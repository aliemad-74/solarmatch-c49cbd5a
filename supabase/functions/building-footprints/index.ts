const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface Building {
  id: number;
  coordinates: [number, number][]; // [lat, lng][]
  area?: number;
  tags?: Record<string, string>;
}

interface OverpassElement {
  type: string;
  id: number;
  geometry?: { lat: number; lon: number }[];
  tags?: Record<string, string>;
}

// Simple in-memory rate limiter (per instance)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_REQUESTS = 20; // requests per window
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute

function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);
  
  if (!record || now > record.resetTime) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  
  if (record.count >= RATE_LIMIT_REQUESTS) {
    return false;
  }
  
  record.count++;
  return true;
}

// Input validation
function validateRequest(body: unknown): { valid: boolean; lat?: number; lng?: number; radius?: number; error?: string } {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Invalid request body' };
  }
  
  const data = body as Record<string, unknown>;
  
  // Validate lat
  if (typeof data.lat !== 'number' || !isFinite(data.lat) || data.lat < -90 || data.lat > 90) {
    return { valid: false, error: 'Invalid latitude: must be between -90 and 90' };
  }
  
  // Validate lng
  if (typeof data.lng !== 'number' || !isFinite(data.lng) || data.lng < -180 || data.lng > 180) {
    return { valid: false, error: 'Invalid longitude: must be between -180 and 180' };
  }
  
  // Validate radius (optional, default 50, max 500)
  let radius = 50;
  if (data.radius !== undefined) {
    if (typeof data.radius !== 'number' || !isFinite(data.radius) || data.radius <= 0 || data.radius > 500) {
      return { valid: false, error: 'Invalid radius: must be between 1 and 500 meters' };
    }
    radius = data.radius;
  }
  
  return { valid: true, lat: data.lat, lng: data.lng, radius };
}

// Calculate polygon area in square meters using Haversine-based approximation
function calculatePolygonArea(coordinates: [number, number][]): number {
  if (coordinates.length < 3) return 0;

  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371000; // Earth radius in meters

  let total = 0;
  const n = coordinates.length;

  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const lat1 = toRad(coordinates[i][0]);
    const lng1 = toRad(coordinates[i][1]);
    const lat2 = toRad(coordinates[j][0]);
    const lng2 = toRad(coordinates[j][1]);

    total += (lng2 - lng1) * (2 + Math.sin(lat1) + Math.sin(lat2));
  }

  return Math.abs((total * R * R) / 2);
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get client identifier for rate limiting (use IP or fallback)
    const clientIP = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || 
                     req.headers.get("x-real-ip") || 
                     "unknown";
    
    // Check rate limit
    if (!checkRateLimit(clientIP)) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse and validate request body
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const validation = validateRequest(body);
    if (!validation.valid) {
      return new Response(
        JSON.stringify({ error: validation.error }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { lat, lng, radius } = validation;

    // Overpass API query to find buildings around a point
    const overpassQuery = `
      [out:json][timeout:15];
      (
        way["building"](around:${radius}, ${lat}, ${lng});
        relation["building"](around:${radius}, ${lat}, ${lng});
      );
      out geom;
    `;

    const overpassUrl = 'https://overpass-api.de/api/interpreter';
    
    console.log(`Fetching buildings at ${lat}, ${lng} with radius ${radius}m`);

    const response = await fetch(overpassUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `data=${encodeURIComponent(overpassQuery)}`,
    });

    if (!response.ok) {
      console.error('Overpass API error:', response.status, response.statusText);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch building data', details: response.statusText }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    
    // Parse OSM elements into building polygons
    const buildings: Building[] = [];
    
    for (const element of data.elements as OverpassElement[]) {
      if (element.geometry && element.geometry.length >= 3) {
        const coordinates: [number, number][] = element.geometry.map(
          (point) => [point.lat, point.lon]
        );
        
        // Calculate approximate area
        const area = calculatePolygonArea(coordinates);
        
        buildings.push({
          id: element.id,
          coordinates,
          area: Math.round(area * 100) / 100,
          tags: element.tags,
        });
      }
    }

    console.log(`Found ${buildings.length} buildings`);

    return new Response(
      JSON.stringify({ 
        buildings,
        count: buildings.length,
        center: { lat, lng },
        radius,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error processing request:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

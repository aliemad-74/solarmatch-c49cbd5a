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
    const body = await req.json();
    const { lat, lng, radius = 50 } = body;

    if (!lat || !lng) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters: lat and lng' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

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
      JSON.stringify({ error: 'Internal server error', details: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

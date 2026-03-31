const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface DetectRequest {
  lat: number;
  lng: number;
  zoom?: number;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const GOOGLE_MAPS_API_KEY = Deno.env.get('GOOGLE_MAPS_API_KEY');
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!GOOGLE_MAPS_API_KEY) {
      return new Response(JSON.stringify({ error: 'Google Maps API key not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: 'AI API key not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body: DetectRequest = await req.json();
    const { lat, lng, zoom = 20 } = body;

    if (typeof lat !== 'number' || typeof lng !== 'number' || !isFinite(lat) || !isFinite(lng)) {
      return new Response(JSON.stringify({ error: 'Invalid coordinates' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get satellite image from Google Maps Static API
    const imageSize = 640;
    const staticMapUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=${zoom}&size=${imageSize}x${imageSize}&maptype=satellite&key=${GOOGLE_MAPS_API_KEY}`;

    console.log(`Fetching satellite image for ${lat}, ${lng} at zoom ${zoom}`);

    const imageResponse = await fetch(staticMapUrl);
    if (!imageResponse.ok) {
      console.error('Static Maps API error:', imageResponse.status);
      return new Response(JSON.stringify({ error: 'Failed to fetch satellite image' }), {
        status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const imageBuffer = await imageResponse.arrayBuffer();
    const base64Image = btoa(String.fromCharCode(...new Uint8Array(imageBuffer)));

    // Calculate meters per pixel for coordinate conversion
    const metersPerPixel = (156543.03392 * Math.cos((lat * Math.PI) / 180)) / Math.pow(2, zoom);

    // Send to Gemini for building detection
    const prompt = `You are analyzing a satellite image centered at coordinates (${lat}, ${lng}).

The image is ${imageSize}x${imageSize} pixels. The center of the image is at pixel (${imageSize / 2}, ${imageSize / 2}).
Each pixel represents approximately ${metersPerPixel.toFixed(4)} meters.

TASK: Identify the building rooftop that is closest to the CENTER of this image.

Return the building boundary as a polygon with coordinates in this EXACT JSON format:
{
  "found": true,
  "confidence": 0.85,
  "polygon": [
    {"lat": 30.0444, "lng": 31.2357},
    {"lat": 30.0445, "lng": 31.2358},
    ...
  ],
  "estimated_area_m2": 150
}

If no building is found at the center, return:
{"found": false, "confidence": 0, "polygon": [], "estimated_area_m2": 0}

IMPORTANT RULES:
- The polygon must have at least 4 points
- Points should trace the actual rooftop boundary precisely
- Convert pixel positions to lat/lng using: 
  lat_offset = (center_y - pixel_y) * ${metersPerPixel.toFixed(4)} / 111320
  lng_offset = (pixel_x - center_x) * ${metersPerPixel.toFixed(4)} / (111320 * cos(${lat} * pi / 180))
  point_lat = ${lat} + lat_offset
  point_lng = ${lng} + lng_offset
- Return ONLY the JSON object, no other text`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt,
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/png;base64,${base64Image}`,
                },
              },
            ],
          },
        ],
        temperature: 0.1,
        max_tokens: 2048,
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded, please try again later.' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: 'AI credits exhausted.' }), {
          status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errorText = await aiResponse.text();
      console.error('AI gateway error:', aiResponse.status, errorText);
      return new Response(JSON.stringify({ error: 'AI analysis failed' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content || '';

    console.log('AI response:', content.substring(0, 500));

    // Parse JSON from response (handle markdown code blocks)
    let jsonStr = content;
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    } else {
      // Try to find raw JSON
      const braceMatch = content.match(/\{[\s\S]*\}/);
      if (braceMatch) jsonStr = braceMatch[0];
    }

    let result;
    try {
      result = JSON.parse(jsonStr);
    } catch {
      console.error('Failed to parse AI response as JSON:', jsonStr);
      return new Response(JSON.stringify({ found: false, error: 'Could not parse AI response', polygon: [] }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate the result
    if (result.found && Array.isArray(result.polygon) && result.polygon.length >= 4) {
      // Validate all points have valid lat/lng
      const validPolygon = result.polygon.every(
        (p: { lat: number; lng: number }) =>
          typeof p.lat === 'number' && typeof p.lng === 'number' && isFinite(p.lat) && isFinite(p.lng)
      );
      if (!validPolygon) {
        result.found = false;
        result.polygon = [];
      }
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Camera, ExternalLink } from "lucide-react";
import { useTranslation } from "react-i18next";

interface Props {
  lat: number;
  lng: number;
}

interface StreetViewResponse {
  available: boolean;
  imageUrl?: string;
  panoId?: string;
  copyright?: string;
}

const StreetViewCard = ({ lat, lng }: Props) => {
  const { i18n } = useTranslation();
  const isAr = i18n.language?.startsWith("ar");
  const [data, setData] = useState<StreetViewResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/google-street-view`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ lat, lng, size: "640x360" }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => { if (!cancelled) setData(json); })
      .catch(() => { if (!cancelled) setData(null); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [lat, lng]);

  if (loading) {
    return (
      <Card className="p-6 border-primary/10">
        <div className="h-48 rounded-md bg-muted animate-pulse" />
      </Card>
    );
  }

  if (!data || data.available === false || !data.imageUrl) return null;

  const mapsLink = `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${lat},${lng}`;

  return (
    <Card className="p-6 space-y-3 border-primary/10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Camera className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">{isAr ? "عرض الموقع من الشارع" : "Street-Level View"}</h3>
            <p className="text-sm text-muted-foreground">
              {isAr ? "للتأكد من المبنى ومحيطه" : "Verify the building and its surroundings"}
            </p>
          </div>
        </div>
        <a
          href={mapsLink}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-primary hover:underline inline-flex items-center gap-1"
        >
          {isAr ? "افتح في Google Maps" : "Open in Maps"}
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
      <div className="rounded-lg overflow-hidden border border-border">
        <img
          src={data.imageUrl}
          alt={isAr ? "صورة الموقع من الشارع" : "Street view of the location"}
          className="w-full h-auto block"
          loading="lazy"
        />
      </div>
      {data.copyright && (
        <p className="text-[10px] text-muted-foreground text-right">{data.copyright}</p>
      )}
    </Card>
  );
};

export default StreetViewCard;

import { NextResponse } from "next/server";

export interface Amenity {
  id: number;
  name: string;
  category: "food" | "atm" | "toilets" | "pharmacy" | "shop" | "waiting" | "other";
  subType: string;
  cuisine?: string;
  lat: number;
  lng: number;
  distance: number; // meters
}

export interface AmenitiesResponse {
  total: number;
  amenities: Amenity[];
  error?: string;
}

// Haversine distance in meters
function distanceMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

function categorize(tags: Record<string, string>): {
  category: Amenity["category"];
  subType: string;
} {
  const amenity = tags.amenity;
  const railway = tags.railway;
  const shop = tags.shop;

  if (amenity) {
    if (["restaurant", "cafe", "fast_food", "food_court", "ice_cream", "pub", "bar"].includes(amenity)) {
      return { category: "food", subType: amenity };
    }
    if (amenity === "atm" || amenity === "bank") {
      return { category: "atm", subType: amenity };
    }
    if (amenity === "toilets") {
      return { category: "toilets", subType: amenity };
    }
    if (amenity === "pharmacy") {
      return { category: "pharmacy", subType: amenity };
    }
  }
  if (railway === "waiting_room" || railway === "station") {
    return { category: "waiting", subType: railway };
  }
  if (shop) {
    if (["convenience", "supermarket", "bakery", "kiosk"].includes(shop)) {
      return { category: "shop", subType: shop };
    }
  }
  return { category: "other", subType: amenity || railway || shop || "unknown" };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = parseFloat(searchParams.get("lat") || "");
  const lng = parseFloat(searchParams.get("lng") || "");
  const radius = parseInt(searchParams.get("radius") || "500");

  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    return NextResponse.json({ error: "lat and lng are required" }, { status: 400 });
  }

  // Overpass QL query: nodes matching amenity/shop/railway tags within radius
  const query = `
    [out:json][timeout:25];
    (
      node["amenity"~"^(restaurant|cafe|fast_food|food_court|ice_cream|atm|bank|toilets|pharmacy)$"](around:${radius},${lat},${lng});
      node["railway"="waiting_room"](around:${radius},${lat},${lng});
      node["shop"~"^(convenience|supermarket|bakery|kiosk)$"](around:${radius},${lat},${lng});
    );
    out body;
  `;

  try {
    const res = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "TrainRouteVisualizer/1.0",
      },
      body: `data=${encodeURIComponent(query)}`,
      // Cache for 30 minutes — amenities don't change often
      next: { revalidate: 1800 },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Overpass API error: ${res.status}` },
        { status: 502 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = await res.json();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const elements: any[] = data.elements || [];

    const amenities: Amenity[] = elements
      .map((el): Amenity | null => {
        if (el.type !== "node" || !el.lat || !el.lon) return null;
        const tags = el.tags || {};
        const { category, subType } = categorize(tags);
        const name = tags.name || tags["name:en"] || "";
        if (!name && category === "other") return null; // skip unnamed "other"
        return {
          id: el.id,
          name: name || subType.charAt(0).toUpperCase() + subType.slice(1).replace(/_/g, " "),
          category,
          subType,
          cuisine: tags.cuisine,
          lat: el.lat,
          lng: el.lon,
          distance: Math.round(distanceMeters(lat, lng, el.lat, el.lon)),
        };
      })
      .filter((a): a is Amenity => a !== null);

    // Sort by distance
    amenities.sort((a, b) => a.distance - b.distance);

    return NextResponse.json({
      total: amenities.length,
      amenities: amenities.slice(0, 30), // cap at 30 for popup display
    });
  } catch (error) {
    console.error("Error fetching amenities:", error);
    return NextResponse.json(
      { error: "Failed to fetch amenities" },
      { status: 500 }
    );
  }
}

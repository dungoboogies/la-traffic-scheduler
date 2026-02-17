const MAPS_KEY = process.env.GOOGLE_MAPS_API_KEY;

interface GeoResult {
  lat: number;
  lng: number;
  formatted: string;
}

const geoCache = new Map<string, GeoResult>();

export async function geocodeAddress(address: string): Promise<GeoResult | null> {
  if (!MAPS_KEY || !address) return null;

  const cached = geoCache.get(address);
  if (cached) return cached;

  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${MAPS_KEY}`;
  const res = await fetch(url);
  const data = await res.json();

  if (data.status !== "OK" || !data.results?.length) return null;

  const result: GeoResult = {
    lat: data.results[0].geometry.location.lat,
    lng: data.results[0].geometry.location.lng,
    formatted: data.results[0].formatted_address,
  };

  geoCache.set(address, result);
  return result;
}

interface DirectionsResult {
  durationMinutes: number;
  distanceMiles: number;
  durationInTraffic?: number;
}

export async function getDirections(
  originLat: number,
  originLng: number,
  destLat: number,
  destLng: number
): Promise<DirectionsResult | null> {
  if (!MAPS_KEY) return null;

  const url =
    `https://maps.googleapis.com/maps/api/directions/json` +
    `?origin=${originLat},${originLng}` +
    `&destination=${destLat},${destLng}` +
    `&departure_time=now` +
    `&traffic_model=best_guess` +
    `&key=${MAPS_KEY}`;

  const res = await fetch(url);
  const data = await res.json();

  if (data.status !== "OK" || !data.routes?.length) return null;

  const leg = data.routes[0].legs[0];
  return {
    durationMinutes: Math.round(leg.duration.value / 60),
    distanceMiles: +(leg.distance.value / 1609.34).toFixed(1),
    durationInTraffic: leg.duration_in_traffic
      ? Math.round(leg.duration_in_traffic.value / 60)
      : undefined,
  };
}

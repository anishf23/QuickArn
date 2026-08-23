export type ReverseGeocodeResponse = {
  address?: {
    city?: string;
    city_district?: string;
    county?: string;
    state?: string;
    state_district?: string;
    suburb?: string;
    town?: string;
    village?: string;
  };
  display_name?: string;
};

export type ReverseGeocodedLocation = {
  address: string;
  city: string;
  state: string;
};

export const nominatimHeaders = {
  Accept: 'application/json',
  'Accept-Language': 'en',
  'User-Agent': 'QuickArn/1.0 (Android location lookup)',
};

export async function reverseGeocode(latitude: number, longitude: number): Promise<ReverseGeocodedLocation> {
  const fallbackAddress = `Current location (${latitude.toFixed(5)}, ${longitude.toFixed(5)})`;
  const response = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
    { headers: nominatimHeaders },
  );

  if (!response.ok) {
    throw new Error('Address lookup failed.');
  }

  const result = (await response.json()) as ReverseGeocodeResponse;
  const city =
    result.address?.city ||
    result.address?.state_district ||
    result.address?.town ||
    result.address?.village ||
    result.address?.city_district ||
    result.address?.county ||
    result.address?.suburb ||
    'Current location';

  return {
    address: result.display_name || fallbackAddress,
    city,
    state: result.address?.state || '',
  };
}

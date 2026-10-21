/**
 * Calculates Haversine distance in kilometers between two lat/long points.
 */
export function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  if (
    lat1 == null || lon1 == null ||
    lat2 == null || lon2 == null ||
    isNaN(lat1) || isNaN(lon1) ||
    isNaN(lat2) || isNaN(lon2)
  ) {
    return null;
  }

  const R = 6371; // Earth's radius in kilometers
  const toRad = (value) => (value * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;

  return Math.round(d * 10) / 10;
}

// City coordinates mapping
export const cityCoordinates = {
  // Gujarat cities
  ahmedabad: [23.0225, 72.5714],
  vadodara: [22.3072, 73.1812],
  surat: [21.1702, 72.8311],
  rajkot: [22.3039, 70.8022],
  bhavnagar: [21.7645, 72.1519],
  jamnagar: [22.4707, 70.0577],
  junagadh: [21.5222, 70.4579],
  gandhinagar: [23.2156, 72.6369],
  anand: [22.5645, 72.9289],
  nadiad: [22.6939, 72.8616],
  mehsana: [23.5880, 72.3693],
  morbi: [22.8173, 70.8340],
  surendranagar: [22.7703, 71.6750],
  gandhidham: [23.0753, 70.1337],
  bharuch: [21.7051, 72.9959],
  valsad: [20.5992, 72.9342],
  vapi: [20.3710, 72.9040],
  navsari: [20.9467, 72.9520],
  godhra: [22.7772, 73.6201],
  patan: [23.8493, 72.1266],
  palanpur: [24.1724, 72.4346],
  bhuj: [23.2420, 69.6669],
  porbandar: [21.6417, 69.6293],
  veraval: [20.9159, 70.3629],
  botad: [22.1704, 71.6664],
  amreli: [21.6032, 71.2221],
  dahod: [22.8320, 74.2599],
  himatnagar: [23.5970, 72.9650],
  
  // Other major cities
  mumbai: [19.0760, 72.8777],
  delhi: [28.6139, 77.2090],
  pune: [18.5204, 73.8567]
};

export function getCityCoordinates(city) {
  const key = (city || 'ahmedabad').toLowerCase().trim();
  const c = cityCoordinates[key] || cityCoordinates['ahmedabad'];
  return { lat: c[0], lng: c[1] };
}

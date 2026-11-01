/**
 * Gujarat City + Area mapping for Chhaya — Frontend
 * Single source of truth for dropdowns and validation.
 */

export const GUJARAT_CITIES = [
  'Ahmedabad',
  'Surat',
  'Vadodara',
  'Rajkot',
  'Bhavnagar',
  'Jamnagar',
  'Junagadh',
  'Gandhinagar',
  'Anand',
  'Morbi',
  'Kutch',
  'Banaskantha',
  'Dang',
  'Gir Somnath',
  'Surendranagar',
];

export const GUJARAT_AREAS = {
  Ahmedabad:    ['Naroda', 'Maninagar', 'Satellite', 'Bopal', 'Chandkheda', 'Vatva', 'Vastrapur', 'Odhav'],
  Surat:        ['Varachha', 'Katargam', 'Adajan', 'Vesu', 'Athwa', 'Udhna', 'Piplod'],
  Vadodara:     ['Makarpura', 'Manjalpur', 'Gotri', 'Alkapuri', 'Karelibaug', 'Fatehgunj', 'Nizampura', 'Waghodia Road'],
  Rajkot:       ['Gondal Road', 'Kalawad Road', 'University Road', 'Mavdi', 'Kothariya'],
  Bhavnagar:    ['Waghawadi Road', 'Ghogha Road', 'Takhteshwar', 'Kaliyabid'],
  Jamnagar:     ['Patel Colony', 'Digvijay Plot', 'Bedeshwar', 'Indira Marg'],
  Junagadh:     ['Zanzarda Road', 'Kalwa Chowk', 'Joshipura', 'Timbavadi'],
  Gandhinagar:  ['Sector 21', 'Sector 29', 'Kudasan', 'Infocity', 'Sargasan'],
  Anand:        ['Vallabh Vidyanagar', 'Gamdi', 'Jitodia', 'Anand-Sojitra Road'],
  Morbi:        ['Sanala Road', 'Ravapar Road', 'Trajpar', 'Mahendranagar'],
  Kutch:        ['Bhuj', 'Mandvi', 'Anjar', 'Gandhidham', 'Mundra'],
  Banaskantha:  ['Palanpur', 'Deesa', 'Tharad', 'Dhanera'],
  Dang:         ['Ahwa', 'Waghai', 'Subir'],
  'Gir Somnath':['Veraval', 'Kodinar', 'Una', 'Somnath'],
  Surendranagar:['Wadhwan', 'Dhrangadhra', 'Limbdi', 'Chotila'],
};

/** Returns areas for a given city, or empty array if city not found */
export const getAreasForCity = (city) => GUJARAT_AREAS[city] || [];

/** Returns true if city is in Gujarat list */
export const isValidCity = (city) => GUJARAT_CITIES.includes(city);

/** Returns true if area belongs to city */
export const isValidArea = (city, area) => {
  const areas = GUJARAT_AREAS[city];
  return Array.isArray(areas) && areas.includes(area);
};

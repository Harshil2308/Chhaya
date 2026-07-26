// Calculate Heat Index (in Celsius)
const calculateHeatIndex = (tempC, humidity) => {
  // Convert Celsius to Fahrenheit for the formula
  const tempF = (tempC * 9) / 5 + 32;

  let hi = 0.5 * (tempF + 61.0 + ((tempF - 68.0) * 1.2) + (humidity * 0.094));

  if (hi > 80) {
    hi = -42.379 + 2.04901523 * tempF + 10.14333127 * humidity
      - 0.22475541 * tempF * humidity
      - 0.00683783 * tempF * tempF
      - 0.05481717 * humidity * humidity
      + 0.00122874 * tempF * tempF * humidity
      + 0.00085282 * tempF * humidity * humidity
      - 0.00000199 * tempF * tempF * humidity * humidity;
  }

  // Convert back to Celsius
  const hiC = ((hi - 32) * 5) / 9;
  return Math.round(hiC * 10) / 10;
};

// Get risk level from Heat Index
const getRiskLevel = (heatIndex) => {
  if (heatIndex < 27) return { level: 'Low', color: 'green', advice: 'Normal conditions. Stay hydrated.' };
  if (heatIndex < 32) return { level: 'Moderate', color: 'yellow', advice: 'Drink water regularly and take short breaks.' };
  if (heatIndex < 41) return { level: 'High', color: 'orange', advice: 'Limit outdoor work. Take frequent breaks in shade.' };
  if (heatIndex < 54) return { level: 'Very High', color: 'red', advice: 'Dangerous! Avoid heavy work during peak hours.' };
  return { level: 'Extreme', color: 'darkred', advice: 'Extreme danger. Stay indoors if possible.' };
};

module.exports = { calculateHeatIndex, getRiskLevel };
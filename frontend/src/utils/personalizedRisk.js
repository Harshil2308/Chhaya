export const WORK_TYPES = {
  Light: {
    label: 'Light Work',
    offset: -1.5,
    description: 'Minimal exertion (monitoring, sitting, driving)'
  },
  Moderate: {
    label: 'Moderate Work',
    offset: 1.5,
    description: 'Regular physical activity (walking, carrying tools)'
  },
  Heavy: {
    label: 'Heavy Labor',
    offset: 4.0,
    description: 'Intense physical strain (construction, digging, lifting)'
  }
};

export const EXPOSURES = {
  Sun: {
    label: 'Direct Sun',
    offset: 3.5,
    description: 'Direct solar radiant heat load'
  },
  Shade: {
    label: 'In Shade',
    offset: -2.5,
    description: 'Sheltered from direct sunlight under canopy or roof'
  }
};

/**
 * Standard risk scale matching the core heatIndex utility
 */
export function getRiskLevelFromHI(heatIndex) {
  if (heatIndex < 27) {
    return { level: 'Low', color: 'green', advice: 'Normal conditions. Stay hydrated.' };
  }
  if (heatIndex < 32) {
    return { level: 'Moderate', color: 'yellow', advice: 'Drink water regularly and take short breaks.' };
  }
  if (heatIndex < 41) {
    return { level: 'High', color: 'orange', advice: 'Limit outdoor work. Take frequent breaks in shade.' };
  }
  if (heatIndex < 54) {
    return { level: 'Very High', color: 'red', advice: 'Dangerous! Avoid heavy work during peak hours.' };
  }
  return { level: 'Extreme', color: 'darkred', advice: 'Extreme danger. Stay indoors if possible.' };
}

/**
 * Calculates personalized risk based on work intensity and sun exposure
 */
export function calculatePersonalizedRisk(baseHeatIndex, workType = 'Moderate', exposure = 'Sun') {
  if (baseHeatIndex == null || isNaN(baseHeatIndex)) return null;

  const work = WORK_TYPES[workType] || WORK_TYPES.Moderate;
  const exp = EXPOSURES[exposure] || EXPOSURES.Sun;

  const totalOffset = work.offset + exp.offset;
  const adjustedHeatIndex = Math.max(0, Math.round((baseHeatIndex + totalOffset) * 10) / 10);

  const baseRisk = getRiskLevelFromHI(baseHeatIndex);
  const adjustedRisk = getRiskLevelFromHI(adjustedHeatIndex);

  const workText = work.offset > 0 ? `heavy physical exertion (+${work.offset}°C)` : work.offset < 0 ? `light physical exertion (${work.offset}°C)` : `moderate exertion (+${work.offset}°C)`;
  const expText = exp.offset > 0 ? `direct sun exposure (+${exp.offset}°C)` : `working in shade (${exp.offset}°C)`;
  const netSign = totalOffset >= 0 ? `+${totalOffset.toFixed(1)}` : `${totalOffset.toFixed(1)}`;

  let explanation = '';
  if (adjustedRisk.level !== baseRisk.level) {
    explanation = `${expText} and ${workText} shift your effective thermal load by ${netSign}°C (${adjustedHeatIndex}°C felt), elevating/reducing your personalized risk from ${baseRisk.level} to ${adjustedRisk.level}.`;
  } else {
    explanation = `${expText} and ${workText} yield a net ${netSign}°C shift (${adjustedHeatIndex}°C felt). Your safety category remains ${adjustedRisk.level}.`;
  }

  return {
    baseHeatIndex,
    adjustedHeatIndex,
    totalOffset,
    workType,
    exposure,
    baseRiskLevel: baseRisk.level,
    personalizedRiskLevel: adjustedRisk.level,
    personalizedAdvice: adjustedRisk.advice,
    personalizedColor: adjustedRisk.color,
    explanation,
  };
}

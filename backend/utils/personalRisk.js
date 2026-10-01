const { getRiskLevel } = require('./heatIndex');

/**
 * Job heat points heuristic:
 * NOTE: This is a simplified operational heat-strain estimate for outdoor workers
 * based on exertion and exposure, NOT a medical or clinical diagnosis.
 *
 * Points:
 * - construction: +7°C (high metabolic exertion, heavy gear, radiant concrete/metal surfaces)
 * - farmer: +6°C (prolonged direct field sun, continuous bending/hoeing)
 * - delivery: +4°C (asphalt road radiation, bike engine heat, helmet heat trapping)
 * - vendor: +2°C (stationary outdoor exposure, pavement reflection)
 * - other: 0°C (standard baseline)
 */
const JOB_HEAT_POINTS = {
  construction: 7,
  farmer: 6,
  delivery: 4,
  vendor: 2,
  other: 0
};

const JOB_DESCRIPTIONS = {
  construction: 'Construction labor adds about 7°C of estimated strain from heavy physical lifting, concrete reflection, and direct sun.',
  farmer: 'Farm work adds about 6°C of estimated strain due to open-field solar exposure and prolonged manual labor.',
  delivery: 'Delivery work adds about 4°C of estimated strain from road asphalt heat, engine warmth, and helmet heat trapping.',
  vendor: 'Street vending adds about 2°C of estimated strain from roadside sun and pavement heat reflection.',
  other: 'Baseline outdoor work conditions without specialized task-load adjustments.'
};

/**
 * Practical, job-specific advice for outdoor workers who cannot stop working
 */
const getPracticalJobAdvice = (jobKey, riskLevel) => {
  const commonSigns = 'Warning signs: dizziness, intense headache, nausea/vomiting, or absence of sweating.';
  
  switch (riskLevel) {
    case 'Low':
      return `Normal conditions. Drink water every 30 minutes before feeling thirsty. Keep ORS packet handy.`;

    case 'Moderate':
      if (jobKey === 'construction') return `Take 5–10 min rest in shade each hour. Pour cool water on neck and arms. Drink ORS. ${commonSigns}`;
      if (jobKey === 'farmer') return `Schedule strenuous weeding/plowing before 11 AM. Rest under tree canopy. Drink fluids regularly. ${commonSigns}`;
      if (jobKey === 'delivery') return `Unfasten helmet at red lights/stops. Drink water between deliveries. Avoid direct engine contact. ${commonSigns}`;
      if (jobKey === 'vendor') return `Set up tarp/umbrella shade over your stall. Sip water frequently. Wear light-colored cotton. ${commonSigns}`;
      return `Drink water before thirsty. Take 5 minutes shade rest every hour. ${commonSigns}`;

    case 'High':
      if (jobKey === 'construction') return `Complete heavy masonry/digging before 11 AM or after 4 PM. Mandatory 15 min shade rest every 45 min. Drink electrolyte/ORS water. ${commonSigns}`;
      if (jobKey === 'farmer') return `Pause field labor during 12–3 PM peak heat. Work under shaded nursery if possible. Cover head with wet cloth. ${commonSigns}`;
      if (jobKey === 'delivery') return `Park bike in shade between drops. Drink 250ml water every 20 min. Splash face with cool water. ${commonSigns}`;
      if (jobKey === 'vendor') return `Dampen stall canopy/cloth with water for evaporative cooling. Sit on a stool off hot ground. Sip ORS. ${commonSigns}`;
      return `Take 15 min rest in shade each hour. Move heavy tasks away from 12–3 PM. Keep head covered. ${commonSigns}`;

    case 'Very High':
    case 'Extreme':
    default:
      if (jobKey === 'construction') return `DANGER: Shift all heavy tasks to dawn (before 10 AM). 30 min work / 30 min cool shelter. Stop immediately if lightheaded. ${commonSigns}`;
      if (jobKey === 'farmer') return `DANGER: Halt open-field labor during midday. Rest in permanent shade. Wet entire shirt and head to lower body temp. ${commonSigns}`;
      if (jobKey === 'delivery') return `DANGER: Take mandatory 10 min break in shaded shop every 2 deliveries. Drink cold electrolyte water. Watch for disorientation. ${commonSigns}`;
      if (jobKey === 'vendor') return `DANGER: Stay strictly under shaded cover. Spray water on surroundings. Never stand directly on sun-baked asphalt. ${commonSigns}`;
      return `DANGER: Rotate into shade every 30 minutes. Wet clothes to dissipate heat. Drink ORS. If dizziness or nausea occurs, seek medical help.`;
  }
};

/**
 * Calculate personal heat index and risk by job
 */
const calculatePersonalRisk = (baseHeatIndex, rawJob) => {
  if (baseHeatIndex == null || isNaN(baseHeatIndex)) return null;

  const job = (rawJob || 'other').toLowerCase().trim();
  const jobPoints = JOB_HEAT_POINTS[job] !== undefined ? JOB_HEAT_POINTS[job] : JOB_HEAT_POINTS.other;
  const personalHeatIndex = Math.round((baseHeatIndex + jobPoints) * 10) / 10;
  const risk = getRiskLevel(personalHeatIndex);
  const practicalAdvice = getPracticalJobAdvice(job, risk.level);
  const reason = JOB_DESCRIPTIONS[job] || JOB_DESCRIPTIONS.other;

  return {
    job,
    jobPoints,
    personalHeatIndex,
    personalRiskLevel: risk.level,
    personalAdvice: practicalAdvice,
    personalColor: risk.color,
    reason
  };
};

module.exports = {
  JOB_HEAT_POINTS,
  calculatePersonalRisk,
  getPracticalJobAdvice
};

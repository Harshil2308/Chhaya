import { calculatePersonalizedRisk, WORK_TYPES, EXPOSURES } from '../utils/personalizedRisk';
import ListenButton from './ListenButton';

const RISK_THEMES = {
  Low: { bg: '#f0fdf4', border: '#86efac', text: '#15803d', badgeBg: '#dcfce7', badgeText: '#166534', icon: '🌿' },
  Moderate: { bg: '#fefce8', border: '#fde68a', text: '#854d0e', badgeBg: '#fef9c3', badgeText: '#713f12', icon: '☀️' },
  High: { bg: '#fff7ed', border: '#fdba74', text: '#c2410c', badgeBg: '#ffedd5', badgeText: '#9a3412', icon: '🔥' },
  'Very High': { bg: '#fff1f2', border: '#fca5a5', text: '#b91c1c', badgeBg: '#fee2e2', badgeText: '#991b1b', icon: '⚠️' },
  Extreme: { bg: '#450a0a', border: '#ef4444', text: '#fee2e2', badgeBg: '#991b1b', badgeText: '#ffffff', icon: '🚨' }
};

function PersonalizedRiskCard({
  baseHeatData,
  workType,
  setWorkType,
  exposure,
  setExposure
}) {
  if (!baseHeatData) return null;

  const result = calculatePersonalizedRisk(baseHeatData.heatIndex, workType, exposure);
  if (!result) return null;

  const baseTheme = RISK_THEMES[result.baseRiskLevel] || RISK_THEMES.Low;
  const persTheme = RISK_THEMES[result.personalizedRiskLevel] || RISK_THEMES.Moderate;

  const isRiskShifted = result.baseRiskLevel !== result.personalizedRiskLevel;

  return (
    <div className="chhaya-card p-6 sm:p-7 card-lift mb-5 dash-fade-up border border-orange-100">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-orange-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">⚡</span>
            <h3 className="font-extrabold text-gray-900 text-lg">Personalized Thermal Stress</h3>
            <span className="badge" style={{ background: '#ffedd5', color: '#9a3412', borderColor: '#fdba74' }}>
              Worker Context
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Weather stations report shaded ambient conditions. Physical labor in direct sun creates higher bodily strain.
          </p>
        </div>
      </div>

      {/* ── Context Selectors ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
        {/* Work Type */}
        <div className="bg-orange-50/50 p-3.5 rounded-2xl border border-orange-100">
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
            1. Work Intensity
          </label>
          <div className="grid grid-cols-3 gap-2">
            {Object.keys(WORK_TYPES).map((key) => {
              const item = WORK_TYPES[key];
              const isSelected = workType === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setWorkType(key)}
                  className={`py-2 px-2.5 rounded-xl text-xs font-bold text-center transition-all duration-200 border cursor-pointer ${
                    isSelected
                      ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white border-transparent shadow-sm scale-[1.02]'
                      : 'bg-white text-gray-700 border-gray-200 hover:bg-orange-50'
                  }`}
                >
                  <div>{item.label}</div>
                  <div className={`text-[10px] mt-0.5 ${isSelected ? 'text-white/80' : 'text-gray-400'}`}>
                    {item.offset > 0 ? `+${item.offset}°C` : `${item.offset}°C`}
                  </div>
                </button>
              );
            })}
          </div>
          <p className="text-[11px] text-gray-500 mt-2 italic">
            {WORK_TYPES[workType]?.description}
          </p>
        </div>

        {/* Sun Exposure */}
        <div className="bg-orange-50/50 p-3.5 rounded-2xl border border-orange-100">
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
            2. Sun vs. Shade Exposure
          </label>
          <div className="grid grid-cols-2 gap-2">
            {Object.keys(EXPOSURES).map((key) => {
              const item = EXPOSURES[key];
              const isSelected = exposure === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setExposure(key)}
                  className={`py-2 px-3 rounded-xl text-xs font-bold text-center transition-all duration-200 border cursor-pointer ${
                    isSelected
                      ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white border-transparent shadow-sm scale-[1.02]'
                      : 'bg-white text-gray-700 border-gray-200 hover:bg-orange-50'
                  }`}
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <span>{key === 'Sun' ? '☀️' : '🌳'}</span>
                    <span>{item.label}</span>
                  </div>
                  <div className={`text-[10px] mt-0.5 ${isSelected ? 'text-white/80' : 'text-gray-400'}`}>
                    {item.offset > 0 ? `+${item.offset}°C` : `${item.offset}°C`}
                  </div>
                </button>
              );
            })}
          </div>
          <p className="text-[11px] text-gray-500 mt-2 italic">
            {EXPOSURES[exposure]?.description}
          </p>
        </div>
      </div>

      {/* ── Comparison Cards: Base vs. Personalized ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Base Heat Index */}
        <div
          className="rounded-2xl p-4 border transition-all duration-200"
          style={{ background: baseTheme.bg, borderColor: baseTheme.border }}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold uppercase tracking-wide text-gray-600">
              Station Base Risk
            </span>
            <span
              className="badge"
              style={{ background: baseTheme.badgeBg, color: baseTheme.badgeText, borderColor: baseTheme.border }}
            >
              {result.baseRiskLevel}
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold" style={{ color: baseTheme.text }}>
              {result.baseHeatIndex}°C
            </span>
            <span className="text-xs text-gray-500 font-medium">Standard Heat Index</span>
          </div>
          <p className="text-xs text-gray-600 mt-1.5 leading-snug">
            Measured in ambient meteorological shade at weather station.
          </p>
        </div>

        {/* Personalized Effective Risk */}
        <div
          className="rounded-2xl p-4 border transition-all duration-200 relative overflow-hidden"
          style={{ background: persTheme.bg, borderColor: persTheme.border }}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold uppercase tracking-wide" style={{ color: persTheme.text }}>
              Personalized Work Risk
            </span>
            <span
              className="badge"
              style={{ background: persTheme.badgeBg, color: persTheme.badgeText, borderColor: persTheme.border }}
            >
              {persTheme.icon} {result.personalizedRiskLevel}
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold" style={{ color: persTheme.text }}>
              {result.adjustedHeatIndex}°C
            </span>
            <span className="text-xs font-bold" style={{ color: persTheme.text }}>
              Effective Felt Strain ({result.totalOffset >= 0 ? `+${result.totalOffset.toFixed(1)}°C` : `${result.totalOffset.toFixed(1)}°C`})
            </span>
          </div>
          <p className="text-xs mt-1.5 font-medium leading-snug" style={{ color: persTheme.text }}>
            {result.personalizedAdvice}
          </p>
          {result.personalizedAdvice && (
            <div className="mt-2">
              <ListenButton text={result.personalizedAdvice} size="sm" />
            </div>
          )}
        </div>
      </div>

      {/* ── Explanation Banner ── */}
      <div
        className={`rounded-xl p-3.5 text-xs flex items-start gap-2.5 border ${
          isRiskShifted
            ? 'bg-amber-50/80 border-amber-200 text-amber-900'
            : 'bg-blue-50/70 border-blue-200 text-blue-900'
        }`}
      >
        <span className="text-base shrink-0 mt-0.5">{isRiskShifted ? 'ℹ️' : '💡'}</span>
        <div>
          <span className="font-bold">Why this adjusted: </span>
          <span>{result.explanation}</span>
        </div>
      </div>
    </div>
  );
}

export default PersonalizedRiskCard;

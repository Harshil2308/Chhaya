import { useEffect, useState, useCallback } from 'react';
import API from '../services/api';

const RISK_BADGES = {
  Low: { bg: '#dcfce7', text: '#166534', border: '#86efac', dot: '#16a34a' },
  Moderate: { bg: '#fef9c3', text: '#713f12', border: '#fde68a', dot: '#eab308' },
  High: { bg: '#ffedd5', text: '#9a3412', border: '#fdba74', dot: '#e06010' },
  'Very High': { bg: '#fee2e2', text: '#991b1b', border: '#fca5a5', dot: '#dc2626' },
  Extreme: { bg: '#7f1d1d', text: '#ffffff', border: '#ef4444', dot: '#b91c1c' }
};

function SafeShiftPlanner({ city }) {
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchForecast = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const targetCity = city || 'Ahmedabad';
      const res = await API.get(`/alerts/forecast?city=${encodeURIComponent(targetCity)}`);
      setForecast(res.data);
    } catch (err) {
      console.error('Forecast load error:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [city]);

  useEffect(() => {
    fetchForecast();
  }, [fetchForecast]);

  const isFallback = error || forecast?.fallback || !forecast?.blocks?.length;

  return (
    <div
      className="rounded-3xl p-6 sm:p-7 border border-purple-100 dash-fade-up card-lift mb-5"
      style={{ background: 'linear-gradient(135deg, #faf5ff 0%, #ede9fe 100%)' }}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">⏱️</span>
            <h3 className="font-bold text-purple-900 text-lg">Safe Shift Planner</h3>
            <span className="badge" style={{ background: '#f3e8ff', color: '#6b21a8', borderColor: '#d8b4fe' }}>
              Live Forecast Powered
            </span>
          </div>
          <p className="text-xs text-purple-700 mt-1">
            Dynamic shift scheduling based on OpenWeather 3-hour heat index forecast.
          </p>
        </div>

        <button
          onClick={fetchForecast}
          disabled={loading}
          className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-white/80 hover:bg-white text-purple-800 border border-purple-200 transition-all cursor-pointer self-start sm:self-auto"
        >
          {loading ? 'Refreshing...' : '🔄 Refresh Forecast'}
        </button>
      </div>

      {loading ? (
        <div className="py-8 text-center text-purple-600">
          <div className="inline-block w-8 h-8 border-3 border-purple-300 border-t-purple-600 rounded-full animate-spin mb-2" />
          <p className="text-xs font-medium">Computing 24-hour shift risk timeline...</p>
        </div>
      ) : isFallback ? (
        /* Fallback Static Advice */
        <div>
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 mb-4 text-xs text-amber-900 flex items-center gap-2">
            <span>ℹ️</span>
            <span>Live forecast offline. Displaying recommended baseline shift windows:</span>
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="bg-white/80 rounded-2xl p-4 shadow-sm border border-purple-100">
              <p className="text-2xl mb-1">🌅</p>
              <p className="text-xs text-purple-500 font-semibold uppercase tracking-wider mb-1">Safe Morning Hours</p>
              <p className="text-purple-900 font-bold text-sm">6:00 AM – 11:00 AM</p>
              <p className="text-[11px] text-gray-500 mt-1">Lowest ambient radiant heat</p>
            </div>
            <div className="bg-white/80 rounded-2xl p-4 shadow-sm border border-purple-100">
              <p className="text-2xl mb-1">🌇</p>
              <p className="text-xs text-purple-500 font-semibold uppercase tracking-wider mb-1">Safe Evening Hours</p>
              <p className="text-purple-900 font-bold text-sm">4:00 PM – 7:00 PM</p>
              <p className="text-[11px] text-gray-500 mt-1">Solar radiation subsiding</p>
            </div>
            <div className="bg-white/80 rounded-2xl p-4 shadow-sm border border-purple-100">
              <p className="text-2xl mb-1">💡</p>
              <p className="text-xs text-purple-500 font-semibold uppercase tracking-wider mb-1">Rest &amp; Hydration Protocol</p>
              <p className="text-purple-900 font-bold text-sm">Mandatory 15m shade rest/hr</p>
              <p className="text-[11px] text-gray-500 mt-1">Provide cool ORS/water at work site</p>
            </div>
          </div>
        </div>
      ) : (
        /* Live Forecast Timeline */
        <div>
          {/* Recommended windows banner */}
          <div className="bg-white/85 backdrop-blur-sm rounded-2xl p-4 border border-purple-200 mb-5 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-base">✅</span>
              <h4 className="text-xs font-bold uppercase tracking-wider text-purple-950">
                Recommended Safer Work Shifts ({forecast.city})
              </h4>
            </div>
            <div className="flex flex-wrap gap-2">
              {forecast.saferWindows?.map((win, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-green-100 text-green-800 border border-green-300 flex items-center gap-1.5"
                >
                  <span>🌤️</span>
                  <span>{win}</span>
                </span>
              ))}
            </div>
          </div>

          {/* Timeline Blocks */}
          <div className="mb-2">
            <p className="text-xs font-bold text-purple-900 uppercase tracking-wider mb-3">
              24-Hour Forward Forecast &amp; Work/Rest Protocol
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {forecast.blocks?.map((block, idx) => {
                const badge = RISK_BADGES[block.riskLevel] || RISK_BADGES.Low;
                return (
                  <div
                    key={idx}
                    className="bg-white/80 backdrop-blur-sm rounded-2xl p-3.5 border border-purple-100 shadow-sm hover:shadow transition-all"
                  >
                    <div className="flex justify-between items-start gap-1 mb-2">
                      <div>
                        <p className="text-xs font-bold text-gray-800">{block.timeLabel}</p>
                        <p className="text-[10px] text-gray-400">{block.dayLabel}</p>
                      </div>
                      <span
                        className="badge"
                        style={{
                          background: badge.bg,
                          color: badge.text,
                          borderColor: badge.border,
                          fontSize: '0.68rem',
                          padding: '0.15rem 0.5rem'
                        }}
                      >
                        {block.riskLevel}
                      </span>
                    </div>

                    <div className="flex items-baseline gap-2 mb-2 pb-2 border-b border-gray-100">
                      <span className="text-lg font-extrabold text-gray-900">{block.temp}°C</span>
                      <span className="text-[11px] text-gray-500 font-medium">HI: {block.heatIndex}°C</span>
                      <span className="text-[11px] text-gray-400">💧 {block.humidity}%</span>
                    </div>

                    {/* Work / Rest Recommendation */}
                    <div className="bg-purple-50/70 rounded-xl p-2 border border-purple-100">
                      <p className="text-[10px] font-bold text-purple-900 uppercase tracking-tight">
                        Shift Guidance:
                      </p>
                      <p className="text-xs font-bold text-purple-950 mt-0.5">
                        {block.workRest}
                      </p>
                      <p className="text-[10px] text-purple-700 mt-1 leading-tight">
                        {block.guidance}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SafeShiftPlanner;

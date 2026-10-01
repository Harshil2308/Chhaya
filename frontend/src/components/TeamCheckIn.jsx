import { useState, useEffect } from 'react';
import API from '../services/api';

function TeamCheckIn() {
  const [teamData, setTeamData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [joinCode, setJoinCode] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  useEffect(() => {
    fetchMyTeam();
  }, []);

  const fetchMyTeam = async () => {
    try {
      const res = await API.get('/teams/my');
      setTeamData(res.data);
    } catch (err) {
      console.error('Failed to fetch team:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!joinCode.trim()) return;

    setStatusMessage(null);
    setSubmitting(true);
    try {
      const res = await API.post('/teams/join', { code: joinCode.trim() });
      setStatusMessage({ type: 'success', text: res.data.message || 'Joined team successfully!' });
      setJoinCode('');
      fetchMyTeam();
    } catch (err) {
      setStatusMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to join team. Check team code.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendCheckIn = async (type) => {
    setStatusMessage(null);
    setSubmitting(true);

    const sendPayload = async (coords = null) => {
      try {
        const payload = {
          type,
          note: note.trim(),
          teamId: teamData?.joinedTeam?._id,
          latitude: coords?.latitude || null,
          longitude: coords?.longitude || null,
        };

        const res = await API.post('/checkins', payload);
        setStatusMessage({
          type: type === 'SOS' ? 'sos' : 'success',
          text: res.data.message || (type === 'SOS' ? 'SOS alert transmitted!' : 'Check-in recorded!')
        });
        setNote('');
        fetchMyTeam();
      } catch (err) {
        setStatusMessage({
          type: 'error',
          text: err.response?.data?.message || 'Failed to send check-in'
        });
      } finally {
        setSubmitting(false);
      }
    };

    // Request GPS location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          sendPayload(pos.coords);
        },
        (err) => {
          console.warn('Geolocation unavailable for check-in:', err.message);
          // Send checkin without GPS
          sendPayload(null);
        },
        { enableHighAccuracy: true, timeout: 6000 }
      );
    } else {
      sendPayload(null);
    }
  };

  if (loading) {
    return (
      <div className="chhaya-card p-6 mb-5 text-center text-gray-500">
        <div className="spinner mx-auto mb-2 border-t-orange-500" />
        <p className="text-xs">Loading team status...</p>
      </div>
    );
  }

  const joinedTeam = teamData?.joinedTeam;
  const latestCheckIn = teamData?.latestCheckIn;

  return (
    <div className="chhaya-card p-6 sm:p-7 card-lift mb-5 dash-fade-up border border-orange-100">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-orange-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">🛡️</span>
            <h3 className="font-extrabold text-gray-900 text-lg">Worker Safety Check-in &amp; SOS</h3>
            <span className="badge" style={{ background: '#ffedd5', color: '#9a3412', borderColor: '#fdba74' }}>
              Rapid Response
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Keep your manager informed of your safety and send instant emergency SOS with live GPS.
          </p>
        </div>

        {joinedTeam && (
          <span className="badge badge-resolved self-start sm:self-auto">
            Team: {joinedTeam.name}
          </span>
        )}
      </div>

      {statusMessage && (
        <div
          className={`alert mb-4 ${
            statusMessage.type === 'sos'
              ? 'bg-red-500 text-white font-bold animate-pulse'
              : statusMessage.type === 'success'
              ? 'alert-success'
              : 'alert-error'
          }`}
        >
          {statusMessage.text}
        </div>
      )}

      {!joinedTeam ? (
        /* Join Team Form */
        <div className="bg-orange-50/50 rounded-2xl p-5 border border-orange-100">
          <h4 className="font-bold text-gray-800 text-sm mb-1">Join Your Work Team</h4>
          <p className="text-xs text-gray-500 mb-4">
            Enter the 6-character Team Code provided by your manager or site supervisor.
          </p>

          <form onSubmit={handleJoin} className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="e.g. CH89AB"
              maxLength={10}
              required
              className="chhaya-input sm:max-w-xs uppercase font-mono font-bold tracking-widest text-center"
            />
            <button
              type="submit"
              disabled={submitting}
              className="chhaya-btn-primary"
            >
              {submitting ? 'Joining...' : '🔗 Join Team'}
            </button>
          </form>
        </div>
      ) : (
        /* Check-in Actions */
        <div>
          {/* Team details bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-orange-50/60 rounded-2xl p-3.5 border border-orange-100 mb-5">
            <div>
              <p className="text-xs font-semibold text-gray-500">Supervisor</p>
              <p className="text-sm font-bold text-gray-800">
                {joinedTeam.manager?.name || 'Manager'}
                {joinedTeam.manager?.phone ? ` · 📞 ${joinedTeam.manager.phone}` : ''}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500">Team Code</p>
              <p className="text-sm font-mono font-bold text-orange-600 tracking-wider">
                {joinedTeam.code}
              </p>
            </div>
            {latestCheckIn && (
              <div>
                <p className="text-xs font-semibold text-gray-500">Last Status</p>
                <span
                  className="badge"
                  style={
                    latestCheckIn.type === 'SOS'
                      ? { background: '#fee2e2', color: '#991b1b', borderColor: '#fca5a5' }
                      : { background: '#dcfce7', color: '#166534', borderColor: '#86efac' }
                  }
                >
                  {latestCheckIn.type === 'SOS' ? '🚨 SOS' : '✅ OK'}{' '}
                  ({new Date(latestCheckIn.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                </span>
              </div>
            )}
          </div>

          {/* Optional Note */}
          <div className="mb-4">
            <label className="block text-xs font-bold text-gray-600 mb-1 uppercase tracking-wide">
              Quick Status Note (optional)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. In shade drinking water, heading to cooling shelter..."
              className="chhaya-input text-xs"
            />
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* I'm OK */}
            <button
              type="button"
              onClick={() => handleSendCheckIn('OK')}
              disabled={submitting}
              className="p-4 rounded-2xl border border-green-200 bg-gradient-to-br from-green-50 to-emerald-100 hover:from-green-100 hover:to-emerald-200 text-green-900 font-extrabold flex items-center justify-center gap-3 transition-all transform hover:scale-[1.01] active:scale-[0.99] shadow-sm cursor-pointer disabled:opacity-50"
            >
              <span className="text-2xl">👍</span>
              <div className="text-left">
                <div className="text-base leading-tight">I'M OK (Safe)</div>
                <div className="text-[11px] font-medium text-green-700">Check in &amp; share status</div>
              </div>
            </button>

            {/* SOS Emergency */}
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Send emergency SOS to your manager with your location?')) {
                  handleSendCheckIn('SOS');
                }
              }}
              disabled={submitting}
              className="p-4 rounded-2xl border border-red-300 bg-gradient-to-br from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white font-extrabold flex items-center justify-center gap-3 transition-all transform hover:scale-[1.01] active:scale-[0.99] shadow-md cursor-pointer disabled:opacity-50 animate-pulse"
            >
              <span className="text-2xl">🚨</span>
              <div className="text-left">
                <div className="text-base leading-tight">EMERGENCY SOS</div>
                <div className="text-[11px] font-medium text-red-100">Broadcast immediate heat distress</div>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default TeamCheckIn;

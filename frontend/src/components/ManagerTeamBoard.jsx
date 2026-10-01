import { useState, useEffect } from 'react';
import API from '../services/api';

function ManagerTeamBoard() {
  const [managedTeams, setManagedTeams] = useState([]);
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [boardData, setBoardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [boardLoading, setBoardLoading] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [creating, setCreating] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchManagedTeams();
  }, []);

  const fetchManagedTeams = async () => {
    setLoading(true);
    try {
      const res = await API.get('/teams/my');
      const teams = res.data.managedTeams || [];
      setManagedTeams(teams);
      if (teams.length > 0) {
        setSelectedTeamId(teams[0]._id);
        fetchTeamLiveBoard(teams[0]._id);
      }
    } catch (err) {
      console.error('Failed to load managed teams:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamLiveBoard = async (teamId) => {
    if (!teamId) return;
    setBoardLoading(true);
    try {
      const res = await API.get(`/checkins/team/${teamId}`);
      setBoardData(res.data);
    } catch (err) {
      console.error('Failed to load team board:', err);
      setErrorMsg('Failed to load live board');
    } finally {
      setBoardLoading(false);
    }
  };

  const handleSelectTeam = (id) => {
    setSelectedTeamId(id);
    fetchTeamLiveBoard(id);
  };

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    if (!newTeamName.trim()) return;

    setCreating(true);
    setErrorMsg('');
    try {
      const res = await API.post('/teams', { name: newTeamName.trim() });
      const created = res.data;
      setNewTeamName('');
      const updatedList = [created, ...managedTeams];
      setManagedTeams(updatedList);
      setSelectedTeamId(created._id);
      fetchTeamLiveBoard(created._id);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to create team');
    } finally {
      setCreating(false);
    }
  };

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  if (loading) {
    return (
      <div className="rounded-3xl p-6 border border-purple-100 bg-white text-center text-purple-600 mb-5">
        <div className="inline-block w-8 h-8 border-3 border-purple-300 border-t-purple-600 rounded-full animate-spin mb-2" />
        <p className="text-xs">Loading safety monitor board...</p>
      </div>
    );
  }

  const selectedTeam = managedTeams.find(t => t._id === selectedTeamId);
  const activeSOS = boardData?.memberStatuses?.filter(m => m.status === 'SOS') || [];

  return (
    <div
      className="rounded-3xl p-6 sm:p-7 border border-purple-100 dash-fade-up card-lift mb-5"
      style={{ background: 'linear-gradient(135deg, #faf5ff 0%, #ede9fe 100%)' }}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-3 border-b border-purple-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">🚨</span>
            <h3 className="font-bold text-purple-900 text-lg">Team Safety Board &amp; SOS Monitor</h3>
            <span className="badge" style={{ background: '#f3e8ff', color: '#6b21a8', borderColor: '#d8b4fe' }}>
              Manager Control
            </span>
          </div>
          <p className="text-xs text-purple-700 mt-1">
            Real-time worker safety check-ins, missing check-in detection, and emergency GPS alerts.
          </p>
        </div>

        {selectedTeamId && (
          <button
            onClick={() => fetchTeamLiveBoard(selectedTeamId)}
            disabled={boardLoading}
            className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-white/80 hover:bg-white text-purple-800 border border-purple-200 transition-all cursor-pointer self-start sm:self-auto"
          >
            {boardLoading ? 'Updating...' : '🔄 Refresh Live Board'}
          </button>
        )}
      </div>

      {errorMsg && (
        <div className="alert alert-error mb-4">
          ⚠️ {errorMsg}
        </div>
      )}

      {/* SOS Alert Banner */}
      {activeSOS.length > 0 && (
        <div className="bg-red-500 text-white rounded-2xl p-4 mb-5 shadow-lg border-2 border-red-600 animate-pulse">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">🚨</span>
            <div>
              <h4 className="font-extrabold text-sm uppercase tracking-wider">
                Active SOS Emergency Alert ({activeSOS.length})
              </h4>
              <p className="text-xs text-white/90">
                Immediate response required! One or more workers have signaled heat distress.
              </p>
            </div>
          </div>

          <div className="mt-3 space-y-2">
            {activeSOS.map((item, idx) => (
              <div
                key={idx}
                className="bg-white/20 rounded-xl p-2.5 flex flex-wrap items-center justify-between gap-2 text-xs"
              >
                <div>
                  <span className="font-bold text-sm">{item.worker.name}</span>
                  {item.worker.phone && <span className="ml-2">📞 {item.worker.phone}</span>}
                  {item.latestCheckIn?.note && (
                    <p className="text-[11px] text-white/90 italic mt-0.5">
                      "{item.latestCheckIn.note}"
                    </p>
                  )}
                </div>

                {item.latestCheckIn?.latitude && item.latestCheckIn?.longitude && (
                  <a
                    href={`https://www.google.com/maps?q=${item.latestCheckIn.latitude},${item.latestCheckIn.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1 bg-white text-red-600 rounded-lg font-bold text-xs hover:bg-white/90 transition-all flex items-center gap-1 shadow-sm"
                  >
                    📍 Open GPS Location
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Team Selection or Creation */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
        {/* Managed teams picker / Code */}
        <div className="md:col-span-2 bg-white/80 rounded-2xl p-4 border border-purple-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-purple-900">
                Active Safety Team
              </label>

              {managedTeams.length > 0 && (
                <div className="flex items-center gap-2">
                  <select
                    value={selectedTeamId}
                    onChange={(e) => handleSelectTeam(e.target.value)}
                    className="chhaya-input py-1 px-2.5 text-xs bg-purple-50 border-purple-200"
                  >
                    {managedTeams.map(t => (
                      <option key={t._id} value={t._id}>
                        {t.name} ({t.members?.length || 0} workers)
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {selectedTeam ? (
              <div className="flex flex-wrap items-center justify-between gap-3 mt-3 pt-3 border-t border-purple-100">
                <div>
                  <h4 className="font-extrabold text-base text-gray-900">{selectedTeam.name}</h4>
                  <p className="text-xs text-gray-500">
                    Workers Enrolled: <span className="font-bold text-purple-900">{selectedTeam.members?.length || 0}</span>
                  </p>
                </div>

                <div className="flex items-center gap-2 bg-purple-50 px-3.5 py-2 rounded-xl border border-purple-200">
                  <span className="text-xs font-semibold text-purple-700">Team Code:</span>
                  <span className="font-mono font-extrabold text-purple-950 text-sm tracking-widest">
                    {selectedTeam.code}
                  </span>
                  <button
                    type="button"
                    onClick={() => copyCode(selectedTeam.code)}
                    className="text-xs font-bold text-purple-600 hover:text-purple-800 bg-white px-2 py-1 rounded-md border border-purple-200 cursor-pointer"
                  >
                    {copiedCode ? '✓ Copied' : '📋 Copy'}
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-xs text-gray-400 mt-2">
                No teams registered yet. Create your first work crew team below.
              </p>
            )}
          </div>
        </div>

        {/* Quick create team form */}
        <div className="bg-white/80 rounded-2xl p-4 border border-purple-100 shadow-sm">
          <label className="block text-xs font-bold uppercase tracking-wider text-purple-900 mb-2">
            Create New Team
          </label>
          <form onSubmit={handleCreateTeam} className="space-y-2">
            <input
              type="text"
              value={newTeamName}
              onChange={(e) => setNewTeamName(e.target.value)}
              placeholder="e.g. Site 4 Construction Crew"
              required
              className="chhaya-input text-xs"
            />
            <button
              type="submit"
              disabled={creating}
              className="chhaya-btn-primary w-full py-2 text-xs"
            >
              {creating ? 'Creating...' : '+ Create Team'}
            </button>
          </form>
        </div>
      </div>

      {/* Live Board Status Counters */}
      {boardData && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
            <div className="bg-white/80 rounded-2xl p-3.5 border border-purple-100 text-center">
              <p className="text-[11px] font-semibold text-gray-500 uppercase">Total Workers</p>
              <p className="text-2xl font-extrabold text-purple-950 mt-0.5">
                {boardData.stats?.totalMembers || 0}
              </p>
            </div>
            <div className="bg-white/80 rounded-2xl p-3.5 border border-green-200 text-center">
              <p className="text-[11px] font-semibold text-green-700 uppercase">Checked in (OK)</p>
              <p className="text-2xl font-extrabold text-green-600 mt-0.5">
                {boardData.stats?.okCount || 0}
              </p>
            </div>
            <div className="bg-white/80 rounded-2xl p-3.5 border border-amber-200 text-center">
              <p className="text-[11px] font-semibold text-amber-700 uppercase">Missed / Overdue</p>
              <p className="text-2xl font-extrabold text-amber-600 mt-0.5">
                {boardData.stats?.missedCount || 0}
              </p>
            </div>
            <div className="bg-white/80 rounded-2xl p-3.5 border border-red-200 text-center">
              <p className="text-[11px] font-semibold text-red-700 uppercase">SOS Emergencies</p>
              <p className="text-2xl font-extrabold text-red-600 mt-0.5">
                {boardData.stats?.sosCount || 0}
              </p>
            </div>
          </div>

          {/* Members Table */}
          <div className="bg-white/90 rounded-2xl p-4 border border-purple-100 shadow-sm overflow-hidden">
            <h4 className="font-bold text-gray-900 text-sm mb-3">
              Worker Status Roster ({boardData.memberStatuses?.length || 0})
            </h4>

            {boardData.memberStatuses?.length === 0 ? (
              <div className="text-center py-6 text-gray-400 text-xs">
                No workers have joined this team yet. Share code <span className="font-mono font-bold text-purple-700">{selectedTeam?.code}</span> with workers.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-gray-100 text-gray-500 font-semibold uppercase">
                      <th className="pb-2.5 pl-2">Worker</th>
                      <th className="pb-2.5">Status</th>
                      <th className="pb-2.5">Last Check-in</th>
                      <th className="pb-2.5">Location</th>
                      <th className="pb-2.5 pr-2">Note</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {boardData.memberStatuses?.map((item) => {
                      const hasLocation = item.latestCheckIn?.latitude != null && item.latestCheckIn?.longitude != null;
                      return (
                        <tr key={item.worker._id} className="hover:bg-purple-50/40">
                          <td className="py-3 pl-2">
                            <p className="font-bold text-gray-900">{item.worker.name}</p>
                            <p className="text-[11px] text-gray-400">{item.worker.occupation || 'Worker'} · {item.worker.phone}</p>
                          </td>
                          <td className="py-3">
                            <span
                              className="badge"
                              style={
                                item.status === 'OK'
                                  ? { background: '#dcfce7', color: '#166534', borderColor: '#86efac' }
                                  : item.status === 'SOS'
                                  ? { background: '#fee2e2', color: '#991b1b', borderColor: '#fca5a5' }
                                  : { background: '#fef3c7', color: '#92400e', borderColor: '#fde68a' }
                              }
                            >
                              {item.status === 'OK' ? '✅ OK' : item.status === 'SOS' ? '🚨 SOS' : '⏳ Missed'}
                            </span>
                          </td>
                          <td className="py-3 text-gray-600">
                            {item.latestCheckIn ? (
                              <div>
                                <p className="font-medium text-gray-800">
                                  {new Date(item.latestCheckIn.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                                <p className="text-[10px] text-gray-400">
                                  {new Date(item.latestCheckIn.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                </p>
                              </div>
                            ) : (
                              <span className="text-gray-400 italic">Never checked in</span>
                            )}
                          </td>
                          <td className="py-3">
                            {hasLocation ? (
                              <a
                                href={`https://www.google.com/maps?q=${item.latestCheckIn.latitude},${item.latestCheckIn.longitude}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 font-semibold underline flex items-center gap-1"
                              >
                                <span>📍</span>
                                <span>View Map</span>
                              </a>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </td>
                          <td className="py-3 pr-2 text-gray-600 max-w-xs truncate">
                            {item.latestCheckIn?.note || '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default ManagerTeamBoard;

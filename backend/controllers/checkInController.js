const CheckIn = require('../models/CheckIn');
const Team = require('../models/Team');

// @desc    Worker sends OK or SOS check-in
// @route   POST /api/checkins
// @access  Private
const createCheckIn = async (req, res) => {
  try {
    const { teamId, type, latitude, longitude, note } = req.body;

    if (!type || !['OK', 'SOS'].includes(type)) {
      return res.status(400).json({ message: 'Type must be either OK or SOS' });
    }

    let targetTeamId = teamId;

    // If teamId not explicitly sent, find the team worker belongs to
    if (!targetTeamId) {
      const userTeam = await Team.findOne({ members: req.user._id });
      if (!userTeam) {
        return res.status(400).json({
          message: 'You have not joined any team yet. Please join a team with your manager\'s code.'
        });
      }
      targetTeamId = userTeam._id;
    }

    const checkIn = await CheckIn.create({
      team: targetTeamId,
      worker: req.user._id,
      type,
      latitude: latitude != null && !isNaN(Number(latitude)) ? Number(latitude) : null,
      longitude: longitude != null && !isNaN(Number(longitude)) ? Number(longitude) : null,
      note: note ? String(note).trim() : ''
    });

    const populatedCheckIn = await CheckIn.findById(checkIn._id)
      .populate('worker', 'name phone location occupation');

    res.status(201).json({
      message: type === 'SOS' ? '🚨 SOS Alert broadcast to your manager!' : '✅ Check-in recorded: All OK!',
      checkIn: populatedCheckIn
    });
  } catch (error) {
    console.error('Error creating check-in:', error);
    res.status(500).json({ message: error.message || 'Failed to record check-in' });
  }
};

// @desc    Manager live board for a team
// @route   GET /api/checkins/team/:teamId
// @access  Private (Manager / Admin)
const getTeamLiveBoard = async (req, res) => {
  try {
    const { teamId } = req.params;

    const team = await Team.findById(teamId)
      .populate('manager', 'name phone location occupation')
      .populate('members', 'name phone location occupation');

    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    // Role check: Only manager who created the team or admin
    if (
      req.user.role !== 'admin' &&
      team.manager._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: 'Not authorized to view this team board' });
    }

    // Get recent check-ins for the team
    const recentCheckIns = await CheckIn.find({ team: teamId })
      .populate('worker', 'name phone location occupation')
      .sort({ createdAt: -1 })
      .limit(30);

    // Compute status per team member
    const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000);

    const memberStatuses = await Promise.all(
      team.members.map(async (member) => {
        const lastCheckIn = await CheckIn.findOne({
          team: teamId,
          worker: member._id
        }).sort({ createdAt: -1 });

        let status = 'Missed';
        let isRecent = false;

        if (lastCheckIn) {
          isRecent = new Date(lastCheckIn.createdAt) >= fourHoursAgo;
          if (lastCheckIn.type === 'SOS') {
            status = 'SOS';
          } else if (isRecent) {
            status = 'OK';
          } else {
            status = 'Missed';
          }
        }

        return {
          worker: member,
          status,
          isRecent,
          latestCheckIn: lastCheckIn
        };
      })
    );

    const okCount = memberStatuses.filter(m => m.status === 'OK').length;
    const sosCount = memberStatuses.filter(m => m.status === 'SOS').length;
    const missedCount = memberStatuses.filter(m => m.status === 'Missed').length;

    res.json({
      team,
      memberStatuses,
      recentCheckIns,
      stats: {
        totalMembers: team.members.length,
        okCount,
        sosCount,
        missedCount
      }
    });
  } catch (error) {
    console.error('Error fetching team live board:', error);
    res.status(500).json({ message: error.message || 'Failed to fetch team live board' });
  }
};

module.exports = {
  createCheckIn,
  getTeamLiveBoard
};

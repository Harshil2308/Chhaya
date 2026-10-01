const crypto = require('crypto');
const Team = require('../models/Team');
const CheckIn = require('../models/CheckIn');

// Helper to generate unique team code
const generateTeamCode = () => {
  return 'CH' + crypto.randomBytes(2).toString('hex').toUpperCase();
};

// @desc    Create new team
// @route   POST /api/teams
// @access  Private (Manager / Admin)
const createTeam = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Team name is required' });
    }

    let code = generateTeamCode();
    // Ensure code uniqueness
    let existing = await Team.findOne({ code });
    while (existing) {
      code = generateTeamCode();
      existing = await Team.findOne({ code });
    }

    const team = await Team.create({
      name: name.trim(),
      code,
      manager: req.user._id,
      members: []
    });

    res.status(201).json(team);
  } catch (error) {
    console.error('Error creating team:', error);
    res.status(500).json({ message: error.message || 'Failed to create team' });
  }
};

// @desc    Join team by code or ID
// @route   POST /api/teams/:id/join or POST /api/teams/join
// @access  Private
const joinTeam = async (req, res) => {
  try {
    const identifier = req.params.id || req.body.code || req.body.teamId;

    if (!identifier) {
      return res.status(400).json({ message: 'Team code or ID is required' });
    }

    let team = null;
    const cleanId = String(identifier).trim();

    // Check if identifier is ObjectId
    if (/^[0-9a-fA-F]{24}$/.test(cleanId)) {
      team = await Team.findById(cleanId);
    }

    // Otherwise find by code
    if (!team) {
      team = await Team.findOne({ code: cleanId.toUpperCase() });
    }

    if (!team) {
      return res.status(404).json({ message: 'Team not found. Please verify the team code.' });
    }

    const userIdStr = req.user._id.toString();
    const alreadyMember = team.members.some(m => m.toString() === userIdStr);

    if (!alreadyMember) {
      team.members.push(req.user._id);
      await team.save();
    }

    const populatedTeam = await Team.findById(team._id)
      .populate('manager', 'name phone location occupation')
      .populate('members', 'name phone location occupation');

    res.json({
      message: alreadyMember ? 'You are already in this team' : 'Successfully joined team',
      team: populatedTeam
    });
  } catch (error) {
    console.error('Error joining team:', error);
    res.status(500).json({ message: error.message || 'Failed to join team' });
  }
};

// @desc    Get my team info (as manager or worker)
// @route   GET /api/teams/my
// @access  Private
const getMyTeams = async (req, res) => {
  try {
    const userId = req.user._id;

    if (req.user.role === 'manager' || req.user.role === 'admin') {
      // Find teams managed by this manager
      const managedTeams = await Team.find({ manager: userId })
        .populate('manager', 'name phone location occupation')
        .populate('members', 'name phone location occupation')
        .sort({ createdAt: -1 });

      return res.json({
        role: req.user.role,
        managedTeams,
        currentTeam: managedTeams[0] || null
      });
    }

    // For worker: find team where user is a member
    const joinedTeam = await Team.findOne({ members: userId })
      .populate('manager', 'name phone location occupation')
      .populate('members', 'name phone location occupation');

    // Also get worker's latest check-in
    let latestCheckIn = null;
    if (joinedTeam) {
      latestCheckIn = await CheckIn.findOne({ worker: userId, team: joinedTeam._id })
        .sort({ createdAt: -1 });
    }

    res.json({
      role: req.user.role,
      joinedTeam,
      latestCheckIn
    });
  } catch (error) {
    console.error('Error fetching my team:', error);
    res.status(500).json({ message: error.message || 'Failed to fetch team data' });
  }
};

module.exports = {
  createTeam,
  joinTeam,
  getMyTeams
};

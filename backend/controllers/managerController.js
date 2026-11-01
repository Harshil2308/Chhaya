const User = require('../models/User');
const Hotspot = require('../models/Hotspot');

/**
 * GET /api/manager/area-summary
 * Returns summary data for the logged-in manager's managed city + area.
 * Protected: JWT + role=manager (or admin)
 */
const getAreaSummary = async (req, res) => {
  try {
    const manager = req.user;

    const managedCity = manager.managedCity || '';
    const managedArea = manager.managedArea || '';

    if (!managedCity || !managedArea) {
      return res.status(400).json({
        message: 'Manager has no assigned city or area. Please contact admin.'
      });
    }

    // Count workers in this city + area
    const workerCount = await User.countDocuments({
      role: 'worker',
      city: { $regex: new RegExp(`^${managedCity}$`, 'i') },
      areaName: { $regex: new RegExp(`^${managedArea}$`, 'i') }
    });

    // Count pending hotspots in this city + area
    const pendingHotspots = await Hotspot.countDocuments({
      city: { $regex: new RegExp(`^${managedCity}$`, 'i') },
      areaName: { $regex: new RegExp(`^${managedArea}$`, 'i') },
      status: 'Pending'
    });

    // Total hotspots in this city + area
    const totalHotspots = await Hotspot.countDocuments({
      city: { $regex: new RegExp(`^${managedCity}$`, 'i') },
      areaName: { $regex: new RegExp(`^${managedArea}$`, 'i') }
    });

    res.json({
      managedCity,
      managedArea,
      workerCount,
      pendingHotspots,
      totalHotspots
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * GET /api/manager/workers
 * Returns workers in the manager's managed city + area.
 */
const getAreaWorkers = async (req, res) => {
  try {
    const manager = req.user;
    const managedCity = manager.managedCity || '';
    const managedArea = manager.managedArea || '';

    if (!managedCity || !managedArea) {
      return res.status(400).json({ message: 'Manager has no assigned city or area' });
    }

    const workers = await User.find({
      role: 'worker',
      city: { $regex: new RegExp(`^${managedCity}$`, 'i') },
      areaName: { $regex: new RegExp(`^${managedArea}$`, 'i') }
    }).select('-password').sort({ createdAt: -1 });

    res.json(workers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * GET /api/manager/hotspots
 * Returns hotspots filtered by the manager's managed city + area.
 */
const getAreaHotspots = async (req, res) => {
  try {
    const manager = req.user;
    const managedCity = manager.managedCity || '';
    const managedArea = manager.managedArea || '';

    if (!managedCity || !managedArea) {
      return res.status(400).json({ message: 'Manager has no assigned city or area' });
    }

    const hotspots = await Hotspot.find({
      city: { $regex: new RegExp(`^${managedCity}$`, 'i') },
      areaName: { $regex: new RegExp(`^${managedArea}$`, 'i') }
    })
      .populate('reportedBy', 'name phone')
      .sort({ createdAt: -1 });

    res.json(hotspots);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getAreaSummary, getAreaWorkers, getAreaHotspots };

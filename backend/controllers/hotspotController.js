const Hotspot = require('../models/Hotspot');
const { isValidCity, isValidArea } = require('../utils/gujaratData');

// Report a new hotspot / complaint
const reportHotspot = async (req, res) => {
  try {
    const { location, city, areaName, description } = req.body;

    // Strict validation
    if (!location || !location.trim()) {
      return res.status(400).json({ message: 'Location / Landmark is required' });
    }
    if (!city || !city.trim()) {
      return res.status(400).json({ message: 'City is required (Must be a Gujarat city)' });
    }
    if (!areaName || !areaName.trim()) {
      return res.status(400).json({ message: 'Area is required' });
    }

    // Optional Gujarat validation warning/check
    if (!isValidCity(city.trim())) {
      return res.status(400).json({ message: `City "${city}" is not a recognized Gujarat city` });
    }

    const hotspot = await Hotspot.create({
      location: location.trim(),
      city: city.trim(),
      areaName: areaName.trim(),
      description: (description || '').trim(),
      reportedBy: req.user._id,
      status: 'Pending'
    });

    const populated = await Hotspot.findById(hotspot._id).populate('reportedBy', 'name phone');
    res.status(201).json(populated || hotspot);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get hotspots / complaints (supports city, areaName, status, or myComplaints)
const getHotspots = async (req, res) => {
  try {
    const { city, areaName, status, myComplaints } = req.query;
    let query = {};

    if (myComplaints === 'true') {
      query.reportedBy = req.user._id;
    } else {
      if (city) {
        query.city = { $regex: `^${city.trim()}$`, $options: 'i' };
      }
      if (areaName) {
        query.areaName = { $regex: `^${areaName.trim()}$`, $options: 'i' };
      }
    }

    if (status && ['Pending', 'Verified', 'Resolved'].includes(status)) {
      query.status = status;
    }

    const hotspots = await Hotspot.find(query)
      .populate('reportedBy', 'name phone')
      .sort({ createdAt: -1 });

    res.json(hotspots);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update hotspot / complaint status (Manager and Admin)
const updateHotspotStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!['Pending', 'Verified', 'Resolved'].includes(status)) {
      return res.status(400).json({ message: 'Status must be Pending, Verified, or Resolved' });
    }

    const hotspot = await Hotspot.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate('reportedBy', 'name phone');

    if (!hotspot) {
      return res.status(404).json({ message: 'Hotspot complaint not found' });
    }

    res.json(hotspot);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  reportHotspot,
  getHotspots,
  updateHotspotStatus
};
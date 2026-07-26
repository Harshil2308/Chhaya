const Hotspot = require('../models/Hotspot');

// Report a new hotspot
const reportHotspot = async (req, res) => {
  try {
    const { location, city, description } = req.body;

    const hotspot = await Hotspot.create({
      location,
      city,
      description: description || '',
      reportedBy: req.user._id
    });

    res.status(201).json(hotspot);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all hotspots
const getHotspots = async (req, res) => {
  try {
    const { city } = req.query;
    let query = {};

    if (city) {
      query.city = { $regex: city, $options: 'i' };
    }

    const hotspots = await Hotspot.find(query)
      .populate('reportedBy', 'name phone')
      .sort({ createdAt: -1 });

    res.json(hotspots);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update hotspot status (Admin only)
const updateHotspotStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const hotspot = await Hotspot.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!hotspot) {
      return res.status(404).json({ message: 'Hotspot not found' });
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
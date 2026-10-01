const CoolingCenter = require('../models/CoolingCenter');

const getCoolingCenters = async (req, res) => {
  try {
    const { city } = req.query;
    let query = {};

    if (city) {
      query.city = { $regex: city, $options: 'i' };
    }

    const centers = await CoolingCenter.find(query).sort({ createdAt: -1 });
    res.json(centers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const addCoolingCenter = async (req, res) => {
  try {
    const { name, address, city, type, facilities, contact, latitude, longitude } = req.body;

    const center = await CoolingCenter.create({
      name,
      address,
      city,
      type: type || 'Other',
      facilities: facilities || 'Shade, Water',
      contact: contact || '',
      latitude: latitude !== undefined && latitude !== '' && !isNaN(Number(latitude)) ? Number(latitude) : null,
      longitude: longitude !== undefined && longitude !== '' && !isNaN(Number(longitude)) ? Number(longitude) : null
    });

    res.status(201).json(center);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteCoolingCenter = async (req, res) => {
  try {
    const center = await CoolingCenter.findByIdAndDelete(req.params.id);

    if (!center) {
      return res.status(404).json({ message: 'Cooling center not found' });
    }

    res.json({ message: 'Cooling center deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getCoolingCenters,
  addCoolingCenter,
  deleteCoolingCenter
};
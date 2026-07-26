const axios = require('axios');
const { calculateHeatIndex, getRiskLevel } = require('../utils/heatIndex');

const getHeatAlert = async (req, res) => {
  try {
    const { city } = req.query;

    if (!city) {
      return res.status(400).json({ message: 'City is required' });
    }

    const apiKey = process.env.WEATHER_API_KEY;
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${apiKey}`;

    const response = await axios.get(url);
    const data = response.data;

    const temp = data.main.temp;
    const humidity = data.main.humidity;
    const heatIndex = calculateHeatIndex(temp, humidity);
    const risk = getRiskLevel(heatIndex);

    res.json({
      city: data.name,
      temperature: temp,
      humidity,
      heatIndex,
      riskLevel: risk.level,
      advice: risk.advice,
      color: risk.color
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: 'Failed to fetch weather data' });
  }
};

module.exports = { getHeatAlert };
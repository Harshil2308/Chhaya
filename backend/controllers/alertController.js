const axios = require('axios');
const { calculateHeatIndex, getRiskLevel } = require('../utils/heatIndex');
const { calculatePersonalRisk } = require('../utils/personalRisk');

const getWorkRestGuidance = (riskLevel) => {
  switch (riskLevel) {
    case 'Low':
      return {
        workRest: '60 min work / normal breaks',
        guidance: 'Standard outdoor activity permitted. Drink water every 30 mins.',
        status: 'Safe'
      };
    case 'Moderate':
      return {
        workRest: '50 min work / 10 min rest in shade',
        guidance: 'Drink 250ml water every 20-30 mins. Provide shaded rest areas.',
        status: 'Caution'
      };
    case 'High':
      return {
        workRest: '45 min work / 15 min rest',
        guidance: 'Mandatory rest in shade. Limit heavy physical exertion.',
        status: 'High Alert'
      };
    case 'Very High':
      return {
        workRest: '30 min work / 30 min rest',
        guidance: 'Extreme thermal strain. Rotate workers, mandatory cool water and electrolytes.',
        status: 'Hazardous'
      };
    case 'Extreme':
    default:
      return {
        workRest: '15 min light work / 45 min cool-down',
        guidance: 'Halt all non-essential heavy outdoor labor. Active cooling required.',
        status: 'Stop Outdoor Work'
      };
  }
};

const getHeatAlert = async (req, res) => {
  try {
    const { city, job } = req.query;

    if (!city) {
      return res.status(400).json({ message: 'City is required' });
    }

    const apiKey = process.env.WEATHER_API_KEY;
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&units=metric&appid=${apiKey}`;

    const response = await axios.get(url);
    const data = response.data;

    const temp = data.main.temp;
    const humidity = data.main.humidity;
    const heatIndex = calculateHeatIndex(temp, humidity);
    const risk = getRiskLevel(heatIndex);

    const payload = {
      city: data.name,
      temperature: temp,
      humidity,
      heatIndex,
      riskLevel: risk.level,
      advice: risk.advice,
      color: risk.color
    };

    // If job is provided, compute personal risk fields
    if (job) {
      const personal = calculatePersonalRisk(heatIndex, job);
      if (personal) {
        payload.personalHeatIndex = personal.personalHeatIndex;
        payload.personalRiskLevel = personal.personalRiskLevel;
        payload.personalAdvice = personal.personalAdvice;
        payload.personalColor = personal.personalColor;
        payload.job = personal.job;
        payload.jobPoints = personal.jobPoints;
        payload.reason = personal.reason;
      }
    }

    res.json(payload);
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: 'Failed to fetch weather data' });
  }
};

const getForecastAlert = async (req, res) => {
  const city = req.query.city || 'Ahmedabad';
  const apiKey = process.env.WEATHER_API_KEY;

  try {
    const url = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&units=metric&appid=${apiKey}`;
    const response = await axios.get(url);
    const list = response.data.list || [];

    // Next 8 blocks = 24-hour forward timeline in 3-hour increments
    const blocks = list.slice(0, 8).map((item) => {
      const temp = item.main.temp;
      const humidity = item.main.humidity;
      const heatIndex = calculateHeatIndex(temp, humidity);
      const risk = getRiskLevel(heatIndex);
      const shiftGuidance = getWorkRestGuidance(risk.level);

      const dateObj = new Date(item.dt * 1000);
      const timeLabel = dateObj.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
      const dayLabel = dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

      return {
        dt: item.dt,
        dt_txt: item.dt_txt,
        timeLabel,
        dayLabel,
        temp: Math.round(temp * 10) / 10,
        humidity,
        heatIndex,
        riskLevel: risk.level,
        color: risk.color,
        advice: risk.advice,
        workRest: shiftGuidance.workRest,
        guidance: shiftGuidance.guidance,
        status: shiftGuidance.status,
        isSafer: risk.level === 'Low' || risk.level === 'Moderate'
      };
    });

    const saferBlocks = blocks.filter(b => b.isSafer);
    let saferWindows = [];
    if (saferBlocks.length > 0) {
      saferWindows = saferBlocks.map(b => `${b.timeLabel} (${b.riskLevel} Risk · ${b.heatIndex}°C HI)`);
    } else {
      const sortedByHI = [...blocks].sort((a, b) => a.heatIndex - b.heatIndex);
      saferWindows = sortedByHI.slice(0, 2).map(b => `${b.timeLabel} (Lowest heat index: ${b.heatIndex}°C)`);
    }

    res.json({
      fallback: false,
      city: response.data.city?.name || city,
      blocks,
      saferWindows
    });
  } catch (error) {
    console.error('Forecast fetch failed, using fallback:', error.message);
    res.json({
      fallback: true,
      city,
      message: 'Live forecast temporarily unavailable. Using standard safety hours.',
      saferWindows: [
        '6:00 AM – 11:00 AM (Recommended Morning Shift)',
        '4:00 PM – 7:00 PM (Recommended Evening Shift)'
      ],
      blocks: []
    });
  }
};

module.exports = { getHeatAlert, getForecastAlert };
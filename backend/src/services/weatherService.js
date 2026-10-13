// שירות מזג אוויר (Weather Service)
// Live NYC weather from Open-Meteo (free, no API key).

const cache = require('./cacheService');

const URL = 'https://api.open-meteo.com/v1/forecast'
  + '?latitude=40.71&longitude=-74.01'
  + '&current=temperature_2m,weather_code&temperature_unit=fahrenheit';

const WEATHER_TTL = 15 * 60 * 1000;  // 15 minutes — Open-Meteo updates every 15 min

// WMO weather codes → short label
function describe(code) {
  if (code === 0)  return 'Clear';
  if (code <= 2)   return 'Partly Cloudy';
  if (code === 3)  return 'Cloudy';
  if (code <= 48)  return 'Fog';
  if (code <= 57)  return 'Drizzle';
  if (code <= 67)  return 'Rain';
  if (code <= 77)  return 'Snow';
  if (code <= 82)  return 'Showers';
  if (code <= 86)  return 'Snow Showers';
  return 'Thunderstorm';
}

async function getWeather() {
  const cached = cache.get('weather', {});
  if (cached) return cached;

  const res = await fetch(URL);
  if (!res.ok) throw new Error(`Open-Meteo HTTP ${res.status}`);
  const { current } = await res.json();

  const data = {
    nyc: {
      temp:       Math.round(current.temperature_2m),
      conditions: describe(current.weather_code),
      label:      'New York City',
    },
    asOf: new Date().toISOString(),
  };
  cache.set('weather', {}, data, WEATHER_TTL);
  return data;
}

module.exports = { getWeather, describe };

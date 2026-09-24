import { getWeatherView } from './weather-agent.js';

const searchForm = document.querySelector('#search-form');
const locationInput = document.querySelector('#location-input');
const statusMessage = document.querySelector('#status-message');
const resultPanel = document.querySelector('#weather-result');
const locateButton = document.querySelector('#locate-button');

const weatherIcons = {
  sunny: '☀', cloudy: '☁', rainy: '☂', snowy: '✳', foggy: '≋', stormy: 'ϟ'
};

function setStatus(message, isError = false) {
  statusMessage.textContent = message;
  statusMessage.classList.toggle('error', isError);
}

function formatForecastDay(date, index) {
  if (index === 0) return 'Today';
  return new Date(`${date}T12:00:00`).toLocaleDateString(undefined, { weekday: 'short' });
}

function renderWeather(view) {
  resultPanel.innerHTML = `
    <div class="weather-heading">
      <div><p class="eyebrow">Right now in</p><h2>${view.location}</h2></div>
      <span class="weather-icon" aria-hidden="true">${weatherIcons[view.kind]}</span>
    </div>
    <div class="temperature-row">
      <strong>${view.temperature}°</strong>
      <div><p class="condition">${view.description}</p><p class="muted">Feels like ${view.feelsLike}°C</p></div>
    </div>
    <div class="advice-box"><span class="advice-mark" aria-hidden="true">✦</span><div><p class="eyebrow">What to wear</p><p>${view.advice}</p></div></div>
    <div class="forecast-section">
      <div class="forecast-heading"><p class="eyebrow">The week ahead</p><p class="muted">High / low</p></div>
      <div class="forecast-grid">${view.forecast.map((day, index) => `
        <article class="forecast-day">
          <p class="forecast-date">${formatForecastDay(day.date, index)}</p>
          <span class="forecast-icon" aria-hidden="true">${weatherIcons[day.kind]}</span>
          <p class="forecast-temperatures"><strong>${day.high}°</strong> <span>${day.low}°</span></p>
          <p class="forecast-condition">${day.description}</p>
          <p class="forecast-rain">☂ ${day.rainChance}% rain</p>
        </article>`).join('')}</div>
    </div>`;
  resultPanel.classList.remove('empty');
}

async function findWeather(location) {
  const normalizedLocation = location.toLowerCase().replace(/[.\s]/g, '');
  const searchNames = [location.replace(/jandk|j&k/ig, 'Jammu and Kashmir')];
  if (normalizedLocation.includes('rspura')) {
    searchNames.push('R.S. Pura', 'R.S. Pura Jammu');
  }
  const firstWord = location.trim().split(/\s+/)[0];
  if (firstWord && firstWord.length > 2 && location.trim().split(/\s+/).length > 1) {
    searchNames.push(firstWord);
  }

  let geocode = { results: [] };
  for (const searchName of [...new Set(searchNames)]) {
    const geocodeResponse = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(searchName)}&count=10&language=en&format=json`);
    if (!geocodeResponse.ok) throw new Error('Could not find that place.');
    geocode = await geocodeResponse.json();
    if (geocode.results?.length) break;
  }
  const places = geocode.results ?? [];
  const needsJammu = /jammu|jandk|j&k|kashmir/i.test(location);
  const searchName = location.toLowerCase();
  const exactPlaces = places.filter((result) => result.name?.toLowerCase() === searchName);
  const jammuPlaces = places.filter((result) => `${result.admin1 ?? ''} ${result.admin2 ?? ''}`.toLowerCase().includes('jammu') || `${result.admin1 ?? ''}`.toLowerCase().includes('kashmir'));
  const regionalPlaces = needsJammu ? jammuPlaces : places;
  const place = exactPlaces.find((result) => regionalPlaces.includes(result) && result.feature_code?.startsWith('PPL'))
    ?? exactPlaces.find((result) => regionalPlaces.includes(result))
    ?? regionalPlaces.find((result) => result.feature_code?.startsWith('PPL'))
    ?? regionalPlaces[0];
  if (!place) throw new Error('That small place is not in the map database. Use “Use my location” for exact local weather.');

  return getWeatherAtCoordinates(place.latitude, place.longitude, `${place.name}${place.country ? `, ${place.country}` : ''}`);
}

async function getWeatherAtCoordinates(latitude, longitude, location) {
  const weatherResponse = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,apparent_temperature,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&forecast_days=7&timezone=auto`);
  if (!weatherResponse.ok) throw new Error('The weather service is unavailable right now.');
  return getWeatherView(await weatherResponse.json(), location);
}

searchForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const location = locationInput.value.trim();
  if (!location) {
    setStatus('Type a town or city first.', true);
    locationInput.focus();
    return;
  }
  setStatus('Looking outside for you...');
  const button = searchForm.querySelector('button');
  button.disabled = true;
  try {
    renderWeather(await findWeather(location));
    setStatus('Updated just now.');
  } catch (error) {
    setStatus(error.message, true);
  } finally {
    button.disabled = false;
  }
});

locateButton.addEventListener('click', () => {
  if (!navigator.geolocation) {
    setStatus('Your browser does not support location.', true);
    return;
  }
  setStatus('Asking for your location...');
  locateButton.disabled = true;
  navigator.geolocation.getCurrentPosition(async ({ coords }) => {
    try {
      renderWeather(await getWeatherAtCoordinates(coords.latitude, coords.longitude, 'Your location'));
      setStatus('Updated for your exact location.');
    } catch (error) {
      setStatus(error.message, true);
    } finally {
      locateButton.disabled = false;
    }
  }, () => {
    setStatus('Location permission was not allowed.', true);
    locateButton.disabled = false;
  });
});
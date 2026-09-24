const WEATHER_DESCRIPTIONS = {
  0: ['Clear sky', 'sunny'],
  1: ['Mainly clear', 'sunny'],
  2: ['Partly cloudy', 'cloudy'],
  3: ['Overcast', 'cloudy'],
  45: ['Foggy', 'foggy'],
  48: ['Icy fog', 'foggy'],
  51: ['Light drizzle', 'rainy'],
  53: ['Drizzle', 'rainy'],
  55: ['Heavy drizzle', 'rainy'],
  61: ['Light rain', 'rainy'],
  63: ['Rain', 'rainy'],
  65: ['Heavy rain', 'rainy'],
  71: ['Light snow', 'snowy'],
  73: ['Snow', 'snowy'],
  75: ['Heavy snow', 'snowy'],
  80: ['Rain showers', 'rainy'],
  81: ['Rain showers', 'rainy'],
  82: ['Heavy showers', 'rainy'],
  95: ['Thunderstorm', 'stormy'],
  96: ['Thunderstorm with hail', 'stormy'],
  99: ['Thunderstorm with hail', 'stormy']
};

export function describeWeather(code) {
  return WEATHER_DESCRIPTIONS[code] ?? ['Changing skies', 'cloudy'];
}

export function clothingAdvice(temperature, weatherCode) {
  const [, kind] = describeWeather(weatherCode);
  const layers = temperature < 8
    ? 'a warm coat, a sweater, and closed shoes'
    : temperature < 16
      ? 'a light jacket or hoodie and trousers'
      : temperature < 24
        ? 'a light top with trousers or jeans'
        : 'breathable clothes and comfortable shoes';
  const extras = kind === 'rainy' || kind === 'stormy'
    ? ' Pack an umbrella or a waterproof layer.'
    : kind === 'snowy'
      ? ' Add gloves and shoes with good grip.'
      : kind === 'sunny' && temperature >= 20
        ? ' Sunglasses and sunscreen are a good idea.'
        : '';
  return `Wear ${layers}.${extras}`;
}

export function summarizeWeather(weather, location) {
  const [description] = describeWeather(weather.current.weather_code);
  return `${location}: ${Math.round(weather.current.temperature_2m)}°C and ${description.toLowerCase()}.`;
}

export function getWeatherView(weather, location) {
  const [description, kind] = describeWeather(weather.current.weather_code);
  const temperature = Math.round(weather.current.temperature_2m);
  const forecast = weather.daily.time.map((date, index) => {
    const high = Math.round(weather.daily.temperature_2m_max[index]);
    const low = Math.round(weather.daily.temperature_2m_min[index]);
    const weatherCode = weather.daily.weather_code[index];
    const [dayDescription, dayKind] = describeWeather(weatherCode);
    return {
      date,
      high,
      low,
      description: dayDescription,
      kind: dayKind,
      rainChance: weather.daily.precipitation_probability_max?.[index] ?? 0,
      advice: clothingAdvice(Math.round((high + low) / 2), weatherCode)
    };
  });
  return {
    location,
    temperature,
    feelsLike: Math.round(weather.current.apparent_temperature),
    description,
    kind,
    advice: clothingAdvice(temperature, weather.current.weather_code),
    forecast
  };
}
# Weather & Wear

A beginner-friendly website that looks up a place, shows its current weather, and suggests what to wear.

## Run it

1. Open this folder in VS Code.
2. Install the **Live Server** extension, then right-click `index.html` and choose **Open with Live Server**.
3. Search for a city.

The test can be run with `npm test`.

## Learn the pieces

- `index.html` is the structure and words on the page.
- `styles.css` controls colors, spacing, and mobile layout.
- `src/app.js` listens for the search and talks to the weather service.
- `src/weather-agent.js` turns weather numbers into human-friendly descriptions and outfit advice.

The app uses the free Open-Meteo APIs, so it does not need a login or API key.
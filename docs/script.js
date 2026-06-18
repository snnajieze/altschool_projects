/* 
   script.js — Weather App
   Uses the Open-Meteo free API (no key required).

   Flow:
     1. User types a city name and clicks Search
        (or the page auto-detects their location on load)
     2. getCoordinates()  → converts city name to lat/lon
     3. getWeather()      → fetches current weather + 5-day forecast
     4. displayCurrentWeather() + displayForecast() → update the DOM
   */

"use strict";

/* 
   DOM references to grab every element we will read or update
 */
const searchForm = document.getElementById("searchForm");
const cityInput = document.getElementById("cityInput");
const loadingEl = document.getElementById("loading");
const errorEl = document.getElementById("errorMessage");
const heroSection = document.getElementById("heroSection");
const heroIcon = document.getElementById("heroIcon");
const heroCity = document.getElementById("heroCity");
const heroTemp = document.getElementById("heroTemp");
const heroDesc = document.getElementById("heroDesc");
const statsRow = document.getElementById("statsRow");
const statHumidity = document.getElementById("statHumidity");
const statWind = document.getElementById("statWind");
const statUV = document.getElementById("statUV");
const forecastSection = document.getElementById("forecastSection");
const forecastList = document.getElementById("forecastList");
const unitToggle = document.getElementById("unitToggle");
const searchHistory = document.getElementById("searchHistory");

/*
   State variables shared between functions
*/
// Stores the last fetched weather payload so we can toggle units
// without making another network request (bonus feature).
let cachedWeatherData = null;
// Tracks whether we are currently displaying Celsius or Fahrenheit.
let isCelsius = true;

// Convert a WMO weather code to description and icon
function getWeatherInfo(code) {
    // Each entry covers a range of WMO codes that share
    // the same visual meaning.
    if (code === 0) return { description: "Clear sky", icon: "☀", animClass: "animate-sun" };
    if (code >= 1 && code <= 3) return { description: "Partly cloudy", icon: "⛅", animClass: "animate-pulse" };
    if (code === 45 || code === 48) return { description: "Foggy", icon: "🌫", animClass: "animate-pulse" };
    if (code >= 51 && code <= 55) return { description: "Drizzle", icon: "🌦", animClass: "animate-rain" };
    if (code >= 61 && code <= 65) return { description: "Rain", icon: "🌧", animClass: "animate-rain" };
    if (code >= 71 && code <= 75) return { description: "Snow", icon: "❄", animClass: "animate-pulse" };
    if (code >= 80 && code <= 82) return { description: "Rain showers", icon: "🌦", animClass: "animate-rain" };
    if (code === 95) return { description: "Thunderstorm", icon: "⛈", animClass: "animate-flash" };
    // Fallback for any other code not listed in the brief
    return { description: "Unknown", icon: "🌡️", animClass: "" };
}

/*
   Helper: getUVLabel(uvValue)
   Converts a numeric UV index into a descriptive label
   (e.g. 3 → "Moderate") so the stats row is easy to read.
    */
function getUVLabel(uvValue) {
    if (uvValue == null) return "N/A";
    if (uvValue < 3) return "Low";
    if (uvValue < 6) return "Moderate";
    if (uvValue < 8) return "High";
    if (uvValue < 11) return "Very High";
    return "Extreme";
}

/* 
   Helper: celsiusToFahrenheit(c)
   Converts a Celsius value to Fahrenheit.
   Used by the unit-toggle feature (bonus).
    */
function celsiusToFahrenheit(c) {
    return Math.round((c * 9) / 5 + 32);
}

/* 
   Helper: formatTemperature(celsius)
   Returns a formatted temperature string in whichever unit
   is currently active.  Example: "32°C" or "90°F"
    */
function formatTemperature(celsius) {
    if (isCelsius) {
        return `${Math.round(celsius)}°C`;
    }
    return `${celsiusToFahrenheit(celsius)}°F`;
}

/* 
   Helper: getDayName(dateString)
   Converts an ISO date string (e.g. "2026-06-18") into a
   short day name.  The first entry in the forecast is always
   "Today" regardless of which day of the week it falls on.
    */
function getDayName(dateString, isFirst) {
    if (isFirst) return "Today";
    // Parse the date and return a long weekday name (Monday, Tuesday…)
    const date = new Date(dateString + "T00:00:00"); // force local midnight
    return date.toLocaleDateString("en-US", { weekday: "long" });
}

/* 
   Function showLoading(isVisible)
   Shows or hides the loading spinner while API calls run.
    */
function showLoading(isVisible) {
    loadingEl.hidden = !isVisible;
}

// Show an error message on the page
function showError(message) {
    errorEl.textContent = message;
    errorEl.hidden = false;
    // Hide weather content when there is an error
    heroSection.hidden = true;
    statsRow.hidden = true;
    forecastSection.hidden = true;
}

/* 
   Function clearError()
   Removes any previously shown error message.
    */
function clearError() {
    errorEl.textContent = "";
    errorEl.hidden = true;
}

// Get coordinates for a city name
async function getCoordinates(city) {
    // Build the geocoding URL with the city name encoded for safety
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;

    const response = await fetch(url);

    // Check that the HTTP request itself succeeded
    if (!response.ok) {
        throw new Error("Could not reach the geocoding service. Please try again.");
    }

    const data = await response.json();

    // The API returns an empty results array when the city is not found
    if (!data.results || data.results.length === 0) {
        throw new Error(`City "${city}" not found. Please check the spelling and try again.`);
    }

    // Extract the first (best-match) result
    const result = data.results[0];
    return {
        lat: result.latitude,
        lon: result.longitude,
        name: result.name,
        country: result.country
    };
}

// Fetch current weather and 5-day forecast
async function getWeather(lat, lon) {
    // Construct the forecast URL with all required fields
    const url =
        `https://api.open-meteo.com/v1/forecast` +
        `?latitude=${lat}&longitude=${lon}` +
        `&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code,apparent_temperature` +
        `&daily=temperature_2m_max,temperature_2m_min,weather_code,uv_index_max` +
        `&timezone=auto` +
        `&forecast_days=5`;

    const response = await fetch(url);

    // Throw a meaningful error if the weather service is unavailable
    if (!response.ok) {
        throw new Error("Could not reach the weather service. Please try again.");
    }

    return await response.json();
}

// Update the DOM with 5-day forecast
function displayCurrentWeather(data, cityName, country) {
    const current = data.current;
    const { description, icon, animClass } = getWeatherInfo(current.weather_code);

    // Update the animated weather icon in the hero
    heroIcon.textContent = icon;
    // Remove all previous animation classes then add the correct one
    heroIcon.className = "hero__icon";
    if (animClass) heroIcon.classList.add(animClass);

    // City name and country
    heroCity.textContent = `${cityName}, ${country}`;

    // Temperature — respect the current unit setting
    heroTemp.textContent = formatTemperature(current.temperature_2m);

    // Description and feels-like temperature
    const feelsLike = current.apparent_temperature != null
        ? ` · Feels like ${formatTemperature(current.apparent_temperature)}`
        : "";
    heroDesc.textContent = `${description}${feelsLike}`;

    // Stats row
    statHumidity.textContent = `${current.relative_humidity_2m}%`;
    statWind.textContent = `${current.wind_speed_10m} km/h`;

    // UV Index comes from daily data (today = index 0)
    const uvValue = data.daily?.uv_index_max?.[0];
    statUV.textContent = getUVLabel(uvValue);

    // Show all weather sections now that data is ready
    heroSection.hidden = false;
    statsRow.hidden = false;
}

/* 
   Function displayForecast(daily)
   Builds and injects the 5-day forecast list into the DOM.
   Each row shows: day name, weather icon, high and low temp.
    */
function displayForecast(daily) {
    // Clear any previously rendered forecast rows
    forecastList.innerHTML = "";

    // Loop over the first 5 days in the daily arrays
    for (let i = 0; i < 5; i++) {
        const { icon } = getWeatherInfo(daily.weather_code[i]);
        const dayName = getDayName(daily.time[i], i === 0);
        const high = formatTemperature(daily.temperature_2m_max[i]);
        const low = formatTemperature(daily.temperature_2m_min[i]);

        // Build a list item for this forecast day
        const li = document.createElement("li");
        li.className = "forecast__row";
        li.setAttribute("role", "listitem");

        li.innerHTML = `
      <span class="forecast__day">${dayName}</span>
      <span class="forecast__icon" aria-hidden="true">${icon}</span>
      <span class="forecast__temps">
        <span class="forecast__high">${high}</span>
        <span class="forecast__low">${low}</span>
      </span>
    `;

        forecastList.appendChild(li);
    }

    forecastSection.hidden = false;
}

/* 
   Function refreshDisplayedTemperatures()
   Re-renders the hero temperature and entire forecast list
   using the cached weather data and current unit preference.
   Called by the unit-toggle button — no new API call needed.
    */
function refreshDisplayedTemperatures() {
    if (!cachedWeatherData) return;

    const { weatherData, cityName, country } = cachedWeatherData;

    // Re-render hero temperature and feels-like
    const current = weatherData.current;
    heroTemp.textContent = formatTemperature(current.temperature_2m);

    const { description } = getWeatherInfo(current.weather_code);
    const feelsLike = current.apparent_temperature != null
        ? ` · Feels like ${formatTemperature(current.apparent_temperature)}`
        : "";
    heroDesc.textContent = `${description}${feelsLike}`;

    // Re-render the 5-day forecast rows
    displayForecast(weatherData.daily);
}

/* 
   Search history feature (bonus)
   loadHistory()   — reads from localStorage and renders buttons
   saveToHistory() — adds a city and saves back to localStorage
    */

/* Loads the search history array from localStorage */
function loadHistory() {
    const stored = localStorage.getItem("weatherHistory");
    return stored ? JSON.parse(stored) : [];
}

/* Renders quick-access buttons for each city in history */
function renderHistory() {
    const history = loadHistory();
    searchHistory.innerHTML = "";

    history.forEach(city => {
        const btn = document.createElement("button");
        btn.className = "search-history__btn";
        btn.textContent = city;
        btn.setAttribute("aria-label", `Search for ${city}`);

        // Clicking a history button fills the input and triggers search
        btn.addEventListener("click", () => {
            cityInput.value = city;
            handleSearch();
        });

        searchHistory.appendChild(btn);
    });
}

/* Adds a city to the front of the history list (max 5 entries) */
function saveToHistory(cityName) {
    let history = loadHistory();

    // Remove the city if it already exists to avoid duplicates
    history = history.filter(c => c.toLowerCase() !== cityName.toLowerCase());

    // Add the new city to the front
    history.unshift(cityName);

    // Keep only the 5 most recent searches
    if (history.length > 5) history = history.slice(0, 5);

    localStorage.setItem("weatherHistory", JSON.stringify(history));
    renderHistory();
}

// Main function triggered by the Search button
async function handleSearch() {
    const city = cityInput.value.trim();

    // Do nothing if the input is empty
    if (!city) {
        showError("Please enter a city name.");
        return;
    }

    // Reset the UI before starting a new request
    clearError();
    showLoading(true);
    heroSection.hidden = true;
    statsRow.hidden = true;
    forecastSection.hidden = true;

    try {
        // Step 1: convert city name → coordinates
        const { lat, lon, name, country } = await getCoordinates(city);

        // Step 2: fetch weather and forecast data
        const weatherData = await getWeather(lat, lon);

        // Cache the result so the unit-toggle can re-render without re-fetching
        cachedWeatherData = { weatherData, cityName: name, country };

        // Step 3: render current weather in the hero section
        displayCurrentWeather(weatherData, name, country);

        // Step 4: render the 5-day forecast
        displayForecast(weatherData.daily);

        // Save this successful search to the history (bonus feature)
        saveToHistory(name);

    } catch (error) {
        // Show the error message from whichever function threw it
        showError(error.message);
    } finally {
        // Always hide the loading spinner when done (success or failure)
        showLoading(false);
    }
}

/* 
   Geolocation feature (bonus)
   Attempts to detect the user's current location on page load
   using the browser's built-in navigator.geolocation API.
   If successful, fetches and displays local weather immediately.
    */
async function loadWeatherByLocation() {
    // Check whether the browser supports geolocation at all
    if (!("geolocation" in navigator)) return;

    showLoading(true);

    navigator.geolocation.getCurrentPosition(
        /* Success callback */
        async (position) => {
            try {
                const { latitude: lat, longitude: lon } = position.coords;

                // Fetch weather directly with the device coordinates
                const weatherData = await getWeather(lat, lon);

                // Open-Meteo geocoding doesn't support reverse lookup via coordinates,
                // so we display "Your Location" as the city name for the auto-detected case.
                cachedWeatherData = { weatherData, cityName: "Your Location", country: "" };
                displayCurrentWeather(weatherData, "Your Location", "");
                displayForecast(weatherData.daily);
                clearError();

            } catch (error) {
                // Silently fail — user can still search manually
                showError(error.message);
            } finally {
                showLoading(false);
            }
        },
        /* Error / denied callback — fail silently so the app still works */
        () => {
            showLoading(false);
        }
    );
}

/* 
   Unit toggle (bonus)
   Switches between °C and °F without making a new API call.
    */
unitToggle.addEventListener("click", () => {
    isCelsius = !isCelsius;
    // Update the button label to indicate the active unit
    unitToggle.textContent = isCelsius ? "°C / °F" : "°F / °C";
    refreshDisplayedTemperatures();
});

/* 
   Search form submit
   Intercepts the native form submit so the page does not reload.
    */
searchForm.addEventListener("submit", (event) => {
    event.preventDefault();
    handleSearch();
});

/* 
   Initialization — runs when the page first loads
   1. Render any saved search history buttons
   2. Attempt to auto-detect the user's location
    */
renderHistory();
loadWeatherByLocation();

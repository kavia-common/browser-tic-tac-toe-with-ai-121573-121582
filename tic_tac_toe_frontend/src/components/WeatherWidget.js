import React, { useEffect, useState } from "react";
import { fetchCurrentWeather, getBrowserLocation } from "../services/weather";

/**
 * WeatherWidget component shows current weather conditions.
 * Displays: city name, temperature, and weather condition.
 * Uses geolocation if permitted; otherwise falls back to "London".
 *
 * It requires REACT_APP_OPENWEATHERMAP_API_KEY to be set.
 */

// PUBLIC_INTERFACE
/**
 * A small UI widget that fetches and displays current weather.
 * @returns {JSX.Element}
 */
export default function WeatherWidget() {
  const apiKey = process.env.REACT_APP_OPENWEATHERMAP_API_KEY;
  const [weather, setWeather] = useState(null);
  const [status, setStatus] = useState("idle"); // 'idle' | 'loading' | 'ready' | 'error'
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadWeather() {
      if (!apiKey) {
        setStatus("error");
        setError("Set REACT_APP_OPENWEATHERMAP_API_KEY to enable weather.");
        return;
      }

      setStatus("loading");
      setError("");

      try {
        let coords = null;
        try {
          coords = await getBrowserLocation(4000); // attempt geolocation within 4s
        } catch {
          // Ignore geolocation errors and fall back to default city
        }

        const data = coords
          ? await fetchCurrentWeather({ lat: coords.lat, lon: coords.lon, units: "metric" })
          : await fetchCurrentWeather({ city: "London", units: "metric" });

        if (!mounted) return;
        setWeather(data);
        setStatus("ready");
      } catch (err) {
        if (!mounted) return;
        setStatus("error");
        setError(err?.message || "Failed to fetch weather.");
      }
    }

    loadWeather();

    return () => {
      mounted = false;
    };
  }, [apiKey]);

  return (
    <div className="weather-widget" role="region" aria-label="Current Weather">
      <div className="weather-header">Weather</div>
      {status === "loading" && (
        <div className="weather-body" aria-live="polite">
          Fetching local weather…
        </div>
      )}
      {status === "ready" && weather && (
        <div className="weather-body">
          <div className="weather-row">
            <div className="weather-city" aria-label="City">
              {weather.cityName}
            </div>
            <div className="weather-temp" aria-label="Temperature">
              {Number.isFinite(weather.temperature) ? `${weather.temperature}°C` : "—"}
            </div>
          </div>
          <div className="weather-row">
            {weather.icon ? (
              <img
                src={`https://openweathermap.org/img/wn/${weather.icon}@2x.png`}
                alt={weather.condition}
                className="weather-icon"
                width="40"
                height="40"
              />
            ) : null}
            <div className="weather-condition" aria-label="Condition">
              {weather.condition}
            </div>
          </div>
        </div>
      )}
      {status === "error" && (
        <div className="weather-body weather-error" aria-live="polite">
          {error || "Weather unavailable."}
        </div>
      )}
    </div>
  );
}

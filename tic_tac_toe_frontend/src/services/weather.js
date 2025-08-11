/**
 * Weather service for fetching current weather from OpenWeatherMap.
 * Uses the REACT_APP_OPENWEATHERMAP_API_KEY environment variable.
 */

// PUBLIC_INTERFACE
/**
 * Fetch current weather from OpenWeatherMap.
 * Either provide {city} or {lat, lon}. Defaults to metric units.
 *
 * @param {Object} params - Parameters for the weather request.
 * @param {string} [params.city] - City name (e.g., "London").
 * @param {number} [params.lat] - Latitude.
 * @param {number} [params.lon] - Longitude.
 * @param {string} [params.units="metric"] - "metric", "imperial", or "standard".
 * @returns {Promise<{ cityName: string, temperature: number, condition: string, icon?: string }>}
 * Simplified weather object with city, rounded temperature, condition, and icon code.
 */
export async function fetchCurrentWeather({ city, lat, lon, units = "metric" } = {}) {
  const apiKey = process.env.REACT_APP_OPENWEATHERMAP_API_KEY;
  if (!apiKey) {
    throw new Error("Missing REACT_APP_OPENWEATHERMAP_API_KEY");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const base = "https://api.openweathermap.org/data/2.5/weather";
    const params = new URLSearchParams({ appid: apiKey, units });

    if (typeof lat === "number" && typeof lon === "number") {
      params.set("lat", String(lat));
      params.set("lon", String(lon));
    } else if (city) {
      params.set("q", city);
    } else {
      // If nothing is provided, use a sensible default
      params.set("q", "London");
    }

    const res = await fetch(`${base}?${params.toString()}`, {
      method: "GET",
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) {
      let detail = "";
      try {
        const err = await res.json();
        detail = err?.message ? ` (${err.message})` : "";
      } catch {
        // ignore json parse failures
      }
      throw new Error(`OpenWeatherMap request failed with status ${res.status}${detail}`);
    }

    const data = await res.json();

    const temperature = Math.round(Number(data?.main?.temp ?? NaN));
    const condition = data?.weather?.[0]?.main || "Unknown";
    const icon = data?.weather?.[0]?.icon || undefined;
    const cityName = data?.name || city || "Unknown";

    return { cityName, temperature, condition, icon };
  } catch (err) {
    if (err?.name === "AbortError") {
      throw new Error("Weather request timed out");
    }
    throw err;
  }
}

// PUBLIC_INTERFACE
/**
 * Get browser geolocation (if permitted) with a timeout.
 *
 * @param {number} [timeoutMs=5000] - Timeout in milliseconds.
 * @returns {Promise<{lat:number, lon:number}>}
 */
export function getBrowserLocation(timeoutMs = 5000) {
  return new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) {
      reject(new Error("Geolocation not supported"));
      return;
    }

    let resolved = false;
    const timeoutId = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        reject(new Error("Geolocation timeout"));
      }
    }, timeoutMs);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timeoutId);
          const lat = pos?.coords?.latitude;
        const lon = pos?.coords?.longitude;
          if (typeof lat === "number" && typeof lon === "number") {
            resolve({ lat, lon });
          } else {
            reject(new Error("Invalid geolocation coordinates"));
          }
        }
      },
      (err) => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timeoutId);
          reject(err || new Error("Geolocation error"));
        }
      },
      { enableHighAccuracy: false, timeout: timeoutMs, maximumAge: 300000 }
    );
  });
}

import { defineTool } from "eve/tools";
import { z } from "zod";

export default defineTool({
  description: "Obtiene clima actual, pronóstico e histórico para una localidad agrícola usando Open-Meteo, sin API key.",
  inputSchema: z.object({ location: z.string().min(2), days: z.number().int().min(1).max(14).default(7) }),
  async execute({ location, days }) {
    const geoResponse = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1&language=es&format=json`);
    if (!geoResponse.ok) throw new Error(`No se pudo geocodificar ${location}.`);
    const geo = await geoResponse.json() as { results?: Array<{ latitude: number; longitude: number; name: string; country?: string; admin1?: string }> };
    const place = geo.results?.[0];
    if (!place) throw new Error(`No se encontró la localidad ${location}.`);
    const forecastResponse = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}&forecast_days=${days}&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto`);
    if (!forecastResponse.ok) throw new Error(`Open-Meteo respondió ${forecastResponse.status}.`);
    return { location: place, ...(await forecastResponse.json()) };
  },
});

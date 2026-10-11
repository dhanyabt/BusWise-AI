import React, { useState, useEffect } from 'react';
import { CloudRain, Sun, Cloud, Thermometer, Wind, Droplets, RefreshCw, AlertTriangle, CheckCircle, Info, Sparkles } from 'lucide-react';
import type { WeatherData } from '../types';
import { fetchCurrentWeather } from '../services/api';

interface WeatherWidgetProps {
  initialLocationName?: string;
  onExperimentalWeatherToggle?: (enabled: boolean) => void;
  isExperimentalActive?: boolean;
}

const TN_LOCATIONS = [
  { id: 'madurai', name: 'Madurai Central Hub' },
  { id: 'thanjavur', name: 'Thanjavur Brihadishvara Hub' },
  { id: 'tiruchendur', name: 'Tiruchendur Temple Hub' },
  { id: 'chennai', name: 'Chennai Koyambedu Hub' },
  { id: 'coimbatore', name: 'Coimbatore Gandhipuram Hub' },
  { id: 'salem', name: 'Salem New Bus Stand' },
  { id: 'palani', name: 'Palani Temple Hub' },
  { id: 'velankanni', name: 'Velankanni Shrine Hub' },
  { id: 'tiruvannamalai', name: 'Tiruvannamalai Annamalaiyar Hub' },
  { id: 'rameswaram', name: 'Rameswaram Temple Hub' },
];

export const WeatherWidget: React.FC<WeatherWidgetProps> = ({
  initialLocationName = 'madurai',
  onExperimentalWeatherToggle,
  isExperimentalActive = false,
}) => {
  const [selectedLocation, setSelectedLocation] = useState<string>(initialLocationName);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadWeather = async (loc: string) => {
    setIsLoading(true);
    try {
      const data = await fetchCurrentWeather(loc);
      setWeather(data);
    } catch (err: any) {
      console.warn('Weather fetch failed', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadWeather(selectedLocation);
  }, [selectedLocation]);

  const getWeatherIcon = (condition: string = '', code: number | null = 0) => {
    const c = condition.toLowerCase();
    if (c.includes('rain') || c.includes('drizzle') || c.includes('thunderstorm') || (code && code >= 50)) {
      return <CloudRain className="w-8 h-8 text-blue-500 animate-bounce" />;
    }
    if (c.includes('cloud') || c.includes('overcast')) {
      return <Cloud className="w-8 h-8 text-slate-400" />;
    }
    return <Sun className="w-8 h-8 text-amber-500 animate-spin-slow" />;
  };

  const getStatusBadge = (status: 'live' | 'stale' | 'unavailable') => {
    switch (status) {
      case 'live':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle className="w-3 h-3 text-emerald-600" />
            <span>LIVE (Open-Meteo)</span>
          </span>
        );
      case 'stale':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-amber-100 text-amber-800 border border-amber-300">
            <AlertTriangle className="w-3 h-3 text-amber-600" />
            <span>STALE CACHE</span>
          </span>
        );
      case 'unavailable':
      default:
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-rose-100 text-rose-800 border border-rose-300">
            <AlertTriangle className="w-3 h-3 text-rose-600" />
            <span>UNAVAILABLE</span>
          </span>
        );
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4 font-sans">
      {/* Header & Location Selection */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
            {weather ? getWeatherIcon(weather.weather_condition, weather.weather_code) : <Sun className="w-6 h-6 text-amber-500" />}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-bold text-slate-900 tracking-tight">Tamil Nadu Event Weather Monitor</h2>
              {weather && getStatusBadge(weather.status)}
            </div>
            <p className="text-xs text-slate-500 font-mono">
              Provider: <strong className="text-slate-700">Open-Meteo REST API</strong> (Live Geo Lat/Lng)
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <select
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="bg-slate-50 border border-slate-300 text-slate-800 text-xs font-mono rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {TN_LOCATIONS.map((loc) => (
              <option key={loc.id} value={loc.id}>
                📍 {loc.name}
              </option>
            ))}
          </select>

          <button
            onClick={() => loadWeather(selectedLocation)}
            disabled={isLoading}
            className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl border border-slate-200 transition-colors"
            title="Refresh Live Weather"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-blue-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Weather Display Card */}
      {weather && weather.status !== 'unavailable' ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
              <div className="flex items-center space-x-1.5 text-xs text-slate-500 font-mono mb-1">
                <Thermometer className="w-3.5 h-3.5 text-rose-500" />
                <span>TEMPERATURE</span>
              </div>
              <div className="text-xl font-bold text-slate-900 font-mono">
                {weather.current_temperature_c !== null ? `${weather.current_temperature_c}°C` : 'N/A'}
              </div>
              <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                Feels like {weather.apparent_temperature_c ?? 'N/A'}°C
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
              <div className="flex items-center space-x-1.5 text-xs text-slate-500 font-mono mb-1">
                <CloudRain className="w-3.5 h-3.5 text-blue-500" />
                <span>RAINFALL</span>
              </div>
              <div className="text-xl font-bold text-slate-900 font-mono">
                {weather.precipitation_mm !== null ? `${weather.precipitation_mm} mm` : '0.0 mm'}
              </div>
              <div className="text-[10px] text-slate-400 font-mono mt-0.5">Current Precipitation</div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
              <div className="flex items-center space-x-1.5 text-xs text-slate-500 font-mono mb-1">
                <Droplets className="w-3.5 h-3.5 text-sky-500" />
                <span>HUMIDITY</span>
              </div>
              <div className="text-xl font-bold text-slate-900 font-mono">
                {weather.relative_humidity_pct !== null ? `${weather.relative_humidity_pct}%` : 'N/A'}
              </div>
              <div className="text-[10px] text-slate-400 font-mono mt-0.5">Relative Humidity</div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
              <div className="flex items-center space-x-1.5 text-xs text-slate-500 font-mono mb-1">
                <Wind className="w-3.5 h-3.5 text-emerald-500" />
                <span>WIND SPEED</span>
              </div>
              <div className="text-xl font-bold text-slate-900 font-mono">
                {weather.wind_speed_kmh !== null ? `${weather.wind_speed_kmh} km/h` : 'N/A'}
              </div>
              <div className="text-[10px] text-slate-400 font-mono mt-0.5">10m Wind Speed</div>
            </div>
          </div>

          {/* Condition and Timestamps */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs font-mono bg-blue-50/60 border border-blue-100 rounded-xl p-3 text-blue-950">
            <div>
              <span className="font-bold">Weather Condition:</span> {weather.weather_condition} ({weather.location_name})
            </div>
            <div className="text-[10px] text-blue-700 mt-1 sm:mt-0">
              Forecast Time: {weather.forecast_time ? new Date(weather.forecast_time).toLocaleTimeString() : 'N/A'} | Updated: {new Date(weather.last_updated_at).toLocaleTimeString()}
            </div>
          </div>

          {/* Hourly Forecast Breakdown */}
          {weather.hourly_forecast && weather.hourly_forecast.length > 0 && (
            <div>
              <span className="text-xs font-mono font-bold text-slate-600 block mb-2 uppercase">
                6-Hour Weather Forecast Trend
              </span>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {weather.hourly_forecast.slice(0, 6).map((item, idx) => (
                  <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl p-2 text-center font-mono">
                    <div className="text-[10px] text-slate-500">
                      {item.time ? new Date(item.time).getHours() + ':00' : `T+${idx}h`}
                    </div>
                    <div className="text-xs font-bold text-slate-900 my-1">{item.temperature_c}°C</div>
                    <div className="text-[9px] text-blue-600 flex items-center justify-center space-x-0.5">
                      <CloudRain className="w-2.5 h-2.5 shrink-0" />
                      <span>{item.precipitation_probability}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Weather Unavailable Alert */
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-xs font-mono text-rose-900 flex items-start space-x-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold uppercase block text-rose-950">LIVE WEATHER DATA UNAVAILABLE</span>
            <p className="text-rose-800 text-[11px] mt-0.5">
              Open-Meteo REST service is currently unreachable or coordinates are invalid. No fake values have been fabricated.
            </p>
          </div>
        </div>
      )}

      {/* Model Influence Disclaimer & Experimental Toggle */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
        <div className="flex items-start space-x-2 text-xs text-slate-600">
          <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-slate-800 font-mono block">Forecast Model Provenance & Influence Disclaimer:</span>
            <p className="text-[11px] text-slate-600">
              Live Open-Meteo weather is maintained separately from historical dataset weather values. The baseline crowd forecasting engine operates on historical festival arrival distributions. Weather data is NOT claimed to influence forecasts unless experimental mode is explicitly enabled.
            </p>
          </div>
        </div>

        {onExperimentalWeatherToggle && (
          <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
            <div className="flex items-center space-x-1.5 text-xs font-mono text-indigo-900 font-bold">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Experimental Weather Adjustment Factor (Rain Multiplier)</span>
            </div>
            <button
              type="button"
              onClick={() => onExperimentalWeatherToggle(!isExperimentalActive)}
              className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                isExperimentalActive
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
              }`}
            >
              {isExperimentalActive ? 'EXPERIMENTAL ENABLED (1.15x)' : 'DISABLED (Baseline)'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Navigation,
  Locate,
  Search,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  ShieldCheck
} from 'lucide-react';
import type {
  BusStop,
  FleetSummary,
  TransferCard,
  ForecastResponse,
  RouteResponse,
  LocationSearchItem,
  TrackedVehicle,
  TraccarStatusResponse
} from '../types';
import { calculateRoute, searchLocations, fetchFleetTracking } from '../services/api';

// Fix Leaflet default icon URL issues in bundlers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Helper component to auto-recenter Leaflet map bounds when route or markers change
const MapRecenter: React.FC<{ bounds?: L.LatLngBoundsExpression }> = ({ bounds }) => {
  const map = useMap();
  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, { padding: [40, 40] });
    }
  }, [bounds, map]);
  return null;
};

// Custom DivIcons for distinct map visualization
const createStopIcon = (name: string, isSelected: boolean) =>
  L.divIcon({
    className: 'custom-div-icon',
    html: `
      <div style="
        background: ${isSelected ? '#4f46e5' : '#1e293b'};
        color: white;
        padding: 4px 8px;
        border-radius: 12px;
        border: 2px solid white;
        box-shadow: 0 4px 6px -1px rgba(0,0,0,0.3);
        font-family: sans-serif;
        font-size: 10px;
        font-weight: bold;
        white-space: nowrap;
        display: flex;
        align-items: center;
        gap: 4px;
      ">
        <span style="width: 8px; height: 8px; border-radius: 50%; background: #60a5fa;"></span>
        <span>${name}</span>
      </div>
    `,
    iconSize: [100, 26],
    iconAnchor: [50, 13],
  });

const createBusIcon = (busNumber: string, status: string, isLive: boolean) => {
  let bgColor = '#6b7280'; // gray for UNTRACKED / OFFLINE
  let badgeText = status;
  if (isLive && status === 'LIVE') {
    bgColor = '#10b981'; // green for LIVE
  } else if (status === 'STALE') {
    bgColor = '#f59e0b'; // amber for STALE
  } else if (status === 'OFFLINE') {
    bgColor = '#ef4444'; // red for OFFLINE
  }

  return L.divIcon({
    className: 'custom-bus-icon',
    html: `
      <div style="
        background: white;
        border: 2px solid ${bgColor};
        border-radius: 16px;
        padding: 2px 6px;
        box-shadow: 0 4px 8px rgba(0,0,0,0.25);
        display: flex;
        align-items: center;
        gap: 4px;
        font-family: sans-serif;
        font-size: 10px;
        font-weight: bold;
      ">
        <div style="
          background: ${bgColor};
          color: white;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 9px;
        ">🚌</div>
        <span style="color: #0f172a;">${busNumber}</span>
        <span style="
          background: ${bgColor};
          color: white;
          font-size: 8px;
          padding: 1px 4px;
          border-radius: 4px;
        ">${badgeText}</span>
      </div>
    `,
    iconSize: [110, 26],
    iconAnchor: [55, 13],
  });
};

const createPinIcon = (label: string, color: string) =>
  L.divIcon({
    className: 'custom-pin-icon',
    html: `
      <div style="
        background: ${color};
        color: white;
        padding: 4px 8px;
        border-radius: 8px;
        font-family: sans-serif;
        font-size: 10px;
        font-weight: bold;
        box-shadow: 0 4px 6px rgba(0,0,0,0.3);
        border: 2px solid white;
        white-space: nowrap;
      ">
        📍 ${label}
      </div>
    `,
    iconSize: [100, 24],
    iconAnchor: [50, 24],
  });

interface LeafletMapViewProps {
  stops: BusStop[];
  fleet: FleetSummary;
  transfers: TransferCard[];
  forecast: ForecastResponse;
  selectedOriginId?: string;
  selectedDestinationId?: string;
  userRole?: string;
}

export const LeafletMapView: React.FC<LeafletMapViewProps> = ({
  stops,
  fleet,
  transfers,
  forecast,
  selectedOriginId,
  selectedDestinationId,
  userRole = 'OFFICER',
}) => {
  // Map Center around Tamil Nadu (Chennai Transit Hub)
  const mapCenter: [number, number] = [13.0694, 80.1948];

  // Geolocation State
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [locationStatus, setLocationStatus] = useState<string>('Use Current GPS Location');

  // OpenRouteService Route Calculation State
  const [originSearch, setOriginSearch] = useState<string>('');
  const [destSearch, setDestSearch] = useState<string>('');
  const [originPoint, setOriginPoint] = useState<{ lat: number; lng: number; name: string } | null>(null);
  const [destPoint, setDestPoint] = useState<{ lat: number; lng: number; name: string } | null>(null);

  const [originResults, setOriginResults] = useState<LocationSearchItem[]>([]);
  const [destResults, setDestResults] = useState<LocationSearchItem[]>([]);
  const [showOriginDropdown, setShowOriginDropdown] = useState<boolean>(false);
  const [showDestDropdown, setShowDestDropdown] = useState<boolean>(false);

  const [routeResult, setRouteResult] = useState<RouteResponse | null>(null);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState<boolean>(false);
  const [routeError, setRouteError] = useState<string | null>(null);

  // GPS Source Mode: 'DEMO_GPS' | 'LIVE_TRACCAR'
  const [gpsSourceMode, setGpsSourceMode] = useState<'DEMO_GPS' | 'LIVE_TRACCAR'>('DEMO_GPS');
  const [simulatedTick, setSimulatedTick] = useState<number>(0);

  // Traccar Live GPS Tracking State
  const [trackedVehicles, setTrackedVehicles] = useState<TrackedVehicle[]>([]);
  const [traccarStatus, setTraccarStatus] = useState<TraccarStatusResponse | null>(null);
  const [isRefreshingGps, setIsRefreshingGps] = useState<boolean>(false);
  const [lastGpsRefreshTime, setLastGpsRefreshTime] = useState<string>('');

  const [selectedStop, setSelectedStop] = useState<BusStop | null>(stops[0] || null);

  // Simulated GPS movement loop for DEMO GPS mode
  useEffect(() => {
    if (gpsSourceMode !== 'DEMO_GPS') return;
    const interval = setInterval(() => {
      setSimulatedTick((prev) => (prev + 1) % 360);
    }, 2500);
    return () => clearInterval(interval);
  }, [gpsSourceMode]);

  // Sync origin / dest if passed via props
  useEffect(() => {
    if (selectedOriginId) {
      const s = stops.find((x) => x.id === selectedOriginId);
      if (s) {
        setOriginPoint({ lat: s.location_lat, lng: s.location_lng, name: s.name });
        setOriginSearch(s.name);
      }
    }
    if (selectedDestinationId) {
      const s = stops.find((x) => x.id === selectedDestinationId);
      if (s) {
        setDestPoint({ lat: s.location_lat, lng: s.location_lng, name: s.name });
        setDestSearch(s.name);
      }
    }
  }, [selectedOriginId, selectedDestinationId, stops]);

  // Initial Traccar Status and Fleet Fetching
  const loadFleetTracking = async () => {
    setIsRefreshingGps(true);
    try {
      const trackingRes = await fetchFleetTracking(userRole);
      setTrackedVehicles(trackingRes.vehicles);
      setTraccarStatus(trackingRes.traccar_status);
      setLastGpsRefreshTime(new Date().toLocaleTimeString());
    } catch (err) {
      console.warn('Fleet tracking poll warning:', err);
    } finally {
      setIsRefreshingGps(false);
    }
  };

  useEffect(() => {
    loadFleetTracking();
    const interval = setInterval(loadFleetTracking, 10000); // Poll every 10 seconds
    return () => clearInterval(interval);
  }, [userRole]);

  // Browser Geolocation Permission Trigger
  const handleRequestLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('Geolocation Unsupported');
      return;
    }
    setLocationStatus('Locating...');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const name = 'Current GPS Location';
        setUserLocation([lat, lng]);
        setOriginPoint({ lat, lng, name });
        setOriginSearch(name);
        setLocationStatus('GPS Active');
      },
      (err) => {
        console.warn('Geolocation denied/failed:', err);
        setLocationStatus('GPS Permission Denied');
      },
      { timeout: 10000 }
    );
  };

  // Location Autocomplete Search handlers
  useEffect(() => {
    if (!originSearch || originSearch.length < 2 || originPoint?.name === originSearch) {
      setOriginResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await searchLocations(originSearch);
        setOriginResults(res.results);
      } catch (err) {
        console.warn('Search failed', err);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [originSearch, originPoint]);

  useEffect(() => {
    if (!destSearch || destSearch.length < 2 || destPoint?.name === destSearch) {
      setDestResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await searchLocations(destSearch);
        setDestResults(res.results);
      } catch (err) {
        console.warn('Search failed', err);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [destSearch, destPoint]);

  // Calculate Route via Backend OpenRouteService Proxy
  const handleCalculateRoute = async () => {
    if (!originPoint || !destPoint) {
      setRouteError('Please select both Origin and Destination locations in Tamil Nadu.');
      return;
    }
    setIsCalculatingRoute(true);
    setRouteError(null);
    setRouteResult(null);

    try {
      const res = await calculateRoute({
        origin_lat: originPoint.lat,
        origin_lng: originPoint.lng,
        destination_lat: destPoint.lat,
        destination_lng: destPoint.lng,
        origin_name: originPoint.name,
        destination_name: destPoint.name,
      });
      setRouteResult(res);
    } catch (err: any) {
      setRouteError(err.message || 'Route calculation failed.');
    } finally {
      setIsCalculatingRoute(false);
    }
  };

  // Compute crowd risk color for stop
  const getStopRisk = (stopId: string): 'HIGH' | 'MODERATE' | 'LOW' | 'STALE' => {
    const stopFc = forecast.stops_forecast.find((sf) => sf.stop_id === stopId);
    if (!stopFc || !stopFc.intervals || stopFc.intervals.length === 0) return 'STALE';
    if (stopFc.intervals.some((i) => i.risk_level === 'CRITICAL' || i.risk_level === 'HIGH')) return 'HIGH';
    if (stopFc.intervals.some((i) => i.risk_level === 'MODERATE')) return 'MODERATE';
    return 'LOW';
  };

  const getCrowdColor = (risk: 'HIGH' | 'MODERATE' | 'LOW' | 'STALE') => {
    switch (risk) {
      case 'HIGH':
        return '#ef4444'; // Red: high crowd
      case 'MODERATE':
        return '#eab308'; // Yellow: moderate crowd
      case 'LOW':
        return '#10b981'; // Green: low crowd
      case 'STALE':
      default:
        return '#6b7280'; // Gray: missing/stale
    }
  };

  // Calculate dynamic map bounds
  const getMapBounds = (): L.LatLngBoundsExpression | undefined => {
    const coords: [number, number][] = [];
    if (routeResult && routeResult.geometry.length > 0) {
      return routeResult.geometry;
    }
    if (originPoint) coords.push([originPoint.lat, originPoint.lng]);
    if (destPoint) coords.push([destPoint.lat, destPoint.lng]);
    if (coords.length >= 2) return coords;
    return undefined;
  };

  const mapBounds = getMapBounds();

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm mb-6 font-sans">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center space-x-2">
            <Navigation className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Live Map Integration (OpenRouteService + Traccar GPS)
            </h2>
            <span className="text-[10px] bg-indigo-50 text-indigo-800 border border-indigo-200 px-2 py-0.5 rounded font-mono font-bold">
              Leaflet + OSM Engine
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Road-based ORS route calculations across Tamil Nadu, real-time Traccar GPS fleet positions, and crowd heat risk overlays.
          </p>
        </div>

        {/* GPS Source Mode & Traccar Status Pill */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
          {/* Mode Switcher */}
          <div className="flex bg-slate-100 p-0.5 rounded-xl border border-slate-200">
            <button
              onClick={() => setGpsSourceMode('DEMO_GPS')}
              className={`px-3 py-1 rounded-lg font-bold transition-all ${
                gpsSourceMode === 'DEMO_GPS'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              DEMO GPS — Simulated
            </button>
            <button
              onClick={() => setGpsSourceMode('LIVE_TRACCAR')}
              className={`px-3 py-1 rounded-lg font-bold transition-all ${
                gpsSourceMode === 'LIVE_TRACCAR'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              LIVE GPS — Traccar
            </button>
          </div>

          <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
            <span className="text-slate-500 font-semibold">Status:</span>
            {gpsSourceMode === 'DEMO_GPS' ? (
              <span className="text-amber-700 font-bold flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
                <span>DEMO GPS (Simulated Movement)</span>
              </span>
            ) : traccarStatus?.connection_status === 'CONNECTED' ? (
              <span className="flex items-center space-x-1 text-emerald-700 font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>CONNECTED ({traccarStatus.online_devices} Live Devices)</span>
              </span>
            ) : (
              <span className="text-slate-500 font-bold">NOT CONFIGURED / UNTRACKED</span>
            )}
            {gpsSourceMode === 'LIVE_TRACCAR' && (
              <button
                onClick={loadFleetTracking}
                disabled={isRefreshingGps}
                className="ml-2 text-slate-400 hover:text-indigo-600 transition-colors"
                title="Refresh Traccar Positions"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingGps ? 'animate-spin text-indigo-600' : ''}`} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Route Calculation & Location Search Controls Bar */}
      <div className="mt-4 bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
          {/* Origin Input */}
          <div className="flex-1 relative">
            <label className="block text-[11px] font-mono font-bold text-slate-600 uppercase mb-1">
              Origin Location (Tamil Nadu)
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search origin city, landmark, or stop..."
                value={originSearch}
                onChange={(e) => {
                  setOriginSearch(e.target.value);
                  setShowOriginDropdown(true);
                }}
                onFocus={() => setShowOriginDropdown(true)}
                className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 pr-8 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5" />
            </div>

            {/* Origin Dropdown Autocomplete */}
            {showOriginDropdown && originResults.length > 0 && (
              <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto font-sans text-xs">
                {originResults.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      setOriginPoint({ lat: item.lat, lng: item.lng, name: item.name });
                      setOriginSearch(item.name);
                      setShowOriginDropdown(false);
                    }}
                    className="p-2.5 hover:bg-indigo-50 cursor-pointer border-b border-slate-100 last:border-none flex items-center justify-between"
                  >
                    <div>
                      <div className="font-semibold text-slate-800">{item.name}</div>
                      <div className="text-[10px] text-slate-500">{item.label}</div>
                    </div>
                    <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">
                      {item.category || 'Location'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Destination Input */}
          <div className="flex-1 relative">
            <label className="block text-[11px] font-mono font-bold text-slate-600 uppercase mb-1">
              Destination Location (Tamil Nadu)
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search destination city, landmark, or stop..."
                value={destSearch}
                onChange={(e) => {
                  setDestSearch(e.target.value);
                  setShowDestDropdown(true);
                }}
                onFocus={() => setShowDestDropdown(true)}
                className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 pr-8 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5" />
            </div>

            {/* Destination Dropdown Autocomplete */}
            {showDestDropdown && destResults.length > 0 && (
              <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto font-sans text-xs">
                {destResults.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      setDestPoint({ lat: item.lat, lng: item.lng, name: item.name });
                      setDestSearch(item.name);
                      setShowDestDropdown(false);
                    }}
                    className="p-2.5 hover:bg-indigo-50 cursor-pointer border-b border-slate-100 last:border-none flex items-center justify-between"
                  >
                    <div>
                      <div className="font-semibold text-slate-800">{item.name}</div>
                      <div className="text-[10px] text-slate-500">{item.label}</div>
                    </div>
                    <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">
                      {item.category || 'Location'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-end gap-2 pt-1 lg:pt-0">
            <button
              onClick={handleRequestLocation}
              className="flex items-center space-x-1.5 bg-white text-slate-700 hover:bg-slate-100 border border-slate-300 text-xs px-3 py-2 rounded-lg transition-all shadow-xs"
              title="Use current device browser location"
            >
              <Locate className="w-3.5 h-3.5 text-indigo-600" />
              <span>{locationStatus}</span>
            </button>

            <button
              onClick={handleCalculateRoute}
              disabled={isCalculatingRoute || !originPoint || !destPoint}
              className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs px-4 py-2 rounded-lg transition-all shadow-sm"
            >
              {isCalculatingRoute ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Calculating Route...</span>
                </>
              ) : (
                <>
                  <Navigation className="w-3.5 h-3.5" />
                  <span>Calculate ORS Route</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Quick Bus Stop Quick-Select Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
          <span className="text-slate-500 text-[11px] font-mono">Quick Tamil Nadu Hubs:</span>
          {stops.map((s) => (
            <button
              key={s.id}
              onClick={() => {
                if (!originPoint) {
                  setOriginPoint({ lat: s.location_lat, lng: s.location_lng, name: s.name });
                  setOriginSearch(s.name);
                } else {
                  setDestPoint({ lat: s.location_lat, lng: s.location_lng, name: s.name });
                  setDestSearch(s.name);
                }
              }}
              className="text-[11px] bg-white border border-slate-200 hover:border-indigo-400 text-slate-700 px-2 py-0.5 rounded font-mono transition-colors"
            >
              + {s.name}
            </button>
          ))}
        </div>
      </div>

      {/* Calculated Route Status & Metrics Banner */}
      {routeError && (
        <div className="mt-3 bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs text-rose-800 flex items-start space-x-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <strong className="font-bold block">Route Calculation Notice:</strong>
            <span>{routeError}</span>
          </div>
        </div>
      )}

      {routeResult && (
        <div className="mt-3 bg-indigo-50/80 border border-indigo-200 rounded-xl p-3 text-xs flex flex-wrap items-center justify-between gap-3 font-mono">
          <div className="flex items-center space-x-2 text-indigo-950">
            <CheckCircle2 className="w-4 h-4 text-indigo-600" />
            <span>
              <strong>Route Calculated:</strong> {routeResult.origin_name || 'Origin'} ➔ {routeResult.destination_name || 'Destination'}
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <span className="bg-white px-2.5 py-1 rounded border border-indigo-200 text-indigo-900 font-bold">
              Distance: {routeResult.distance_km} km
            </span>
            <span className="bg-white px-2.5 py-1 rounded border border-indigo-200 text-indigo-900 font-bold">
              Est. Duration: {routeResult.duration_minutes} mins
            </span>
            <span className="text-[10px] text-slate-500">
              Provider: {routeResult.routing_provider}
            </span>
          </div>
        </div>
      )}

      {/* Map Display & Crowd Legend */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs font-mono pb-2">
        <div className="flex items-center space-x-3">
          <span className="font-bold text-slate-700">Map Legend:</span>
          <span className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
            <span className="text-slate-600">Green: Low Crowd</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
            <span className="text-slate-600">Yellow: Moderate</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span>
            <span className="text-slate-600">Red: High Surge</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-400 inline-block"></span>
            <span className="text-slate-600">Gray: Untracked/Stale</span>
          </span>
        </div>

        <div className="text-[11px] text-slate-500">
          Last GPS Poll: <strong className="text-slate-700">{lastGpsRefreshTime || 'Polling...'}</strong>
        </div>
      </div>

      {/* Leaflet Map Canvas */}
      <div className="h-[450px] w-full rounded-xl overflow-hidden border border-slate-200 relative z-0 shadow-inner">
        <MapContainer
          center={mapCenter}
          zoom={12}
          scrollWheelZoom={true}
          className="h-full w-full"
        >
          {/* Map auto-recenter hook */}
          <MapRecenter bounds={mapBounds} />

          {/* OpenStreetMap Tile Layer */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors | OpenRouteService | Traccar GPS'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Calculated Road Route Polyline */}
          {routeResult && routeResult.geometry.length > 0 && (
            <Polyline
              positions={routeResult.geometry}
              pathOptions={{ color: '#4f46e5', weight: 5, opacity: 0.85 }}
            />
          )}

          {/* Origin Marker */}
          {originPoint && (
            <Marker
              position={[originPoint.lat, originPoint.lng]}
              icon={createPinIcon(`Origin: ${originPoint.name}`, '#10b981')}
            >
              <Popup>
                <div className="font-sans text-xs">
                  <strong className="text-emerald-700 block">Origin Location</strong>
                  <span>{originPoint.name}</span>
                </div>
              </Popup>
            </Marker>
          )}

          {/* Destination Marker */}
          {destPoint && (
            <Marker
              position={[destPoint.lat, destPoint.lng]}
              icon={createPinIcon(`Dest: ${destPoint.name}`, '#ef4444')}
            >
              <Popup>
                <div className="font-sans text-xs">
                  <strong className="text-rose-700 block">Destination Location</strong>
                  <span>{destPoint.name}</span>
                </div>
              </Popup>
            </Marker>
          )}

          {/* User GPS Location Marker */}
          {userLocation && (
            <Marker position={userLocation}>
              <Popup>
                <div className="font-sans text-xs">
                  <strong className="text-indigo-600 block">Your Device Location</strong>
                  <span className="text-[10px] text-slate-500">GPS Permission Granted</span>
                </div>
              </Popup>
            </Marker>
          )}

          {/* Registered Bus Stops with Crowd Heat Circles */}
          {stops.map((stop) => {
            const risk = getStopRisk(stop.id);
            const color = getCrowdColor(risk);
            const pos: [number, number] = [stop.location_lat, stop.location_lng];
            const isSelected = selectedStop?.id === stop.id;

            return (
              <React.Fragment key={stop.id}>
                <Circle
                  center={pos}
                  radius={400}
                  pathOptions={{
                    fillColor: color,
                    fillOpacity: risk === 'HIGH' ? 0.45 : 0.25,
                    color: color,
                    weight: 2,
                  }}
                />

                <Marker
                  position={pos}
                  icon={createStopIcon(stop.name, isSelected)}
                  eventHandlers={{ click: () => setSelectedStop(stop) }}
                >
                  <Popup>
                    <div className="font-sans text-xs space-y-1 p-1">
                      <strong className="text-slate-900 text-sm block">{stop.name}</strong>
                      <div className="text-slate-600 text-[11px]">{stop.description}</div>
                      <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-200 font-mono text-[10px]">
                        <div>
                          <span className="text-slate-500 block">QUEUE</span>
                          <strong className="text-indigo-600">{stop.initial_queue} pax</strong>
                        </div>
                        <div>
                          <span className="text-slate-500 block">CROWD RISK</span>
                          <strong style={{ color }}>{risk}</strong>
                        </div>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              </React.Fragment>
            );
          })}

          {/* Bus Markers: DEMO GPS Mode vs LIVE Traccar Mode */}
          {gpsSourceMode === 'DEMO_GPS'
            ? fleet.buses.map((b, idx) => {
                if (b.status === 'DEACTIVATED') return null;
                const assignedStop = stops.find((s) => s.id === (b.current_stop_id || b.initial_stop_id)) || stops[idx % stops.length] || stops[0];
                const baseLat = assignedStop ? assignedStop.location_lat : 13.0694;
                const baseLng = assignedStop ? assignedStop.location_lng : 80.1948;

                // Orbit/offset simulated motion formula
                const angle = ((simulatedTick + idx * 45) * Math.PI) / 180;
                const radius = 0.008 + (idx % 3) * 0.004;
                const simLat = baseLat + Math.sin(angle) * radius;
                const simLng = baseLng + Math.cos(angle) * radius;
                const simSpeed = Math.round(25 + Math.sin(angle) * 15);

                return (
                  <Marker
                    key={b.id}
                    position={[simLat, simLng]}
                    icon={createBusIcon(b.bus_number, 'DEMO GPS', false)}
                  >
                    <Popup>
                      <div className="font-sans text-xs space-y-1 p-1 min-w-[200px]">
                        <div className="flex items-center justify-between border-b border-amber-200 pb-1 bg-amber-50 -mx-1 -mt-1 p-1.5 rounded-t">
                          <strong className="text-slate-900 text-sm font-bold">{b.bus_number}</strong>
                          <span className="text-[9px] bg-amber-500 text-white px-1.5 py-0.5 rounded font-mono font-bold">
                            DEMO GPS
                          </span>
                        </div>

                        <div className="text-amber-800 text-[10px] font-mono font-bold bg-amber-50 p-1 rounded border border-amber-200 mt-1">
                          ⚠️ DEMO GPS — Simulated location
                        </div>

                        <div className="text-slate-600 text-[11px] font-mono mt-1">
                          Bus ID: <strong className="text-slate-800">{b.id}</strong> • Capacity: <strong>{b.capacity}</strong>
                        </div>

                        <div className="text-slate-600 text-[11px]">
                          Current Stop: <strong className="text-indigo-600">{assignedStop ? assignedStop.name : 'En Route'}</strong>
                        </div>

                        <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-200 font-mono text-[10px]">
                          <div>
                            <span className="text-slate-500 block">SIM SPEED</span>
                            <strong className="text-slate-800">{simSpeed} km/h</strong>
                          </div>
                          <div>
                            <span className="text-slate-500 block">GPS SOURCE</span>
                            <strong className="text-amber-700">Simulated</strong>
                          </div>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                );
              })
            : trackedVehicles.map((v) => {
                if (!v.latitude || !v.longitude) return null;
                const busPos: [number, number] = [v.latitude, v.longitude];

                return (
                  <Marker
                    key={v.bus_id}
                    position={busPos}
                    icon={createBusIcon(v.bus_number, v.status, v.is_live_gps)}
                  >
                    <Popup>
                      <div className="font-sans text-xs space-y-1 p-1 min-w-[180px]">
                        <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                          <strong className="text-slate-900 text-sm">{v.bus_number}</strong>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold ${v.is_live_gps ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                            }`}>
                            {v.status}
                          </span>
                        </div>

                        <div className="text-slate-600 text-[11px] font-mono">
                          Bus ID: <strong className="text-slate-800">{v.bus_id}</strong>
                        </div>

                        {v.assigned_stop_name && (
                          <div className="text-slate-600 text-[11px]">
                            Terminus: <strong className="text-indigo-600">{v.assigned_stop_name}</strong>
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-200 font-mono text-[10px]">
                          <div>
                            <span className="text-slate-500 block">SPEED</span>
                            <strong className="text-slate-800">
                              {v.speed_kmh !== null && v.speed_kmh !== undefined ? `${v.speed_kmh} km/h` : 'N/A'}
                            </strong>
                          </div>
                          <div>
                            <span className="text-slate-500 block">HEADING</span>
                            <strong className="text-slate-800">
                              {v.heading !== null && v.heading !== undefined ? `${v.heading}°` : 'N/A'}
                            </strong>
                          </div>
                        </div>

                        <div className="text-[10px] text-slate-400 font-mono mt-1 pt-1 border-t border-slate-100 flex items-center justify-between">
                          <span>GPS Fix: {v.is_live_gps ? 'Live Genuine Traccar' : 'Untracked'}</span>
                          {v.battery_level !== null && v.battery_level !== undefined && (
                            <span className="text-emerald-600 font-bold">🔋 {v.battery_level}%</span>
                          )}
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}

          {/* Recommended Optimization Transfer Lines */}
          {transfers.map((t) => {
            const oStop = stops.find((s) => s.id === t.origin_stop_id);
            const dStop = stops.find((s) => s.id === t.destination_stop_id);
            if (!oStop || !dStop) return null;
            return (
              <Polyline
                key={t.id}
                positions={[
                  [oStop.location_lat, oStop.location_lng],
                  [dStop.location_lat, dStop.location_lng],
                ]}
                pathOptions={{ color: '#db2777', weight: 3, dashArray: '6, 6' }}
              />
            );
          })}
        </MapContainer>
      </div>

      {/* Map Footer Operational Summary */}
      <div className="mt-3 flex flex-wrap items-center justify-between text-xs font-mono text-slate-500 gap-2">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Role View: <strong>{userRole}</strong></span>
          <span>• Active Buses: <strong>{fleet.total_buses} Registered</strong></span>
        </div>
        <div>
          <span>OpenRouteService & Traccar Live Integration Engine</span>
        </div>
      </div>
    </div>
  );
};

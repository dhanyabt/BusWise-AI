import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Navigation, Locate } from 'lucide-react';
import type { BusStop, FleetSummary, TransferCard, ForecastResponse } from '../types';

// Fix Leaflet default icon URL issues in bundlers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
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
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [locationStatus, setLocationStatus] = useState<string>('Click to locate');
  const [selectedStop, setSelectedStop] = useState<BusStop | null>(stops[0] || null);

  // Center map around Tamil Nadu CMBT Festival Transit hub
  const mapCenter: [number, number] = [13.0694, 80.1948];

  // User Geolocation Permission Trigger
  const handleRequestLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('Geolocation unsupported');
      return;
    }
    setLocationStatus('Locating user...');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation([pos.coords.latitude, pos.coords.longitude]);
        setLocationStatus('GPS Position Active');
      },
      () => {
        setLocationStatus('GPS Access Denied (Simulated)');
        // Fallback simulated Tamil Nadu attendee location (Chennai Central)
        setUserLocation([13.0827, 80.2707]);
      },
      { timeout: 8000 }
    );
  };

  // Compute risk level for stop
  const getStopRisk = (stopId: string): 'HIGH' | 'MODERATE' | 'LOW' | 'STALE' => {
    const stopFc = forecast.stops_forecast.find((sf) => sf.stop_id === stopId);
    if (!stopFc || !stopFc.intervals || stopFc.intervals.length === 0) return 'STALE';
    if (stopFc.intervals.some((i) => i.risk_level === 'CRITICAL' || i.risk_level === 'HIGH')) return 'HIGH';
    if (stopFc.intervals.some((i) => i.risk_level === 'MODERATE')) return 'MODERATE';
    return 'LOW';
  };

  // Crowd density color conforming strictly to STEP 5 requirements:
  // Red: high crowd level, Yellow: moderate crowd level, Green: low crowd level, Gray: missing or stale data
  const getCrowdColor = (risk: 'HIGH' | 'MODERATE' | 'LOW' | 'STALE') => {
    switch (risk) {
      case 'HIGH':
        return '#ef4444'; // Red
      case 'MODERATE':
        return '#eab308'; // Yellow
      case 'LOW':
        return '#10b981'; // Green
      case 'STALE':
      default:
        return '#6b7280'; // Gray
    }
  };

  // Coordinates for selected origin -> destination polyline
  const originStop = stops.find((s) => s.id === selectedOriginId);
  const destStop = stops.find((s) => s.id === selectedDestinationId);
  const routePositions: [number, number][] =
    originStop && destStop
      ? [
        [originStop.location_lat, originStop.location_lng],
        [destStop.location_lat, destStop.location_lng],
      ]
      : [];

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm mb-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center space-x-2">
            <Navigation className="w-5 h-5 text-pink-600" />
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Interactive Geospatial Map & Crowd Density Layer
            </h2>
            <span className="text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded font-mono font-bold">
              OpenStreetMap + GPS
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Geographic coordinates of festival stops, live bus locations, crowd heat overlays, and passenger route paths.
          </p>
        </div>

        {/* Geolocation Button & Legend */}
        <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
          <button
            onClick={handleRequestLocation}
            className="flex items-center space-x-1.5 bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200 px-3 py-1.5 rounded-xl transition-all active:scale-95 shadow-xs"
          >
            <Locate className="w-3.5 h-3.5 text-pink-600" />
            <span>{locationStatus}</span>
          </button>

          <div className="flex flex-wrap items-center space-x-2 border-l border-slate-200 pl-3">
            <span className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
              <span className="text-slate-600 font-medium">Green: Low</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
              <span className="text-slate-600 font-medium">Yellow: Moderate</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse inline-block"></span>
              <span className="text-slate-600 font-medium">Red: High</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-400 inline-block"></span>
              <span className="text-slate-600 font-medium">Gray: Missing/Stale</span>
            </span>
          </div>
        </div>
      </div>

      {/* Simulated Telemetry & Data Source Notice */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-[11px] font-mono text-slate-600 mb-3">
        <span className="font-bold text-amber-800">
          • SIMULATED VEHICLE POSITIONS — FIXED 16 BUS FLEET •
        </span>
        <span>
          Data Source: Poisson Surge Forecasting Model (Demonstration)
        </span>
      </div>

      {/* Map Container */}
      <div className="h-[420px] w-full rounded-xl overflow-hidden mt-4 border border-slate-200 relative z-0 shadow-inner">
        <MapContainer
          center={mapCenter}
          zoom={13}
          scrollWheelZoom={false}
          className="h-full w-full"
        >
          {/* TileLayer */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* User Geolocation Marker */}
          {userLocation && (
            <Marker position={userLocation}>
              <Popup>
                <div className="text-xs font-sans">
                  <strong className="text-indigo-600 block">Your Current Location</strong>
                  <span className="text-slate-600 text-[10px]">GPS Active</span>
                </div>
              </Popup>
            </Marker>
          )}

          {/* Stop Markers & Crowd Heat Overlays */}
          {stops.map((stop) => {
            const risk = getStopRisk(stop.id);
            const color = getCrowdColor(risk);
            const pos: [number, number] = [stop.location_lat, stop.location_lng];

            return (
              <React.Fragment key={stop.id}>
                {/* Crowd Density Heat Circle */}
                <Circle
                  center={pos}
                  radius={350}
                  pathOptions={{
                    fillColor: color,
                    fillOpacity: risk === 'HIGH' ? 0.45 : 0.25,
                    color: color,
                    weight: 2,
                  }}
                />

                {/* Stop Marker */}
                <Marker position={pos} eventHandlers={{ click: () => setSelectedStop(stop) }}>
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
                          <span className="text-slate-500 block">RISK</span>
                          <strong style={{ color }}>{risk}</strong>
                        </div>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              </React.Fragment>
            );
          })}

          {/* Selected Passenger Route Line */}
          {routePositions.length > 0 && (
            <Polyline
              positions={routePositions}
              pathOptions={{ color: '#6366f1', weight: 4, dashArray: '8, 8' }}
            />
          )}

          {/* Active Transfer Corridors */}
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
                pathOptions={{ color: '#10b981', weight: 3 }}
              />
            );
          })}
        </MapContainer>
      </div>

      {/* Map Footer Metadata */}
      <div className="mt-3 flex flex-wrap items-center justify-between text-xs font-mono text-slate-400 gap-2">
        <span>Map Layer: OpenStreetMap Open-Source GIS Engine • Active Fleet: {fleet.total_buses - fleet.maintenance_buses}/{fleet.total_buses} Buses</span>
        <span>Role: {userRole} • Selected Stop: {selectedStop ? selectedStop.name : 'All Hubs'}</span>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { Calendar, Plus, Edit3, ShieldAlert, CheckCircle2, RefreshCw, Eye, CloudRain, ListFilter } from 'lucide-react';
import type { UserSession } from '../types';
import { fetchEvents, createEvent, updateEventOccurrence, fetchDatasetSummary } from '../services/api';
import { WeatherWidget } from './WeatherWidget';
import { CrowdObservationForm } from './CrowdObservationForm';

interface EventManagementViewProps {
  session: UserSession;
}

export const EventManagementView: React.FC<EventManagementViewProps> = ({ session }) => {
  const [activeTab, setActiveTab] = useState<'EVENTS' | 'OBSERVATIONS' | 'WEATHER'>('EVENTS');
  const [isExperimentalWeather, setIsExperimentalWeather] = useState<boolean>(false);
  const [eventsList, setEventsList] = useState<any[]>([]);
  const [datasetMeta, setDatasetMeta] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Form states
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [editingOccurrence, setEditingOccurrence] = useState<any | null>(null);

  const [eventName, setEventName] = useState<string>('');
  const [eventType] = useState<string>('Religious & Temple Festival');
  const [district, setDistrict] = useState<string>('Madurai');
  const [cityOrTown, setCityOrTown] = useState<string>('Madurai');
  const [eventDate, setEventDate] = useState<string>('2026-10-15');
  const [startTime, setStartTime] = useState<string>('06:00');
  const [endTime, setEndTime] = useState<string>('22:00');
  const [expectedAttendance, setExpectedAttendance] = useState<number>(150000);

  // Edit occurrence state
  const [userObservedAttendance, setUserObservedAttendance] = useState<number>(0);
  const [updatedExpectedAttendance, setUpdatedExpectedAttendance] = useState<number>(0);

  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const isEventManagerOrHigher = ['EVENT_MANAGER', 'OFFICER', 'TRANSPORT_OFFICER', 'ADMIN', 'ADMINISTRATOR'].includes(session.role.toUpperCase());

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [evtRes, metaRes] = await Promise.all([fetchEvents(), fetchDatasetSummary()]);
      setEventsList(evtRes.events || []);
      setDatasetMeta(metaRes);
    } catch (err) {
      console.warn('Failed to load events', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    try {
      await createEvent(
        {
          event_name: eventName,
          event_type: eventType,
          district,
          city_or_town: cityOrTown,
          event_date: eventDate,
          event_start_time: startTime,
          event_end_time: endTime,
          expected_attendance: Number(expectedAttendance),
        },
        session.role
      );
      setFormSuccess(`Event '${eventName}' created successfully in SQLite database.`);
      setShowAddModal(false);
      loadData();
    } catch (err: any) {
      setFormError(err.message || 'Failed to create event.');
    }
  };

  const handleUpdateOccurrence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOccurrence) return;
    setFormError(null);
    setFormSuccess(null);

    try {
      await updateEventOccurrence(
        editingOccurrence.id,
        {
          expected_attendance: Number(updatedExpectedAttendance),
          user_observed_attendance: Number(userObservedAttendance),
        },
        session.role
      );
      setFormSuccess(`Occurrence '${editingOccurrence.id}' updated with user observations.`);
      setEditingOccurrence(null);
      loadData();
    } catch (err: any) {
      setFormError(err.message || 'Failed to update occurrence.');
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center space-x-2">
            <Calendar className="w-6 h-6 text-indigo-600" />
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Festival &amp; Event Operations Center</h1>
            <span className="text-xs bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded font-mono font-bold">
              Provenance Verification Active
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Manage Tamil Nadu festival schedules, Event Manager ground crowd observations (Item L), and live Open-Meteo weather integrations (Item K).
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={loadData}
            className="flex items-center space-x-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 px-3 py-2 rounded-xl text-xs font-mono transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          {isEventManagerOrHigher && (
            <button
              onClick={() => {
                setEventName('Chithirai Festival Surge 2026');
                setShowAddModal(true);
              }}
              className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold font-mono transition-all shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Create Event</span>
            </button>
          )}
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border border-slate-200 rounded-2xl p-1 bg-white shadow-xs text-xs font-mono font-bold">
        <button
          onClick={() => setActiveTab('EVENTS')}
          className={`flex-1 py-2 px-3 rounded-xl flex items-center justify-center space-x-2 transition-all ${
            activeTab === 'EVENTS'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <ListFilter className="w-4 h-4" />
          <span>Events Roster ({eventsList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('OBSERVATIONS')}
          className={`flex-1 py-2 px-3 rounded-xl flex items-center justify-center space-x-2 transition-all ${
            activeTab === 'OBSERVATIONS'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Eye className="w-4 h-4" />
          <span>Event Manager Crowd Observations (Item L)</span>
        </button>

        <button
          onClick={() => setActiveTab('WEATHER')}
          className={`flex-1 py-2 px-3 rounded-xl flex items-center justify-center space-x-2 transition-all ${
            activeTab === 'WEATHER'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <CloudRain className="w-4 h-4" />
          <span>Live Weather Monitor (Item K)</span>
        </button>
      </div>

      {/* TAB CONTENT: Live Weather */}
      {activeTab === 'WEATHER' && (
        <WeatherWidget
          initialLocationName="madurai"
          isExperimentalActive={isExperimentalWeather}
          onExperimentalWeatherToggle={setIsExperimentalWeather}
        />
      )}

      {/* TAB CONTENT: Ground Observations */}
      {activeTab === 'OBSERVATIONS' && (
        <CrowdObservationForm
          session={session}
          onObservationAdded={loadData}
        />
      )}

      {/* TAB CONTENT: Main Events List */}
      {activeTab === 'EVENTS' && (
        <>
          {/* Dataset Provenance Banner */}
          <div className="bg-amber-50/90 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-start space-x-3">
              <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-amber-900 font-mono block uppercase">
                  DATASET PROVENANCE STATUS: Dataset-provided — provenance unverified
                </span>
                <p className="text-amber-800 text-[11px] mt-0.5">
                  Historical CSV rows (1,230 rows) represent demonstration/historical counts. Live or user-entered observations are tagged separately and never silently overwrite original records.
                </p>
              </div>
            </div>

            {datasetMeta && (
              <div className="bg-white/80 border border-amber-300 rounded-xl px-3 py-1.5 font-mono text-[10px] text-amber-900 shrink-0">
                <div>File: <strong>{datasetMeta.dataset_file}</strong></div>
                <div>Unique Occurrences: <strong>{datasetMeta.unique_occurrences}</strong></div>
              </div>
            )}
          </div>


      {formSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-800 flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{formSuccess}</span>
        </div>
      )}

      {formError && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs text-rose-800 flex items-center space-x-2">
          <ShieldAlert className="w-4 h-4 text-rose-600" />
          <span>{formError}</span>
        </div>
      )}

      {/* Events Roster */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-sm font-mono uppercase">
            Managed Event Occurrences ({eventsList.length} Records)
          </h3>
          <span className="text-xs text-slate-500 font-mono">
            User Role: <strong>{session.role}</strong>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs font-sans">
            <thead>
              <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-mono text-[11px]">
                <th className="p-3">OCCURRENCE ID</th>
                <th className="p-3">EVENT NAME</th>
                <th className="p-3">DISTRICT / CITY</th>
                <th className="p-3">DATE &amp; TIME</th>
                <th className="p-3">EXPECTED ATTENDANCE</th>
                <th className="p-3">OBSERVED / ACTUAL</th>
                <th className="p-3">PROVENANCE</th>
                <th className="p-3 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {eventsList.map((occ) => (
                <tr key={occ.id} className="hover:bg-slate-50">
                  <td className="p-3 font-mono font-bold text-indigo-700 text-[11px]">{occ.id}</td>
                  <td className="p-3 font-bold text-slate-900">{occ.event_name}</td>
                  <td className="p-3 text-slate-600 font-mono">{occ.district}, {occ.city_or_town}</td>
                  <td className="p-3 font-mono text-slate-700">
                    <div>{occ.event_date} ({occ.day_of_week || 'Scheduled'})</div>
                    <div className="text-[10px] text-slate-400">{occ.event_start_time} - {occ.event_end_time}</div>
                  </td>
                  <td className="p-3 font-mono font-bold text-indigo-600">
                    {occ.expected_attendance ? occ.expected_attendance.toLocaleString() : 'N/A'} pax
                  </td>
                  <td className="p-3 font-mono text-slate-800 font-bold">
                    {occ.user_observed_attendance ? (
                      <span className="text-emerald-700">👁️ {occ.user_observed_attendance.toLocaleString()} (Observed)</span>
                    ) : occ.actual_attendance ? (
                      <span>{occ.actual_attendance.toLocaleString()}</span>
                    ) : (
                      <span className="text-slate-400 italic">Unrecorded</span>
                    )}
                  </td>
                  <td className="p-3 font-mono">
                    <span className="text-[9px] bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded">
                      {occ.provenance || 'Dataset-provided'}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    {isEventManagerOrHigher ? (
                      <button
                        onClick={() => {
                          setEditingOccurrence(occ);
                          setUpdatedExpectedAttendance(occ.expected_attendance);
                          setUserObservedAttendance(occ.user_observed_attendance || occ.actual_attendance || 0);
                        }}
                        className="p-1.5 bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 rounded-lg transition-colors font-mono"
                        title="Edit Occurrence / Record Observation"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <span className="text-[10px] text-slate-400 font-mono">View Only</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Event Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-200 pb-3">Create New Event Occurrence</h3>
            <form onSubmit={handleCreateEvent} className="space-y-3 font-mono text-xs">
              <div>
                <label className="block text-slate-600 mb-1 font-bold">Event Name</label>
                <input
                  type="text"
                  required
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1 font-bold">District</label>
                  <input
                    type="text"
                    required
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1 font-bold">City or Town</label>
                  <input
                    type="text"
                    required
                    value={cityOrTown}
                    onChange={(e) => setCityOrTown(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-slate-600 mb-1 font-bold">Event Date</label>
                  <input
                    type="date"
                    required
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1 font-bold">Start Time</label>
                  <input
                    type="text"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1 font-bold">End Time</label>
                  <input
                    type="text"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-bold">Expected Attendance</label>
                <input
                  type="number"
                  required
                  min={100}
                  value={expectedAttendance}
                  onChange={(e) => setExpectedAttendance(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold"
                >
                  Save Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Occurrence Modal */}
      {editingOccurrence && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-200 pb-3">
              Edit Occurrence {editingOccurrence.id}
            </h3>
            <form onSubmit={handleUpdateOccurrence} className="space-y-3 font-mono text-xs">
              <div>
                <label className="block text-slate-600 mb-1 font-bold">Updated Expected Attendance</label>
                <input
                  type="number"
                  required
                  value={updatedExpectedAttendance}
                  onChange={(e) => setUpdatedExpectedAttendance(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-bold text-emerald-800">
                  Record User-Observed Attendance (Manual Observation)
                </label>
                <input
                  type="number"
                  value={userObservedAttendance}
                  onChange={(e) => setUserObservedAttendance(Number(e.target.value))}
                  className="w-full bg-emerald-50 border border-emerald-300 rounded-lg p-2 text-emerald-950 font-bold"
                />
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Stored explicitly as user observation, distinct from imported CSV values.
                </span>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingOccurrence(null)}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold"
                >
                  Update Occurrence
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
};

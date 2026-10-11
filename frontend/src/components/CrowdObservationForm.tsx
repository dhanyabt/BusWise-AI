import React, { useState, useEffect } from 'react';
import { Eye, Plus, Edit2, History, CheckCircle2, AlertCircle } from 'lucide-react';
import type { UserSession, CrowdObservation } from '../types';
import { createCrowdObservation, fetchCrowdObservations, updateCrowdObservation } from '../services/api';

interface CrowdObservationFormProps {
  session: UserSession;
  eventId?: string;
  onObservationAdded?: () => void;
}

export const CrowdObservationForm: React.FC<CrowdObservationFormProps> = ({
  session,
  eventId = 'EVT-2026-MADURAI-01',
  onObservationAdded,
}) => {
  const [observations, setObservations] = useState<CrowdObservation[]>([]);

  // Form state
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [editingObs, setEditingObs] = useState<CrowdObservation | null>(null);

  // Field states
  const [targetEventId, setTargetEventId] = useState<string>(eventId);
  const [occurrenceId] = useState<string>('OCC-2026-CHITHIRAI-01');
  const [locationName, setLocationName] = useState<string>('Madurai Central Bus Stand');
  const [observedCount, setObservedCount] = useState<number | ''>(2500);
  const [observedAt, setObservedAt] = useState<string>(new Date().toISOString().slice(0, 16));
  const [notes, setNotes] = useState<string>('Ground patrol gate count at peak arrival hour');
  const [source, setSource] = useState<string>('Gate Counter Patrol 2');

  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const isAuthorized = ['EVENT_MANAGER', 'OFFICER', 'TRANSPORT_OFFICER', 'ADMIN', 'ADMINISTRATOR', 'POLICE'].includes(session.role.toUpperCase());

  const loadObservations = async () => {
    try {
      const data = await fetchCrowdObservations(targetEventId);
      setObservations(data || []);
    } catch (err) {
      console.warn('Failed to load observations', err);
    }
  };

  useEffect(() => {
    loadObservations();
  }, [targetEventId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (observedCount === '' || Number(observedCount) < 0) {
      setFormError('Observed crowd count must be a non-negative number.');
      return;
    }

    try {
      await createCrowdObservation(
        {
          event_id: targetEventId,
          occurrence_id: occurrenceId,
          location: locationName,
          observed_count: Number(observedCount),
          observed_at: new Date(observedAt).toISOString(),
          notes: notes.trim() || undefined,
          source: source.trim() || undefined,
        },
        session.token
      );

      setFormSuccess('Manual crowd observation recorded successfully.');
      setShowCreateModal(false);
      loadObservations();
      if (onObservationAdded) onObservationAdded();
    } catch (err: any) {
      setFormError(err.message || 'Failed to submit observation.');
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingObs) return;

    setFormError(null);
    setFormSuccess(null);

    if (observedCount === '' || Number(observedCount) < 0) {
      setFormError('Observed crowd count must be a non-negative number.');
      return;
    }

    try {
      await updateCrowdObservation(
        editingObs.id,
        {
          observed_count: Number(observedCount),
          location: locationName,
          observed_at: new Date(observedAt).toISOString(),
          notes: notes.trim() || undefined,
          source: source.trim() || undefined,
        },
        session.token
      );

      setFormSuccess(`Observation #${editingObs.id} corrected with audit log entry.`);
      setEditingObs(null);
      loadObservations();
      if (onObservationAdded) onObservationAdded();
    } catch (err: any) {
      setFormError(err.message || 'Failed to update observation.');
    }
  };

  const latestObservation = observations.length > 0 ? observations[0] : null;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-5 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
            <Eye className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-bold text-slate-900 tracking-tight">Event Manager Manual Crowd Reporting</h2>
              <span className="text-[10px] font-mono font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded border border-amber-300">
                Ground Provenance
              </span>
            </div>
            <p className="text-xs text-slate-500 font-mono">
              Authorized ground observation reporting with audit trail tracking. Separated from CSV dataset &amp; predicted crowd numbers.
            </p>
          </div>
        </div>

        {isAuthorized ? (
          <button
            onClick={() => {
              setObservedCount(2500);
              setObservedAt(new Date().toISOString().slice(0, 16));
              setFormError(null);
              setShowCreateModal(true);
            }}
            className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold font-mono transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Record Ground Count</span>
          </button>
        ) : (
          <div className="text-xs font-mono text-slate-400 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
            Read-Only (Event Manager Role Required)
          </div>
        )}
      </div>

      {formSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center space-x-2 font-mono">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{formSuccess}</span>
        </div>
      )}

      {formError && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center space-x-2 font-mono">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      {/* Latest Observation Banner */}
      {latestObservation ? (
        <div className="bg-indigo-50/70 border border-indigo-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-mono font-bold uppercase text-indigo-900 bg-indigo-200/80 px-2 py-0.5 rounded">
                Manually reported
              </span>
              <span className="text-xs font-mono text-slate-500">
                Observation #{latestObservation.id}
              </span>
            </div>
            <div className="text-xl font-bold font-mono text-indigo-950">
              👁️ {latestObservation.observed_count.toLocaleString()} passengers
            </div>
            <div className="text-xs text-slate-600 font-mono flex items-center space-x-3">
              <span>📍 {latestObservation.location}</span>
              <span>👤 Reporter: {latestObservation.reported_by}</span>
              <span>🕒 Observed: {new Date(latestObservation.observed_at).toLocaleString()}</span>
            </div>
          </div>

          <div className="text-right text-[10px] font-mono text-indigo-800 bg-white/80 p-2.5 rounded-lg border border-indigo-200">
            <div>Provenanced Entry</div>
            <div>Not Automatically Called Live</div>
            <div>Database Status: <strong>Persisted</strong></div>
          </div>
        </div>
      ) : (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-center text-xs font-mono text-slate-500">
          No ground crowd observation recorded for this event yet. Event Managers can submit verified observations using the button above.
        </div>
      )}

      {/* Observations Roster Table */}
      <div className="border border-slate-200 rounded-xl overflow-hidden">
        <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs font-mono">
          <span className="font-bold text-slate-700 uppercase">
            Ground Crowd Observation Logs ({observations.length} Entries)
          </span>
          <span className="text-slate-500">
            User Account: <strong>{session.email || session.name}</strong>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs font-sans">
            <thead>
              <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-mono text-[11px]">
                <th className="p-3">ID</th>
                <th className="p-3">LOCATION</th>
                <th className="p-3">OBSERVED COUNT</th>
                <th className="p-3">OBSERVED TIME</th>
                <th className="p-3">REPORTED BY</th>
                <th className="p-3">NOTES &amp; SOURCE</th>
                <th className="p-3 font-mono">AUDIT TRAIL</th>
                {isAuthorized && <th className="p-3 text-right">ACTIONS</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {observations.map((obs) => (
                <tr key={obs.id} className="hover:bg-slate-50">
                  <td className="p-3 font-bold text-indigo-600 text-[11px]">#{obs.id}</td>
                  <td className="p-3 text-slate-800 font-bold">{obs.location}</td>
                  <td className="p-3 font-bold text-indigo-900 text-sm">
                    {obs.observed_count.toLocaleString()}
                  </td>
                  <td className="p-3 text-slate-600 text-[11px]">
                    {new Date(obs.observed_at).toLocaleString()}
                  </td>
                  <td className="p-3 text-slate-700 text-[11px]">{obs.reported_by}</td>
                  <td className="p-3 text-slate-600 text-[11px]">
                    <div>{obs.notes || '—'}</div>
                    <div className="text-[10px] text-slate-400">Src: {obs.source || 'Ground Patrol'}</div>
                  </td>
                  <td className="p-3 font-mono text-[10px]">
                    {obs.audit_trail && obs.audit_trail.length > 0 ? (
                      <span className="inline-flex items-center space-x-1 text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                        <History className="w-3 h-3 text-amber-600" />
                        <span>Edited ({obs.audit_trail.length}x)</span>
                      </span>
                    ) : (
                      <span className="text-slate-400">Original</span>
                    )}
                  </td>
                  {isAuthorized && (
                    <td className="p-3 text-right">
                      <button
                        onClick={() => {
                          setEditingObs(obs);
                          setLocationName(obs.location);
                          setObservedCount(obs.observed_count);
                          setObservedAt(new Date(obs.observed_at).toISOString().slice(0, 16));
                          setNotes(obs.notes || '');
                          setSource(obs.source || '');
                          setFormError(null);
                        }}
                        className="p-1.5 bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 rounded-lg transition-colors"
                        title="Edit / Correct Observation"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Record Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 font-sans">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-900 font-mono">
                Record Ground Crowd Observation
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-mono"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3 text-xs font-mono">
              <div>
                <label className="block text-slate-600 mb-1 font-bold">Event &amp; Occurrence ID</label>
                <input
                  type="text"
                  required
                  value={targetEventId}
                  onChange={(e) => setTargetEventId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-bold">Bus Stand / Location Name</label>
                <input
                  type="text"
                  required
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-bold text-indigo-900">
                  Observed Crowd Count (Passenger Headcount)
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  value={observedCount}
                  onChange={(e) => setObservedCount(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full bg-indigo-50 border border-indigo-300 rounded-lg p-2 text-indigo-950 font-bold text-sm"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-bold">Observation Date &amp; Time</label>
                <input
                  type="datetime-local"
                  required
                  value={observedAt}
                  onChange={(e) => setObservedAt(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-bold">Reporting Account (Auto-filled)</label>
                <input
                  type="text"
                  readOnly
                  value={session.email || session.name || 'Event Manager'}
                  className="w-full bg-slate-100 border border-slate-200 text-slate-500 rounded-lg p-2 cursor-not-allowed"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-600 mb-1 font-bold">Source / Gate ID</label>
                  <input
                    type="text"
                    value={source}
                    placeholder="e.g. Gate Counter 2"
                    onChange={(e) => setSource(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1 font-bold">Notes</label>
                  <input
                    type="text"
                    value={notes}
                    placeholder="Optional field notes"
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900"
                  />
                </div>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[10px] text-amber-900">
                <strong>Provenance Guarantee:</strong> Manually reported observations are saved into the SQLite database with your account identity timestamp. They will be labeled as "Manually reported" and will not overwrite historical dataset CSV rows.
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold"
                >
                  Save Observation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit / Correct Modal with Audit Trail */}
      {editingObs && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 font-sans">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-900 font-mono">
                Edit Observation #{editingObs.id} &amp; Audit Log
              </h3>
              <button
                onClick={() => setEditingObs(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-mono"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-3 text-xs font-mono">
              <div>
                <label className="block text-slate-600 mb-1 font-bold">Location Name</label>
                <input
                  type="text"
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-bold text-indigo-900">
                  Corrected Crowd Count
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  value={observedCount}
                  onChange={(e) => setObservedCount(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full bg-indigo-50 border border-indigo-300 rounded-lg p-2 text-indigo-950 font-bold text-sm"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-bold">Correction Notes / Reason</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900"
                />
              </div>

              {/* Display Existing Audit Trail */}
              {editingObs.audit_trail && editingObs.audit_trail.length > 0 && (
                <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 space-y-2">
                  <span className="text-[11px] font-bold text-slate-700 block uppercase">
                    Previous Audit Log History:
                  </span>
                  <div className="space-y-1.5 max-h-32 overflow-y-auto text-[10px] text-slate-600">
                    {editingObs.audit_trail.map((entry, idx) => (
                      <div key={idx} className="bg-white p-2 rounded border border-slate-200 space-y-0.5">
                        <div className="flex justify-between font-bold text-slate-800">
                          <span>By: {entry.edited_by}</span>
                          <span>{new Date(entry.edited_at).toLocaleTimeString()}</span>
                        </div>
                        <div>Previous values: {JSON.stringify(entry.previous_values)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingObs(null)}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold"
                >
                  Save Correction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import { Bus as BusIcon, Plus, Edit3, Power, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import type { FleetSummary, Bus, UserSession } from '../types';
import { createBus, updateBus, updateBusStatus } from '../services/api';

interface FleetManagementViewProps {
  fleet: FleetSummary;
  session: UserSession;
  onRefreshFleet: () => void;
}

export const FleetManagementView: React.FC<FleetManagementViewProps> = ({
  fleet,
  session,
  onRefreshFleet,
}) => {
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [editingBus, setEditingBus] = useState<Bus | null>(null);

  // Form states
  const [busNumber, setBusNumber] = useState<string>('');
  const [capacity, setCapacity] = useState<number>(60);
  const [status, setStatus] = useState<Bus['status']>('AVAILABLE');
  const [initialStopId] = useState<string>('STOP-001');
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const isOfficerOrAdmin = ['OFFICER', 'TRANSPORT_OFFICER', 'ADMIN', 'ADMINISTRATOR', 'POLICE'].includes(session.role.toUpperCase());

  const handleAddBus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!busNumber.trim()) {
      setFormError('Bus Registration Number is required.');
      return;
    }
    setIsSubmitting(true);
    setFormError(null);
    setFormSuccess(null);

    try {
      await createBus(
        {
          bus_number: busNumber,
          capacity: Number(capacity),
          status,
          initial_stop_id: initialStopId,
        },
        session.role
      );
      setFormSuccess(`Bus '${busNumber.toUpperCase()}' successfully added to database.`);
      setBusNumber('');
      setShowAddModal(false);
      onRefreshFleet();
    } catch (err: any) {
      setFormError(err.message || 'Failed to add bus.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateBus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBus) return;
    setIsSubmitting(true);
    setFormError(null);

    try {
      await updateBus(
        editingBus.id,
        {
          bus_number: busNumber,
          capacity: Number(capacity),
          status,
        },
        session.role
      );
      setFormSuccess(`Bus '${editingBus.id}' updated successfully.`);
      setEditingBus(null);
      onRefreshFleet();
    } catch (err: any) {
      setFormError(err.message || 'Failed to update bus.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleDeactivate = async (bus: Bus) => {
    const newStatus = bus.status === 'DEACTIVATED' ? 'AVAILABLE' : 'DEACTIVATED';
    try {
      await updateBusStatus(bus.id, newStatus, session.role);
      onRefreshFleet();
    } catch (err: any) {
      alert(`Status update failed: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center space-x-2">
            <BusIcon className="w-6 h-6 text-indigo-600" />
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Dynamic Fleet Management</h1>
            <span className="text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded font-mono font-bold">
              SQLite Persistent Store
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Manage registered bus inventory, passenger capacities, service statuses, and activation states. Supports 16, 32, 50, or any valid fleet size.
          </p>
        </div>

        {isOfficerOrAdmin && (
          <div className="flex items-center space-x-3">
            <button
              onClick={onRefreshFleet}
              className="flex items-center space-x-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 px-3 py-2 rounded-xl text-xs font-mono transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Sync Fleet</span>
            </button>

            <button
              onClick={() => {
                setBusNumber(`BW-${fleet.registered_fleet + 101}`);
                setCapacity(60);
                setStatus('AVAILABLE');
                setShowAddModal(true);
              }}
              className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold font-mono transition-all shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Bus</span>
            </button>
          </div>
        )}
      </div>

      {/* Fleet Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs font-mono">
          <span className="text-[10px] text-slate-500 font-bold block uppercase">Registered Fleet</span>
          <span className="text-xl font-extrabold text-slate-900">{fleet.registered_fleet}</span>
          <span className="text-[9px] text-slate-400 block mt-0.5">Total recorded in DB</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-xs font-mono">
          <span className="text-[10px] text-emerald-600 font-bold block uppercase">Available Fleet</span>
          <span className="text-xl font-extrabold text-emerald-700">{fleet.available_fleet}</span>
          <span className="text-[9px] text-emerald-600 block mt-0.5">Eligible for service</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-indigo-200 shadow-xs font-mono">
          <span className="text-[10px] text-indigo-600 font-bold block uppercase">Allocated Fleet</span>
          <span className="text-xl font-extrabold text-indigo-700">{fleet.allocated_fleet}</span>
          <span className="text-[9px] text-indigo-600 block mt-0.5">Assigned to events</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs font-mono">
          <span className="text-[10px] text-slate-500 font-bold block uppercase">Unallocated Fleet</span>
          <span className="text-xl font-extrabold text-slate-800">{fleet.unallocated_fleet}</span>
          <span className="text-[9px] text-slate-400 block mt-0.5">Reserve availability</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-xs font-mono">
          <span className="text-[10px] text-amber-600 font-bold block uppercase">Maintenance</span>
          <span className="text-xl font-extrabold text-amber-700">{fleet.maintenance_buses}</span>
          <span className="text-[9px] text-amber-600 block mt-0.5">Servicing in depot</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-rose-200 shadow-xs font-mono">
          <span className="text-[10px] text-rose-600 font-bold block uppercase">Deactivated</span>
          <span className="text-xl font-extrabold text-rose-700">{fleet.deactivated_buses}</span>
          <span className="text-[9px] text-rose-600 block mt-0.5">Historical audit record</span>
        </div>
      </div>

      {formSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-800 flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{formSuccess}</span>
        </div>
      )}

      {formError && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs text-rose-800 flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-rose-600" />
          <span>{formError}</span>
        </div>
      )}

      {/* Fleet Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-sm font-mono uppercase">
            Registered Fleet Roster ({fleet.buses.length} Buses)
          </h3>
          <span className="text-xs text-slate-500 font-mono">
            Logged in as: <strong>{session.name} ({session.role})</strong>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs font-sans">
            <thead>
              <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-mono text-[11px]">
                <th className="p-3">BUS ID</th>
                <th className="p-3">REGISTRATION #</th>
                <th className="p-3">CAPACITY</th>
                <th className="p-3">SERVICE STATUS</th>
                <th className="p-3">ASSIGNED STOP</th>
                <th className="p-3 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {fleet.buses.map((b) => (
                <tr key={b.id} className={b.status === 'DEACTIVATED' ? 'bg-slate-50/60 opacity-60' : 'hover:bg-slate-50'}>
                  <td className="p-3 font-mono font-bold text-indigo-700">{b.id}</td>
                  <td className="p-3 font-mono font-bold text-slate-900">{b.bus_number}</td>
                  <td className="p-3 font-mono">{b.capacity} pax</td>
                  <td className="p-3 font-mono">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        b.status === 'AVAILABLE'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : b.status === 'IN_SERVICE'
                          ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                          : b.status === 'MAINTENANCE'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}
                    >
                      {b.status}
                    </span>
                  </td>
                  <td className="p-3 text-slate-600 font-mono">{b.current_stop_id || b.initial_stop_id || 'STOP-001'}</td>
                  <td className="p-3 text-right space-x-2">
                    {isOfficerOrAdmin ? (
                      <>
                        <button
                          onClick={() => {
                            setEditingBus(b);
                            setBusNumber(b.bus_number);
                            setCapacity(b.capacity);
                            setStatus(b.status);
                          }}
                          className="p-1.5 bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 rounded-lg transition-colors"
                          title="Edit Bus"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleToggleDeactivate(b)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            b.status === 'DEACTIVATED'
                              ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700'
                              : 'bg-rose-50 hover:bg-rose-100 text-rose-700'
                          }`}
                          title={b.status === 'DEACTIVATED' ? 'Reactivate Bus' : 'Deactivate Bus'}
                        >
                          <Power className="w-3.5 h-3.5" />
                        </button>
                      </>
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

      {/* Add Bus Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-200 pb-3">Add New Fleet Bus</h3>
            <form onSubmit={handleAddBus} className="space-y-3 font-mono text-xs">
              <div>
                <label className="block text-slate-600 mb-1 font-bold">Bus Registration Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. BW-501"
                  value={busNumber}
                  onChange={(e) => setBusNumber(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-bold">Passenger Capacity</label>
                <input
                  type="number"
                  required
                  min={10}
                  max={200}
                  value={capacity}
                  onChange={(e) => setCapacity(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-bold">Initial Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="AVAILABLE">AVAILABLE</option>
                  <option value="IN_SERVICE">IN_SERVICE</option>
                  <option value="MAINTENANCE">MAINTENANCE</option>
                  <option value="DEACTIVATED">DEACTIVATED</option>
                </select>
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
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold"
                >
                  {isSubmitting ? 'Saving...' : 'Save Bus'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Bus Modal */}
      {editingBus && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-200 pb-3">Edit Bus {editingBus.id}</h3>
            <form onSubmit={handleUpdateBus} className="space-y-3 font-mono text-xs">
              <div>
                <label className="block text-slate-600 mb-1 font-bold">Bus Registration Number</label>
                <input
                  type="text"
                  required
                  value={busNumber}
                  onChange={(e) => setBusNumber(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-bold">Passenger Capacity</label>
                <input
                  type="number"
                  required
                  min={10}
                  max={200}
                  value={capacity}
                  onChange={(e) => setCapacity(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-bold">Service Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="AVAILABLE">AVAILABLE</option>
                  <option value="IN_SERVICE">IN_SERVICE</option>
                  <option value="MAINTENANCE">MAINTENANCE</option>
                  <option value="DEACTIVATED">DEACTIVATED</option>
                </select>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingBus(null)}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold"
                >
                  {isSubmitting ? 'Updating...' : 'Update Bus'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

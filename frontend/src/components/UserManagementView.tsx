import React, { useState, useEffect } from 'react';
import { Users, Shield, CheckCircle2, AlertCircle, RefreshCw, Key } from 'lucide-react';
import type { UserSession } from '../types';
import { fetchUsers, updateUserRole } from '../services/api';

interface UserManagementViewProps {
  session: UserSession;
}

export const UserManagementView: React.FC<UserManagementViewProps> = ({ session }) => {
  const [userList, setUserList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>('PASSENGER');
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const isAdmin = ['ADMIN', 'ADMINISTRATOR'].includes(session.role.toUpperCase());

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const res = await fetchUsers(session.role);
      setUserList(res.users || []);
    } catch (err) {
      console.warn('Failed to load users', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadUsers();
    }
  }, [isAdmin]);

  const handleRoleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setFormError(null);
    setFormSuccess(null);

    try {
      await updateUserRole(editingUser.id, selectedRole, session.role);
      setFormSuccess(`User '${editingUser.name}' role updated to ${selectedRole}.`);
      setEditingUser(null);
      loadUsers();
    } catch (err: any) {
      setFormError(err.message || 'Failed to update user role.');
    }
  };

  if (!isAdmin) {
    return (
      <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-xs text-rose-900 flex items-start space-x-3 font-sans">
        <Shield className="w-5 h-5 text-rose-600 shrink-0" />
        <div>
          <strong className="font-bold text-sm block">Access Restricted (Administrator Privilege Required)</strong>
          <p className="mt-1">
            User &amp; Role Management functions are reserved for authorized system Administrators. Please contact an Administrator to elevate your account privileges.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center space-x-2">
            <Users className="w-6 h-6 text-indigo-600" />
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">User &amp; Role Management</h1>
            <span className="text-xs bg-indigo-50 text-indigo-800 border border-indigo-200 px-2 py-0.5 rounded font-mono font-bold">
              Admin Security Controls
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Manage user accounts, assign elevated roles (Administrator, Transport Officer, Event Manager), and inspect security session profiles.
          </p>
        </div>

        <button
          onClick={loadUsers}
          className="flex items-center space-x-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 px-3 py-2 rounded-xl text-xs font-mono transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Sync Users</span>
        </button>
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

      {/* User Accounts Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-sm font-mono uppercase">
            Registered Accounts ({userList.length} Accounts)
          </h3>
          <span className="text-xs text-slate-500 font-mono">
            Admin Session: <strong>{session.email}</strong>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs font-sans">
            <thead>
              <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-mono text-[11px]">
                <th className="p-3">USER ID</th>
                <th className="p-3">NAME &amp; EMAIL</th>
                <th className="p-3">ASSIGNED ROLE</th>
                <th className="p-3">AGENCY / BADGE</th>
                <th className="p-3">CREATED AT</th>
                <th className="p-3 text-right">ROLE ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {userList.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50">
                  <td className="p-3 font-mono font-bold text-indigo-700">{u.id}</td>
                  <td className="p-3 font-sans">
                    <div className="font-bold text-slate-900">{u.name}</div>
                    <div className="text-[10px] text-slate-500 font-mono">{u.email}</div>
                  </td>
                  <td className="p-3 font-mono">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        ['ADMINISTRATOR', 'ADMIN'].includes(u.role)
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : ['OFFICER', 'TRANSPORT_OFFICER'].includes(u.role)
                          ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                          : u.role === 'EVENT_MANAGER'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="p-3 font-mono text-slate-600">
                    <div>{u.agency || 'N/A'}</div>
                    {u.badge_number && <div className="text-[10px] text-slate-400">Badge: {u.badge_number}</div>}
                  </td>
                  <td className="p-3 font-mono text-slate-500 text-[10px]">{u.created_at || 'Pre-configured'}</td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => {
                        setEditingUser(u);
                        setSelectedRole(u.role);
                      }}
                      className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold font-mono transition-colors"
                    >
                      Manage Role
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Role Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 font-sans">
            <div className="flex items-center space-x-2 border-b border-slate-200 pb-3">
              <Key className="w-5 h-5 text-indigo-600" />
              <h3 className="text-base font-bold text-slate-900">Manage Role for {editingUser.name}</h3>
            </div>
            <form onSubmit={handleRoleUpdate} className="space-y-3 font-mono text-xs">
              <div>
                <label className="block text-slate-600 mb-1 font-bold">Select Assigned System Role</label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                >
                  <option value="ADMINISTRATOR">ADMINISTRATOR (Full System Controls)</option>
                  <option value="TRANSPORT_OFFICER">TRANSPORT_OFFICER (Fleet &amp; Optimizer Manager)</option>
                  <option value="EVENT_MANAGER">EVENT_MANAGER (Festival &amp; Event Manager)</option>
                  <option value="POLICE">POLICE (Crowd Safety &amp; Tactical Dispatch)</option>
                  <option value="PASSENGER">PASSENGER (Public Transit Rider)</option>
                </select>
              </div>

              <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg text-[10px] text-slate-600">
                <strong>Security Policy Note:</strong> Elevating a user role grants immediate backend access permissions for operational data modifications.
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold"
                >
                  Save New Role
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

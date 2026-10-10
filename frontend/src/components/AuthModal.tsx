import React, { useState } from 'react';
import { Shield, User, Bus, Building, AlertCircle } from 'lucide-react';

import type { UserRole, UserSession } from '../types';
import { registerUser, loginUser, API_BASE } from '../services/api';

export type { UserRole, UserSession };

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (session: UserSession) => void;
  currentRole: UserRole;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  currentRole,
}) => {
  const [authMode, setAuthMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [selectedRole, setSelectedRole] = useState<UserRole>(currentRole);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('demo123');
  const [agency, setAgency] = useState('');
  const [badgeNumber, setBadgeNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    if (authMode === 'REGISTER') {
      if (!name.trim()) {
        setErrorMsg('Please enter your full name or official title.');
        setIsLoading(false);
        return;
      }
      if (!email.trim() || !email.includes('@')) {
        setErrorMsg('Please enter a valid email address.');
        setIsLoading(false);
        return;
      }
      if (!password || password.length < 4) {
        setErrorMsg('Password must be at least 4 characters long.');
        setIsLoading(false);
        return;
      }
    } else {
      if (!email.trim()) {
        setErrorMsg('Please enter your email address.');
        setIsLoading(false);
        return;
      }
      if (!password) {
        setErrorMsg('Please enter your password.');
        setIsLoading(false);
        return;
      }
    }

    try {
      let sessionData: UserSession;
      if (authMode === 'REGISTER') {
        sessionData = await registerUser({
          name: name.trim(),
          email: email.trim(),
          password,
          role: selectedRole,
          agency: agency.trim() || undefined,
          badge_number: badgeNumber.trim() || undefined,
        });
      } else {
        sessionData = await loginUser({
          email: email.trim(),
          password,
          role: selectedRole,
        });
      }

      // Persist session to localStorage for reload resilience
      try {
        localStorage.setItem('buswise_session', JSON.stringify(sessionData));
      } catch (storageErr) {
        console.warn('Could not persist session to localStorage', storageErr);
      }

      onLoginSuccess(sessionData);
      onClose();
    } catch (err: any) {
      const msg = err?.message || 'Authentication failed. Please verify credentials.';
      if (msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('Load failed')) {
        setErrorMsg(`Network Error: Cannot connect to BusWise AI backend at ${API_BASE}. Ensure the backend server is running on port 8000.`);
      } else {
        setErrorMsg(msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 shadow-2xl text-slate-800 font-sans">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-pink-600 rounded-xl text-white shadow-sm">
              <Bus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">BusWise AI Identity Portal</h2>
              <p className="text-xs text-slate-500 font-mono">Government Role-Based Access Control</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-900 text-sm font-mono px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Tab Switcher: Login vs Register */}
        <div className="flex border border-slate-200 rounded-xl p-1 bg-slate-50 mt-4 text-xs font-mono font-bold">
          <button
            type="button"
            onClick={() => setAuthMode('LOGIN')}
            className={`flex-1 py-1.5 rounded-lg transition-all ${authMode === 'LOGIN' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setAuthMode('REGISTER')}
            className={`flex-1 py-1.5 rounded-lg transition-all ${authMode === 'REGISTER' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
          >
            Create Account
          </button>
        </div>

        {errorMsg && (
          <div className="mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 mt-4 text-xs font-mono">
          <div>
            <label className="text-slate-600 block mb-1.5 font-bold uppercase text-[10px]">Select Authorized Role:</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setSelectedRole('PASSENGER')}
                className={`p-2.5 rounded-xl border text-center transition-all ${selectedRole === 'PASSENGER'
                  ? 'bg-pink-600 text-white border-pink-600 shadow-sm font-bold'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
              >
                <User className="w-4 h-4 mx-auto mb-1" />
                <span>Passenger</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedRole('OFFICER')}
                className={`p-2.5 rounded-xl border text-center transition-all ${selectedRole === 'OFFICER'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm font-bold'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
              >
                <Building className="w-4 h-4 mx-auto mb-1" />
                <span>Officer</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedRole('POLICE')}
                className={`p-2.5 rounded-xl border text-center transition-all ${selectedRole === 'POLICE'
                  ? 'bg-rose-600 text-white border-rose-600 shadow-sm font-bold'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
              >
                <Shield className="w-4 h-4 mx-auto mb-1" />
                <span>Police/Safety</span>
              </button>
            </div>
          </div>

          {authMode === 'REGISTER' && (
            <div>
              <label className="text-slate-600 block mb-1">Full Name / Official Name:</label>
              <input
                type="text"
                value={name}
                placeholder="e.g. Inspector Rajesh Kumar"
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-pink-500 text-xs"
              />
            </div>
          )}

          <div>
            <label className="text-slate-600 block mb-1">Email Address:</label>
            <input
              type="email"
              value={email}
              placeholder={`${selectedRole.toLowerCase()}@buswise.ai`}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-pink-500 text-xs"
            />
          </div>

          <div>
            <label className="text-slate-600 block mb-1">Security Password / Passcode:</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-pink-500 text-xs"
            />
          </div>

          {authMode === 'REGISTER' && selectedRole !== 'PASSENGER' && (
            <div>
              <label className="text-slate-600 block mb-1">Department / Agency Name:</label>
              <input
                type="text"
                value={agency}
                placeholder="e.g. Tamil Nadu State Transport Corporation (TNSTC)"
                onChange={(e) => setAgency(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-pink-500 text-xs"
              />
            </div>
          )}

          {authMode === 'REGISTER' && selectedRole !== 'PASSENGER' && (
            <div>
              <label className="text-slate-600 block mb-1">Official Badge / ID Number (Optional):</label>
              <input
                type="text"
                value={badgeNumber}
                placeholder="e.g. TNSTC-4091 or POL-992"
                onChange={(e) => setBadgeNumber(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-pink-500 text-xs"
              />
            </div>
          )}

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600 font-sans">
            <span className="font-bold text-slate-800 block mb-0.5">Role Permissions:</span>
            {selectedRole === 'PASSENGER' && 'Access festival trip planner, live map, route schedules, and crowd status.'}
            {selectedRole === 'OFFICER' && 'Access full transport control center, OR-Tools optimizer, fleet transfers, and RippleGuard ledger.'}
            {selectedRole === 'POLICE' && 'Access crowd density safety overlays, incident surge alerts, and security dispatch parameters.'}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 bg-pink-600 hover:bg-pink-700 text-white font-bold rounded-xl shadow-sm transition-all active:scale-95 disabled:opacity-50 text-xs uppercase"
          >
            {isLoading
              ? 'Processing...'
              : authMode === 'REGISTER'
                ? `Create ${selectedRole} Account`
                : `Log In as ${selectedRole}`}
          </button>
        </form>
      </div>
    </div>
  );
};

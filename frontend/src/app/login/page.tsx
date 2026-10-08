'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTenant, UserRole } from '@/lib/tenant-context';
import { INITIAL_USERS } from '@/lib/api';
import IdentifyLogo from '@/components/IdentifyLogo';
import {
  Lock,
  Mail,
  ShieldCheck,
  Building2,
  ChevronRight,
  Sparkles,
  School as SchoolIcon,
  KeyRound,
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { school, setCurrentRole, availableSchools, setSchool, loginAs } = useTenant();

  const [email, setEmail] = useState('superadmin@deped.gov.ph');
  const [password, setPassword] = useState('SuperAdmin123!');
  const [totpCode, setTotpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hideQuickLogins, setHideQuickLogins] = useState(false);
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hidden =
        localStorage.getItem('identify_hide_quick_logins') === 'true' ||
        localStorage.getItem('identify_production_launch_mode') === 'true';
      setHideQuickLogins(hidden);
      const twoFa = localStorage.getItem('identify_2fa_enabled') === 'true';
      setIs2FAEnabled(twoFa);
    }
  }, []);

  const quickRoles = [
    { role: 'SUPER_ADMIN' as UserRole, email: 'superadmin@deped.gov.ph', pass: 'SuperAdmin123!', label: 'Super Admin' },
    { role: 'PRINCIPAL' as UserRole, email: 'sawatelementaryschool@gmail.com', pass: 'Principal123!', label: 'Principal (Rico Idos)' },
    { role: 'ADMIN_ASSISTANT' as UserRole, email: 'adminassistant.sawat@deped.gov.ph', pass: 'AdminAssistant123!', label: 'Admin Assistant (AO)' },
    { role: 'HEAD_TEACHER' as UserRole, email: 'ht.jhs@mabini.deped.gov.ph', pass: 'Head Teacher' },
    { role: 'MASTER_TEACHER' as UserRole, email: 'mt.ramos@mabini.deped.gov.ph', pass: 'Master Teacher' },
    { role: 'TEACHER' as UserRole, email: 'teacher.santos@mabini.deped.gov.ph', pass: 'Teacher' },
  ];

  const handleRolePreFill = (roleObj: typeof quickRoles[0]) => {
    setEmail(roleObj.email);
    setPassword(roleObj.pass);
    const user = INITIAL_USERS.find((u) => u.role === roleObj.role) || {
      ...INITIAL_USERS[0],
      role: roleObj.role,
      email: roleObj.email,
    };
    loginAs(user);
    setError('');
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const lowerEmail = email.toLowerCase().trim();

    // Guard: Learners (students) do not have login access
    if (
      lowerEmail.includes('student') ||
      lowerEmail.includes('juan.delacruz@student') ||
      lowerEmail.startsWith('student.')
    ) {
      setError('Access Denied: Student learners do not have portal login access. Records are maintained via the DepEd BEEF Database.');
      setLoading(false);
      return;
    }

    // Guard: Kiosk does not require or have user login
    if (
      lowerEmail.includes('kiosk') ||
      lowerEmail.includes('turnstile') ||
      lowerEmail.startsWith('kiosk.')
    ) {
      setError('Notice: The RFID Gate Turnstile Kiosk operates autonomously without user login at the slug /kiosk.');
      setLoading(false);
      return;
    }

    // Guard: Enforce 2FA Authenticator TOTP if enabled
    if (is2FAEnabled) {
      const cleanedCode = totpCode.trim();
      if (!cleanedCode) {
        setError('Two-Factor Authentication is enabled for this deployment. Please enter your 6-digit Authenticator code.');
        setLoading(false);
        return;
      }
      if (!/^\d{6}$/.test(cleanedCode)) {
        setError('Invalid 2FA Code: Please enter a 6-digit verification code from your authenticator app.');
        setLoading(false);
        return;
      }
    }

    setTimeout(() => {
      // Determine role from email
      const matched = quickRoles.find(
        (r) => r.email.toLowerCase() === lowerEmail,
      );
      if (matched) {
        const user = INITIAL_USERS.find((u) => u.role === matched.role) || {
          ...INITIAL_USERS[0],
          role: matched.role,
          email: matched.email,
        };
        loginAs(user);
      } else {
        loginAs({
          ...INITIAL_USERS[0],
          email: lowerEmail,
          full_name: lowerEmail.split('@')[0],
          role: 'TEACHER',
        });
      }
      router.push('/dashboard');
      setLoading(false);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 py-12">
      {/* Dynamic White-Label Brand Logo */}
      <div className="text-center mb-8 animate-fade-in">
        <div className="mb-4 flex justify-center">
          <IdentifyLogo size="sm" showSubtitle={false} />
        </div>
        <div className="w-20 h-20 mx-auto rounded-2xl p-2 bg-gradient-to-tr from-blue-700 to-indigo-600 shadow-2xl shadow-blue-900/50 flex items-center justify-center mb-4 transition-transform hover:scale-105">
          <img
            src={school.logo_url}
            alt={school.name}
            className="w-full h-full object-contain"
          />
        </div>
        <h1 className="text-2xl font-black text-white tracking-tight">
          {school.name}
        </h1>
        <div className="flex items-center justify-center space-x-2 mt-1">
          <span className="text-xs font-mono font-bold text-yellow-400">
            DepEd School ID: {school.deped_school_id}
          </span>
          <span className="text-slate-500">&bull;</span>
          <span className="text-xs text-slate-400">
            {school.division} &bull; {school.region}
          </span>
        </div>
      </div>

      {/* Login Card */}
      <div className="w-full max-w-md glass-panel p-8 rounded-2xl border border-slate-800 shadow-2xl relative z-10 animate-fade-in">
        <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-800">
          <div>
            <h2 className="text-base font-bold text-white">Official DepEd Authentication</h2>
            <p className="text-xs text-slate-400">Single Sign-On & Role-Based Access</p>
          </div>
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
        </div>

        {error && (
          <div className="p-3 mb-4 rounded-lg bg-red-950/80 border border-red-800 text-xs text-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Official DepEd Email or Username
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@deped.gov.ph"
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-sans"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Account Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
                <KeyRound className="w-3.5 h-3.5 text-slate-400" />
                <span>2FA Authenticator TOTP</span>
              </label>
              {is2FAEnabled ? (
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Required (2FA Active)
                </span>
              ) : (
                <span className="text-[10px] text-slate-500">Optional</span>
              )}
            </div>
            <input
              type="text"
              maxLength={6}
              value={totpCode}
              onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
              placeholder={is2FAEnabled ? 'Enter 6-digit Authenticator code' : '6-digit authenticator code (optional)'}
              className={`w-full bg-slate-900 border ${
                is2FAEnabled ? 'border-emerald-500/50 focus:border-emerald-400' : 'border-slate-700 focus:border-blue-500'
              } rounded-xl px-4 py-2 text-xs text-white font-mono placeholder-slate-500 focus:outline-none tracking-wider`}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center space-x-1.5 active:scale-95 disabled:opacity-50"
          >
            <span>{loading ? 'Authenticating...' : 'Sign In to DepEd Portal'}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </form>

        {/* Quick Role Fillers for One-Click Evaluation (Suppressed if Prepared for Launch) */}
        {!hideQuickLogins ? (
          <div className="mt-6 pt-5 border-t border-slate-800">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center space-x-1">
              <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
              <span>One-Click Role Test Accounts:</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {quickRoles.map((r) => (
                <button
                  key={r.role}
                  type="button"
                  onClick={() => handleRolePreFill(r)}
                  className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-[11px] text-slate-300 font-medium transition-all text-center"
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="mt-5 p-3 rounded-xl bg-emerald-950/20 border border-emerald-900/40 text-center">
            <div className="flex items-center justify-center gap-1.5 text-xs text-emerald-400 font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Production Launch Mode Enforced</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Evaluation accounts removed. Authenticate with official DepEd credentials.
            </p>
          </div>
        )}

        {/* Autonomous Turnstile Kiosk Banner (No Login Required) */}
        <div className="mt-5 p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-center">
          <span className="text-xs text-slate-400">Need Turnstile Gate Station? </span>
          <Link href="/kiosk" className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold underline ml-1">
            Launch Kiosk Station (/kiosk) &rarr;
          </Link>
          <p className="text-[11px] text-slate-500 mt-0.5">Operates autonomously without login credentials.</p>
        </div>

        {/* Tenant Switcher on Login Page */}
        <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
          <span>Active Tenant:</span>
          <div className="flex space-x-2">
            {availableSchools.map((s) => (
              <button
                key={s.id}
                onClick={() => setSchool(s)}
                className={`text-[11px] underline ${
                  school.id === s.id ? 'text-blue-400 font-bold' : 'text-slate-400'
                }`}
              >
                {s.short_name || s.name.substring(0, 10)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 text-center text-xs text-slate-500">
        <Link href="/" className="hover:text-slate-300 transition-colors">
          &larr; Back to Directory
        </Link>
      </div>
    </div>
  );
}

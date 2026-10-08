'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTenant, UserRole } from '@/lib/tenant-context';
import { formatUserDisplayName } from '@/lib/api';
import IdentifyLogo from './IdentifyLogo';
import { CopyrightNotice } from './CopyrightNotice';
import UserProfileModal from './UserProfileModal';
import {
  Building2,
  Users,
  Clock,
  FileSpreadsheet,
  ShieldCheck,
  ChevronDown,
  LogOut,
  QrCode,
  GraduationCap,
  Sparkles,
  Layers,
  School as SchoolIcon,
  Menu,
  X,
  ShieldAlert,
  BarChart3,
  UserPlus,
  ExternalLink,
  UploadCloud,
  Sliders,
  Settings,
  User,
  Check,
  BookOpen,
  Mail,
  Phone,
  Shield,
  BadgeCheck,
  Sun,
  Moon,
  Palette,
  RotateCcw,
} from 'lucide-react';
import { useTheme } from '@/lib/theme-context';

interface BrandedShellProps {
  children: React.ReactNode;
  activeNav?: string;
  onNavChange?: (nav: string) => void;
}

export default function BrandedShell({ children, activeNav, onNavChange }: BrandedShellProps) {
  const {
    school,
    currentRole,
    setCurrentRole,
    currentUser,
    authenticatedUser,
    isSuperAdminSession,
    isSpoofing,
    spoofRole,
    exitSpoof,
    logout,
  } = useTenant();
  const { currentTheme, setTheme, themeConfig, isDark } = useTheme();
  const pathname = usePathname();
  const router = useRouter();

  // State
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [roleSwitcherOpen, setRoleSwitcherOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const roles: { role: UserRole; label: string; position: string; desc: string }[] = [
    {
      role: 'SUPER_ADMIN',
      label: 'Super Admin',
      position: 'System Administrator',
      desc: 'Full CRUD across all modules, granular RBAC configuration, SOC 2 audit trail',
    },
    {
      role: 'PRINCIPAL',
      label: 'Principal',
      position: 'Principal I',
      desc: 'School head metrics for all grades/sections/teachers, faculty & student CRUD, class assignments',
    },
    {
      role: 'ADMIN_ASSISTANT',
      label: 'Admin Assistant (AO)',
      position: 'Administrative Assistant II',
      desc: 'CRUD teachers and staff, assign grade levels & custom sections, CRUD students & CSV import',
    },
    {
      role: 'MASTER_TEACHER',
      label: 'Master Teacher',
      position: 'Master Teacher I',
      desc: 'Same RBAC as Teacher: Assigned classes, manual attendance (Present, Absent, Excused, Dropped)',
    },
    {
      role: 'TEACHER',
      label: 'Teacher',
      position: 'Teacher III',
      desc: 'Assigned classes, subject roll call with gate status check, student performance metrics',
    },
    {
      role: 'STAFF',
      label: 'School Staff',
      position: 'Staff',
      desc: 'Operational support, student directory viewing, general assistance',
    },
  ];

  const handleNavClick = (navKey: string) => {
    // Outside the dashboard (e.g. /deped-forms, /kiosk) there is no tab state to change,
    // so navigate to the dashboard with the requested tab.
    if (pathname !== '/dashboard') {
      setMobileMenuOpen(false);
      router.push(`/dashboard?nav=${encodeURIComponent(navKey)}`);
      return;
    }
    if (onNavChange) {
      onNavChange(navKey);
    }
    setMobileMenuOpen(false);
  };

  const handleLogoff = () => {
    setProfileDropdownOpen(false);
    logout();
    router.push('/login');
  };

  // Determine user display values
  const userPhoto = currentUser?.photo_url || '/avatars/default-user.svg';
  const userName = formatUserDisplayName(currentUser) || currentUser?.display_name || currentUser?.full_name || 'Chester Sigua';
  const userPosition = currentUser?.position || (currentRole === 'SUPER_ADMIN' ? 'System Administrator' : 'Principal I');

  // RBAC Permission check
  const isSuperAdmin = currentRole === 'SUPER_ADMIN';
  const isPrincipal = currentRole === 'PRINCIPAL';
  const isAdminAssistant = currentRole === 'ADMIN_ASSISTANT';
  const isTeacherOrMaster = currentRole === 'TEACHER' || currentRole === 'MASTER_TEACHER';

  // Helper to ensure crisp, readable text across all 6 light and dark themes
  const getNavItemClass = (isActive: boolean) =>
    `w-full flex items-center space-x-2.5 px-3.5 py-2.5 rounded-xl font-medium transition-all ${
      isActive
        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold shadow-lg shadow-blue-600/30'
        : 'text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80 font-semibold'
    }`;

  return (
    <div className="min-h-screen flex bg-slate-950 text-slate-100 font-sans antialiased">
      {/* ------------------------------------------------------------- */}
      {/* 1. SIDEBAR NAVIGATION                                         */}
      {/* ------------------------------------------------------------- */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-slate-900/95 backdrop-blur-2xl border-r border-slate-800/90 flex flex-col justify-between transition-transform duration-300 ease-in-out md:translate-x-0 shadow-2xl ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="flex flex-col h-full overflow-y-auto custom-scrollbar">
          {/* A. iDentify Brand Logo ON TOP */}
          <div className="p-5 border-b border-slate-800/80 bg-slate-950/40">
            <div className="flex items-center justify-between">
              <Link href="/dashboard" className="block focus:outline-none">
                <IdentifyLogo size="md" />
              </Link>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="md:hidden text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* B. Logged in user profile photo and name UNDER THE LOGO */}
          <div className="px-5 pt-4 pb-2">
            <div className="p-3.5 rounded-2xl bg-gradient-to-b from-slate-800/60 to-slate-900/80 border border-slate-700/60 shadow-lg relative overflow-hidden group">
              {/* Subtle accent glow */}
              <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-xl pointer-events-none" />

              <div className="flex items-center space-x-3.5 relative z-10">
                <div className="relative shrink-0">
                  <div className="w-12 h-12 rounded-xl overflow-hidden ring-2 ring-blue-500/50 p-0.5 bg-slate-950 shadow-md">
                    <img
                      src={userPhoto}
                      alt={userName}
                      className="w-full h-full object-cover rounded-[10px]"
                    />
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-slate-900 rounded-full shadow-sm" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center space-x-1.5">
                    <h2 className="text-sm font-bold text-white truncate tracking-tight" title={userName}>
                      {userName}
                    </h2>
                  </div>
                  <p className="text-[11px] text-cyan-300 font-medium truncate" title={userPosition}>
                    {userPosition}
                  </p>
                  <div className="mt-1 flex items-center space-x-1.5">
                    <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-blue-600/30 text-blue-300 border border-blue-500/40 uppercase">
                      {currentRole.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              </div>

              {/* School Affiliation */}
              <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                <span className="truncate">{school.short_name || school.name}</span>
                <span className="text-yellow-400 font-semibold shrink-0">ID: {school.deped_school_id}</span>
              </div>
            </div>
          </div>

          {/* C. SEPARATION DIVIDER */}
          <div className="px-5 py-2">
            <div className="h-px bg-gradient-to-r from-transparent via-slate-700/80 to-transparent" />
          </div>

          {/* D. THE MENU */}
          <nav className="flex-1 px-3 py-2 space-y-1 text-xs">
            <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-3 mb-2 flex items-center justify-between">
              <span>Main Workspace</span>
              <span className="text-[9px] text-slate-400 font-mono font-normal">v1.2b</span>
            </div>

            {/* 1. Dashboard & Metrics (Principal, Super Admin, Teachers) */}
            {(isSuperAdmin || isPrincipal || isTeacherOrMaster) && (
              <button
                id="nav-dashboard"
                onClick={() => handleNavClick('overview')}
                className={getNavItemClass((!activeNav || activeNav === 'overview') && pathname === '/dashboard')}
              >
                <Layers className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                <span>Dashboard &amp; Metrics</span>
              </button>
            )}

            {/* 2. Faculty & Staff / DTR */}
            {(isSuperAdmin || isPrincipal || isAdminAssistant || isTeacherOrMaster) && (
              <button
                id="nav-users"
                onClick={() => handleNavClick('users')}
                className={getNavItemClass((activeNav === 'users' || activeNav === 'staff') && pathname === '/dashboard')}
              >
                <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>{isTeacherOrMaster && !isAdminAssistant && !isPrincipal ? 'Faculty & My DTR' : 'Faculty & Staff (DTR)'}</span>
              </button>
            )}

            {/* 3. Student Database (DepEd BEEF) */}
            <button
              id="nav-students"
              onClick={() => handleNavClick('students')}
              className={getNavItemClass(activeNav === 'students' && pathname === '/dashboard')}
            >
              <GraduationCap className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              <span>Student Database (BEEF)</span>
            </button>

            {/* 4. Import DepEd CSV/Excel */}
            {(isSuperAdmin || isPrincipal || isAdminAssistant) && (
              <button
                id="nav-import"
                onClick={() => handleNavClick('import_csv')}
                className={getNavItemClass(activeNav === 'import_csv' && pathname === '/dashboard')}
              >
                <UploadCloud className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Import DepEd CSV</span>
              </button>
            )}

            {/* 5. Academic Sections & Subject Assignments */}
            {(isSuperAdmin || isPrincipal || isAdminAssistant || isTeacherOrMaster) && (
              <button
                id="nav-academic"
                onClick={() => handleNavClick('academic')}
                className={getNavItemClass(activeNav === 'academic' && pathname === '/dashboard')}
              >
                <BookOpen className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>Sections &amp; Subjects</span>
              </button>
            )}

            {/* 6. Classroom Attendance (Manual & Turnstile Combined - Super Admin, Principal, Teachers) */}
            {(isSuperAdmin || isPrincipal || isTeacherOrMaster) && (
              <button
                id="nav-attendance"
                onClick={() => handleNavClick('attendance')}
                className={getNavItemClass(activeNav === 'attendance' && pathname === '/dashboard')}
              >
                <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Classroom Roll Call</span>
              </button>
            )}

            {/* 7. School Settings (Super Admin & Principal) */}
            {(isSuperAdmin || isPrincipal) && (
              <button
                id="nav-settings"
                onClick={() => handleNavClick('school_profile')}
                className={getNavItemClass((activeNav === 'school_profile' || activeNav === 'settings') && pathname === '/dashboard')}
              >
                <SchoolIcon className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span>School Settings</span>
              </button>
            )}

            {/* 8. Immutable SOC 2 Audit Ledger (Super Admin & Principal) */}
            {(isSuperAdmin || isPrincipal) && (
              <button
                id="nav-audit"
                onClick={() => handleNavClick('audit')}
                className={getNavItemClass(activeNav === 'audit' && pathname === '/dashboard')}
              >
                <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                <span>Immutable Audit Log</span>
              </button>
            )}

            {/* 9. Standalone Kiosk Terminal (Super Admin & Principal) */}
            {(isSuperAdmin || isPrincipal) && (
              <div className="pt-2">
                <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-3 mb-1.5">
                  Hardware Stations
                </div>
                <Link
                  href="/kiosk"
                  className={`w-full flex items-center space-x-2.5 px-3.5 py-2.5 rounded-xl font-medium transition-all ${
                    pathname === '/kiosk'
                      ? 'bg-emerald-600 text-white font-bold shadow-lg'
                      : 'text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80 font-semibold'
                  }`}
                >
                  <QrCode className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Gate RFID Kiosk</span>
                </Link>
              </div>
            )}

            {/* 10. DepEd Official Forms SF1/SF2/SF5 (Super Admin, Principal, Teachers) */}
            {(isSuperAdmin || isPrincipal || isTeacherOrMaster) && (
              <Link
                href="/deped-forms"
                className={`w-full flex items-center space-x-2.5 px-3.5 py-2.5 rounded-xl font-medium transition-all ${
                  pathname === '/deped-forms'
                    ? 'bg-blue-600 text-white font-bold shadow-lg'
                    : 'text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80 font-semibold'
                }`}
              >
                <FileSpreadsheet className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>DepEd SF1 / SF2 / SF5</span>
              </Link>
            )}
          </nav>

          {/* E. Bottom Role Indicator / Switcher */}
          {isSuperAdminSession ? (
            <div className="p-3 border-t border-slate-800/80 bg-slate-950/60">
              <div className="text-[9px] font-bold uppercase tracking-wider mb-1.5 px-1 flex items-center justify-between">
                <span className={isSpoofing ? 'text-amber-400 font-extrabold flex items-center gap-1' : 'text-slate-500'}>
                  {isSpoofing && <Sparkles className="w-2.5 h-2.5 animate-spin" />}
                  Super Admin Tool
                </span>
                {isSpoofing ? (
                  <span className="text-amber-400 font-mono text-[9px] flex items-center gap-1 font-bold animate-pulse">
                    <Sparkles className="w-2.5 h-2.5" /> Spoof Active
                  </span>
                ) : (
                  <span className="text-yellow-400 font-mono text-[9px] flex items-center gap-1 font-bold">
                    <Sparkles className="w-2.5 h-2.5" /> Persona Test
                  </span>
                )}
              </div>
              <button
                id="superadmin-role-switcher"
                onClick={() => setRoleSwitcherOpen(!roleSwitcherOpen)}
                className={`w-full flex items-center justify-between p-2 rounded-xl text-xs transition-all ${
                  isSpoofing
                    ? 'bg-amber-950/40 border border-amber-500/60 hover:border-amber-400 text-amber-200 shadow-md shadow-amber-950/50'
                    : 'bg-slate-900 border border-slate-700/60 hover:border-blue-500/60 text-slate-200'
                }`}
              >
                <div className="flex items-center space-x-2 truncate">
                  <Sparkles className={`w-3.5 h-3.5 shrink-0 ${isSpoofing ? 'text-amber-400' : 'text-yellow-400'}`} />
                  <div className="text-left truncate">
                    <div className="text-[11px] font-bold truncate">
                      {isSpoofing ? `Spoofing: ${currentRole}` : `Master: ${currentRole}`}
                    </div>
                    {isSpoofing && (
                      <div className="text-[9px] text-amber-300/80 truncate">
                        {currentUser?.full_name}
                      </div>
                    )}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              </button>

              {/* Quick Revert Button if Spoofing */}
              {isSpoofing && (
                <button
                  onClick={exitSpoof}
                  className="mt-1.5 w-full flex items-center justify-center space-x-1.5 py-1.5 px-2 rounded-lg bg-gradient-to-r from-amber-600/80 to-rose-600/80 hover:from-amber-600 hover:to-rose-600 text-white text-[10px] font-bold shadow transition-all hover:scale-[1.02]"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Exit Spoof (Revert to Super Admin)</span>
                </button>
              )}

              {roleSwitcherOpen && (
                <div className="mt-2 bg-slate-900 border border-slate-700 rounded-xl p-2 shadow-2xl space-y-1 max-h-64 overflow-y-auto custom-scrollbar">
                  <div className="flex items-center justify-between pb-1 border-b border-slate-800 text-[10px] text-slate-400 font-bold px-1">
                    <span>SELECT SIMULATION PERSONA</span>
                    {isSpoofing && (
                      <button
                        onClick={() => {
                          exitSpoof();
                          setRoleSwitcherOpen(false);
                        }}
                        className="text-rose-400 hover:text-rose-300 text-[10px] font-bold"
                      >
                        Reset to Master
                      </button>
                    )}
                  </div>

                  {roles.map((r) => {
                    const isSelected = currentRole === r.role && (!isSpoofing || r.role !== 'SUPER_ADMIN');
                    return (
                      <button
                        key={r.role}
                        onClick={() => {
                          if (r.role === 'SUPER_ADMIN') {
                            exitSpoof();
                          } else {
                            spoofRole(r.role);
                          }
                          setRoleSwitcherOpen(false);
                        }}
                        className={`w-full text-left p-2 rounded-lg text-xs transition-colors ${
                          isSelected
                            ? 'bg-blue-600 text-white font-bold'
                            : r.role === 'SUPER_ADMIN'
                            ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-900/50'
                            : 'text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold flex items-center gap-1">
                            {r.role === 'SUPER_ADMIN' ? '👑 ' : '🎭 '}
                            {r.label}
                          </span>
                          <span className="text-[9px] opacity-75 font-mono">{r.position}</span>
                        </div>
                        <div className="text-[10px] opacity-70 mt-0.5 line-clamp-1">{r.desc}</div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="p-3 border-t border-slate-800/80 bg-slate-950/60">
              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800/80 text-xs flex items-center justify-between">
                <div className="flex items-center space-x-2 truncate">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div className="truncate">
                    <div className="text-[10px] text-slate-400 font-semibold leading-tight">Access Level</div>
                    <div className="text-[11px] font-bold text-slate-200 truncate">{currentRole}</div>
                  </div>
                </div>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800/70 font-mono">
                  Enforced
                </span>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile Drawer Backdrop */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-40 glass-modal-backdrop bg-slate-950/50 backdrop-blur-md md:hidden animate-fade-in"
        />
      )}

      {/* ------------------------------------------------------------- */}
      {/* 2. TOP HEADER & MAIN CONTENT                                  */}
      {/* ------------------------------------------------------------- */}
      <div className="flex-1 flex flex-col md:pl-72 min-w-0">
        {/* Top Header Bar */}
        <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-xl sticky top-0 z-30 h-16">
          <div className="w-[85%] max-w-[85vw] mx-auto h-full flex items-center justify-between px-4 sm:px-6">
            {/* Left: Mobile hamburger & breadcrumb */}
            <div className="flex items-center space-x-3.5">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="md:hidden text-slate-300 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors"
                title="Open Navigation"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div className="flex items-center space-x-2.5 text-xs">
                {school.logo_url && (
                  <div className="w-8 h-8 rounded-lg overflow-hidden p-0.5 bg-slate-950/80 border border-slate-700/80 shadow-md shrink-0 flex items-center justify-center">
                    <img
                      src={school.logo_url}
                      alt={school.name}
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}
                <div className="flex items-center space-x-2">
                  <span className="text-white font-extrabold text-sm tracking-tight">{school.name}</span>
                  <span className="font-mono text-[11px] text-yellow-400 bg-yellow-950/60 px-2 py-0.5 rounded-md border border-yellow-900/60 hidden sm:inline-block">
                    DepEd ID: {school.deped_school_id}
                  </span>
                </div>
              </div>
            </div>

            {/* Right: QUICK THEME TOGGLE + USER PROFILE MENU */}
            <div className="flex items-center space-x-2.5">
              {/* Quick Light/Dark Mode Toggle */}
              <button
                id="quick-theme-toggle"
                onClick={() => setTheme(isDark ? 'facebook-light' : 'facebook-dark')}
                className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 hover:border-slate-600 transition-all text-xs font-semibold text-slate-200 shadow-sm"
                title={`Current: ${themeConfig.name} (${themeConfig.category.toUpperCase()}). Click to toggle mode.`}
              >
                {isDark ? (
                  <>
                    <Sun className="w-4 h-4 text-amber-400" />
                    <span className="hidden sm:inline text-[11px]">Light Mode</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-4 h-4 text-blue-500" />
                    <span className="hidden sm:inline text-[11px]">Dark Mode</span>
                  </>
                )}
              </button>

              <div className="relative" ref={dropdownRef}>
                <button
                  id="user-profile-menu-button"
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center space-x-3 p-1.5 pr-3 rounded-2xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 hover:border-slate-600 transition-all shadow-sm group"
                  aria-expanded={profileDropdownOpen}
                >
                <div className="relative">
                  <div className="w-9 h-9 rounded-xl overflow-hidden ring-1 ring-blue-500/50 bg-slate-950">
                    <img
                      src={userPhoto}
                      alt={userName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-slate-900 rounded-full" />
                </div>

                <div className="text-left hidden sm:block">
                  <div className="text-xs font-bold text-white group-hover:text-blue-300 transition-colors leading-tight">
                    {userName}
                  </div>
                  <div className="text-[10px] text-slate-400 font-medium leading-tight">
                    {userPosition}
                  </div>
                </div>

                <ChevronDown
                  className={`w-4 h-4 text-slate-400 group-hover:text-white transition-transform duration-200 ${
                    profileDropdownOpen ? 'rotate-180 text-blue-400' : ''
                  }`}
                />
              </button>

              {/* DROPDOWN MENU: Profile, Settings, Logoff */}
              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-700/90 rounded-2xl shadow-2xl p-2 z-50 animate-fade-in backdrop-blur-2xl">
                  {/* User Header in Dropdown */}
                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 mb-1.5">
                    <div className="flex items-center space-x-2.5">
                      <img src={userPhoto} alt={userName} className="w-8 h-8 rounded-lg object-cover" />
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-white truncate">{userName}</div>
                        <div className="text-[10px] text-cyan-300 font-mono truncate">{userPosition}</div>
                      </div>
                    </div>
                    <div className="mt-2 text-[10px] text-slate-400 font-mono truncate">
                      {currentUser?.email || 'user@deped.gov.ph'}
                    </div>
                  </div>

                  <div className="space-y-0.5 text-xs">
                    {/* 1. Profile Details */}
                    <button
                      onClick={() => {
                        setShowProfileModal(true);
                        setProfileDropdownOpen(false);
                      }}
                      className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left font-medium"
                    >
                      <User className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                      <span>My Profile</span>
                    </button>

                    {/* 2. School Settings */}
                    <button
                      onClick={() => {
                        handleNavClick('school_profile');
                        setProfileDropdownOpen(false);
                      }}
                      className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left font-medium"
                    >
                      <Settings className="w-4 h-4 text-purple-500 dark:text-purple-400" />
                      <span>School Settings</span>
                    </button>

                    {/* 2b. Appearance & Theme Settings */}
                    <button
                      onClick={() => {
                        handleNavClick('school_profile');
                        setProfileDropdownOpen(false);
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left font-medium"
                    >
                      <div className="flex items-center space-x-2.5">
                        <Palette className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                        <span>Theme (6 Modes)</span>
                      </div>
                      <span className="text-[10px] text-blue-600 dark:text-blue-400 font-mono font-bold">
                        {themeConfig.badge}
                      </span>
                    </button>

                    {/* 3. Turnstile Kiosk Quick Access */}
                    <Link
                      href="/kiosk"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left font-medium"
                    >
                      <div className="flex items-center space-x-2.5">
                        <QrCode className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                        <span>Kiosk Mode</span>
                      </div>
                      <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-mono">No Login</span>
                    </Link>

                    <div className="my-1 border-t border-slate-200 dark:border-slate-800" />

                    {/* 4. Logoff */}
                    <button
                      onClick={handleLogoff}
                      className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors text-left font-medium"
                    >
                      <LogOut className="w-4 h-4 text-rose-500 dark:text-rose-400" />
                      <span>Logoff / Switch Account</span>
                    </button>
                  </div>
                </div>
              )}
              </div>
            </div>
          </div>
        </header>

        {/* Global Superadmin Persona Spoofing Alert Banner */}
        {isSpoofing && (
          <div className="bg-gradient-to-r from-amber-950/95 via-purple-950/95 to-amber-950/95 border-b border-amber-500/40 px-4 py-2.5 text-xs flex flex-wrap items-center justify-between gap-3 shadow-2xl sticky top-16 z-20 backdrop-blur-md animate-fade-in">
            <div className="flex items-center space-x-2.5 text-amber-200">
              <span className="flex h-2.5 w-2.5 relative shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
              </span>
              <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono font-bold text-[10px] border border-amber-500/40 uppercase tracking-wide">
                Super Admin Spoofing Active
              </span>
              <span className="text-slate-200">
                Viewing as <strong className="text-white font-extrabold">{currentUser?.full_name}</strong>
                <span className="text-amber-300 font-mono font-bold ml-1.5">[{currentRole}]</span>
              </span>
              <span className="text-slate-400 hidden xl:inline">
                &bull; Real Master Session: <span className="text-slate-300 font-semibold">{authenticatedUser?.full_name} (SUPER_ADMIN)</span>
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setRoleSwitcherOpen(true)}
                className="px-2.5 py-1 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px] font-bold flex items-center space-x-1.5 transition-colors shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
                <span>Switch Role</span>
              </button>
              <button
                onClick={exitSpoof}
                className="px-3 py-1 rounded-lg bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 text-white text-[11px] font-bold flex items-center space-x-1.5 shadow-md shadow-amber-900/40 transition-all hover:scale-105"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Exit Spoof (Revert to Super Admin)</span>
              </button>
            </div>
          </div>
        )}

        {/* Content Body: 85% Width of Window */}
        <main className="flex-1 py-8 px-4 sm:px-6 w-[85%] max-w-[85vw] mx-auto min-w-0">
          {children}
        </main>

        {/* Footer */}
        <footer className="sticky bottom-0 z-30 border-t border-slate-800/80 bg-slate-950/95 backdrop-blur py-3 text-xs text-slate-400">
          <div className="w-[85%] max-w-[85vw] mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>
                SOC 2 Type 2 Validated &bull; RA 10173 (Data Privacy Act) &bull; DepEd Order No. 8, s. 2015
              </span>
            </div>
            <div className="shrink-0">
              <CopyrightNotice className="text-[11px] text-slate-400" />
            </div>
          </div>
        </footer>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* USER PROFILE MODAL (EDIT PROFILE & PHOTO UPLOAD)               */}
      {/* ------------------------------------------------------------- */}
      <UserProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
      />
    </div>
  );
}

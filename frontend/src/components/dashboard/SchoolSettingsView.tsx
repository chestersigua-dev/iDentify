'use client';

import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Save, 
  CheckCircle, 
  MapPin, 
  Phone, 
  Mail, 
  UserCheck, 
  Image as ImageIcon, 
  Key, 
  MessageSquare, 
  Clock, 
  ShieldCheck,
  Palette,
  Sun,
  Moon,
  Sparkles,
  Check,
  Send,
  ExternalLink,
  RotateCcw,
  RefreshCw,
  AlertTriangle,
  Trash2,
  XCircle,
  ShieldAlert,
  X,
  QrCode,
  Rocket,
  Copy,
  CheckCircle2,
  KeyRound,
  Smartphone,
  Lock
} from 'lucide-react';
import { useTheme } from '@/lib/theme-context';
import { useTenant } from '@/lib/tenant-context';
import { apiClient } from '@/lib/api';
import { TestSmsModal } from './TestSmsModal';

interface SchoolSettingsViewProps {
  onPurgeComplete?: () => void;
}

export function SchoolSettingsView({ onPurgeComplete }: SchoolSettingsViewProps = {}) {
  const { currentTheme, setTheme, themeConfig, allThemes } = useTheme();
  const { school, setSchool, currentRole, currentUser } = useTenant();

  const getSchoolDefaults = (s: typeof school) => ({
    school_name: s?.name || 'Sawat Elementary School',
    school_id: s?.deped_school_id || '101692',
    division: [s?.division, s?.region].filter(Boolean).join(' • ') || 'Division of Pangasinan II • Region I',
    region: s?.region || 'Region I',
    address: [
      s?.barangay ? `Brgy. ${s.barangay}` : '',
      s?.municipality_city,
      s?.province,
      s?.postal_code,
    ].filter(Boolean).join(', ') || 'Sawat, Urbiztondo, Pangasinan 2414',
    contact_number: s?.contact_phone || '0905 669 1862',
    email: s?.contact_email || 'sawatelementaryschool@gmail.com',
    school_head_name: s?.school_head_name || 'Dr. Rico Idos',
    school_head_title: s?.school_head_title || 'Principal I',
    logo_url: s?.logo_url || '/logos/sawat.png',
  });

  const [settings, setSettings] = useState(() => {
    const baseDefaults = {
      school_name: 'Sawat Elementary School',
      school_id: '101692',
      division: 'Division of Pangasinan II • Region I',
      region: 'Region I',
      address: 'Sawat, Urbiztondo, Pangasinan 2414',
      contact_number: '0905 669 1862',
      email: 'sawatelementaryschool@gmail.com',
      school_head_name: 'Dr. Rico Idos',
      school_head_title: 'Principal I',
      logo_url: '/logos/sawat.png',
      easysms_api_key: 'es_live_********************************',
      semaphore_api_key: 'sem_live_********************************',
      philsms_api_token: 'philsms_live_****************************',
      sms_sender_name: 'iDentify',
      kiosk_debounce_minutes: 30,
      kiosk_display_duration_seconds: 2,
      kiosk_show_sms_status: true,
      sms_provider: 'EASYSMS',
      parent_sms_enabled: true,
    };

    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('identify_school_settings');
        if (stored) {
          const parsed = JSON.parse(stored);
          // If stored is the old placeholder 'San Fernando National High School', ignore it
          if (parsed.school_name && !parsed.school_name.includes('San Fernando')) {
            return {
              ...baseDefaults,
              ...parsed,
              kiosk_display_duration_seconds: Number(parsed.kiosk_display_duration_seconds) || 2,
              kiosk_show_sms_status: parsed.kiosk_show_sms_status !== false,
            };
          }
        }
      } catch (e) {
        console.error('Error loading school settings:', e);
      }
    }
    return baseDefaults;
  });

  const [isSaved, setIsSaved] = useState(false);
  const [isLoadedNotice, setIsLoadedNotice] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);

  // Super Admin Purge states
  const [isPurgeModalOpen, setIsPurgeModalOpen] = useState(false);
  const [purgeConfirmationText, setPurgeConfirmationText] = useState('');
  const [isPurgeCheckboxChecked, setIsPurgeCheckboxChecked] = useState(false);
  const [isPurging, setIsPurging] = useState(false);
  const [purgeSuccessBanner, setPurgeSuccessBanner] = useState<string | null>(null);
  const [purgeErrorMessage, setPurgeErrorMessage] = useState<string | null>(null);

  // 2FA Authenticator states
  const [is2FAActive, setIs2FAActive] = useState(false);
  const [is2FAModalOpen, setIs2FAModalOpen] = useState(false);
  const [totpSecret, setTotpSecret] = useState('');
  const [totpQrUri, setTotpQrUri] = useState('');
  const [totpVerifyCode, setTotpVerifyCode] = useState('');
  const [totpError, setTotpError] = useState<string | null>(null);
  const [isVerifying2FA, setIsVerifying2FA] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [twoFaSuccessBanner, setTwoFaSuccessBanner] = useState<string | null>(null);

  // Prepare for Launch states
  const [isLaunchModalOpen, setIsLaunchModalOpen] = useState(false);
  const [isPreparingLaunch, setIsPreparingLaunch] = useState(false);
  const [launchSuccessBanner, setLaunchSuccessBanner] = useState<string | null>(null);
  const [launchErrorMessage, setLaunchErrorMessage] = useState<string | null>(null);

  // Factory Reset to Zero states
  const [isFactoryResetModalOpen, setIsFactoryResetModalOpen] = useState(false);
  const [factoryResetConfirmText, setFactoryResetConfirmText] = useState('');
  const [isFactoryResetChecked, setIsFactoryResetChecked] = useState(false);
  const [isFactoryResetting, setIsFactoryResetting] = useState(false);
  const [factoryResetSuccessBanner, setFactoryResetSuccessBanner] = useState<string | null>(null);
  const [factoryResetErrorMessage, setFactoryResetErrorMessage] = useState<string | null>(null);

  // Initial read of 2FA state from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const is2FA = localStorage.getItem('identify_2fa_enabled') === 'true';
      setIs2FAActive(is2FA);
    }
  }, []);

  // 2FA Handlers
  const handleOpen2FAModal = async () => {
    setTotpError(null);
    setTotpVerifyCode('');
    setCopiedSecret(false);
    try {
      const res = await apiClient.setup2FA(currentUser?.id);
      setTotpSecret(res.secret);
      setTotpQrUri(res.otpauth);
      setIs2FAModalOpen(true);
    } catch {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
      let sec = '';
      for (let i = 0; i < 16; i++) sec += chars.charAt(Math.floor(Math.random() * chars.length));
      setTotpSecret(sec);
      setTotpQrUri(`otpauth://totp/iDentify:${currentUser?.email || 'admin@deped.gov.ph'}?secret=${sec}&issuer=iDentify`);
      setIs2FAModalOpen(true);
    }
  };

  const handleCopySecret = () => {
    if (totpSecret && typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(totpSecret);
      setCopiedSecret(true);
      setTimeout(() => setCopiedSecret(false), 2500);
    }
  };

  const handleVerifyAndEnable2FA = async () => {
    const cleaned = totpVerifyCode.trim();
    if (!cleaned || cleaned.length !== 6 || !/^\d{6}$/.test(cleaned)) {
      setTotpError('Please enter a valid 6-digit code from your authenticator app.');
      return;
    }
    setIsVerifying2FA(true);
    setTotpError(null);
    try {
      const res = await apiClient.enable2FA(cleaned, totpSecret, currentUser?.id);
      if (res.success) {
        setIs2FAActive(true);
        setIs2FAModalOpen(false);
        setTwoFaSuccessBanner('Two-Factor Authentication (2FA) is now ACTIVE! Authenticator TOTP will be enforced on subsequent logins.');
      } else {
        setTotpError(res.message || 'Verification failed. Please try again.');
      }
    } catch (err: any) {
      setTotpError(err?.message || 'Verification failed. Please check the code.');
    } finally {
      setIsVerifying2FA(false);
    }
  };

  const handleDisable2FA = async () => {
    try {
      await apiClient.disable2FA(currentUser?.id);
      setIs2FAActive(false);
      setTwoFaSuccessBanner('Two-Factor Authentication (2FA) has been deactivated.');
    } catch (err: any) {
      setTwoFaSuccessBanner('Failed to deactivate 2FA.');
    }
  };

  // Prepare for Launch Action
  const handleExecutePrepareForLaunch = async () => {
    setIsPreparingLaunch(true);
    setLaunchErrorMessage(null);
    try {
      const res = await apiClient.prepareForLaunch(currentRole);
      if (res.success) {
        setIsLaunchModalOpen(false);
        setLaunchSuccessBanner(res.message || 'System successfully prepared for production launch! Demo student records, tap logs, and test logins removed.');
        if (onPurgeComplete) {
          onPurgeComplete();
        }
      } else {
        setLaunchErrorMessage(res.message || 'Failed to prepare for launch.');
      }
    } catch (err: any) {
      setLaunchErrorMessage(err?.message || 'Error occurred while preparing for launch.');
    } finally {
      setIsPreparingLaunch(false);
    }
  };

  // Factory Reset to Zero Action
  const handleExecuteFactoryReset = async () => {
    if (factoryResetConfirmText.trim() !== 'FACTORY RESET ZERO' || !isFactoryResetChecked) {
      return;
    }
    setIsFactoryResetting(true);
    setFactoryResetErrorMessage(null);
    try {
      const res = await apiClient.factoryResetSystemToZero(currentRole);
      if (res.success) {
        setIsFactoryResetModalOpen(false);
        setFactoryResetConfirmText('');
        setIsFactoryResetChecked(false);
        setFactoryResetSuccessBanner(res.message || 'Factory reset to zero complete. All operational data and audit logs restored to zero. Ready for new school relaunch.');
        setSettings({
          school_name: 'New DepEd School',
          school_id: '000000',
          division: 'Division Office',
          region: 'Region Office',
          address: 'DepEd Division Office, Philippines',
          contact_number: '0900 000 0000',
          email: 'admin@deped.gov.ph',
          school_head_name: 'School Head / Principal',
          school_head_title: 'Principal I',
          logo_url: '/placeholder-photo.svg',
          sms_sender_name: 'iDentify',
          kiosk_debounce_minutes: 30,
          kiosk_display_duration_seconds: 2,
          kiosk_show_sms_status: true,
          sms_provider: 'EASYSMS',
          easysms_api_key: '',
          semaphore_api_key: '',
          philsms_api_token: '',
          parent_sms_enabled: true,
        });
        if (onPurgeComplete) {
          onPurgeComplete();
        }
      } else {
        setFactoryResetErrorMessage(res.message || 'Failed to execute factory reset.');
      }
    } catch (err: any) {
      setFactoryResetErrorMessage(err?.message || 'Error occurred during factory reset.');
    } finally {
      setIsFactoryResetting(false);
    }
  };

  const handleExecutePurge = async () => {
    if (purgeConfirmationText.trim() !== 'PURGE ALL DATA' || !isPurgeCheckboxChecked) {
      return;
    }
    setIsPurging(true);
    setPurgeErrorMessage(null);
    try {
      const res = await apiClient.purgeAllDataExceptSuperAdmin(currentRole);
      if (res.success) {
        setIsPurgeModalOpen(false);
        setPurgeConfirmationText('');
        setIsPurgeCheckboxChecked(false);
        setPurgeSuccessBanner(res.message || 'System data purged successfully! All operational records have been wiped except Super Admin.');
        if (onPurgeComplete) {
          onPurgeComplete();
        }
      } else {
        setPurgeErrorMessage(res.message || 'Failed to purge data.');
      }
    } catch (err: any) {
      setPurgeErrorMessage(err?.message || 'Error occurred during system purge.');
    } finally {
      setIsPurging(false);
    }
  };

  // Sync settings when school context loads or changes
  useEffect(() => {
    if (school) {
      setSettings((prev) => {
        // If still holding the placeholder or empty, load current school and head
        if (!prev.school_name || prev.school_name.includes('San Fernando')) {
          return {
            ...prev,
            ...getSchoolDefaults(school),
          };
        }
        return prev;
      });
    }
  }, [school]);

  const handleLoadCurrentSchoolAndHead = () => {
    const currentDefaults = getSchoolDefaults(school);
    setSettings((prev) => ({
      ...prev,
      ...currentDefaults,
    }));
    setIsLoadedNotice(true);
    setTimeout(() => setIsLoadedNotice(false), 3500);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (typeof window !== 'undefined') {
      localStorage.setItem('identify_school_settings', JSON.stringify(settings));
      window.dispatchEvent(new Event('storage'));
    }
    // Update global school tenant context in real-time
    if (setSchool && school) {
      setSchool({
        ...school,
        name: settings.school_name,
        deped_school_id: settings.school_id,
        logo_url: settings.logo_url,
        contact_phone: settings.contact_number,
        contact_email: settings.email,
        school_head_name: settings.school_head_name,
        school_head_title: settings.school_head_title,
      });
    }
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-950/60 via-slate-900 to-slate-900 border border-emerald-500/30 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
              <Building2 className="w-3.5 h-3.5 inline mr-1" /> DepEd Institutional Configuration
            </span>
            <span className="text-xs text-slate-400 font-mono">School: {school?.name || settings.school_name}</span>
          </div>
          <h2 className="text-2xl font-black text-white mt-1">School Profile &amp; Gate Settings</h2>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Configure official DepEd institutional credentials, visual color themes, school head, contact channels, and SMS gateway credentials.
          </p>
        </div>

        {isSaved && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-semibold animate-in fade-in">
            <CheckCircle className="w-4 h-4" /> Changes Saved Successfully
          </div>
        )}
      </div>

      {purgeSuccessBanner && (
        <div className="bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-500/40 rounded-2xl p-4 flex items-center justify-between gap-3 text-emerald-900 dark:text-emerald-300 text-sm shadow-sm dark:shadow-xl animate-in fade-in">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="font-medium">{purgeSuccessBanner}</span>
          </div>
          <button
            type="button"
            onClick={() => setPurgeSuccessBanner(null)}
            className="p-1 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 rounded-lg text-emerald-700 dark:text-emerald-400 hover:text-emerald-900 dark:hover:text-emerald-200 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {launchSuccessBanner && (
        <div className="bg-cyan-50 dark:bg-cyan-950/80 border border-cyan-300 dark:border-cyan-500/40 rounded-2xl p-4 flex items-center justify-between gap-3 text-cyan-900 dark:text-cyan-300 text-sm shadow-sm dark:shadow-xl animate-in fade-in">
          <div className="flex items-center gap-3">
            <Rocket className="w-5 h-5 text-cyan-600 dark:text-cyan-400 shrink-0" />
            <span className="font-medium">{launchSuccessBanner}</span>
          </div>
          <button
            type="button"
            onClick={() => setLaunchSuccessBanner(null)}
            className="p-1 hover:bg-cyan-100 dark:hover:bg-cyan-900/50 rounded-lg text-cyan-700 dark:text-cyan-400 hover:text-cyan-900 dark:hover:text-cyan-200 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {factoryResetSuccessBanner && (
        <div className="bg-rose-50 dark:bg-rose-950/80 border border-rose-300 dark:border-rose-500/40 rounded-2xl p-4 flex items-center justify-between gap-3 text-rose-900 dark:text-rose-300 text-sm shadow-sm dark:shadow-xl animate-in fade-in">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
            <span className="font-medium">{factoryResetSuccessBanner}</span>
          </div>
          <button
            type="button"
            onClick={() => setFactoryResetSuccessBanner(null)}
            className="p-1 hover:bg-rose-100 dark:hover:bg-rose-900/50 rounded-lg text-rose-700 dark:text-rose-400 hover:text-rose-900 dark:hover:text-rose-200 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {twoFaSuccessBanner && (
        <div className="bg-emerald-950/80 border border-emerald-500/40 rounded-2xl p-4 flex items-center justify-between gap-3 text-emerald-300 text-sm shadow-xl animate-in fade-in">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{twoFaSuccessBanner}</span>
          </div>
          <button
            type="button"
            onClick={() => setTwoFaSuccessBanner(null)}
            className="p-1 hover:bg-emerald-900/50 rounded-lg text-emerald-400 hover:text-emerald-200 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Card 0: Theme & Visual Appearance (6 Themes: 3 Light Modes, 3 Dark Modes) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Palette className="w-5 h-5 text-blue-400" />
                Theme &amp; Visual Appearance (6 Themes)
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Choose from 6 curated themes: 3 Light Modes (defaulting to clean Facebook colors) and 3 Dark Modes. The selected theme applies instantly across your whole session.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-400">Active Theme:</span>
              <span className="px-2.5 py-1 rounded-lg text-xs font-bold font-mono bg-blue-600/20 text-blue-400 border border-blue-500/30">
                {themeConfig.name}
              </span>
            </div>
          </div>

          {/* Section 1: 3 Light Modes */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Sun className="w-4 h-4 text-amber-400" />
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Light Modes (3 Options) &bull; Default: Facebook Classic Light
              </h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {allThemes
                .filter((t) => t.category === 'light')
                .map((t) => {
                  const isSelected = currentTheme === t.id;
                  return (
                    <div
                      key={t.id}
                      onClick={() => setTheme(t.id)}
                      className={`cursor-pointer rounded-xl border p-4 transition-all relative flex flex-col justify-between ${
                        isSelected
                          ? 'border-blue-500 bg-blue-500/10 shadow-lg ring-2 ring-blue-500'
                          : 'border-slate-800 bg-slate-950/60 hover:border-slate-700 hover:bg-slate-950'
                      }`}
                    >
                      <div>
                        {/* Mini UI Simulation Preview */}
                        <div
                          className="w-full h-16 rounded-lg mb-3 p-1.5 flex gap-1 border overflow-hidden shadow-inner"
                          style={{ backgroundColor: t.colors.bg, borderColor: t.colors.border }}
                        >
                          {/* Sidebar simulation */}
                          <div
                            className="w-1/4 h-full rounded border flex flex-col gap-1 p-1"
                            style={{ backgroundColor: t.colors.surface, borderColor: t.colors.border }}
                          >
                            <div className="w-full h-1.5 rounded" style={{ backgroundColor: t.colors.primary }} />
                            <div className="w-3/4 h-1 rounded" style={{ backgroundColor: t.colors.border }} />
                            <div className="w-1/2 h-1 rounded" style={{ backgroundColor: t.colors.border }} />
                          </div>
                          {/* Main body simulation */}
                          <div className="flex-1 flex flex-col gap-1">
                            <div
                              className="w-full h-3 rounded border flex items-center px-1"
                              style={{ backgroundColor: t.colors.surface, borderColor: t.colors.border }}
                            >
                              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: t.colors.primary }} />
                            </div>
                            <div
                              className="w-full flex-1 rounded border p-1"
                              style={{ backgroundColor: t.colors.surface, borderColor: t.colors.border }}
                            >
                              <div className="w-2/3 h-1.5 rounded mb-1" style={{ backgroundColor: t.colors.text }} />
                              <div className="w-1/3 h-1 rounded" style={{ backgroundColor: t.colors.accent }} />
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-sm text-white">{t.name}</span>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded font-mono bg-blue-900/60 text-blue-300 border border-blue-700/60">
                            {t.badge}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed mb-3">
                          {t.description}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                        {/* Swatches */}
                        <div className="flex items-center gap-1.5">
                          <div className="w-4 h-4 rounded-full border border-white/20" style={{ backgroundColor: t.colors.primary }} title="Primary" />
                          <div className="w-4 h-4 rounded-full border border-white/20" style={{ backgroundColor: t.colors.bg }} title="Canvas" />
                          <div className="w-4 h-4 rounded-full border border-white/20" style={{ backgroundColor: t.colors.surface }} title="Surface" />
                          <div className="w-4 h-4 rounded-full border border-white/20" style={{ backgroundColor: t.colors.accent }} title="Accent" />
                        </div>

                        {isSelected ? (
                          <span className="flex items-center gap-1 text-xs font-bold text-blue-400">
                            <Check className="w-3.5 h-3.5" /> Active
                          </span>
                        ) : (
                          <span className="text-xs text-slate-500 hover:text-slate-300 font-medium">
                            Select Theme
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Section 2: 3 Dark Modes */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-2">
              <Moon className="w-4 h-4 text-cyan-400" />
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Dark Modes (3 Options)
              </h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {allThemes
                .filter((t) => t.category === 'dark')
                .map((t) => {
                  const isSelected = currentTheme === t.id;
                  return (
                    <div
                      key={t.id}
                      onClick={() => setTheme(t.id)}
                      className={`cursor-pointer rounded-xl border p-4 transition-all relative flex flex-col justify-between ${
                        isSelected
                          ? 'border-blue-500 bg-blue-500/10 shadow-lg ring-2 ring-blue-500'
                          : 'border-slate-800 bg-slate-950/60 hover:border-slate-700 hover:bg-slate-950'
                      }`}
                    >
                      <div>
                        {/* Mini UI Simulation Preview */}
                        <div
                          className="w-full h-16 rounded-lg mb-3 p-1.5 flex gap-1 border overflow-hidden shadow-inner"
                          style={{ backgroundColor: t.colors.bg, borderColor: t.colors.border }}
                        >
                          {/* Sidebar simulation */}
                          <div
                            className="w-1/4 h-full rounded border flex flex-col gap-1 p-1"
                            style={{ backgroundColor: t.colors.surface, borderColor: t.colors.border }}
                          >
                            <div className="w-full h-1.5 rounded" style={{ backgroundColor: t.colors.primary }} />
                            <div className="w-3/4 h-1 rounded" style={{ backgroundColor: t.colors.border }} />
                            <div className="w-1/2 h-1 rounded" style={{ backgroundColor: t.colors.border }} />
                          </div>
                          {/* Main body simulation */}
                          <div className="flex-1 flex flex-col gap-1">
                            <div
                              className="w-full h-3 rounded border flex items-center px-1"
                              style={{ backgroundColor: t.colors.surface, borderColor: t.colors.border }}
                            >
                              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: t.colors.primary }} />
                            </div>
                            <div
                              className="w-full flex-1 rounded border p-1"
                              style={{ backgroundColor: t.colors.surface, borderColor: t.colors.border }}
                            >
                              <div className="w-2/3 h-1.5 rounded mb-1" style={{ backgroundColor: t.colors.text }} />
                              <div className="w-1/3 h-1 rounded" style={{ backgroundColor: t.colors.accent }} />
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-sm text-white">{t.name}</span>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded font-mono bg-slate-800 text-slate-300 border border-slate-700">
                            {t.badge}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed mb-3">
                          {t.description}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                        {/* Swatches */}
                        <div className="flex items-center gap-1.5">
                          <div className="w-4 h-4 rounded-full border border-white/20" style={{ backgroundColor: t.colors.primary }} title="Primary" />
                          <div className="w-4 h-4 rounded-full border border-white/20" style={{ backgroundColor: t.colors.bg }} title="Canvas" />
                          <div className="w-4 h-4 rounded-full border border-white/20" style={{ backgroundColor: t.colors.surface }} title="Surface" />
                          <div className="w-4 h-4 rounded-full border border-white/20" style={{ backgroundColor: t.colors.accent }} title="Accent" />
                        </div>

                        {isSelected ? (
                          <span className="flex items-center gap-1 text-xs font-bold text-blue-400">
                            <Check className="w-3.5 h-3.5" /> Active
                          </span>
                        ) : (
                          <span className="text-xs text-slate-500 hover:text-slate-300 font-medium">
                            Select Theme
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>

        {/* Card 1: School Identity & DepEd Identifiers */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-400" />
                Institutional Identity &amp; Accreditation
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Current active school parameters and DepEd institutional accreditation
              </p>
            </div>

            {/* Reload Current School Setting & School Head Button */}
            <button
              type="button"
              onClick={handleLoadCurrentSchoolAndHead}
              className="px-3.5 py-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 hover:text-white border border-blue-500/40 text-xs font-semibold flex items-center gap-1.5 transition self-start sm:self-auto cursor-pointer"
              title="Load current active DepEd school and school head credentials"
            >
              <RotateCcw className="w-3.5 h-3.5 text-blue-400" />
              <span>Load Current School &amp; Head</span>
            </button>
          </div>

          {/* Current School Context Banner / Notification */}
          {isLoadedNotice && (
            <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs flex items-center justify-between animate-fade-in">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-blue-400 shrink-0" />
                <span>
                  Current school settings (<strong>{school?.name || 'Sawat Elementary School'}</strong>) and school head (<strong>{school?.school_head_name || 'Dr. Rico Idos'}</strong>, {school?.school_head_title || 'Principal I'}) successfully loaded!
                </span>
              </div>
              <span className="text-[10px] font-mono text-blue-400 bg-blue-950 px-2 py-0.5 rounded border border-blue-800">
                School ID: {school?.deped_school_id || '101692'}
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Official School Name (DepEd) *
                </label>
                <input
                  type="text"
                  required
                  value={settings.school_name}
                  onChange={(e) => setSettings({ ...settings, school_name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    DepEd School ID *
                  </label>
                  <input
                    type="text"
                    required
                    value={settings.school_id}
                    onChange={(e) => setSettings({ ...settings, school_id: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm font-mono text-blue-400 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Division & Region
                  </label>
                  <input
                    type="text"
                    value={settings.division}
                    onChange={(e) => setSettings({ ...settings, division: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* School Logo Preview & Edit */}
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-slate-300">Official School Seal / Logo</label>
              <div className="flex flex-col items-center justify-center p-4 border border-dashed border-slate-700 rounded-2xl bg-slate-950">
                <img
                  src={settings.logo_url}
                  alt="School Seal"
                  className="w-24 h-24 rounded-2xl object-cover border-2 border-blue-500/40 shadow-md mb-2"
                />
                <input
                  type="text"
                  value={settings.logo_url}
                  onChange={(e) => setSettings({ ...settings, logo_url: e.target.value })}
                  placeholder="https://..."
                  className="w-full text-xs bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-300 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400" /> Complete School Campus Address
              </label>
              <input
                type="text"
                value={settings.address}
                onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" /> Landline / Mobile
                </label>
                <input
                  type="text"
                  value={settings.contact_number}
                  onChange={(e) => setSettings({ ...settings, contact_number: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" /> DepEd Official Email
                </label>
                <input
                  type="email"
                  value={settings.email}
                  onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: School Head Administration */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-indigo-400" />
              School Head &amp; Executive Signatory
            </h3>
            <span className="text-xs font-mono text-indigo-400 bg-indigo-950/60 px-2.5 py-1 rounded-lg border border-indigo-800">
              Active Plantilla Head: {school?.school_head_name || 'Dr. Rico Idos'} &bull; {school?.school_head_title || 'Principal I'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                School Head Full Name
              </label>
              <input
                type="text"
                value={settings.school_head_name}
                onChange={(e) => setSettings({ ...settings, school_head_name: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Official DepEd Plantilla Position
              </label>
              <input
                type="text"
                value={settings.school_head_title}
                onChange={(e) => setSettings({ ...settings, school_head_title: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Card 3: Gate Kiosk & Turnstile Attendance Configuration */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-cyan-400" />
                RFID Gate Kiosk &amp; Attendance Display Rules
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Configure turnstile debounce thresholds, countdown result display time, and real-time SMS status indicators
              </p>
            </div>
            <span className="text-xs font-mono text-cyan-400 bg-cyan-950/60 px-3 py-1 rounded-lg border border-cyan-800 self-start sm:self-auto">
              Subdomain: /kiosk
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 1. Display Duration in Seconds */}
            <div className="space-y-2 bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
              <label className="block text-xs font-semibold text-slate-200">
                Attendance Result Display Duration (Seconds)
              </label>
              <div className="flex flex-wrap items-center gap-3">
                <input
                  type="number"
                  min={1}
                  max={15}
                  value={settings.kiosk_display_duration_seconds}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      kiosk_display_duration_seconds: Math.max(1, Math.min(15, Number(e.target.value) || 1)),
                    })
                  }
                  className="w-24 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-base font-mono text-emerald-400 font-bold focus:outline-none focus:border-emerald-500 text-center"
                />
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 5, 8].map((sec) => (
                    <button
                      key={sec}
                      type="button"
                      onClick={() => setSettings({ ...settings, kiosk_display_duration_seconds: sec })}
                      className={`px-2.5 py-1.5 text-xs font-mono rounded-lg border transition cursor-pointer ${
                        settings.kiosk_display_duration_seconds === sec
                          ? 'bg-emerald-600 text-white border-emerald-500 font-bold shadow-md shadow-emerald-950/50'
                          : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-white hover:bg-slate-700'
                      }`}
                    >
                      {sec}s
                    </button>
                  ))}
                </div>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Duration the student photo, name, and tap feedback stay on screen before resetting to Ready to Scan. Current: <span className="text-emerald-400 font-semibold">{settings.kiosk_display_duration_seconds || 2} seconds</span>.
              </p>
            </div>

            {/* 2. SMS Dispatch Status on Kiosk Screen */}
            <div className="space-y-2 bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 flex flex-col justify-between">
              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1">
                  Kiosk SMS Dispatch Status Feedback
                </label>
                <p className="text-xs text-slate-400 leading-relaxed mb-3">
                  Toggle whether the real-time parent SMS delivery status badge is shown on the kiosk display upon scanning.
                </p>
              </div>

              <label className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 cursor-pointer transition">
                <input
                  type="checkbox"
                  checked={settings.kiosk_show_sms_status}
                  onChange={(e) => setSettings({ ...settings, kiosk_show_sms_status: e.target.checked })}
                  className="w-4 h-4 rounded border-slate-700 text-cyan-600 focus:ring-cyan-500 cursor-pointer"
                />
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
                    {settings.kiosk_show_sms_status ? 'SMS Dispatch Status Enabled' : 'SMS Dispatch Status Disabled'}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {settings.kiosk_show_sms_status
                      ? 'Shows parent phone delivery confirmation badge on scan result'
                      : 'Hides SMS dispatch indicators completely from the kiosk screen'}
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* 3. Turnstile Debounce Policy */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center pt-2 border-t border-slate-800/60">
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-300">
                Turnstile Multi-Tap Debounce &amp; Clock-Out Threshold (Minutes)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min={5}
                  max={120}
                  value={settings.kiosk_debounce_minutes}
                  onChange={(e) => setSettings({ ...settings, kiosk_debounce_minutes: Number(e.target.value) })}
                  className="w-28 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-base font-mono text-cyan-400 font-bold focus:outline-none focus:border-cyan-500"
                />
                <span className="text-xs text-slate-400">
                  Default 30 minutes. Rapid multi-taps within this period are debounced. Taps after {settings.kiosk_debounce_minutes} minutes trigger Clock-Out.
                </span>
              </div>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
              <span className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" /> High-Throughput Turnstile Protection
              </span>
              <p className="text-xs text-slate-400 leading-relaxed">
                Prevents accidental double taps in turnstile queues. Subdomain slug <code className="text-blue-400">/kiosk</code> runs independently with zero authentication required.
              </p>
            </div>
          </div>
        </div>

        {/* Card 4: SMS Notification Providers (EasySMS, Semaphore & PhilSMS) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-emerald-400" />
                DepEd Parent SMS Notification Gateways (EasySMS, Semaphore &amp; PhilSMS)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Automated gate RFID clock-in/out SMS alerts dispatched directly to parents and guardians
              </p>
            </div>

            {/* SEND TEST SMS BUTTON */}
            <button
              type="button"
              onClick={() => setShowTestModal(true)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md shadow-emerald-900/40 flex items-center gap-2 transition cursor-pointer self-start sm:self-auto"
            >
              <Send className="w-4 h-4" />
              <span>Send Test SMS</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Active SMS Gateway Provider
              </label>
              <select
                value={settings.sms_provider}
                onChange={(e) => setSettings({ ...settings, sms_provider: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="EASYSMS">Easy Send SMS (https://restapi.easysendsms.app)</option>
                <option value="SEMAPHORE">Semaphore PH (https://api.semaphore.co/api/v4)</option>
                <option value="PHILSMS">PhilSMS Gateway (https://dashboard.philsms.com/api/v3)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Sender ID / Mask
              </label>
              <input
                type="text"
                value={settings.sms_sender_name}
                onChange={(e) => setSettings({ ...settings, sms_sender_name: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Parent SMS Auto-Dispatch
              </label>
              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.parent_sms_enabled}
                    onChange={(e) => setSettings({ ...settings, parent_sms_enabled: e.target.checked })}
                    className="rounded border-slate-700 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-xs text-slate-300 font-medium">Send SMS on Gate Clock In/Out</span>
                </label>
              </div>
            </div>
          </div>

          {/* Gateway API Credentials Grid (EasySMS, Semaphore, PhilSMS) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            {/* EasySMS API Key */}
            <div className={`p-3 rounded-xl border transition ${settings.sms_provider === 'EASYSMS' ? 'border-emerald-500/50 bg-emerald-950/20' : 'border-slate-800 bg-slate-950/40'}`}>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-emerald-400" /> EasySMS API Key
                </label>
                <a
                  href="https://my.easysendsms.app/api_references"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] text-blue-400 hover:underline flex items-center gap-0.5"
                >
                  <span>Docs</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>
              <input
                type="password"
                value={settings.easysms_api_key}
                onChange={(e) => setSettings({ ...settings, easysms_api_key: e.target.value })}
                placeholder="es_live_..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-emerald-400 focus:outline-none focus:border-emerald-500"
              />
              <div className="mt-2 flex items-center justify-between">
                <span className="text-[10px] text-slate-500 font-mono">restapi.easysendsms.app</span>
                <button
                  type="button"
                  onClick={() => setShowTestModal(true)}
                  className="text-[10px] text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1"
                >
                  <Send className="w-2.5 h-2.5" /> Test EasySMS
                </button>
              </div>
            </div>

            {/* Semaphore API Key */}
            <div className={`p-3 rounded-xl border transition ${settings.sms_provider === 'SEMAPHORE' ? 'border-emerald-500/50 bg-emerald-950/20' : 'border-slate-800 bg-slate-950/40'}`}>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-emerald-400" /> Semaphore API Key
              </label>
              <input
                type="password"
                value={settings.semaphore_api_key}
                onChange={(e) => setSettings({ ...settings, semaphore_api_key: e.target.value })}
                placeholder="sem_live_..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-emerald-400 focus:outline-none focus:border-emerald-500"
              />
              <div className="mt-2 flex items-center justify-between">
                <span className="text-[10px] text-slate-500 font-mono">api.semaphore.co</span>
                <button
                  type="button"
                  onClick={() => setShowTestModal(true)}
                  className="text-[10px] text-slate-400 hover:text-white font-semibold flex items-center gap-1"
                >
                  Test
                </button>
              </div>
            </div>

            {/* PhilSMS Bearer Token */}
            <div className={`p-3 rounded-xl border transition ${settings.sms_provider === 'PHILSMS' ? 'border-emerald-500/50 bg-emerald-950/20' : 'border-slate-800 bg-slate-950/40'}`}>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-emerald-400" /> PhilSMS Bearer Token
              </label>
              <input
                type="password"
                value={settings.philsms_api_token}
                onChange={(e) => setSettings({ ...settings, philsms_api_token: e.target.value })}
                placeholder="philsms_live_..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-emerald-400 focus:outline-none focus:border-emerald-500"
              />
              <div className="mt-2 flex items-center justify-between">
                <span className="text-[10px] text-slate-500 font-mono">dashboard.philsms.com</span>
                <button
                  type="button"
                  onClick={() => setShowTestModal(true)}
                  className="text-[10px] text-slate-400 hover:text-white font-semibold flex items-center gap-1"
                >
                  Test
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Card 5: Two-Factor Authentication (2FA Authenticator) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40 flex items-center gap-1">
                  <KeyRound className="w-3 h-3" /> Security &amp; Access Controls
                </span>
                {is2FAActive ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    2FA Active (Protected)
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                    2FA Inactive (Password Only)
                  </span>
                )}
              </div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-400" />
                Two-Factor Authentication (2FA via Authenticator Apps)
              </h3>
              <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
                Enhance account security by connecting an authenticator app (Google Authenticator, Microsoft Authenticator, Authy). When enabled, portal login requires your password plus the dynamic 6-digit rolling code.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
              {!is2FAActive ? (
                <button
                  type="button"
                  onClick={handleOpen2FAModal}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md shadow-blue-900/40 flex items-center gap-2 transition"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>Connect Authenticator App</span>
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleOpen2FAModal}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Reconfigure
                  </button>
                  <button
                    type="button"
                    onClick={handleDisable2FA}
                    className="px-3.5 py-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/60 text-rose-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition"
                  >
                    <XCircle className="w-3.5 h-3.5" /> Disable 2FA
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="text-[11px] text-slate-400 flex items-center gap-2">
            <Smartphone className="w-3.5 h-3.5 text-slate-500" />
            <span>Compatible with Google Authenticator, Microsoft Authenticator, Authy, and any standard RFC 6238 TOTP client.</span>
          </div>
        </div>

        {/* Super Admin Deployment & Lifecycle Controls: Exclusively for SUPER_ADMIN */}
        {currentRole === 'SUPER_ADMIN' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/10 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 dark:border-amber-500/40 flex items-center gap-1 shadow-sm">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" /> Super Admin Operations
                </span>
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Institutional Lifecycle Management</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Prepare for Launch Card (Production Readiness) */}
              <div className="bg-gradient-to-br from-cyan-50/70 via-white to-teal-50/40 dark:from-cyan-950/40 dark:via-slate-900 dark:to-slate-900 border border-cyan-200/90 dark:border-cyan-800/50 rounded-2xl p-5 space-y-4 shadow-sm dark:shadow-xl flex flex-col justify-between transition-all">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-100 dark:bg-cyan-500/10 border border-cyan-300 dark:border-cyan-500/30 text-cyan-800 dark:text-cyan-400 text-[11px] font-bold mb-2 shadow-sm">
                    <Rocket className="w-3 h-3 text-cyan-600 dark:text-cyan-400" /> Production Readiness
                  </div>
                  <h4 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    Prepare for Production Launch
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300/80 mt-1.5 leading-relaxed">
                    Cleanses all dummy learners, demo turnstile gate tap logs, and test evaluation logins. <strong className="text-cyan-700 dark:text-cyan-300 font-semibold">Permanently removes the one-click test logins list on the login page</strong>. Preserves Super Admin master credentials and official school configurations.
                  </p>
                </div>

                <div className="pt-2 border-t border-cyan-100 dark:border-cyan-900/40 flex items-center justify-between">
                  <span className="text-[11px] text-cyan-700 dark:text-cyan-400 font-semibold flex items-center gap-1">
                    <Check className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" /> Retains Super Admin
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setLaunchErrorMessage(null);
                      setIsLaunchModalOpen(true);
                    }}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white font-bold text-xs shadow-md shadow-cyan-600/25 flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
                  >
                    <Rocket className="w-3.5 h-3.5" /> Prepare for Launch
                  </button>
                </div>
              </div>

              {/* Factory Reset to Zero Card (Genesis Reset) */}
              <div className="bg-gradient-to-br from-rose-50/80 via-white to-red-50/50 dark:from-rose-950/50 dark:via-slate-900 dark:to-rose-950/30 border border-rose-200/90 dark:border-rose-800/70 rounded-2xl p-5 space-y-4 shadow-sm dark:shadow-xl flex flex-col justify-between transition-all">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-100 dark:bg-rose-500/10 border border-rose-300 dark:border-rose-500/30 text-rose-800 dark:text-rose-400 text-[11px] font-bold mb-2 shadow-sm">
                    <RotateCcw className="w-3 h-3 text-rose-600 dark:text-rose-400" /> Irreversible Genesis Reset
                  </div>
                  <h4 className="text-base font-bold text-rose-950 dark:text-rose-200 flex items-center gap-2">
                    Factory Reset to Zero (Relaunch New School)
                  </h4>
                  <p className="text-xs text-slate-700 dark:text-rose-300/80 mt-1.5 leading-relaxed">
                    Irreversibly resets the entire platform to Genesis state (zero). Wipes every student, RFID card, gate tap, SF2 attendance, SMS log, secondary user account, and <strong className="text-rose-700 dark:text-white font-semibold">CLEARS THE AUDIT LOG BACK TO ZERO</strong>. Resets school profile to blank template so you can relaunch the app for a new school.
                  </p>
                </div>

                <div className="pt-2 border-t border-rose-100 dark:border-rose-900/40 flex items-center justify-between">
                  <span className="text-[11px] text-rose-700 dark:text-rose-300 font-semibold flex items-center gap-1">
                    <Check className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" /> Auto Audit Backup
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setFactoryResetConfirmText('');
                      setIsFactoryResetChecked(false);
                      setFactoryResetErrorMessage(null);
                      setIsFactoryResetModalOpen(true);
                    }}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 dark:bg-rose-600/30 dark:hover:bg-rose-600 border border-rose-600 dark:border-rose-500/50 text-white dark:text-rose-200 dark:hover:text-white font-bold text-xs shadow-md shadow-rose-600/20 dark:shadow-rose-950/50 flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Factory Reset System to Zero
                  </button>
                </div>
              </div>
            </div>

            {/* Danger Zone: Operational Data Purge (Retained for standard data wipe while keeping settings) */}
            <div className="bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-400 shadow-sm">
              <div className="flex items-center gap-2.5">
                <Trash2 className="w-4 h-4 text-slate-500 dark:text-slate-400 shrink-0" />
                <span>
                  <strong className="text-slate-900 dark:text-slate-200">Standard Operational Data Purge:</strong> Wipe student records &amp; attendance while keeping school profile and historical audit ledger intact.
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setPurgeConfirmationText('');
                  setIsPurgeCheckboxChecked(false);
                  setPurgeErrorMessage(null);
                  setIsPurgeModalOpen(true);
                }}
                className="px-3.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-semibold text-xs border border-slate-300 dark:border-slate-700 shrink-0 self-start sm:self-auto transition shadow-sm"
              >
                Purge Operational Data Only
              </button>
            </div>
          </div>
        )}

        {/* Submit */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-lg shadow-blue-600/30 flex items-center gap-2 transition"
          >
            <Save className="w-4 h-4" /> Save School Settings
          </button>
        </div>
      </form>

      {/* Super Admin Purge Confirmation Modal */}
      {isPurgeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/60 rounded-2xl max-w-lg w-full p-6 space-y-6 shadow-2xl text-slate-800 dark:text-slate-200">
            <div className="flex items-start justify-between gap-3 border-b border-rose-100 dark:border-rose-900/40 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Irreversible System Data Purge</h3>
                  <p className="text-xs text-rose-600 dark:text-rose-400 font-semibold">Super Administrator Exclusive Action</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => !isPurging && setIsPurgeModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                disabled={isPurging}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-700 dark:text-slate-300 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/30 rounded-xl p-4">
              <p className="font-semibold text-rose-900 dark:text-rose-300 text-sm">
                Warning: This will execute an irreversible clean wipe of:
              </p>
              <ul className="list-disc list-inside space-y-1 text-slate-700 dark:text-slate-300 pl-1">
                <li><strong className="text-slate-900 dark:text-white font-semibold">All Learners / Students</strong> and registered RFID tags</li>
                <li><strong className="text-slate-900 dark:text-white font-semibold">All Gate Logs:</strong> Every clock-in &amp; clock-out tap</li>
                <li><strong className="text-slate-900 dark:text-white font-semibold">All Attendance:</strong> Daily rolls, sessions, and SF2 monthly records</li>
                <li><strong className="text-slate-900 dark:text-white font-semibold">All SMS Records:</strong> Parent notifications and dispatch queue</li>
                <li><strong className="text-slate-900 dark:text-white font-semibold">All Secondary Users:</strong> Principals, Teachers, Staff, Admin Assistants</li>
              </ul>
              <div className="pt-2 border-t border-rose-200/80 dark:border-rose-900/30 text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
                <Check className="w-4 h-4 shrink-0" />
                <span>Super Admin master account ({currentUser?.email || 'admin@deped.gov.ph'}) will remain intact.</span>
              </div>
              <div className="text-[11px] text-sky-700 dark:text-sky-400 font-semibold flex items-center gap-1.5">
                <Check className="w-4 h-4 shrink-0" />
                <span>The immutable audit logs are backed up automatically (downloaded as JSON + saved on the server) before the purge starts.</span>
              </div>
            </div>

            {purgeErrorMessage && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
                <XCircle className="w-4 h-4 shrink-0" />
                <span>{purgeErrorMessage}</span>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Type <span className="font-mono text-rose-700 dark:text-rose-400 font-bold tracking-wider select-all">PURGE ALL DATA</span> to confirm:
                </label>
                <input
                  type="text"
                  value={purgeConfirmationText}
                  onChange={(e) => setPurgeConfirmationText(e.target.value)}
                  placeholder="PURGE ALL DATA"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-rose-500 focus:bg-white dark:focus:bg-slate-950 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white font-mono placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none transition"
                  autoFocus
                  disabled={isPurging}
                />
              </div>

              <label className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isPurgeCheckboxChecked}
                  onChange={(e) => setIsPurgeCheckboxChecked(e.target.checked)}
                  disabled={isPurging}
                  className="mt-0.5 rounded border-slate-400 dark:border-slate-700 bg-white dark:bg-slate-900 text-rose-600 focus:ring-rose-500 w-4 h-4"
                />
                <span className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                  I understand that this action is permanent and completely irrecoverable. I want to purge all data except the Super Admin account.
                </span>
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsPurgeModalOpen(false)}
                disabled={isPurging}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-transparent text-xs font-semibold transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecutePurge}
                disabled={purgeConfirmationText.trim() !== 'PURGE ALL DATA' || !isPurgeCheckboxChecked || isPurging}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-40 disabled:hover:bg-rose-600 text-white text-xs font-bold shadow-lg shadow-rose-600/30 flex items-center gap-2 transition"
              >
                {isPurging ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Purging All Data...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" /> Permanently Purge All Data
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2FA Authenticator Setup Modal */}
      {is2FAModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-6 shadow-2xl text-slate-200">
            <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
                  <KeyRound className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Connect Authenticator App</h3>
                  <p className="text-xs text-slate-400">Google Authenticator, Microsoft Authenticator, or Authy</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => !isVerifying2FA && setIs2FAModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                disabled={isVerifying2FA}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Step 1: QR & Secret */}
            <div className="space-y-3">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                Step 1: Scan QR Code or Input Secret Key
              </span>
              <div className="flex flex-col sm:flex-row items-center gap-4 bg-slate-950 p-4 rounded-xl border border-slate-800">
                <div className="p-2 bg-white rounded-xl shadow-lg shrink-0">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
                      totpQrUri || `otpauth://totp/iDentify:${currentUser?.email || 'admin@deped.gov.ph'}?secret=${totpSecret}&issuer=iDentify`
                    )}`}
                    alt="2FA QR Code"
                    className="w-32 h-32 block mx-auto"
                  />
                </div>
                <div className="space-y-2 text-xs w-full">
                  <p className="text-slate-300 font-semibold">Scan with Authenticator App</p>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    Open your app on iOS/Android, choose <span className="text-white font-medium">&quot;Scan QR code&quot;</span>, or type the secret key manually below:
                  </p>
                  <div className="pt-1">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1">Secret Key:</span>
                    <div className="flex items-center gap-2">
                      <code className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-amber-400 font-mono text-xs select-all flex-1 text-center font-bold tracking-wider">
                        {totpSecret || 'JBSWY3DPEHPK3PXP'}
                      </code>
                      <button
                        type="button"
                        onClick={handleCopySecret}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1 border border-slate-700 transition"
                      >
                        {copiedSecret ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-400">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2: Verification Code */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                Step 2: Enter 6-Digit Code from App
              </label>
              <input
                type="text"
                maxLength={6}
                value={totpVerifyCode}
                onChange={(e) => setTotpVerifyCode(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-4 py-3 text-center text-xl font-mono text-white tracking-[0.3em] placeholder:text-slate-600 focus:outline-none"
                autoFocus
                disabled={isVerifying2FA}
              />
              <span className="text-[11px] text-slate-400 block text-center">
                Enter the temporary rolling 6-digit number displayed in your authenticator app.
              </span>
            </div>

            {totpError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                <XCircle className="w-4 h-4 shrink-0" />
                <span>{totpError}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIs2FAModalOpen(false)}
                disabled={isVerifying2FA}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleVerifyAndEnable2FA}
                disabled={totpVerifyCode.trim().length !== 6 || isVerifying2FA}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-40 text-white text-xs font-bold shadow-lg shadow-blue-600/30 flex items-center gap-2 transition"
              >
                {isVerifying2FA ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Verifying...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5" /> Verify &amp; Activate 2FA
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Prepare for Production Launch Modal */}
      {isLaunchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-cyan-200 dark:border-cyan-800/60 rounded-2xl max-w-lg w-full p-6 space-y-6 shadow-2xl text-slate-800 dark:text-slate-200">
            <div className="flex items-start justify-between gap-3 border-b border-cyan-100 dark:border-cyan-900/40 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-600 dark:text-cyan-400 shrink-0">
                  <Rocket className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Prepare for Production Launch</h3>
                  <p className="text-xs text-cyan-700 dark:text-cyan-400 font-semibold">Remove Test Data &amp; Suppress Test Accounts</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => !isPreparingLaunch && setIsLaunchModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                disabled={isPreparingLaunch}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-700 dark:text-slate-300 bg-cyan-50 dark:bg-cyan-950/20 border border-cyan-200 dark:border-cyan-900/30 rounded-xl p-4">
              <p className="font-semibold text-cyan-900 dark:text-cyan-300 text-sm">
                This action prepares the platform for production school deployment:
              </p>
              <ul className="list-disc list-inside space-y-1.5 text-slate-700 dark:text-slate-300 pl-1">
                <li><strong className="text-slate-900 dark:text-white font-semibold">Removes All Demo Students:</strong> Deletes sample learners, test PSA entries, and dummy RFID assignments.</li>
                <li><strong className="text-slate-900 dark:text-white font-semibold">Clears Demo Gate Logs:</strong> Wipes all simulated clock-in &amp; clock-out RFID turnstile taps.</li>
                <li><strong className="text-slate-900 dark:text-white font-semibold">Clears Demo Attendance:</strong> Wipes classroom roll-call sessions and sample SF2 entries.</li>
                <li><strong className="text-slate-900 dark:text-white font-semibold">Removes One-Click Logins:</strong> Suppresses and permanently hides the test accounts button list on the login page.</li>
                <li><strong className="text-slate-900 dark:text-white font-semibold">Cleanses Test Secondary Logins:</strong> Purges evaluation teacher/principal credentials.</li>
              </ul>
              <div className="pt-2 border-t border-cyan-200/80 dark:border-cyan-900/30 text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
                <Check className="w-4 h-4 shrink-0" />
                <span>Super Admin master account ({currentUser?.email || 'admin@deped.gov.ph'}) and official institutional settings are preserved.</span>
              </div>
            </div>

            {launchErrorMessage && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
                <XCircle className="w-4 h-4 shrink-0" />
                <span>{launchErrorMessage}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsLaunchModalOpen(false)}
                disabled={isPreparingLaunch}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-transparent text-xs font-semibold transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecutePrepareForLaunch}
                disabled={isPreparingLaunch}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-cyan-600/30 flex items-center gap-2 transition"
              >
                {isPreparingLaunch ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Preparing Launch...
                  </>
                ) : (
                  <>
                    <Rocket className="w-3.5 h-3.5" /> Confirm &amp; Launch System
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Factory Reset to Zero (Relaunch New School - Genesis) Modal */}
      {isFactoryResetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/70 rounded-2xl max-w-lg w-full p-6 space-y-6 shadow-2xl text-slate-800 dark:text-slate-200">
            <div className="flex items-start justify-between gap-3 border-b border-rose-100 dark:border-rose-900/40 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
                  <RotateCcw className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Factory Reset System to Zero</h3>
                  <p className="text-xs text-rose-600 dark:text-rose-400 font-semibold">Genesis Reset for New School Relaunch</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => !isFactoryResetting && setIsFactoryResetModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                disabled={isFactoryResetting}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-700 dark:text-slate-300 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/30 rounded-xl p-4">
              <p className="font-semibold text-rose-900 dark:text-rose-300 text-sm">
                Severe Warning: Irreversible Platform Reset to Zero
              </p>
              <ul className="list-disc list-inside space-y-1.5 text-slate-700 dark:text-slate-300 pl-1">
                <li><strong className="text-slate-900 dark:text-white font-semibold">All Learners / Students:</strong> Completely wiped out.</li>
                <li><strong className="text-slate-900 dark:text-white font-semibold">All Gate Logs &amp; Attendance:</strong> Every turnstile tap, SF2 record, and roll call wiped.</li>
                <li><strong className="text-slate-900 dark:text-white font-semibold">All SMS Logs:</strong> Parent SMS queues and notification history wiped.</li>
                <li><strong className="text-slate-900 dark:text-white font-semibold">All Secondary Users:</strong> Principals, Teachers, Staff accounts wiped.</li>
                <li><strong className="text-rose-700 dark:text-rose-400 font-bold">Immutable Audit Log Ledger:</strong> Restored back to zero (0 entries).</li>
                <li><strong className="text-slate-900 dark:text-white font-semibold">School Profile Reset:</strong> Reset to a clean unconfigured template for new school deployment.</li>
              </ul>
              <div className="pt-2 border-t border-rose-200/80 dark:border-rose-900/30 text-[11px] text-sky-700 dark:text-sky-400 font-semibold flex items-center gap-1.5">
                <Check className="w-4 h-4 shrink-0" />
                <span>An immutable JSON backup of the audit log is downloaded automatically before zeroing out.</span>
              </div>
              <div className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
                <Check className="w-4 h-4 shrink-0" />
                <span>Super Admin master credentials ({currentUser?.email || 'admin@deped.gov.ph'}) will remain intact.</span>
              </div>
            </div>

            {factoryResetErrorMessage && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
                <XCircle className="w-4 h-4 shrink-0" />
                <span>{factoryResetErrorMessage}</span>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Type <span className="font-mono text-rose-700 dark:text-rose-400 font-bold tracking-wider select-all">FACTORY RESET ZERO</span> to confirm:
                </label>
                <input
                  type="text"
                  value={factoryResetConfirmText}
                  onChange={(e) => setFactoryResetConfirmText(e.target.value)}
                  placeholder="FACTORY RESET ZERO"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-rose-500 focus:bg-white dark:focus:bg-slate-950 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white font-mono placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none transition"
                  autoFocus
                  disabled={isFactoryResetting}
                />
              </div>

              <label className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isFactoryResetChecked}
                  onChange={(e) => setIsFactoryResetChecked(e.target.checked)}
                  disabled={isFactoryResetting}
                  className="mt-0.5 rounded border-slate-400 dark:border-slate-700 bg-white dark:bg-slate-900 text-rose-600 focus:ring-rose-500 w-4 h-4"
                />
                <span className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                  I understand that this action will delete all test data, clear the audit logs back to zero, and restore the app back to zero for relaunching to a new school.
                </span>
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsFactoryResetModalOpen(false)}
                disabled={isFactoryResetting}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-transparent text-xs font-semibold transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteFactoryReset}
                disabled={factoryResetConfirmText.trim() !== 'FACTORY RESET ZERO' || !isFactoryResetChecked || isFactoryResetting}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-40 disabled:hover:bg-rose-600 text-white text-xs font-bold shadow-lg shadow-rose-600/30 flex items-center gap-2 transition"
              >
                {isFactoryResetting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Resetting to Zero...
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-3.5 h-3.5" /> Irreversibly Reset to Zero
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Test SMS Modal */}
      <TestSmsModal
        isOpen={showTestModal}
        onClose={() => setShowTestModal(false)}
        defaultProvider={settings.sms_provider}
        defaultApiKey={
          settings.sms_provider === 'EASYSMS'
            ? settings.easysms_api_key
            : settings.sms_provider === 'SEMAPHORE'
            ? settings.semaphore_api_key
            : settings.philsms_api_token
        }
        defaultSenderName={settings.sms_sender_name}
      />
    </div>
  );
}

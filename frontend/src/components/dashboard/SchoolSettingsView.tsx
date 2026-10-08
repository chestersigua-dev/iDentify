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
  Lock,
  Upload,
  Camera,
  GraduationCap,
  BookOpen,
  Layers,
  Sliders,
} from 'lucide-react';
import { useTheme } from '@/lib/theme-context';
import { useTenant } from '@/lib/tenant-context';
import { 
  apiClient, 
  ALL_DEPED_GRADE_LEVELS, 
  ELEMENTARY_GRADE_LEVELS, 
  HIGH_SCHOOL_GRADE_LEVELS, 
  INTEGRATED_GRADE_LEVELS, 
  SchoolClassification 
} from '@/lib/api';
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
    school_type: (s?.school_type as SchoolClassification) || 'ELEMENTARY',
    enabled_grade_levels: s?.enabled_grade_levels && s.enabled_grade_levels.length > 0 ? s.enabled_grade_levels : ELEMENTARY_GRADE_LEVELS,
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
      school_type: 'ELEMENTARY' as SchoolClassification,
      enabled_grade_levels: ELEMENTARY_GRADE_LEVELS as string[],
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
              school_type: (parsed.school_type as SchoolClassification) || 'ELEMENTARY',
              enabled_grade_levels: Array.isArray(parsed.enabled_grade_levels) && parsed.enabled_grade_levels.length > 0
                ? parsed.enabled_grade_levels
                : ELEMENTARY_GRADE_LEVELS,
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

  // RBAC Institutional Permissions: Super Admin & School Head (Principal)
  const isSuperAdmin = currentRole === 'SUPER_ADMIN';
  const isPrincipal = currentRole === 'PRINCIPAL';
  const canEditInstitutional = isSuperAdmin || isPrincipal;

  // Logo File Upload states
  const logoFileInputRef = React.useRef<HTMLInputElement>(null);
  const [logoUploadError, setLogoUploadError] = useState<string | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isDraggingLogo, setIsDraggingLogo] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveErrorMessage, setSaveErrorMessage] = useState<string | null>(null);

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

  const handleProcessLogoFile = (file: File) => {
    if (!file) return;

    if (!file.type.startsWith('image/') && !file.name.toLowerCase().endsWith('.svg')) {
      setLogoUploadError('Please select a valid image file (PNG, JPG, SVG, WebP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setLogoUploadError('Logo file size exceeds 5MB limit. Please choose a smaller image.');
      return;
    }

    setLogoUploadError(null);
    setIsUploadingLogo(true);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setSettings((prev) => ({ ...prev, logo_url: reader.result as string }));
        setIsUploadingLogo(false);
      }
    };
    reader.onerror = () => {
      setLogoUploadError('Failed to read logo image. Please try again.');
      setIsUploadingLogo(false);
    };
    reader.readAsDataURL(file);
  };

  const handleLogoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleProcessLogoFile(file);
    }
  };

  const handleLogoDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingLogo(false);
    if (!canEditInstitutional) return;
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleProcessLogoFile(file);
    }
  };

  const handleLoadCurrentSchoolAndHead = () => {
    const currentDefaults = getSchoolDefaults(school);
    setSettings((prev) => ({
      ...prev,
      ...currentDefaults,
    }));
    setIsLoadedNotice(true);
    setTimeout(() => setIsLoadedNotice(false), 3500);
  };

  // Grade Level Offerings Handlers
  const handleSelectPreset = (preset: 'ELEMENTARY' | 'HIGH_SCHOOL' | 'INTEGRATED') => {
    if (!canEditInstitutional) return;
    if (preset === 'ELEMENTARY') {
      setSettings((prev) => ({
        ...prev,
        school_type: 'ELEMENTARY',
        enabled_grade_levels: [...ELEMENTARY_GRADE_LEVELS],
      }));
    } else if (preset === 'HIGH_SCHOOL') {
      setSettings((prev) => ({
        ...prev,
        school_type: 'HIGH_SCHOOL',
        enabled_grade_levels: [...HIGH_SCHOOL_GRADE_LEVELS],
      }));
    } else if (preset === 'INTEGRATED') {
      setSettings((prev) => ({
        ...prev,
        school_type: 'INTEGRATED',
        enabled_grade_levels: [...INTEGRATED_GRADE_LEVELS],
      }));
    }
  };

  const handleToggleGrade = (grade: string) => {
    if (!canEditInstitutional) return;
    const currentList = settings.enabled_grade_levels || [];
    let updated: string[];
    if (currentList.includes(grade)) {
      if (currentList.length <= 1) {
        alert('At least one grade level must remain active for enrollment.');
        return;
      }
      updated = currentList.filter((g) => g !== grade);
    } else {
      updated = [...currentList, grade];
    }

    // Determine classification
    let computedType: SchoolClassification = 'CUSTOM';
    const isExactElem =
      updated.length === ELEMENTARY_GRADE_LEVELS.length &&
      ELEMENTARY_GRADE_LEVELS.every((g) => updated.includes(g));
    const isExactHS =
      updated.length === HIGH_SCHOOL_GRADE_LEVELS.length &&
      HIGH_SCHOOL_GRADE_LEVELS.every((g) => updated.includes(g));
    const isExactIntegrated =
      updated.length === INTEGRATED_GRADE_LEVELS.length &&
      INTEGRATED_GRADE_LEVELS.every((g) => updated.includes(g));

    if (isExactElem) computedType = 'ELEMENTARY';
    else if (isExactHS) computedType = 'HIGH_SCHOOL';
    else if (isExactIntegrated) computedType = 'INTEGRATED';

    setSettings((prev) => ({
      ...prev,
      school_type: computedType,
      enabled_grade_levels: updated,
    }));
  };

  const handleEnableAllGrades = () => {
    if (!canEditInstitutional) return;
    setSettings((prev) => ({
      ...prev,
      school_type: 'INTEGRATED',
      enabled_grade_levels: [...INTEGRATED_GRADE_LEVELS],
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEditInstitutional) {
      setSaveErrorMessage('Unauthorized: Only Super Administrator and School Head (Principal) can modify institutional identity and accreditation settings.');
      return;
    }

    setIsSaving(true);
    setSaveErrorMessage(null);

    // 1. Persist to browser LocalStorage for offline durability
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('identify_school_settings', JSON.stringify(settings));
        window.dispatchEvent(new Event('storage'));
      } catch (err) {
        console.error('Failed to save to localStorage:', err);
      }
    }

    // 2. Persist to backend API if school exists
    if (school?.id) {
      try {
        await apiClient.updateSchool(
          school.id,
          {
            name: settings.school_name,
            deped_school_id: settings.school_id,
            logo_url: settings.logo_url,
            contact_phone: settings.contact_number,
            contact_email: settings.email,
            school_head_name: settings.school_head_name,
            school_head_title: settings.school_head_title,
            division: settings.division,
            region: settings.region,
            school_type: settings.school_type,
            enabled_grade_levels: settings.enabled_grade_levels,
          },
          currentRole,
        );
      } catch (err) {
        console.warn('Backend updateSchool sync notice:', err);
      }
    }

    // 3. Update global school tenant context in real-time
    if (setSchool && school) {
      setSchool({
        ...school,
        name: settings.school_name,
        short_name: settings.school_name ? (settings.school_name.length > 20 ? settings.school_name.substring(0, 18) + '...' : settings.school_name) : school.short_name,
        deped_school_id: settings.school_id,
        logo_url: settings.logo_url,
        contact_phone: settings.contact_number,
        contact_email: settings.email,
        school_head_name: settings.school_head_name,
        school_head_title: settings.school_head_title,
        division: settings.division,
        region: settings.region,
        school_type: settings.school_type,
        enabled_grade_levels: settings.enabled_grade_levels,
      });
    }

    setIsSaving(false);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3500);
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
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-blue-400" />
                  Institutional Identity &amp; Accreditation
                </h3>
                {canEditInstitutional ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center gap-1 shadow-sm">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    Editable by Super Admin &amp; School Head
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center gap-1 shadow-sm">
                    <Lock className="w-3 h-3 text-amber-400" />
                    Read-Only (Super Admin / School Head required)
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Official DepEd institutional parameters, accreditation identifiers, contact channels, and official seal
              </p>
            </div>

            {/* Reload Current School Setting & School Head Button */}
            {canEditInstitutional && (
              <button
                type="button"
                onClick={handleLoadCurrentSchoolAndHead}
                className="px-3.5 py-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 hover:text-white border border-blue-500/40 text-xs font-semibold flex items-center gap-1.5 transition self-start sm:self-auto cursor-pointer"
                title="Load current active DepEd school and school head credentials"
              >
                <RotateCcw className="w-3.5 h-3.5 text-blue-400" />
                <span>Load Current School &amp; Head</span>
              </button>
            )}
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
                  disabled={!canEditInstitutional}
                  value={settings.school_name}
                  onChange={(e) => setSettings({ ...settings, school_name: e.target.value })}
                  placeholder="e.g. Sawat Elementary School"
                  className="w-full bg-slate-950 border border-slate-800 disabled:opacity-60 disabled:cursor-not-allowed rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition"
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
                    disabled={!canEditInstitutional}
                    value={settings.school_id}
                    onChange={(e) => setSettings({ ...settings, school_id: e.target.value })}
                    placeholder="101692"
                    className="w-full bg-slate-950 border border-slate-800 disabled:opacity-60 disabled:cursor-not-allowed rounded-xl px-4 py-2.5 text-sm font-mono text-blue-400 focus:outline-none focus:border-blue-500 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Division &amp; Region
                  </label>
                  <input
                    type="text"
                    disabled={!canEditInstitutional}
                    value={settings.division}
                    onChange={(e) => setSettings({ ...settings, division: e.target.value })}
                    placeholder="Division of Pangasinan II • Region I"
                    className="w-full bg-slate-950 border border-slate-800 disabled:opacity-60 disabled:cursor-not-allowed rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition"
                  />
                </div>
              </div>
            </div>

            {/* School Logo Preview, File Upload & URL Editor */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-blue-400" /> Official School Seal / Logo
                </label>
                {settings.logo_url && settings.logo_url !== '/logos/sawat.png' && canEditInstitutional && (
                  <button
                    type="button"
                    onClick={() => setSettings({ ...settings, logo_url: '/logos/sawat.png' })}
                    className="text-[10px] text-slate-400 hover:text-blue-300 hover:underline transition cursor-pointer"
                    title="Reset to default Sawat Elementary seal"
                  >
                    Reset Default
                  </button>
                )}
              </div>

              {/* Hidden file picker input */}
              <input
                ref={logoFileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
                onChange={handleLogoFileUpload}
                disabled={!canEditInstitutional || isUploadingLogo}
                className="hidden"
              />

              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  if (canEditInstitutional) setIsDraggingLogo(true);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  setIsDraggingLogo(false);
                }}
                onDrop={handleLogoDrop}
                className={`flex flex-col items-center justify-center p-4 border rounded-2xl bg-slate-950 transition-all ${
                  isDraggingLogo
                    ? 'border-blue-500 bg-blue-950/40 ring-2 ring-blue-500/40'
                    : 'border-dashed border-slate-700 hover:border-slate-600'
                }`}
              >
                {/* Logo Image Preview with Hover Overlay */}
                <div className="relative group mb-3">
                  <img
                    src={settings.logo_url || '/logos/sawat.png'}
                    alt="Official School Seal"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = '/logos/sawat.png';
                    }}
                    className="w-24 h-24 rounded-2xl object-cover border-2 border-blue-500/40 shadow-lg bg-slate-900"
                  />
                  {canEditInstitutional && (
                    <button
                      type="button"
                      onClick={() => logoFileInputRef.current?.click()}
                      className="absolute inset-0 bg-slate-950/80 opacity-0 group-hover:opacity-100 rounded-2xl flex flex-col items-center justify-center gap-1 text-white transition-opacity cursor-pointer border border-blue-400/50"
                      title="Upload new school seal image"
                    >
                      <Camera className="w-5 h-5 text-blue-400" />
                      <span className="text-[10px] font-bold">Replace Logo</span>
                    </button>
                  )}
                </div>

                {/* Upload Button */}
                {canEditInstitutional ? (
                  <div className="flex flex-col items-center gap-1.5 w-full">
                    <button
                      type="button"
                      onClick={() => logoFileInputRef.current?.click()}
                      disabled={isUploadingLogo}
                      className="w-full px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-98 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-md shadow-blue-950/40 transition cursor-pointer disabled:opacity-50"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>{isUploadingLogo ? 'Processing...' : 'Upload School Logo'}</span>
                    </button>
                    <span className="text-[10px] text-slate-400 text-center">
                      PNG, JPG, SVG, WebP up to 5MB
                    </span>
                  </div>
                ) : (
                  <span className="text-[10px] text-slate-500 text-center font-medium">
                    Upload locked (Super Admin or School Head required)
                  </span>
                )}

                {/* Upload Error Banner */}
                {logoUploadError && (
                  <div className="mt-2 text-[11px] text-rose-400 bg-rose-950/40 border border-rose-800/60 rounded-lg px-2.5 py-1 text-center w-full">
                    {logoUploadError}
                  </div>
                )}

                {/* URL Input Fallback */}
                <div className="w-full mt-3 pt-3 border-t border-slate-800/80">
                  <label className="block text-[10px] font-medium text-slate-400 mb-1">
                    Or Direct Image URL / Path:
                  </label>
                  <input
                    type="text"
                    value={settings.logo_url}
                    onChange={(e) => setSettings({ ...settings, logo_url: e.target.value })}
                    disabled={!canEditInstitutional}
                    placeholder="/logos/sawat.png"
                    className="w-full text-xs bg-slate-900 border border-slate-800 disabled:opacity-60 disabled:cursor-not-allowed rounded-lg px-2.5 py-1.5 text-slate-300 focus:outline-none focus:border-blue-500"
                  />
                </div>
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
                disabled={!canEditInstitutional}
                value={settings.address}
                onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                placeholder="Sawat, Urbiztondo, Pangasinan 2414"
                className="w-full bg-slate-950 border border-slate-800 disabled:opacity-60 disabled:cursor-not-allowed rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" /> Landline / Mobile
                </label>
                <input
                  type="text"
                  disabled={!canEditInstitutional}
                  value={settings.contact_number}
                  onChange={(e) => setSettings({ ...settings, contact_number: e.target.value })}
                  placeholder="0905 669 1862"
                  className="w-full bg-slate-950 border border-slate-800 disabled:opacity-60 disabled:cursor-not-allowed rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" /> DepEd Official Email
                </label>
                <input
                  type="email"
                  disabled={!canEditInstitutional}
                  value={settings.email}
                  onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                  placeholder="sawatelementaryschool@gmail.com"
                  className="w-full bg-slate-950 border border-slate-800 disabled:opacity-60 disabled:cursor-not-allowed rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: School Head Administration */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-indigo-400" />
                School Head &amp; Executive Signatory
              </h3>
              {canEditInstitutional ? (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/40 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-indigo-400" /> Authorized Signatory
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-800 text-slate-400 border border-slate-700 flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Read-Only
                </span>
              )}
            </div>
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
                disabled={!canEditInstitutional}
                value={settings.school_head_name}
                onChange={(e) => setSettings({ ...settings, school_head_name: e.target.value })}
                placeholder="Dr. Rico Idos"
                className="w-full bg-slate-950 border border-slate-800 disabled:opacity-60 disabled:cursor-not-allowed rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Official DepEd Plantilla Position
              </label>
              <input
                type="text"
                disabled={!canEditInstitutional}
                value={settings.school_head_title}
                onChange={(e) => setSettings({ ...settings, school_head_title: e.target.value })}
                placeholder="Principal I"
                className="w-full bg-slate-950 border border-slate-800 disabled:opacity-60 disabled:cursor-not-allowed rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition"
              />
            </div>
          </div>
        </div>

        {/* Card 2: Enrollment Grade Level Offerings & School Scope */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-emerald-400" />
                  Enrollment Grade Level Offerings &amp; School Scope
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1 shadow-sm">
                  {settings.school_type === 'ELEMENTARY' && 'Elementary Only (K-6)'}
                  {settings.school_type === 'HIGH_SCHOOL' && 'High School Only (7-12)'}
                  {settings.school_type === 'INTEGRATED' && 'Integrated School (K-12)'}
                  {settings.school_type === 'CUSTOM' && 'Custom Scope'}
                </span>
                <span className="text-[10px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                  {settings.enabled_grade_levels?.length || 0} of {ALL_DEPED_GRADE_LEVELS.length} Grades Active
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Enable or disable grade levels offered for enrollment. Public enrollees on the DepEd enrollment form (<code className="text-emerald-400">/enroll</code>) will only see active grade offerings.
              </p>
            </div>

            {canEditInstitutional && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleEnableAllGrades}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                  title="Enable all DepEd grade levels (K through 12)"
                >
                  <Layers className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Select All (K-12)</span>
                </button>
              </div>
            )}
          </div>

          {/* Quick Selection Presets */}
          <div className="space-y-3">
            <label className="block text-xs font-semibold text-slate-300">
              Quick School Classification Presets
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Preset 1: Elementary Only */}
              <button
                type="button"
                disabled={!canEditInstitutional}
                onClick={() => handleSelectPreset('ELEMENTARY')}
                className={`p-4 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer disabled:cursor-not-allowed ${
                  settings.school_type === 'ELEMENTARY'
                    ? 'bg-emerald-950/40 border-emerald-500/60 ring-2 ring-emerald-500/30'
                    : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  {settings.school_type === 'ELEMENTARY' && (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-800">
                      <Check className="w-3 h-3" /> Selected
                    </span>
                  )}
                </div>
                <div>
                  <div className="text-sm font-bold text-white mb-0.5">Elementary School Only</div>
                  <div className="text-xs text-slate-400">Kindergarten to Grade 6</div>
                  <div className="mt-2 text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-900/60 inline-block">
                    7 Grade Offerings
                  </div>
                </div>
              </button>

              {/* Preset 2: High School Only */}
              <button
                type="button"
                disabled={!canEditInstitutional}
                onClick={() => handleSelectPreset('HIGH_SCHOOL')}
                className={`p-4 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer disabled:cursor-not-allowed ${
                  settings.school_type === 'HIGH_SCHOOL'
                    ? 'bg-blue-950/40 border-blue-500/60 ring-2 ring-blue-500/30'
                    : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  {settings.school_type === 'HIGH_SCHOOL' && (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-blue-400 bg-blue-950 px-2 py-0.5 rounded-full border border-blue-800">
                      <Check className="w-3 h-3" /> Selected
                    </span>
                  )}
                </div>
                <div>
                  <div className="text-sm font-bold text-white mb-0.5">High School Only</div>
                  <div className="text-xs text-slate-400">Junior (7-10) &amp; Senior (11-12)</div>
                  <div className="mt-2 text-[10px] font-mono text-blue-400 bg-blue-950/80 px-2 py-0.5 rounded border border-blue-900/60 inline-block">
                    6 Grade Offerings
                  </div>
                </div>
              </button>

              {/* Preset 3: Integrated School */}
              <button
                type="button"
                disabled={!canEditInstitutional}
                onClick={() => handleSelectPreset('INTEGRATED')}
                className={`p-4 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer disabled:cursor-not-allowed ${
                  settings.school_type === 'INTEGRATED'
                    ? 'bg-purple-950/40 border-purple-500/60 ring-2 ring-purple-500/30'
                    : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400">
                    <Layers className="w-4 h-4" />
                  </div>
                  {settings.school_type === 'INTEGRATED' && (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-purple-400 bg-purple-950 px-2 py-0.5 rounded-full border border-purple-800">
                      <Check className="w-3 h-3" /> Selected
                    </span>
                  )}
                </div>
                <div>
                  <div className="text-sm font-bold text-white mb-0.5">Integrated School</div>
                  <div className="text-xs text-slate-400">Complete Basic Ed (K to 12)</div>
                  <div className="mt-2 text-[10px] font-mono text-purple-400 bg-purple-950/80 px-2 py-0.5 rounded border border-purple-900/60 inline-block">
                    All 13 Grade Offerings
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Granular Key Stage Grade Level Toggle Matrix */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-300">
                Granular Grade Level Offerings (Click to Toggle)
              </label>
              <span className="text-[11px] text-slate-400">
                {canEditInstitutional ? 'Toggle specific grades offered by your institution' : 'View-only mode'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Elementary Stages */}
              <div className="bg-slate-950/70 border border-slate-800/90 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                    <BookOpen className="w-4 h-4" />
                    Elementary Key Stages (K to Grade 6)
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">
                    {ELEMENTARY_GRADE_LEVELS.filter((g) => settings.enabled_grade_levels?.includes(g)).length} / 7 active
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {ELEMENTARY_GRADE_LEVELS.map((grade) => {
                    const isEnabled = settings.enabled_grade_levels?.includes(grade);
                    return (
                      <button
                        key={grade}
                        type="button"
                        disabled={!canEditInstitutional}
                        onClick={() => handleToggleGrade(grade)}
                        className={`flex items-center justify-between p-2.5 rounded-lg border text-xs font-medium transition cursor-pointer disabled:cursor-not-allowed ${
                          isEnabled
                            ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200 shadow-sm'
                            : 'bg-slate-900/60 border-slate-800 text-slate-500 hover:border-slate-700'
                        }`}
                      >
                        <span className="font-semibold">{grade}</span>
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                            isEnabled
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold'
                              : 'bg-slate-800 text-slate-500 border border-slate-700'
                          }`}
                        >
                          {isEnabled ? 'Enrolling' : 'Disabled'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* High School Stages */}
              <div className="bg-slate-950/70 border border-slate-800/90 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-blue-400">
                    <GraduationCap className="w-4 h-4" />
                    High School Stages (Grades 7 to 12)
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">
                    {HIGH_SCHOOL_GRADE_LEVELS.filter((g) => settings.enabled_grade_levels?.includes(g)).length} / 6 active
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {HIGH_SCHOOL_GRADE_LEVELS.map((grade) => {
                    const isEnabled = settings.enabled_grade_levels?.includes(grade);
                    const isSHS = grade === 'Grade 11' || grade === 'Grade 12';
                    return (
                      <button
                        key={grade}
                        type="button"
                        disabled={!canEditInstitutional}
                        onClick={() => handleToggleGrade(grade)}
                        className={`flex items-center justify-between p-2.5 rounded-lg border text-xs font-medium transition cursor-pointer disabled:cursor-not-allowed ${
                          isEnabled
                            ? isSHS
                              ? 'bg-purple-950/40 border-purple-500/50 text-purple-200 shadow-sm'
                              : 'bg-blue-950/40 border-blue-500/50 text-blue-200 shadow-sm'
                            : 'bg-slate-900/60 border-slate-800 text-slate-500 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex flex-col text-left">
                          <span className="font-semibold">{grade}</span>
                          <span className="text-[9px] text-slate-400">
                            {isSHS ? 'Senior High (SHS)' : 'Junior High (JHS)'}
                          </span>
                        </div>
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                            isEnabled
                              ? isSHS
                                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 font-bold'
                                : 'bg-blue-500/20 text-blue-300 border border-blue-500/40 font-bold'
                              : 'bg-slate-800 text-slate-500 border border-slate-700'
                          }`}
                        >
                          {isEnabled ? 'Enrolling' : 'Disabled'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Real-time enrollment interoperability note */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400 flex items-start gap-2.5">
            <Sliders className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-200">Interoperability Active: </span>
              Selected grade levels are immediately applied to the public DepEd enrollment form at <code className="text-emerald-400">/enroll</code>.
              Applicants will only be presented with the {settings.enabled_grade_levels?.length || 0} active grade levels enabled above.
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
        {currentRole === 'SUPER_ADMIN' ? (
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
        ) : (
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700/60 flex items-center justify-center text-slate-400 shrink-0">
                <Lock className="w-5 h-5 text-slate-400" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  System Lifecycle &amp; Irreversible Purge Tasks
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Super Admin Exclusive
                  </span>
                </h4>
                <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                  Only Super Administrators can perform system lifecycle tasks, such as factory reset to zero, production launch preparation, and cascading operational data purges.
                </p>
              </div>
            </div>
            <span className="text-xs text-slate-500 font-mono bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 self-start sm:self-auto shrink-0">
              Active Role: {currentRole || 'PRINCIPAL'}
            </span>
          </div>
        )}

        {/* Submit Section */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-slate-800/80">
          <div>
            {saveErrorMessage && (
              <div className="text-xs text-rose-400 bg-rose-950/40 border border-rose-800/50 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>{saveErrorMessage}</span>
              </div>
            )}
            {!canEditInstitutional && (
              <p className="text-xs text-amber-400/90 flex items-center gap-1.5 font-medium">
                <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                Institutional settings modification requires Super Administrator or School Head credentials.
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={!canEditInstitutional || isSaving}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm shadow-lg shadow-blue-600/30 flex items-center gap-2 transition active:scale-98 cursor-pointer self-end sm:self-auto"
          >
            {isSaving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" /> Saving Settings...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" /> Save School Settings
              </>
            )}
          </button>
        </div>
      </form>

      {/* Super Admin Purge Confirmation Modal */}
      {isPurgeModalOpen && (
        <div className="fixed inset-0 z-50 glass-modal-backdrop bg-slate-950/60 backdrop-blur-xl flex items-center justify-center p-4 overflow-y-auto">
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
        <div className="fixed inset-0 z-50 glass-modal-backdrop bg-slate-950/60 backdrop-blur-xl flex items-center justify-center p-4 overflow-y-auto">
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
        <div className="fixed inset-0 z-50 glass-modal-backdrop bg-slate-950/60 backdrop-blur-xl flex items-center justify-center p-4 overflow-y-auto">
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
        <div className="fixed inset-0 z-50 glass-modal-backdrop bg-slate-950/60 backdrop-blur-xl flex items-center justify-center p-4 overflow-y-auto">
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

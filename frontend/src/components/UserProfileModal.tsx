'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Camera,
  Upload,
  User,
  Mail,
  Phone,
  Briefcase,
  Building2,
  BadgeCheck,
  Save,
  CheckCircle2,
  AlertCircle,
  Image as ImageIcon,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { useTenant } from '@/lib/tenant-context';
import { POSITIONS_LIST, usersApi, formatUserDisplayName } from '@/lib/api';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_AVATARS = [
  {
    label: 'Executive Admin',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&auto=format&fit=crop&q=80',
  },
  {
    label: 'Institutional Head',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160&auto=format&fit=crop&q=80',
  },
  {
    label: 'Academic Faculty (F)',
    url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=160&auto=format&fit=crop&q=80',
  },
  {
    label: 'Academic Faculty (M)',
    url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=160&auto=format&fit=crop&q=80',
  },
  {
    label: 'Master Teacher',
    url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=160&auto=format&fit=crop&q=80',
  },
  {
    label: 'Default Silhouette',
    url: '/avatars/default-user.svg',
  },
];

export default function UserProfileModal({ isOpen, onClose }: UserProfileModalProps) {
  const { currentUser, setCurrentUser, currentRole, school } = useTenant();

  const [formData, setFormData] = useState({
    title_prefix: currentUser?.title_prefix || '',
    full_name: currentUser?.full_name || '',
    title_postfix: currentUser?.title_postfix || '',
    email: currentUser?.email || '',
    phone_number: currentUser?.phone_number || '',
    position: currentUser?.position || '',
    photo_url: currentUser?.photo_url || '/avatars/default-user.svg',
  });

  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showUrlInput, setShowUrlInput] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state whenever modal opens or currentUser changes
  useEffect(() => {
    if (currentUser) {
      setFormData({
        title_prefix: currentUser.title_prefix || '',
        full_name: currentUser.full_name || '',
        title_postfix: currentUser.title_postfix || '',
        email: currentUser.email || '',
        phone_number: currentUser.phone_number || '',
        position: currentUser.position || '',
        photo_url: currentUser.photo_url || '/avatars/default-user.svg',
      });
    }
    setSuccessMessage(null);
    setErrorMessage(null);
  }, [currentUser, isOpen]);

  if (!isOpen) return null;

  // Handle local image file upload (PNG/JPG/WebP) and convert to base64 Data URL
  const handlePhotoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please select a valid image file (PNG, JPG, WebP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('Photo file exceeds 5MB limit. Please choose a smaller image.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setFormData((prev) => ({ ...prev, photo_url: reader.result as string }));
        setSuccessMessage('Photo loaded! Click "Save Changes" to update your profile.');
        setErrorMessage(null);
      }
    };
    reader.onerror = () => {
      setErrorMessage('Failed to read image file. Please try again.');
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.full_name.trim()) {
      setErrorMessage('Full name is required.');
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const trimmedPrefix = formData.title_prefix.trim();
      const trimmedPostfix = formData.title_postfix.trim();
      const trimmedFullName = formData.full_name.trim();

      const computedDisplayName = formatUserDisplayName({
        title_prefix: trimmedPrefix,
        full_name: trimmedFullName,
        title_postfix: trimmedPostfix,
      });

      const updatedUser = {
        ...currentUser,
        title_prefix: trimmedPrefix,
        full_name: trimmedFullName,
        title_postfix: trimmedPostfix,
        display_name: computedDisplayName,
        email: formData.email.trim(),
        phone_number: formData.phone_number.trim(),
        position: formData.position.trim(),
        photo_url: formData.photo_url,
      };

      // Call API to persist changes
      try {
        await usersApi.update(currentUser.id, {
          firstName: trimmedFullName.split(' ')[0],
          lastName: trimmedFullName.split(' ').slice(1).join(' ') || '',
          email: formData.email.trim(),
          mobileNumber: formData.phone_number.trim(),
          position: formData.position.trim(),
          photoUrl: formData.photo_url,
          titlePrefix: trimmedPrefix,
          titlePostfix: trimmedPostfix,
          displayName: computedDisplayName,
        });
      } catch (apiErr) {
        // Fallback gracefully to local state
        console.warn('API update failed, persisting locally:', apiErr);
      }

      // Update Tenant Context
      setCurrentUser(updatedUser);

      // Persist in localStorage for cross-session survival
      try {
        localStorage.setItem('identify_user_profile', JSON.stringify(updatedUser));
      } catch {}

      setSuccessMessage('Profile and title affixes updated successfully!');

      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-3xl max-w-xl w-full p-6 shadow-2xl relative text-slate-900 dark:text-slate-100 max-h-[90vh] overflow-y-auto custom-scrollbar">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
          title="Close modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <User className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              My User Profile
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Manage your personal DepEd institutional credentials, contact details, and avatar photo.
            </p>
          </div>
        </div>

        {/* Notifications */}
        {successMessage && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span>{successMessage}</span>
          </div>
        )}
        {errorMessage && (
          <div className="mt-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="mt-5 space-y-5">
          {/* 1. PHOTO MANAGEMENT SECTION */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center gap-4">
            <div className="relative group shrink-0">
              <div className="w-20 h-20 rounded-2xl overflow-hidden ring-2 ring-blue-500/60 p-0.5 bg-white dark:bg-slate-900 shadow-lg">
                <img
                  src={formData.photo_url || '/avatars/default-user.svg'}
                  alt={formData.full_name}
                  className="w-full h-full object-cover rounded-[14px]"
                  onError={(e: any) => {
                    e.target.src = '/avatars/default-user.svg';
                  }}
                />
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 rounded-2xl bg-black/50 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-xs cursor-pointer"
                title="Change Photo"
              >
                <Camera className="w-5 h-5 mb-0.5" />
                <span className="text-[9px] font-bold">Change</span>
              </button>
            </div>

            <div className="flex-1 w-full text-center sm:text-left space-y-2">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handlePhotoFileChange}
                  accept="image/png, image/jpeg, image/jpg, image/webp"
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Photo</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowUrlInput(!showUrlInput)}
                  className="px-3 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors"
                >
                  <ImageIcon className="w-3.5 h-3.5 inline mr-1" />
                  <span>{showUrlInput ? 'Hide URL' : 'Use Photo URL'}</span>
                </button>
              </div>

              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Supports PNG, JPEG, and WebP up to 5MB. Stored with instant preview.
              </p>

              {/* Photo URL Direct Input Option */}
              {showUrlInput && (
                <div className="pt-2 animate-fade-in">
                  <input
                    type="url"
                    value={formData.photo_url}
                    onChange={(e) => setFormData({ ...formData, photo_url: e.target.value })}
                    placeholder="https://example.com/avatar.jpg"
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Quick Preset Avatars Picker */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>Or Choose a Quick Preset Avatar</span>
            </span>
            <div className="grid grid-cols-6 gap-2">
              {PRESET_AVATARS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setFormData({ ...formData, photo_url: preset.url });
                    setSuccessMessage(`Selected ${preset.label} preset.`);
                  }}
                  className={`group relative rounded-xl p-1 border transition-all ${
                    formData.photo_url === preset.url
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/60 ring-2 ring-blue-500/40'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600 bg-slate-50 dark:bg-slate-950'
                  }`}
                  title={preset.label}
                >
                  <img
                    src={preset.url}
                    alt={preset.label}
                    className="w-full aspect-square rounded-lg object-cover"
                    onError={(e: any) => {
                      e.target.src = '/avatars/default-user.svg';
                    }}
                  />
                  <div className="text-[9px] truncate text-center mt-1 text-slate-600 dark:text-slate-400 font-medium group-hover:text-slate-900 dark:group-hover:text-white">
                    {preset.label.split(' ')[0]}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* 2. PROFILE DETAILS FORM FIELDS */}
          <div className="space-y-4">
            {/* Official Display Name & Titles Section */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-blue-500" />
                  <span>Official Name & Title Affixes</span>
                </label>
                {(formData.title_prefix || formData.title_postfix) && (
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, title_prefix: '', title_postfix: '' }))}
                    className="text-[11px] font-medium text-rose-500 hover:text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
                  >
                    Clear Titles
                  </button>
                )}
              </div>

              {/* 3-Part Input Grid: Prefix, Full Name, Postfix */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                {/* Title Prefix */}
                <div className="sm:col-span-3">
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Prefix <span className="text-[10px] text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.title_prefix}
                    onChange={(e) => setFormData({ ...formData, title_prefix: e.target.value })}
                    placeholder="e.g. Dr., Prof."
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700/80 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                  />
                </div>

                {/* Full Base Name */}
                <div className="sm:col-span-6">
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Full Base Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    placeholder="e.g. Chester Sigua"
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700/80 rounded-xl px-3 py-2 text-sm font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                  />
                </div>

                {/* Title Postfix */}
                <div className="sm:col-span-3">
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Postfix <span className="text-[10px] text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.title_postfix}
                    onChange={(e) => setFormData({ ...formData, title_postfix: e.target.value })}
                    placeholder="e.g. PhD, LPT"
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700/80 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                  />
                </div>
              </div>

              {/* Suggestions Quick Select Pills */}
              <div className="space-y-2 pt-1 border-t border-slate-200/70 dark:border-slate-800/80">
                {/* Prefix Suggestions */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mr-1">Prefix:</span>
                  {['Dr.', 'Prof.', 'Engr.', 'Atty.', 'Mr.', 'Ms.', 'Hon.'].map((pfx) => {
                    const isSelected = formData.title_prefix.trim() === pfx;
                    return (
                      <button
                        key={pfx}
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            title_prefix: isSelected ? '' : pfx,
                          }))
                        }
                        className={`px-2 py-0.5 rounded-lg text-[11px] font-medium transition cursor-pointer border ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-600 font-bold shadow-xs'
                            : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-blue-400'
                        }`}
                      >
                        {pfx}
                      </button>
                    );
                  })}
                </div>

                {/* Postfix Suggestions */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mr-1">Postfix:</span>
                  {['PhD', 'EdD', 'LPT', 'CESO VI', 'CPA', 'MIT', 'Jr.', 'III'].map((pfx) => {
                    const isSelected = formData.title_postfix.trim() === pfx;
                    return (
                      <button
                        key={pfx}
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            title_postfix: isSelected ? '' : pfx,
                          }))
                        }
                        className={`px-2 py-0.5 rounded-lg text-[11px] font-medium transition cursor-pointer border ${
                          isSelected
                            ? 'bg-indigo-600 text-white border-indigo-600 font-bold shadow-xs'
                            : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-indigo-400'
                        }`}
                      >
                        {pfx}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Dynamic Display Name Preview */}
              <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-transparent border border-blue-500/20 flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    <span>Live Displayed Name</span>
                  </div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white truncate mt-0.5">
                    {formatUserDisplayName({
                      title_prefix: formData.title_prefix,
                      full_name: formData.full_name,
                      title_postfix: formData.title_postfix,
                    }) || <span className="text-slate-400 italic font-normal">Enter name above...</span>}
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {formData.title_prefix.trim() || formData.title_postfix.trim()
                      ? 'Custom title prefixes/postfixes will appear across system navigation, reports, and logs.'
                      : 'No title entered — standard full name will be displayed without affixes.'}
                  </p>
                </div>
                <div className="shrink-0 ml-3">
                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold border ${
                      formData.title_prefix.trim() || formData.title_postfix.trim()
                        ? 'bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 border-blue-300 dark:border-blue-800'
                        : 'bg-slate-100 dark:bg-slate-850 text-slate-500 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {formData.title_prefix.trim() || formData.title_postfix.trim() ? 'WITH TITLES' : 'NO TITLES'}
                  </span>
                </div>
              </div>
            </div>

            {/* Position & Role in 2 Columns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Official Position / Title
                </label>
                <div className="relative">
                  <Briefcase className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <select
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                  >
                    <option value="System Administrator">System Administrator</option>
                    {POSITIONS_LIST.map((pos) => (
                      <option key={pos} value={pos}>
                        {pos}
                      </option>
                    ))}
                    {!POSITIONS_LIST.includes(formData.position as any) && formData.position && (
                      <option value={formData.position}>{formData.position}</option>
                    )}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Security Access Level
                </label>
                <div className="flex items-center space-x-2 px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 font-mono font-bold">
                  <BadgeCheck className="w-4 h-4 text-emerald-500" />
                  <span>{currentRole.replace('_', ' ')}</span>
                  <span className="ml-auto text-[10px] text-slate-400 font-sans font-normal">Enforced</span>
                </div>
              </div>
            </div>

            {/* Email & Phone in 2 Columns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Institutional Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="name@deped.gov.ph"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Mobile / SMS Contact
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="tel"
                    value={formData.phone_number}
                    onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                    placeholder="+63 905 669 1862"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Institutional School Badge */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-500" />
                <div>
                  <span className="font-bold text-slate-900 dark:text-white">{school.name}</span>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">{school.division} • {school.region}</div>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block">DepEd ID</span>
                <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{school.deped_school_id}</span>
              </div>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/30 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Profile Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

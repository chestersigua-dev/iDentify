'use client';

import React, { useState, useRef } from 'react';
import {
  SchoolWebsiteConfig,
  SchoolPhotoItem,
  SchoolAnnouncementItem,
  getDefaultSchoolWebsiteConfig,
} from '@/lib/school-website-defaults';
import { School } from '@/lib/api';
import {
  X,
  Sparkles,
  Image as ImageIcon,
  Type,
  Plus,
  Trash2,
  Upload,
  Check,
  RotateCcw,
  Palette,
  FileText,
  User,
  Phone,
  Layers,
  Save,
  Eye,
  Sliders,
  ExternalLink,
} from 'lucide-react';

interface WixWebsiteCustomizerProps {
  isOpen: boolean;
  onClose: () => void;
  config: SchoolWebsiteConfig;
  onSaveConfig: (updated: SchoolWebsiteConfig) => void;
  activeSchool?: School | null;
}

const PRESET_ACCENT_COLORS = [
  { name: 'DepEd Royal Blue', value: '#2563eb' },
  { name: 'Emerald Green', value: '#059669' },
  { name: 'Pangasinan Teal', value: '#0d9488' },
  { name: 'Imperial Indigo', value: '#4f46e5' },
  { name: 'Golden Amber', value: '#d97706' },
  { name: 'DepEd Crimson', value: '#dc2626' },
];

export default function WixWebsiteCustomizer({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  activeSchool,
}: WixWebsiteCustomizerProps) {
  const [activeTab, setActiveTab] = useState<'branding' | 'hero' | 'photos' | 'about' | 'announcements' | 'contact'>('branding');
  const [draft, setDraft] = useState<SchoolWebsiteConfig>(config);
  const [saveFeedback, setSaveFeedback] = useState<boolean>(false);

  // File upload refs
  const logoFileRef = useRef<HTMLInputElement>(null);
  const heroFileRef = useRef<HTMLInputElement>(null);
  const newPhotoFileRef = useRef<HTMLInputElement>(null);

  // New Photo modal state
  const [newPhotoUrl, setNewPhotoUrl] = useState<string>('');
  const [newPhotoTitle, setNewPhotoTitle] = useState<string>('');
  const [newPhotoCategory, setNewPhotoCategory] = useState<'Campus' | 'Academic' | 'Events' | 'Facilities'>('Campus');
  const [newPhotoDesc, setNewPhotoDesc] = useState<string>('');
  const [showAddPhotoForm, setShowAddPhotoForm] = useState<boolean>(false);

  // New Announcement modal state
  const [newAnnTitle, setNewAnnTitle] = useState<string>('');
  const [newAnnDate, setNewAnnDate] = useState<string>('SY 2025–2026');
  const [newAnnBadge, setNewAnnBadge] = useState<string>('Important');
  const [newAnnContent, setNewAnnContent] = useState<string>('');
  const [showAddAnnForm, setShowAddAnnForm] = useState<boolean>(false);

  // Reset draft if config changes
  React.useEffect(() => {
    setDraft(config);
  }, [config, isOpen]);

  if (!isOpen) return null;

  // Handle image upload as base64
  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    onComplete: (dataUrl: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (PNG, JPG, WebP, SVG).');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onComplete(reader.result);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSave = () => {
    onSaveConfig(draft);
    setSaveFeedback(true);
    setTimeout(() => setSaveFeedback(false), 2500);
  };

  const handleResetDefaults = () => {
    if (confirm('Reset this school website to DepEd default institutional template? All custom text and added photos will be restored to defaults.')) {
      const def = getDefaultSchoolWebsiteConfig(activeSchool);
      setDraft(def);
      onSaveConfig(def);
      setSaveFeedback(true);
      setTimeout(() => setSaveFeedback(false), 2500);
    }
  };

  // Photo handlers
  const handleAddPhoto = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPhotoUrl && !newPhotoTitle) {
      alert('Please provide a photo image or upload a photo.');
      return;
    }

    const newPhoto: SchoolPhotoItem = {
      id: 'photo-' + Date.now(),
      url: newPhotoUrl || '/gallery/campus-banner.jpg',
      title: newPhotoTitle || 'Campus Photo',
      category: newPhotoCategory,
      description: newPhotoDesc,
    };

    setDraft((prev) => ({
      ...prev,
      photos: [newPhoto, ...prev.photos],
    }));

    setNewPhotoUrl('');
    setNewPhotoTitle('');
    setNewPhotoDesc('');
    setShowAddPhotoForm(false);
  };

  const handleDeletePhoto = (id: string) => {
    setDraft((prev) => ({
      ...prev,
      photos: prev.photos.filter((p) => p.id !== id),
    }));
  };

  // Announcement handlers
  const handleAddAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnnTitle || !newAnnContent) return;

    const newAnn: SchoolAnnouncementItem = {
      id: 'ann-' + Date.now(),
      title: newAnnTitle,
      date: newAnnDate,
      badge: newAnnBadge,
      content: newAnnContent,
    };

    setDraft((prev) => ({
      ...prev,
      announcements: [newAnn, ...prev.announcements],
    }));

    setNewAnnTitle('');
    setNewAnnContent('');
    setShowAddAnnForm(false);
  };

  const handleDeleteAnnouncement = (id: string) => {
    setDraft((prev) => ({
      ...prev,
      announcements: prev.announcements.filter((a) => a.id !== id),
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      {/* Hidden file inputs */}
      <input
        ref={logoFileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) =>
          handleFileUpload(e, (dataUrl) => setDraft((prev) => ({ ...prev, logo_url: dataUrl })))
        }
      />
      <input
        ref={heroFileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) =>
          handleFileUpload(e, (dataUrl) => setDraft((prev) => ({ ...prev, hero_bg_image: dataUrl })))
        }
      />
      <input
        ref={newPhotoFileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) =>
          handleFileUpload(e, (dataUrl) => {
            setNewPhotoUrl(dataUrl);
            if (!newPhotoTitle) setNewPhotoTitle('Uploaded Campus Photo');
          })
        }
      />

      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden text-slate-100">
        {/* Editor Header Bar */}
        <div className="p-5 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-600/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-black text-white">Wix-Style Website Builder</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40">
                  Live School CMS
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Customizing public landing page for{' '}
                <strong className="text-white">{draft.hero_title}</strong> (DepEd ID: {draft.deped_school_id})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {saveFeedback && (
              <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1 animate-pulse">
                <Check className="w-4 h-4" /> Changes Applied!
              </span>
            )}
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-xs font-bold text-white shadow-md shadow-blue-600/30 flex items-center gap-1.5 transition cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save &amp; Publish</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
              title="Close Customizer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-5 border-b border-slate-800 bg-slate-950/40 flex items-center gap-2 overflow-x-auto py-2.5 custom-scrollbar text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('branding')}
            className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'branding'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>Identity &amp; Logo</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('hero')}
            className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'hero'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Type className="w-3.5 h-3.5" />
            <span>Hero Showcase &amp; Title</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('photos')}
            className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'photos'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Campus Photos ({draft.photos.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('about')}
            className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'about'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>DepEd Mission &amp; Principal</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('announcements')}
            className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'announcements'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Bulletin &amp; News</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('contact')}
            className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'contact'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Phone className="w-3.5 h-3.5" />
            <span>Contact &amp; Stats</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6 text-sm">
          {/* TAB 1: IDENTITY & LOGO */}
          {activeTab === 'branding' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Logo Editor Card */}
                <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                      Official School Seal / Logo
                    </label>
                    <span className="text-[10px] text-slate-500">Square SVG/PNG</span>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 rounded-2xl bg-slate-900 border-2 border-blue-500/30 p-1 flex items-center justify-center shrink-0 overflow-hidden shadow-inner">
                      <img
                        src={draft.logo_url}
                        alt="Logo Preview"
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = '/logos/sawat.png';
                        }}
                      />
                    </div>
                    <div className="space-y-2 flex-1">
                      <button
                        type="button"
                        onClick={() => logoFileRef.current?.click()}
                        className="w-full px-3 py-2 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 hover:text-white border border-blue-500/40 text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload Logo File</span>
                      </button>
                      <input
                        type="text"
                        value={draft.logo_url}
                        onChange={(e) => setDraft({ ...draft, logo_url: e.target.value })}
                        placeholder="Or enter image URL (/logos/sawat.png)"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Accent Color Picker */}
                <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-5 space-y-4">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                    Institutional Theme Accent Color
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {PRESET_ACCENT_COLORS.map((c) => (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => setDraft({ ...draft, accent_color: c.value })}
                        className={`p-2.5 rounded-xl border flex items-center gap-2.5 text-xs font-medium transition cursor-pointer ${
                          draft.accent_color === c.value
                            ? 'bg-slate-850 border-white/40 ring-2 ring-white/20'
                            : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <span className="w-4 h-4 rounded-full border border-white/20 shrink-0" style={{ backgroundColor: c.value }} />
                        <span className="truncate">{c.name}</span>
                        {draft.accent_color === c.value && <Check className="w-3.5 h-3.5 ml-auto text-emerald-400" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* DepEd Identifiers */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 mb-1 block">Official DepEd School ID</label>
                  <input
                    type="text"
                    value={draft.deped_school_id}
                    onChange={(e) => setDraft({ ...draft, deped_school_id: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 mb-1 block">DepEd Division</label>
                  <input
                    type="text"
                    value={draft.deped_division}
                    onChange={(e) => setDraft({ ...draft, deped_division: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 mb-1 block">DepEd Region</label>
                  <input
                    type="text"
                    value={draft.deped_region}
                    onChange={(e) => setDraft({ ...draft, deped_region: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: HERO SHOWCASE & TITLE */}
          {activeTab === 'hero' && (
            <div className="space-y-5">
              <div>
                <label className="text-xs font-bold text-slate-300 mb-1.5 block">
                  Official School Name / Main Website Title *
                </label>
                <input
                  type="text"
                  value={draft.hero_title}
                  onChange={(e) => setDraft({ ...draft, hero_title: e.target.value })}
                  placeholder="e.g. Sawat Elementary School"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 mb-1.5 block">
                  School Motto &amp; Tagline
                </label>
                <input
                  type="text"
                  value={draft.hero_tagline}
                  onChange={(e) => setDraft({ ...draft, hero_tagline: e.target.value })}
                  placeholder="e.g. Molding Lifelong Filipino Learners with Excellence"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 mb-1.5 block">
                  Hero Welcome Description
                </label>
                <textarea
                  rows={3}
                  value={draft.hero_description}
                  onChange={(e) => setDraft({ ...draft, hero_description: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-blue-500 leading-relaxed"
                />
              </div>

              {/* Hero Background Banner */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                    Hero Showcase Banner Photo
                  </label>
                  <span className="text-[10px] text-slate-400">16:9 Landscape recommended</span>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 items-center">
                  <div className="w-full sm:w-48 h-28 rounded-xl bg-slate-900 border border-slate-800 overflow-hidden shrink-0 relative group">
                    <img src={draft.hero_bg_image} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="space-y-2 flex-1 w-full">
                    <button
                      type="button"
                      onClick={() => heroFileRef.current?.click()}
                      className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer w-full sm:w-auto"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload Banner Photo</span>
                    </button>
                    <input
                      type="text"
                      value={draft.hero_bg_image}
                      onChange={(e) => setDraft({ ...draft, hero_bg_image: e.target.value })}
                      placeholder="Or photo URL (/gallery/campus-banner.jpg)"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CAMPUS PHOTOS & GALLERY */}
          {activeTab === 'photos' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">Campus Photo Gallery</h3>
                  <p className="text-xs text-slate-400">
                    Add high-quality campus, classroom, athletic, and school activity photos
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowAddPhotoForm(true)}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-md shadow-emerald-600/30 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add School Photo</span>
                </button>
              </div>

              {/* Add Photo Form Card */}
              {showAddPhotoForm && (
                <form
                  onSubmit={handleAddPhoto}
                  className="bg-slate-950 border border-emerald-500/40 rounded-2xl p-4 space-y-3 animate-fade-in"
                >
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                      <ImageIcon className="w-4 h-4" /> Add New Photo to Gallery
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowAddPhotoForm(false)}
                      className="text-slate-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">Photo Title *</label>
                      <input
                        type="text"
                        required
                        value={newPhotoTitle}
                        onChange={(e) => setNewPhotoTitle(e.target.value)}
                        placeholder="e.g. Science Laboratory Experiment"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">Category</label>
                      <select
                        value={newPhotoCategory}
                        onChange={(e) => setNewPhotoCategory(e.target.value as any)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                      >
                        <option value="Campus">Campus &amp; Grounds</option>
                        <option value="Academic">Academic &amp; Classroom</option>
                        <option value="Events">Events &amp; Sports</option>
                        <option value="Facilities">Facilities &amp; Library</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">Photo Image Source</label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => newPhotoFileRef.current?.click()}
                        className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white flex items-center gap-1.5 shrink-0 transition cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload File</span>
                      </button>
                      <input
                        type="text"
                        value={newPhotoUrl}
                        onChange={(e) => setNewPhotoUrl(e.target.value)}
                        placeholder="Or paste image URL (/gallery/... or https://...)"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    {newPhotoUrl && (
                      <div className="mt-2 w-32 h-20 rounded-lg overflow-hidden border border-slate-700 bg-slate-900">
                        <img src={newPhotoUrl} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">Description / Caption</label>
                    <input
                      type="text"
                      value={newPhotoDesc}
                      onChange={(e) => setNewPhotoDesc(e.target.value)}
                      placeholder="Brief note about the photo"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddPhotoForm(false)}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/30"
                    >
                      Add Photo
                    </button>
                  </div>
                </form>
              )}

              {/* Photo List Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {draft.photos.map((p) => (
                  <div
                    key={p.id}
                    className="bg-slate-950/80 border border-slate-800 rounded-2xl overflow-hidden group hover:border-slate-700 transition"
                  >
                    <div className="h-36 bg-slate-900 relative overflow-hidden">
                      <img src={p.url} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-slate-950/80 text-white backdrop-blur border border-slate-700">
                        {p.category}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDeletePhoto(p.id)}
                        className="absolute top-2 right-2 p-1.5 rounded-lg bg-rose-600/80 hover:bg-rose-600 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Delete photo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="p-3">
                      <div className="font-bold text-xs text-white truncate">{p.title}</div>
                      {p.description && <div className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">{p.description}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: DEPED MISSION & PRINCIPAL */}
          {activeTab === 'about' && (
            <div className="space-y-5">
              <div>
                <label className="text-xs font-bold text-slate-300 mb-1.5 block">Official DepEd Mission Statement</label>
                <textarea
                  rows={3}
                  value={draft.mission_text}
                  onChange={(e) => setDraft({ ...draft, mission_text: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-blue-500 leading-relaxed"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 mb-1.5 block">Official DepEd Vision Statement</label>
                <textarea
                  rows={3}
                  value={draft.vision_text}
                  onChange={(e) => setDraft({ ...draft, vision_text: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-blue-500 leading-relaxed"
                />
              </div>

              {/* Principal Message */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-3">
                <div className="font-bold text-xs text-white uppercase tracking-wider flex items-center gap-2">
                  <User className="w-4 h-4 text-blue-400" />
                  School Head (Principal) Welcome Message
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">Principal Name</label>
                    <input
                      type="text"
                      value={draft.principal_name}
                      onChange={(e) => setDraft({ ...draft, principal_name: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">Official Plantilla Title</label>
                    <input
                      type="text"
                      value={draft.principal_title}
                      onChange={(e) => setDraft({ ...draft, principal_title: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Message from the Principal</label>
                  <textarea
                    rows={4}
                    value={draft.principal_message}
                    onChange={(e) => setDraft({ ...draft, principal_message: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-blue-500 leading-relaxed"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: BULLETIN & ANNOUNCEMENTS */}
          {activeTab === 'announcements' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">School Bulletin Board</h3>
                  <p className="text-xs text-slate-400">Post announcements for enrollment, assemblies, and safety advisories</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddAnnForm(true)}
                  className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 transition shadow cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Announcement</span>
                </button>
              </div>

              {showAddAnnForm && (
                <form
                  onSubmit={handleAddAnnouncement}
                  className="bg-slate-950 border border-blue-500/40 rounded-2xl p-4 space-y-3 animate-fade-in"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="text-xs font-semibold text-slate-300 block mb-1">Headline *</label>
                      <input
                        type="text"
                        required
                        value={newAnnTitle}
                        onChange={(e) => setNewAnnTitle(e.target.value)}
                        placeholder="e.g. Schedule for First Grading Card Giving"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">Badge Tag</label>
                      <input
                        type="text"
                        value={newAnnBadge}
                        onChange={(e) => setNewAnnBadge(e.target.value)}
                        placeholder="Advisory / Academic / Event"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">Announcement Body *</label>
                    <textarea
                      rows={3}
                      required
                      value={newAnnContent}
                      onChange={(e) => setNewAnnContent(e.target.value)}
                      placeholder="Detailed announcement content..."
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowAddAnnForm(false)}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold"
                    >
                      Post Announcement
                    </button>
                  </div>
                </form>
              )}

              <div className="space-y-3">
                {draft.announcements.map((a) => (
                  <div
                    key={a.id}
                    className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-start justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40">
                          {a.badge}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">{a.date}</span>
                      </div>
                      <h4 className="text-sm font-bold text-white">{a.title}</h4>
                      <p className="text-xs text-slate-400 leading-relaxed">{a.content}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteAnnouncement(a.id)}
                      className="p-2 rounded-xl bg-slate-900 hover:bg-rose-950 text-slate-400 hover:text-rose-400 transition"
                      title="Remove"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: CONTACT & STATS */}
          {activeTab === 'contact' && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 mb-1 block">Enrolled Learners</label>
                  <input
                    type="text"
                    value={draft.stat_students}
                    onChange={(e) => setDraft({ ...draft, stat_students: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 mb-1 block">Certified Faculty</label>
                  <input
                    type="text"
                    value={draft.stat_teachers}
                    onChange={(e) => setDraft({ ...draft, stat_teachers: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 mb-1 block">Classrooms</label>
                  <input
                    type="text"
                    value={draft.stat_classrooms}
                    onChange={(e) => setDraft({ ...draft, stat_classrooms: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 mb-1 block">Turnstile Attendance</label>
                  <input
                    type="text"
                    value={draft.stat_attendance_rate}
                    onChange={(e) => setDraft({ ...draft, stat_attendance_rate: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 mb-1 block">Official School Address</label>
                <input
                  type="text"
                  value={draft.address}
                  onChange={(e) => setDraft({ ...draft, address: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 mb-1 block">Contact Phone / Mobile</label>
                  <input
                    type="text"
                    value={draft.contact_phone}
                    onChange={(e) => setDraft({ ...draft, contact_phone: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 mb-1 block">Contact Email</label>
                  <input
                    type="email"
                    value={draft.contact_email}
                    onChange={(e) => setDraft({ ...draft, contact_email: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to DepEd Defaults</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/30 flex items-center gap-1.5 transition cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Publish Changes</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTenant } from '@/lib/tenant-context';
import { School, getSchoolEnabledGrades } from '@/lib/api';
import IdentifyLogo from '@/components/IdentifyLogo';
import { CopyrightNotice } from '@/components/CopyrightNotice';
import SchoolInfoModal from '@/components/SchoolInfoModal';
import WixWebsiteCustomizer from '@/components/landing/WixWebsiteCustomizer';
import {
  SchoolWebsiteConfig,
  SchoolPhotoItem,
  loadSchoolWebsiteConfig,
  saveSchoolWebsiteConfig,
} from '@/lib/school-website-defaults';
import {
  ShieldCheck,
  Building2,
  QrCode,
  Layers,
  FileSpreadsheet,
  ArrowRight,
  Sparkles,
  School as SchoolIcon,
  CheckCircle2,
  Lock,
  ExternalLink,
  Info,
  Calendar,
  Phone,
  Mail,
  MapPin,
  GraduationCap,
  Users,
  Award,
  BookOpen,
  Image as ImageIcon,
  Heart,
  ChevronRight,
  Sliders,
  Edit3,
  Plus,
  Maximize2,
  X,
  Compass,
} from 'lucide-react';

export default function SchoolWebsiteLandingPage() {
  const { school, availableSchools, setSchool } = useTenant();

  // Website Configuration state (customizable via Wix-like editor)
  const [siteConfig, setSiteConfig] = useState<SchoolWebsiteConfig>(() =>
    loadSchoolWebsiteConfig(school)
  );

  // Reload config when tenant school changes
  useEffect(() => {
    setSiteConfig(loadSchoolWebsiteConfig(school));
  }, [school]);

  // Wix-Style Editor Modal
  const [isEditorOpen, setIsEditorOpen] = useState<boolean>(false);

  // Gallery filter & lightbox
  const [activePhotoCategory, setActivePhotoCategory] = useState<string>('ALL');
  const [lightboxPhoto, setLightboxPhoto] = useState<SchoolPhotoItem | null>(null);

  // School Switcher & Info Modal
  const [selectedSchoolForModal, setSelectedSchoolForModal] = useState<School | null>(null);

  // Save handler for editor
  const handleSaveConfig = (updated: SchoolWebsiteConfig) => {
    setSiteConfig(updated);
    saveSchoolWebsiteConfig(school?.id || 'default', updated);
  };

  // Filtered photos
  const filteredPhotos = siteConfig.photos.filter((p) => {
    if (activePhotoCategory === 'ALL') return true;
    return p.category === activePhotoCategory;
  });

  const enabledGrades = getSchoolEnabledGrades(school);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-blue-600 selection:text-white">
      {/* ------------------------------------------------------------- */}
      {/* 1. WIX-STYLE LIVE EDIT BAR / MULTI-TENANT SWITCHER             */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 border-b border-indigo-500/20 px-4 py-2 text-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-300 font-medium">Official School Public Website:</span>
            <span className="font-bold text-white bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700">
              {school?.name || siteConfig.hero_title}
            </span>
            <span className="font-mono text-amber-400 font-bold bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/60">
              DepEd ID: {school?.deped_school_id || siteConfig.deped_school_id}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick School Switcher */}
            <select
              value={school.id}
              onChange={(e) => {
                const found = availableSchools.find((s) => s.id === e.target.value);
                if (found) setSchool(found);
              }}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-[11px] text-slate-300 focus:outline-none focus:border-blue-500"
              title="Switch Active DepEd School Instance"
            >
              {availableSchools.map((s) => (
                <option key={s.id} value={s.id}>
                  Switch to: {s.name} ({s.deped_school_id})
                </option>
              ))}
            </select>

            {/* Wix-Style Customizer Trigger */}
            <button
              type="button"
              onClick={() => setIsEditorOpen(true)}
              className="px-3 py-1 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-[11px] shadow-sm flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
              title="Customize School Logo, Titles, Photos, and Announcements"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Customize Website</span>
            </button>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. PUBLIC HEADER & NAVIGATION                                 */}
      {/* ------------------------------------------------------------- */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-xl border-b border-slate-800 px-4 sm:px-8 py-3.5 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* School Brand with Logo */}
          <div className="flex items-center space-x-3 group">
            <div className="relative">
              <img
                src={siteConfig.logo_url}
                alt="School Seal"
                className="w-12 h-12 rounded-xl object-contain p-0.5 bg-slate-950 border border-slate-700/80 shadow"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = '/logos/sawat.png';
                }}
              />
              <button
                type="button"
                onClick={() => setIsEditorOpen(true)}
                className="absolute -bottom-1 -right-1 p-1 rounded-full bg-blue-600 text-white opacity-0 group-hover:opacity-100 transition shadow cursor-pointer"
                title="Edit School Logo"
              >
                <Edit3 className="w-2.5 h-2.5" />
              </button>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base sm:text-lg font-black text-white tracking-tight leading-none">
                  {siteConfig.hero_title}
                </span>
                <span className="hidden md:inline-block text-[10px] font-mono px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800/80">
                  {siteConfig.deped_region}
                </span>
              </div>
              <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-2">
                <span>{siteConfig.deped_division}</span>
                <span>&bull;</span>
                <span className="font-mono text-yellow-400">ID: {siteConfig.deped_school_id}</span>
              </div>
            </div>
          </div>

          {/* Nav Links */}
          <nav className="hidden lg:flex items-center space-x-6 text-xs font-semibold text-slate-300">
            <a href="#about" className="hover:text-blue-400 transition">
              About &amp; Mandate
            </a>
            <a href="#programs" className="hover:text-blue-400 transition">
              Academic Programs
            </a>
            <a href="#gallery" className="hover:text-blue-400 transition">
              Campus Gallery
            </a>
            <a href="#bulletin" className="hover:text-blue-400 transition">
              Announcements
            </a>
            <a href="#leadership" className="hover:text-blue-400 transition">
              Leadership
            </a>
            <a href="#contact" className="hover:text-blue-400 transition">
              Contact
            </a>
          </nav>

          {/* Action CTAs */}
          <div className="flex items-center space-x-2.5">
            <Link
              href="/enroll"
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white shadow-md shadow-emerald-600/30 transition flex items-center space-x-1.5"
            >
              <GraduationCap className="w-4 h-4" />
              <span>Enroll Online</span>
            </Link>
            <Link
              href="/login"
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white border border-slate-700 transition"
            >
              Sign In
            </Link>
            <Link
              href="/dashboard"
              className="hidden sm:flex px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white shadow-md shadow-blue-600/30 transition items-center space-x-1"
            >
              <span>Portal</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* ------------------------------------------------------------- */}
      {/* 3. HERO SHOWCASE SECTION                                      */}
      {/* ------------------------------------------------------------- */}
      <section className="relative min-h-[580px] flex items-center justify-center overflow-hidden border-b border-slate-800">
        {/* Background Image with Dark Vignette */}
        <div className="absolute inset-0 z-0">
          <img
            src={siteConfig.hero_bg_image}
            alt="Campus Showcase"
            className="w-full h-full object-cover scale-105 filter brightness-[0.35] contrast-[1.05]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-transparent to-slate-950/80" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-20 text-center space-y-6">
          {/* DepEd Pill */}
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-slate-900/80 backdrop-blur-md border border-slate-700/80 shadow-lg text-slate-200">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Republic of the Philippines &bull; Department of Education</span>
            <span className="font-mono text-yellow-400 font-bold">DepEd ID: {siteConfig.deped_school_id}</span>
          </div>

          {/* School Title with Quick Edit Button */}
          <div className="relative group inline-block max-w-4xl">
            <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-tight drop-shadow-md">
              {siteConfig.hero_title}
            </h1>
            <button
              type="button"
              onClick={() => setIsEditorOpen(true)}
              className="absolute -top-2 -right-6 p-2 rounded-xl bg-blue-600 text-white opacity-0 group-hover:opacity-100 transition shadow-lg cursor-pointer"
              title="Edit Title & School Name"
            >
              <Edit3 className="w-4 h-4" />
            </button>
          </div>

          {/* Tagline / Motto */}
          <p className="text-lg sm:text-xl font-medium text-blue-300 max-w-3xl mx-auto leading-relaxed drop-shadow">
            &ldquo;{siteConfig.hero_tagline}&rdquo;
          </p>

          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mx-auto leading-relaxed">
            {siteConfig.hero_description}
          </p>

          {/* Quick Hero Actions */}
          <div className="pt-4 flex flex-wrap justify-center gap-3.5">
            <Link
              href="/enroll"
              className="px-6 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-sm font-bold text-white shadow-xl shadow-emerald-600/30 transition flex items-center space-x-2"
            >
              <GraduationCap className="w-5 h-5" />
              <span>Apply for Enrollment (DepEd /enroll)</span>
            </Link>

            <Link
              href="/kiosk"
              className="px-6 py-3.5 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-sm font-bold text-white border border-slate-700 shadow-xl transition flex items-center space-x-2"
            >
              <QrCode className="w-5 h-5 text-emerald-400" />
              <span>Gate Turnstile Attendance (/kiosk)</span>
            </Link>

            <Link
              href="/dashboard"
              className="px-6 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-sm font-bold text-white shadow-xl shadow-blue-600/30 transition flex items-center space-x-2"
            >
              <Layers className="w-5 h-5" />
              <span>Faculty &amp; Staff Portal</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 4. QUICK STATS BANNER                                         */}
      {/* ------------------------------------------------------------- */}
      <section className="bg-slate-900/90 border-b border-slate-800 py-8 px-4">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
            <span className="text-2xl sm:text-3xl font-black text-white font-mono block">
              {siteConfig.stat_students}
            </span>
            <span className="text-xs text-slate-400 font-medium mt-1 block">Enrolled Learners</span>
          </div>
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
            <span className="text-2xl sm:text-3xl font-black text-blue-400 font-mono block">
              {siteConfig.stat_teachers}
            </span>
            <span className="text-xs text-slate-400 font-medium mt-1 block">Licensed DepEd Faculty</span>
          </div>
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
            <span className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono block">
              {siteConfig.stat_classrooms}
            </span>
            <span className="text-xs text-slate-400 font-medium mt-1 block">Instructional Classrooms</span>
          </div>
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
            <span className="text-2xl sm:text-3xl font-black text-amber-400 font-mono block">
              {siteConfig.stat_attendance_rate}
            </span>
            <span className="text-xs text-slate-400 font-medium mt-1 block">Turnstile Attendance Rate</span>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 5. ABOUT THE SCHOOL & DEPED CORE MANDATE                      */}
      {/* ------------------------------------------------------------- */}
      <section id="about" className="py-20 px-4 sm:px-6 max-w-7xl mx-auto space-y-12">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase">
            DepEd Institutional Mandate
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Vision, Mission &amp; Core Values
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Guided by national Department of Education standards, fostering holistic learner formation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Mission */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-3 relative group">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Compass className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">The DepEd Mission</h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {siteConfig.mission_text}
            </p>
          </div>

          {/* Vision */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-3 relative group">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">The DepEd Vision</h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {siteConfig.vision_text}
            </p>
          </div>
        </div>

        {/* DepEd 4 Core Values */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {siteConfig.core_values.map((v, idx) => (
            <div key={idx} className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-2">
              <span className="text-[10px] font-mono font-bold text-blue-400 uppercase">Core Value 0{idx + 1}</span>
              <h4 className="text-base font-bold text-white">{v.title}</h4>
              <p className="text-xs text-slate-400 leading-relaxed">{v.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 6. ACADEMIC GRADE LEVEL OFFERINGS                             */}
      {/* ------------------------------------------------------------- */}
      <section id="programs" className="py-16 bg-slate-900/60 border-y border-slate-800 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto space-y-10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase">
                Curricular Programs
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-2">
                Active Grade Levels for Enrollment
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Official offerings configured under{' '}
                <strong className="text-emerald-400">
                  {school?.school_type === 'ELEMENTARY' && 'Elementary Only (K to Grade 6)'}
                  {school?.school_type === 'HIGH_SCHOOL' && 'High School Only (Grades 7 to 12)'}
                  {school?.school_type === 'INTEGRATED' && 'Integrated School (K to Grade 12)'}
                  {!school?.school_type && 'Standard DepEd Scope'}
                </strong>
              </p>
            </div>

            <Link
              href="/enroll"
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white shadow-md shadow-emerald-600/30 flex items-center gap-2 self-start sm:self-auto transition"
            >
              <span>Submit Enrollment Application</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {enabledGrades.map((grade) => {
              const isK = grade === 'Kindergarten';
              const isSHS = grade === 'Grade 11' || grade === 'Grade 12';
              const isJHS = ['Grade 7', 'Grade 8', 'Grade 9', 'Grade 10'].includes(grade);

              return (
                <div
                  key={grade}
                  className="p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between"
                >
                  <div>
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-2">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <div className="font-bold text-sm text-white">{grade}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {isK && 'Early Childhood'}
                      {isJHS && 'Junior High'}
                      {isSHS && 'Senior High'}
                      {!isK && !isJHS && !isSHS && 'Elementary'}
                    </div>
                  </div>
                  <span className="mt-3 text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-900/60 inline-block self-start">
                    Active
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 7. CAMPUS PHOTO GALLERY (WIX-STYLE INTERACTIVE GRID)          */}
      {/* ------------------------------------------------------------- */}
      <section id="gallery" className="py-20 px-4 sm:px-6 max-w-7xl mx-auto space-y-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20 uppercase">
              Visual Highlights
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight mt-2">
              Campus Photo Gallery
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Explore our learners, classrooms, school events, and campus facilities.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsEditorOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 border border-slate-700 flex items-center gap-1.5 transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-400" />
              <span>Add / Manage Photos</span>
            </button>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar text-xs">
          {['ALL', 'Campus', 'Academic', 'Events', 'Facilities'].map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActivePhotoCategory(cat)}
              className={`px-4 py-2 rounded-xl font-semibold transition cursor-pointer ${
                activePhotoCategory === cat
                  ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-600/30'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {cat === 'ALL' ? 'All Photos' : cat}
            </button>
          ))}
        </div>

        {/* Photos Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPhotos.map((photo) => (
            <div
              key={photo.id}
              className="group bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden hover:border-slate-700 transition-all duration-300 shadow-xl flex flex-col justify-between"
            >
              <div
                className="relative h-64 bg-slate-950 overflow-hidden cursor-pointer"
                onClick={() => setLightboxPhoto(photo)}
              >
                <img
                  src={photo.url}
                  alt={photo.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5 bg-slate-900/90 px-3 py-1.5 rounded-xl border border-slate-700">
                    <Maximize2 className="w-3.5 h-3.5 text-blue-400" />
                    <span>View Full Photo</span>
                  </span>
                </div>
                <span className="absolute top-3 left-3 px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold bg-slate-950/80 text-blue-300 border border-slate-800 backdrop-blur">
                  {photo.category}
                </span>
              </div>

              <div className="p-5 space-y-1.5">
                <h4 className="font-bold text-sm text-white group-hover:text-blue-400 transition-colors">
                  {photo.title}
                </h4>
                {photo.description && (
                  <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                    {photo.description}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 8. PRINCIPAL'S WELCOME & LEADERSHIP                           */}
      {/* ------------------------------------------------------------- */}
      <section id="leadership" className="py-16 bg-slate-900/60 border-y border-slate-800 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-8 sm:p-12 shadow-2xl relative overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
            {/* Principal Portrait */}
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="w-32 h-32 rounded-3xl overflow-hidden bg-slate-950 border-4 border-blue-500/30 p-1 shadow-xl">
                <img
                  src={siteConfig.principal_photo_url}
                  alt={siteConfig.principal_name}
                  className="w-full h-full object-cover rounded-2xl"
                />
              </div>
              <div>
                <h3 className="font-bold text-base text-white">{siteConfig.principal_name}</h3>
                <p className="text-xs text-blue-400 font-mono mt-0.5">{siteConfig.principal_title}</p>
                <p className="text-[11px] text-slate-400">School Head</p>
              </div>
            </div>

            {/* Principal Welcome Message */}
            <div className="md:col-span-2 space-y-4">
              <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase">
                From the Office of the School Head
              </span>
              <h2 className="text-2xl font-black text-white tracking-tight">
                Welcome to Our Educational Community
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed italic border-l-2 border-blue-500 pl-4 py-1">
                &ldquo;{siteConfig.principal_message}&rdquo;
              </p>
              <div className="pt-2 text-xs text-slate-400 flex items-center gap-3">
                <span>DepEd School Division of Pangasinan II</span>
                <span>&bull;</span>
                <span className="font-mono text-yellow-400 font-semibold">ID: {siteConfig.deped_school_id}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 9. SCHOOL BULLETIN & ANNOUNCEMENTS                            */}
      {/* ------------------------------------------------------------- */}
      <section id="bulletin" className="py-20 px-4 sm:px-6 max-w-7xl mx-auto space-y-10">
        <div className="text-center max-w-3xl mx-auto space-y-2">
          <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase">
            Official Notices
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            School Bulletin Board
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Timely updates, enrollment notices, and school calendar announcements for parents and learners.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {siteConfig.announcements.map((ann) => (
            <div
              key={ann.id}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-3 flex flex-col justify-between hover:border-slate-700 transition shadow-xl"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40">
                    {ann.badge}
                  </span>
                  <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-500" />
                    {ann.date}
                  </span>
                </div>
                <h4 className="font-bold text-base text-white">{ann.title}</h4>
                <p className="text-xs text-slate-300 leading-relaxed">{ann.content}</p>
              </div>

              <div className="pt-3 border-t border-slate-800 text-xs font-semibold text-blue-400 flex items-center justify-between">
                <span>Official Notice</span>
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 10. CONTACT & LOCATION DETAILS                                */}
      {/* ------------------------------------------------------------- */}
      <section id="contact" className="py-16 bg-slate-900/80 border-t border-slate-800 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-3xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <MapPin className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-white">Campus Location</h4>
            <p className="text-xs text-slate-400 leading-relaxed">{siteConfig.address}</p>
            <p className="text-[11px] font-mono text-yellow-400">Official DepEd School ID: {siteConfig.deped_school_id}</p>
          </div>

          <div className="p-6 rounded-3xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Phone className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-white">Telephone / Mobile</h4>
            <p className="text-xs text-slate-400 leading-relaxed font-mono">{siteConfig.contact_phone}</p>
            <p className="text-[11px] text-slate-500">Principal Office &amp; Admissions Inquiries</p>
          </div>

          <div className="p-6 rounded-3xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Mail className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-white">Official DepEd Email</h4>
            <p className="text-xs text-slate-400 leading-relaxed font-mono">{siteConfig.contact_email}</p>
            <p className="text-[11px] text-slate-500">DepEd Institutional Inquiries &amp; Verification</p>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 11. FOOTER: POWERED BY IDENTIFY (AS REQUESTED)               */}
      {/* ------------------------------------------------------------- */}
      <footer className="bg-slate-950 border-t border-slate-800/80 py-12 px-4 sm:px-6 text-slate-400 text-xs">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-slate-800">
            {/* School Seal & Info */}
            <div className="flex items-center space-x-3">
              <img
                src={siteConfig.logo_url}
                alt="School Seal"
                className="w-10 h-10 rounded-xl object-contain p-0.5 bg-slate-900 border border-slate-700"
              />
              <div>
                <div className="font-bold text-sm text-white">{siteConfig.hero_title}</div>
                <div className="text-[11px] text-slate-400">
                  {siteConfig.deped_division} &bull; {siteConfig.deped_region} &bull; DepEd ID: {siteConfig.deped_school_id}
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-300">
              <Link href="/enroll" className="hover:text-emerald-400 transition">
                DepEd Enrollment Form
              </Link>
              <Link href="/kiosk" className="hover:text-cyan-400 transition">
                Gate RFID Kiosk
              </Link>
              <Link href="/deped-forms" className="hover:text-amber-400 transition">
                SF1 / SF2 / SF5 Forms
              </Link>
              <Link href="/login" className="hover:text-blue-400 transition">
                Faculty &amp; Staff Login
              </Link>
            </div>
          </div>

          {/* POWERED BY IDENTIFY BRANDING BADGE */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            <div className="flex items-center space-x-2.5">
              <span className="text-slate-400 text-xs">Powered by</span>
              <Link href="/dashboard" className="inline-flex items-center space-x-1.5 focus:outline-none group">
                <IdentifyLogo size="sm" />
              </Link>
              <span className="text-slate-500">&bull;</span>
              <span className="text-[11px] text-slate-400">
                DepEd Automated Attendance &amp; Multi-Tenant School Management System
              </span>
            </div>

            <div className="flex items-center space-x-3 text-[11px] text-slate-400">
              <span>SOC 2 Type 2 Validated</span>
              <span>&bull;</span>
              <span>RA 10173 Compliant</span>
              <span>&bull;</span>
              <span>DepEd Order No. 8, s. 2015</span>
            </div>
          </div>

          <CopyrightNotice className="text-center pt-4 text-[11px] text-slate-400" />
        </div>
      </footer>

      {/* ------------------------------------------------------------- */}
      {/* 12. LIGHTBOX PHOTO MODAL                                      */}
      {/* ------------------------------------------------------------- */}
      {lightboxPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-md animate-fade-in"
          onClick={() => setLightboxPhoto(null)}
        >
          <div
            className="max-w-4xl max-h-[90vh] bg-slate-900 border border-slate-700 rounded-3xl overflow-hidden shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/20 text-blue-300">
                  {lightboxPhoto.category}
                </span>
                <h3 className="text-sm font-bold text-white mt-1">{lightboxPhoto.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setLightboxPhoto(null)}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-hidden max-h-[70vh] bg-black flex items-center justify-center">
              <img
                src={lightboxPhoto.url}
                alt={lightboxPhoto.title}
                className="max-h-[70vh] w-auto object-contain"
              />
            </div>
            {lightboxPhoto.description && (
              <div className="p-4 text-xs text-slate-300 border-t border-slate-800">
                {lightboxPhoto.description}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 13. WIX-STYLE LIVE WEBSITE CUSTOMIZER MODAL                   */}
      {/* ------------------------------------------------------------- */}
      <WixWebsiteCustomizer
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        config={siteConfig}
        onSaveConfig={handleSaveConfig}
        activeSchool={school}
      />

      {/* ------------------------------------------------------------- */}
      {/* 14. SCHOOL INFO MODAL                                         */}
      {/* ------------------------------------------------------------- */}
      <SchoolInfoModal
        school={selectedSchoolForModal}
        isOpen={!!selectedSchoolForModal}
        onClose={() => setSelectedSchoolForModal(null)}
        onSelectAsActive={(s) => setSchool(s)}
      />
    </div>
  );
}

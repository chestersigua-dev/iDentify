'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useTenant } from '@/lib/tenant-context';
import { apiClient, School, DEFAULT_SCHOOL } from '@/lib/api';
import { CopyrightNotice } from '@/components/CopyrightNotice';
import {
  Building2,
  QrCode,
  Layers,
  FileSpreadsheet,
  ShieldCheck,
  Phone,
  Mail,
  MapPin,
  UserCheck,
  ChevronLeft,
  ArrowRight,
  ExternalLink,
  Sparkles,
  School as SchoolIcon,
} from 'lucide-react';

export default function SchoolSubdomainPortalPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;
  const { setSchool, setCurrentRole } = useTenant();

  const [currentSchool, setCurrentSchool] = useState<School | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (slug) {
      apiClient.getSchoolBySlug(slug).then((res) => {
        setCurrentSchool(res);
        setSchool(res);
        setLoading(false);
      });
    }
  }, [slug, setSchool]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center font-sans">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-400 font-mono">Resolving tenant subdomain: /schools/{slug}...</p>
        </div>
      </div>
    );
  }

  const sch = currentSchool || DEFAULT_SCHOOL;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between font-sans">
      {/* Top Header */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md px-6 py-4 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link
              href="/dashboard"
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors flex items-center space-x-1 text-xs"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>All Schools</span>
            </Link>
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl p-1 bg-slate-800 border border-slate-700 flex items-center justify-center">
                <img src={sch.logo_url} alt="" className="w-full h-full object-contain" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-white tracking-tight">{sch.name}</h1>
                <span className="text-[11px] font-mono text-yellow-400">
                  DepEd ID: {sch.deped_school_id} &bull; {sch.division}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className="hidden sm:inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-800">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>RLS ACTIVE</span>
            </span>
            <Link
              href="/dashboard"
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white transition-colors"
            >
              Admin Dashboard
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 flex flex-col justify-center">
        {/* Main Tenant Card */}
        <div className="glass-panel p-8 sm:p-10 rounded-3xl border border-slate-800 shadow-2xl relative overflow-hidden">
          {/* Subtle Background Watermark */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/4 opacity-10 pointer-events-none">
            <img src={sch.logo_url} alt="" className="w-[450px] h-[450px] object-contain" />
          </div>

          <div className="relative z-10 max-w-3xl space-y-6">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-950/80 text-blue-300 border border-blue-800/80">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Subdomain Tenant: <span className="font-mono text-white">{sch.slug}.saasdomain.ph</span></span>
            </div>

            <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6">
              <div className="w-28 h-28 rounded-2xl p-2 bg-gradient-to-tr from-blue-900 to-indigo-900 border-2 border-blue-500/40 shadow-xl flex items-center justify-center shrink-0">
                <img src={sch.logo_url} alt={sch.name} className="w-full h-full object-contain" />
              </div>

              <div>
                <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                  {sch.name}
                </h2>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <span className="px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-yellow-950 text-yellow-300 border border-yellow-800">
                    DepEd School ID: {sch.deped_school_id}
                  </span>
                  <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-slate-800 text-slate-300">
                    {sch.division}
                  </span>
                  <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-slate-800 text-slate-300">
                    {sch.region}
                  </span>
                </div>
              </div>
            </div>

            {/* School Head & Metadata */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-800/80 text-xs">
              <div className="flex items-start space-x-2 text-slate-300">
                <UserCheck className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-slate-500">School Head / Principal</div>
                  <div className="font-bold text-white">{sch.school_head_name || 'Dr. Rodrigo M. Villanueva'}</div>
                  <div className="text-[11px] text-slate-400">{sch.school_head_title || 'Principal IV'}</div>
                </div>
              </div>

              <div className="flex items-start space-x-2 text-slate-300">
                <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-slate-500">Physical Address</div>
                  <div className="font-semibold text-white">
                    {sch.barangay}, {sch.municipality_city}
                  </div>
                  <div className="text-[11px] text-slate-400">{sch.province}</div>
                </div>
              </div>

              <div className="flex items-start space-x-2 text-slate-300">
                <Mail className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-slate-500">Official Communications</div>
                  <div className="font-semibold text-white">{sch.contact_email || 'admin@deped.gov.ph'}</div>
                  <div className="text-[11px] text-slate-400">{sch.contact_phone || '(02) 8642-1234'}</div>
                </div>
              </div>
            </div>

            {/* Tenant Interactive Action Buttons */}
            <div className="pt-4 flex flex-wrap gap-3">
              <Link
                href="/kiosk"
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white shadow-lg shadow-emerald-600/30 transition-all flex items-center space-x-2 active:scale-95"
              >
                <QrCode className="w-4 h-4" />
                <span>Launch Gate Turnstile Kiosk</span>
              </Link>

              <Link
                href="/dashboard"
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white shadow-lg shadow-blue-600/30 transition-all flex items-center space-x-2 active:scale-95"
              >
                <Layers className="w-4 h-4" />
                <span>Manage School in Dashboard</span>
              </Link>

              <Link
                href="/deped-forms"
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-white transition-all flex items-center space-x-2 active:scale-95"
              >
                <FileSpreadsheet className="w-4 h-4 text-amber-400" />
                <span>School Forms (SF1, SF2, SF5)</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Live Academic & Roster Statistics for this School */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="glass-panel p-4 rounded-xl">
            <span className="text-xs text-slate-400 font-medium">Total Enrolled Learners</span>
            <div className="text-2xl font-bold text-white mt-1">643 Students</div>
            <div className="text-[11px] text-blue-400 mt-1">DepEd 12-Digit LRNs Active</div>
          </div>

          <div className="glass-panel p-4 rounded-xl">
            <span className="text-xs text-slate-400 font-medium">Academic Grade Levels</span>
            <div className="text-2xl font-bold text-white mt-1">Grade 7 - 12</div>
            <div className="text-[11px] text-emerald-400 mt-1">Junior & Senior High Tracks</div>
          </div>

          <div className="glass-panel p-4 rounded-xl">
            <span className="text-xs text-slate-400 font-medium">Daily Attendance Rate</span>
            <div className="text-2xl font-bold text-emerald-400 mt-1">97.2%</div>
            <div className="text-[11px] text-slate-400 mt-1">Gate Turnstile Debounced</div>
          </div>

          <div className="glass-panel p-4 rounded-xl">
            <span className="text-xs text-slate-400 font-medium">Row-Level Security</span>
            <div className="text-2xl font-bold text-yellow-400 mt-1">Isolated</div>
            <div className="text-[11px] text-slate-400 mt-1">Tenant ID: {sch.id.substring(0, 8)}...</div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="sticky bottom-0 z-30 border-t border-slate-800 bg-slate-900/95 backdrop-blur py-4 text-center text-xs text-slate-500">
        iDentify DepEd SaaS &bull; Dedicated Tenant Subdomain: {sch.slug} &bull; RA 10173 &amp; SOC 2 Type 2
        <CopyrightNotice className="mt-1" />
      </footer>
    </div>
  );
}

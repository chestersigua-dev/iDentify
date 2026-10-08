'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useTenant } from '@/lib/tenant-context';
import { School } from '@/lib/api';
import SchoolInfoModal from '@/components/SchoolInfoModal';
import { CopyrightNotice } from '@/components/CopyrightNotice';
import IdentifyLogo from '@/components/IdentifyLogo';
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
} from 'lucide-react';

export default function HomePage() {
  const { availableSchools, setSchool } = useTenant();
  const [selectedSchoolForModal, setSelectedSchoolForModal] = useState<School | null>(null);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between">
      {/* Top Banner */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <IdentifyLogo size="md" />
          </div>

          <div className="flex items-center space-x-3">
            <Link
              href="/login"
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white border border-slate-700 transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/dashboard"
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white shadow-lg shadow-blue-600/30 transition-all flex items-center space-x-1"
            >
              <span>Open Portal</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-1 flex flex-col justify-center">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-950/80 text-blue-300 border border-blue-800/80 shadow-inner">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>SOC 2 Type 2 &bull; RA 10173 &bull; DepEd Order No. 8, s. 2015</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Automated Attendance & School Management for{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-300 to-emerald-400">
              Philippine Schools
            </span>
          </h1>

          <p className="text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Autonomous standalone deployment with segregated faculty and DepEd BEEF learner databases,
            direct CSV roster importation, hardware RFID turnstile kiosks, and pixel-accurate SF1, SF2, SF5 reporting.
          </p>

          <div className="pt-4 flex flex-wrap justify-center gap-3">
            <Link
              href="/kiosk"
              className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-sm font-bold text-white shadow-xl shadow-emerald-600/30 transition-all flex items-center space-x-2 active:scale-95"
            >
              <QrCode className="w-5 h-5" />
              <span>Launch Gate Turnstile Kiosk</span>
            </Link>
            <Link
              href="/dashboard"
              className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-sm font-bold text-white shadow-xl shadow-blue-600/30 transition-all flex items-center space-x-2 active:scale-95"
            >
              <Layers className="w-5 h-5" />
              <span>Enter School Management Portal</span>
            </Link>
            <Link
              href="/deped-forms"
              className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-sm font-bold text-white transition-all flex items-center space-x-2 active:scale-95"
            >
              <FileSpreadsheet className="w-5 h-5 text-amber-400" />
              <span>Official SF1 / SF2 / SF5 Forms</span>
            </Link>
          </div>
        </div>

        {/* Multi-Tenant School Launchpad */}
        <div className="mt-14 max-w-4xl mx-auto w-full">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 text-center">
            Select Active Multi-Tenant Instance
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {availableSchools.map((s) => (
              <div
                key={s.id}
                className="glass-panel p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 group hover:border-blue-500/50 transition-all cursor-pointer"
                onClick={() => setSelectedSchoolForModal(s)}
              >
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 rounded-xl p-1 bg-slate-800/80 border border-slate-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <img src={s.logo_url} alt="" className="w-full h-full object-contain" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors flex items-center space-x-1.5">
                      <span>{s.name}</span>
                      <Info className="w-3.5 h-3.5 text-slate-500 group-hover:text-blue-400" />
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      DepEd School ID: <span className="font-mono text-yellow-400 font-bold">{s.deped_school_id}</span>
                    </p>
                    <Link
                      href={`/schools/${s.slug}`}
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center space-x-1 text-blue-400 hover:text-blue-300 font-mono text-[11px] mt-1 hover:underline"
                    >
                      <span>/schools/{s.slug}</span>
                      <ExternalLink className="w-3 h-3 text-blue-400" />
                    </Link>
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => setSelectedSchoolForModal(s)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors"
                  >
                    View Info
                  </button>
                  <Link
                    href={`/schools/${s.slug}`}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md transition-all flex items-center space-x-1"
                  >
                    <span>Test Slug</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pre-Seeded Evaluation Credentials Card */}
        <div className="mt-10 max-w-4xl mx-auto w-full glass-panel p-5 rounded-2xl border border-slate-800 text-xs font-mono">
          <div className="flex items-center justify-between mb-3 text-slate-300 font-sans">
            <span className="font-bold flex items-center space-x-2">
              <Lock className="w-4 h-4 text-yellow-400" />
              <span>Pre-Seeded Credentials (All 6 DepEd Roles Pre-Configured)</span>
            </span>
            <span className="text-[11px] text-emerald-400">Ready for Instant Evaluation</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-[11px]">
            <div className="p-2 bg-slate-900 rounded border border-slate-800">
              <div className="font-bold text-yellow-400">SUPER_ADMIN</div>
              <div className="text-slate-300">superadmin@deped.gov.ph</div>
              <div className="text-slate-500">Pass: SuperAdmin123!</div>
            </div>
            <div className="p-2 bg-slate-900 rounded border border-slate-800">
              <div className="font-bold text-yellow-400">PRINCIPAL</div>
              <div className="text-slate-300">sawatelementaryschool@gmail.com</div>
              <div className="text-slate-500">Pass: Principal123!</div>
            </div>
            <div className="p-2 bg-slate-900 rounded border border-slate-800">
              <div className="font-bold text-yellow-400">HEAD_TEACHER</div>
              <div className="text-slate-300">ht.jhs@mabini.deped.gov.ph</div>
              <div className="text-slate-500">Pass: HeadTeacher123!</div>
            </div>
            <div className="p-2 bg-slate-900 rounded border border-slate-800">
              <div className="font-bold text-yellow-400">TEACHER</div>
              <div className="text-slate-300">teacher.santos@mabini.deped.gov.ph</div>
              <div className="text-slate-500">Pass: Teacher123!</div>
            </div>
            <div className="p-2 bg-slate-900 rounded border border-slate-800">
              <div className="font-bold text-yellow-400">TURNSTILE KIOSK</div>
              <div className="text-slate-300">kiosk1@mabini.deped.gov.ph</div>
              <div className="text-slate-500">Pass: KioskPass123!</div>
            </div>
            <div className="p-2 bg-slate-900 rounded border border-slate-800">
              <div className="font-bold text-yellow-400">STUDENT ROSTER</div>
              <div className="text-slate-300">juan.delacruz@student.deped.gov.ph</div>
              <div className="text-slate-500">Pass: Student123!</div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="sticky bottom-0 z-30 border-t border-slate-800 bg-slate-900/95 backdrop-blur py-4 text-center text-xs text-slate-500">
        iDentify DepEd SaaS &bull; Compliant with DepEd Order No. 8, s. 2015 &bull; SOC 2 Type 2 Validated
        <CopyrightNotice className="mt-1" />
      </footer>

      {/* School Info & Subdomain Slug Test Modal */}
      <SchoolInfoModal
        school={selectedSchoolForModal}
        isOpen={!!selectedSchoolForModal}
        onClose={() => setSelectedSchoolForModal(null)}
        onSelectAsActive={(s) => setSchool(s)}
      />
    </div>
  );
}

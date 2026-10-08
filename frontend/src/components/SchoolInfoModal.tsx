'use client';

import React from 'react';
import Link from 'next/link';
import { School } from '@/lib/api';
import {
  X,
  Building2,
  ExternalLink,
  MapPin,
  Mail,
  Phone,
  UserCheck,
  ShieldCheck,
  QrCode,
  Layers,
  Sparkles,
  Palette,
} from 'lucide-react';

interface SchoolInfoModalProps {
  school: School | null;
  isOpen: boolean;
  onClose: () => void;
  onSelectAsActive?: (school: School) => void;
}

export default function SchoolInfoModal({
  school,
  isOpen,
  onClose,
  onSelectAsActive,
}: SchoolInfoModalProps) {
  if (!isOpen || !school) return null;

  const subdomainUrl = `/schools/${school.slug}`;
  const fullSubdomainUrl = `http://localhost:3000/schools/${school.slug}`;

  return (
    <div className="fixed inset-0 z-50 glass-modal-backdrop bg-slate-950/60 backdrop-blur-xl flex items-center justify-center p-4 overflow-y-auto font-sans">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl relative text-slate-100 my-8 animate-fade-in">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          title="Close Modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center space-x-4 mb-6 pb-4 border-b border-slate-800">
          <div className="w-16 h-16 rounded-2xl p-1.5 bg-gradient-to-tr from-blue-700 to-indigo-600 shadow-xl shadow-blue-900/40 flex items-center justify-center shrink-0">
            <img
              src={school.logo_url}
              alt={school.name}
              className="w-full h-full object-contain"
            />
          </div>
          <div className="pr-6">
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-yellow-950 text-yellow-300 border border-yellow-800">
                DepEd ID: {school.deped_school_id}
              </span>
              <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center space-x-1">
                <ShieldCheck className="w-3 h-3" />
                <span>RLS ISOLATED</span>
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold text-white mt-1 leading-snug">
              {school.name}
            </h2>
            <p className="text-xs text-slate-400">
              {school.division} &bull; {school.region}
            </p>
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* SUBDOMAIN SLUG TEST CARD (HIGHLIGHTED PER USER REQUEST)       */}
        {/* ------------------------------------------------------------- */}
        <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-blue-950/60 to-indigo-950/60 border border-blue-500/40 shadow-inner">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-blue-300 uppercase tracking-wider flex items-center space-x-1.5">
              <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
              <span>Multi-Tenant Subdomain Slug</span>
            </span>
            <span className="text-[10px] font-mono text-emerald-400 font-semibold">
              Live & Testable
            </span>
          </div>

          <div className="flex items-center justify-between bg-slate-950/80 border border-blue-800/60 rounded-xl p-2.5 text-xs font-mono">
            <div className="truncate pr-2">
              <span className="text-slate-500">Route Prefix: </span>
              <span className="text-blue-300 font-bold">{subdomainUrl}</span>
            </div>
            <Link
              href={subdomainUrl}
              onClick={onClose}
              className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-sans font-bold text-xs shadow-md transition-all shrink-0 hover:scale-105 active:scale-95"
            >
              <span>Test Slug</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="flex items-center justify-between mt-2 pt-2 border-t border-blue-900/40 text-[11px] text-slate-400">
            <span>Direct Kiosk Subdomain:</span>
            <Link
              href={`/schools/${school.slug}/kiosk`}
              onClick={onClose}
              className="text-emerald-400 hover:text-emerald-300 font-mono font-semibold flex items-center space-x-1 hover:underline"
            >
              <span>/schools/{school.slug}/kiosk</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* School Metadata Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          {/* Physical Address */}
          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
            <div className="flex items-center space-x-1.5 text-slate-400 font-semibold mb-1">
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              <span>Physical DepEd Jurisdiction</span>
            </div>
            <div className="text-white font-medium">{school.barangay}, {school.municipality_city}</div>
            <div className="text-slate-400 text-[11px]">{school.province} &bull; {school.district || 'District I'}</div>
          </div>

          {/* School Head */}
          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
            <div className="flex items-center space-x-1.5 text-slate-400 font-semibold mb-1">
              <UserCheck className="w-3.5 h-3.5 text-blue-400" />
              <span>School Head / Principal</span>
            </div>
            <div className="text-white font-bold">{school.school_head_name || 'Dr. Rodrigo M. Villanueva'}</div>
            <div className="text-slate-400 text-[11px]">{school.school_head_title || 'Principal IV'}</div>
          </div>

          {/* Contact Information */}
          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
            <div className="flex items-center space-x-1.5 text-slate-400 font-semibold mb-1">
              <Mail className="w-3.5 h-3.5 text-purple-400" />
              <span>Official Email & Phone</span>
            </div>
            <div className="text-white font-mono truncate">{school.contact_email || `${school.slug || 'school'}@deped.gov.ph`}</div>
            <div className="text-slate-400 text-[11px] font-mono">{school.contact_phone || '0905 669 1862'}</div>
          </div>

          {/* Dynamic White-Label Brand Tokens */}
          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
            <div className="flex items-center space-x-1.5 text-slate-400 font-semibold mb-1">
              <Palette className="w-3.5 h-3.5 text-amber-400" />
              <span>Dynamic White-Label Brand Tokens</span>
            </div>
            <div className="flex items-center space-x-3 mt-1.5">
              <div className="flex items-center space-x-1.5">
                <span
                  className="w-4 h-4 rounded-full border border-white/20"
                  style={{ backgroundColor: school.primary_color || '#1e3a8a' }}
                />
                <span className="font-mono text-[10px] text-slate-400">{school.primary_color || '#1e3a8a'}</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span
                  className="w-4 h-4 rounded-full border border-white/20"
                  style={{ backgroundColor: school.accent_color || '#0ea5e9' }}
                />
                <span className="font-mono text-[10px] text-slate-400">{school.accent_color || '#0ea5e9'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
          <div className="text-[11px] font-mono text-slate-500">
            Database Tenant ID: {school.id.substring(0, 13)}...
          </div>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-colors"
            >
              Close
            </button>
            {onSelectAsActive && (
              <button
                type="button"
                onClick={() => {
                  onSelectAsActive(school);
                  onClose();
                }}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white shadow-lg transition-all"
              >
                Set as Active School
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

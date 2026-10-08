'use client';

import React from 'react';
import { Fingerprint } from 'lucide-react';

interface IdentifyLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
}

export default function IdentifyLogo({ size = 'md', showSubtitle = true }: IdentifyLogoProps) {
  const iconSize = size === 'sm' ? 'w-8 h-8' : size === 'lg' ? 'w-12 h-12' : 'w-10 h-10';
  const innerIconSize = size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-6 h-6' : 'w-5 h-5';
  const titleSize = size === 'sm' ? 'text-base' : size === 'lg' ? 'text-2xl' : 'text-lg';

  return (
    <div className="flex items-center space-x-3 select-none">
      {/* High-tech biometric pseudo-fingerprint emblem */}
      <div className={`relative ${iconSize} rounded-2xl p-0.5 bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 shadow-lg shadow-blue-500/25 flex items-center justify-center shrink-0 group`}>
        <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center relative overflow-hidden">
          {/* Subtle radial biometric sensor backlight */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.25)_0%,transparent_75%)] pointer-events-none" />

          {/* Animated horizontal biometric laser scanline */}
          <div
            className="absolute inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_6px_#22d3ee] animate-pulse pointer-events-none"
            style={{ top: '48%' }}
          />

          {/* Pseudo Fingerprint biometric ridges */}
          <Fingerprint
            className={`${innerIconSize} text-cyan-400 group-hover:text-cyan-300 drop-shadow-[0_0_8px_rgba(34,211,238,0.65)] transform group-hover:scale-110 transition-all duration-300 z-10`}
            strokeWidth={2.2}
          />

          {/* Optical corner scan markers */}
          <div className="absolute top-1 left-1 w-1.5 h-1.5 border-t border-l border-cyan-400/40 pointer-events-none" />
          <div className="absolute top-1 right-1 w-1.5 h-1.5 border-t border-r border-cyan-400/40 pointer-events-none" />
          <div className="absolute bottom-1 left-1 w-1.5 h-1.5 border-b border-l border-cyan-400/40 pointer-events-none" />
          <div className="absolute bottom-1 right-1 w-1.5 h-1.5 border-b border-r border-cyan-400/40 pointer-events-none" />
        </div>
      </div>

      <div className="min-w-0">
        <div className="flex items-center space-x-1.5">
          <span className={`font-black tracking-tight text-white ${titleSize} font-sans`}>
            i<span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-cyan-300 bg-clip-text text-transparent">Dentify</span>
          </span>
          <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-blue-950 text-cyan-300 border border-cyan-800/60 shadow-sm">
            v1.2b
          </span>
        </div>
        {showSubtitle && (
          <p className="text-[10px] text-slate-400 font-medium tracking-wide truncate">
            DepEd School &amp; Attendance System
          </p>
        )}
      </div>
    </div>
  );
}

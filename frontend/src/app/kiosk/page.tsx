'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useTenant } from '@/lib/tenant-context';
import { apiClient, Student, UserAccount, DEFAULT_SCHOOL, formatUserDisplayName, formatUsDateTime } from '@/lib/api';
import IdentifyLogo from '@/components/IdentifyLogo';
import { CopyrightNotice } from '@/components/CopyrightNotice';
import {
  QrCode,
  Radio,
  Clock,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  ShieldCheck,
  ChevronLeft,
  Volume2,
  RefreshCw,
  Sparkles,
  Settings,
  Send,
  Maximize2,
  Smartphone,
  Check,
  X,
  ShieldAlert,
} from 'lucide-react';

interface FlashPayload {
  studentName: string;
  lrn: string;
  gradeSection: string;
  photoUrl: string;
  status: 'CLOCK_IN' | 'CLOCK_OUT' | 'DEBOUNCED' | 'INVALID';
  timestamp: string;
  message: string;
  minutesFromFirstTap?: number;
  isFaculty?: boolean;
  smsDispatched?: boolean;
  parentPhone?: string;
  smsProvider?: string;
}

export default function KioskPage() {
  const { school } = useTenant();
  const [currentTime, setCurrentTime] = useState<string>('');
  const [displayTime, setDisplayTime] = useState<string>('');
  const [currentUsDate, setCurrentUsDate] = useState<string>('October 6, 2026');
  const [currentWeekday, setCurrentWeekday] = useState<string>('Tuesday');
  const [rfidInput, setRfidInput] = useState<string>('');
  const [flashData, setFlashData] = useState<FlashPayload | null>(null);
  const [recentLogs, setRecentLogs] = useState<FlashPayload[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Synchronized School Settings for Kiosk Display Duration and SMS Status Feedback
  const [kioskConfig, setKioskConfig] = useState(() => {
    const s = apiClient.getSchoolSettings();
    return {
      displayDurationSeconds: Math.max(1, Math.min(15, Number(s.kiosk_display_duration_seconds) || 2)),
      showSmsStatus: s.kiosk_show_sms_status !== false,
      debounceMinutes: Number(s.kiosk_debounce_minutes) || 30,
      parentSmsEnabled: s.parent_sms_enabled !== false,
      smsProvider: s.sms_provider || 'EASYSMS',
    };
  });

  // Sync settings dynamically when altered in School Settings or across tabs
  useEffect(() => {
    const syncKioskSettings = () => {
      const s = apiClient.getSchoolSettings();
      setKioskConfig({
        displayDurationSeconds: Math.max(1, Math.min(15, Number(s.kiosk_display_duration_seconds) || 2)),
        showSmsStatus: s.kiosk_show_sms_status !== false,
        debounceMinutes: Number(s.kiosk_debounce_minutes) || 30,
        parentSmsEnabled: s.parent_sms_enabled !== false,
        smsProvider: s.sms_provider || 'EASYSMS',
      });
    };

    window.addEventListener('storage', syncKioskSettings);
    return () => window.removeEventListener('storage', syncKioskSettings);
  }, []);

  // Loaded students and faculty from API / local database
  const [loadedStudents, setLoadedStudents] = useState<Student[]>([]);
  const [loadedFaculty, setLoadedFaculty] = useState<UserAccount[]>([]);

  // Student state memory for multi-tap debounce and 30-min auto clock-out
  const [studentTapStates, setStudentTapStates] = useState<Record<string, { firstTapTime: number; status: 'CLOCK_IN' | 'CLOCK_OUT' }>>({});

  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch registered school students & faculty for dynamic RFID lookup
  useEffect(() => {
    const schoolId = school.id || DEFAULT_SCHOOL.id;
    apiClient.getStudents(schoolId).then((students) => {
      if (students && students.length > 0) {
        setLoadedStudents(students);
      }
    });
    apiClient.getUsers(schoolId).then((users) => {
      if (users && users.length > 0) {
        setLoadedFaculty(users);
      }
    });
  }, [school.id]);

  // Digital Clock & US Date Updater (Seconds Precision, No Milliseconds)
  useEffect(() => {
    const pad = (n: number) => (n < 10 ? '0' + n : String(n));

    const updateClock = () => {
      const now = new Date();
      const hours = now.getHours();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const hours12 = hours % 12 || 12;

      const strHeader = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(
        now.getDate(),
      )} ${pad(hours)}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
      setCurrentTime(strHeader);

      const strTime = `${pad(hours12)}:${pad(now.getMinutes())}:${pad(now.getSeconds())} ${ampm}`;
      setDisplayTime(strTime);

      setCurrentUsDate(
        now.toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        })
      );
      setCurrentWeekday(
        now.toLocaleDateString('en-US', {
          weekday: 'long',
        })
      );
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // Continuous Autofocus for USB HID RFID readers
  useEffect(() => {
    const focusReader = () => {
      if (!flashData && inputRef.current && document.activeElement !== inputRef.current) {
        inputRef.current.focus({ preventScroll: true });
      }
    };

    focusReader();
    const heartbeat = setInterval(focusReader, 600);

    const onGlobalClick = () => {
      focusReader();
    };

    const onWindowFocus = () => {
      focusReader();
    };

    const onGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.altKey || e.metaKey) return;
      if (inputRef.current && document.activeElement !== inputRef.current) {
        inputRef.current.focus({ preventScroll: true });
        if (e.key && e.key.length === 1 && !isProcessing && !flashData) {
          setRfidInput((prev) => (prev + e.key).slice(0, 10));
        }
      }
    };

    window.addEventListener('click', onGlobalClick);
    window.addEventListener('focus', onWindowFocus);
    window.addEventListener('keydown', onGlobalKeyDown);

    return () => {
      clearInterval(heartbeat);
      window.removeEventListener('click', onGlobalClick);
      window.removeEventListener('focus', onWindowFocus);
      window.removeEventListener('keydown', onGlobalKeyDown);
    };
  }, [flashData, isProcessing]);

  // Audio chime feedback using Web Audio API
  const playChime = (type: 'in' | 'out' | 'debounce' | 'error') => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'in') {
        osc.frequency.setValueAtTime(587.33, ctx.currentTime);
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      } else if (type === 'out') {
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.setValueAtTime(587.33, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      } else if (type === 'error') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, ctx.currentTime);
        osc.frequency.setValueAtTime(146.83, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
        osc.start();
        osc.stop(ctx.currentTime + 0.4);
      } else {
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
        osc.start();
        osc.stop(ctx.currentTime + 0.2);
      }
    } catch { }
  };

  // Fullscreen Toggle
  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => { });
    } else {
      document.exitFullscreen().catch(() => { });
    }
  };

  // Scan processor for 10-digit numerical tags
  const handleScan = async (rawToken: string) => {
    const tokenUid = rawToken.trim();
    if (!tokenUid || isProcessing) return;
    setIsProcessing(true);

    try {
      const now = new Date();
      const pad = (n: number) => (n < 10 ? '0' + n : String(n));
      const hours = now.getHours();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const hours12 = hours % 12 || 12;
      const timeStr = `${pad(hours12)}:${pad(now.getMinutes())}:${pad(now.getSeconds())} ${ampm}`;
      const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      const usFormattedTimestamp = `${months[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()} ${timeStr}`;
      const currentEpoch = Date.now();

      // Pre-seeded 10-Digit Numerical Student Metadata lookup
      const studentMap: Record<string, { name: string; lrn: string; grade: string; photo: string; phone: string }> = {
        '0008522301': {
          name: 'Juan Dela Cruz Jr.',
          lrn: '109283746501',
          grade: 'Grade 10 - Bonifacio',
          photo: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
          phone: '+639178885678',
        },
        '0008522302': {
          name: 'Maria Clara Santos',
          lrn: '109283746502',
          grade: 'Grade 10 - Bonifacio',
          photo: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
          phone: '+639177771122',
        },
        '0008522303': {
          name: 'Diego Silang',
          lrn: '109283746503',
          grade: 'Grade 10 - Bonifacio',
          photo: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=150&auto=format&fit=crop&q=80',
          phone: '+639176664455',
        },
        '0008522304': {
          name: 'Josefa Mercado',
          lrn: '109283746504',
          grade: 'Grade 11 - STEM - Archimedes',
          photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
          phone: '+639175553344',
        },
      };

      // Pre-seeded Faculty & Staff Metadata lookup
      const facultyMap: Record<string, { name: string; idNum: string; role: string; photo: string }> = {
        '0008522401': {
          name: 'Dr. Rico Idos',
          idNum: 'DEPED-FAC-001',
          role: 'Principal I (School Head)',
          photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        },
        '0008522402': {
          name: 'Maria Elena Bautista',
          idNum: 'DEPED-FAC-002',
          role: 'Administrative Assistant II',
          photo: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
        },
        '0008522403': {
          name: 'Prof. Corazon Aquino-Reyes',
          idNum: 'DEPED-FAC-003',
          role: 'Head Teacher II (Faculty)',
          photo: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
        },
        '0008522404': {
          name: 'Danilo Ramos, LPT',
          idNum: 'DEPED-FAC-004',
          role: 'Master Teacher I (Faculty)',
          photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
        },
        '0008522405': {
          name: 'Maria Fe Santos, LPT',
          idNum: 'DEPED-FAC-005',
          role: 'Teacher III (Faculty)',
          photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
        },
        '0008522406': {
          name: 'Roberto Dizon',
          idNum: 'DEPED-FAC-006',
          role: 'Staff / Administration',
          photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
        },
      };

      // 1. Check Student Database
      const dynamicStudent = loadedStudents.find(
        (s) => s.active_rfid_uid === tokenUid || s.rfid_tag === tokenUid || s.lrn === tokenUid
      );
      const preseededStudent = studentMap[tokenUid];

      // 2. Check Faculty Database
      const dynamicFaculty = loadedFaculty.find(
        (u) => u.active_rfid_uid === tokenUid || u.rfid_tag === tokenUid
      );
      const preseededFaculty = facultyMap[tokenUid];

      // If NOT in student or faculty database -> INVALID ID
      if (!dynamicStudent && !preseededStudent && !dynamicFaculty && !preseededFaculty) {
        const payload: FlashPayload = {
          studentName: 'Invalid ID Card',
          lrn: `Card UID: ${tokenUid}`,
          gradeSection: 'Unregistered RFID Tag',
          photoUrl: '',
          status: 'INVALID',
          timestamp: usFormattedTimestamp,
          message: 'Access Denied: This ID does not exist in the student or faculty database.',
        };

        playChime('error');
        setFlashData(payload);
        setRecentLogs((prev) => [payload, ...prev.slice(0, 7)]);
        setRfidInput('');

        const invalidDurationMs = Math.max(1500, kioskConfig.displayDurationSeconds * 1000);
        setTimeout(() => {
          setFlashData(null);
          setIsProcessing(false);
          if (inputRef.current) inputRef.current.focus({ preventScroll: true });
        }, invalidDurationMs);

        return;
      }

      // Valid Person (Student or Faculty)
      let personName = '';
      let personId = '';
      let personGroup = '';
      let personPhoto = '';
      let isFacultyMember = false;
      let parentContact = '';

      if (dynamicStudent) {
        personName = `${dynamicStudent.first_name} ${dynamicStudent.last_name}${
          dynamicStudent.extension_name ? ' ' + dynamicStudent.extension_name : ''
        }`;
        personId = `LRN: ${dynamicStudent.lrn}`;
        personGroup = `${dynamicStudent.grade_level} - ${dynamicStudent.section_name || 'Regular'}`;
        personPhoto = dynamicStudent.photo_url || '/avatars/student-default.svg';
        parentContact = dynamicStudent.emergency_contact || (dynamicStudent as any).primary_sms_phone || '';
      } else if (preseededStudent) {
        personName = preseededStudent.name;
        personId = `LRN: ${preseededStudent.lrn}`;
        personGroup = preseededStudent.grade;
        personPhoto = preseededStudent.photo;
        parentContact = preseededStudent.phone;
      } else if (dynamicFaculty) {
        personName = formatUserDisplayName(dynamicFaculty) || dynamicFaculty.full_name || dynamicFaculty.name || 'Faculty Member';
        personId = dynamicFaculty.position || dynamicFaculty.role || 'Faculty';
        personGroup = 'Faculty & Staff';
        personPhoto = dynamicFaculty.photo_url || '/avatars/teacher-default.svg';
        isFacultyMember = true;
      } else if (preseededFaculty) {
        personName = preseededFaculty.name;
        personId = preseededFaculty.idNum;
        personGroup = preseededFaculty.role;
        personPhoto = preseededFaculty.photo;
        isFacultyMember = true;
      }

      // Attendance multi-tap state logic
      const existing = studentTapStates[tokenUid];
      let status: 'CLOCK_IN' | 'CLOCK_OUT' | 'DEBOUNCED';
      let minutesFromFirst = 0;
      let msg = '';

      if (!existing) {
        status = 'CLOCK_IN';
        minutesFromFirst = 0;
        setStudentTapStates((prev) => ({
          ...prev,
          [tokenUid]: { firstTapTime: currentEpoch, status: 'CLOCK_IN' },
        }));
        msg = `Welcome! Safely Clocked IN at ${usFormattedTimestamp}.`;
      } else {
        const actualElapsed = Math.floor((currentEpoch - existing.firstTapTime) / 60000);
        minutesFromFirst = actualElapsed;

        if (existing.status === 'CLOCK_OUT') {
          status = 'DEBOUNCED';
          msg = `Already Clocked OUT today. Duplicate tap ignored.`;
        } else if (actualElapsed < kioskConfig.debounceMinutes) {
          status = 'DEBOUNCED';
          msg = `Already Clocked IN (${actualElapsed} min ago). Multi-tap debounced (<${kioskConfig.debounceMinutes} min).`;
        } else {
          status = 'CLOCK_OUT';
          setStudentTapStates((prev) => ({
            ...prev,
            [tokenUid]: { firstTapTime: existing.firstTapTime, status: 'CLOCK_OUT' },
          }));
          msg = `Goodbye! Safely Clocked OUT at ${usFormattedTimestamp}.`;
        }
      }

      const payload: FlashPayload = {
        studentName: personName,
        lrn: personId,
        gradeSection: personGroup,
        photoUrl: personPhoto,
        status,
        timestamp: usFormattedTimestamp,
        message: msg,
        minutesFromFirstTap: minutesFromFirst,
        isFaculty: isFacultyMember,
        smsDispatched: kioskConfig.parentSmsEnabled && status !== 'DEBOUNCED' && !isFacultyMember,
        parentPhone: parentContact,
        smsProvider: kioskConfig.smsProvider,
      };

      // Persistently record tap into the appropriate database (Faculty vs Student separated)
      if (isFacultyMember) {
        const facultyUserId = dynamicFaculty?.id || (
          tokenUid === '0008522401' ? '11111111-1111-1111-1111-000000000002' :
          tokenUid === '0008522402' ? '11111111-1111-1111-1111-000000000007' :
          tokenUid === '0008522403' ? '11111111-1111-1111-1111-000000000003' :
          tokenUid === '0008522404' ? '11111111-1111-1111-1111-000000000008' :
          tokenUid === '0008522405' ? '11111111-1111-1111-1111-000000000004' :
          tokenUid === '0008522406' ? '11111111-1111-1111-1111-000000000009' :
          'fac-' + tokenUid
        );

        apiClient.recordFacultyTap({
          userId: facultyUserId,
          name: personName,
          role: dynamicFaculty?.role || preseededFaculty?.role || 'TEACHER',
          position: dynamicFaculty?.position || preseededFaculty?.role || 'Faculty / Staff',
          rfid: tokenUid,
          status: status as any,
          timeStr,
          isoTimestamp: now.toISOString(),
          dateStr: now.toISOString().split('T')[0],
        });
      } else {
        apiClient.recordKioskTap({
          studentId: dynamicStudent?.id,
          lrn: (personId || '').replace(/^LRN:\s*/, ''),
          name: personName,
          rfid: tokenUid,
          status: status as any,
          timeStr,
          isoTimestamp: now.toISOString(),
          dateStr: now.toISOString().split('T')[0],
        });
      }

      // Play audio chime
      playChime(status === 'CLOCK_IN' ? 'in' : status === 'CLOCK_OUT' ? 'out' : 'debounce');

      // Flash feedback for configured duration in seconds
      setFlashData(payload);
      setRecentLogs((prev) => [payload, ...prev.slice(0, 7)]);
      setRfidInput('');

      const durationMs = kioskConfig.displayDurationSeconds * 1000;

      setTimeout(() => {
        setFlashData(null);
        setIsProcessing(false);
        // Ensure reader is refocused immediately after flash feedback
        if (inputRef.current) {
          inputRef.current.focus({ preventScroll: true });
        }
      }, durationMs);
    } catch {
      setIsProcessing(false);
    }
  };

  // Auto-scan when 10 numerical digits are received (for USB readers without Enter key)
  useEffect(() => {
    const clean = rfidInput.trim();
    if (clean.length === 10 && /^\d{10}$/.test(clean) && !isProcessing && !flashData) {
      const timer = setTimeout(() => {
        handleScan(clean);
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [rfidInput, isProcessing, flashData]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (rfidInput.trim()) {
        handleScan(rfidInput.trim());
      }
    }
  };

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between overflow-hidden select-none font-sans">
      {/* ------------------------------------------------------------- */}
      {/* HIDDEN PERSISTENT RFID READER INPUT                           */}
      {/* Continuously captures USB HID RFID turnstile scanner input    */}
      {/* without displaying any input box or typed digits on-screen    */}
      {/* ------------------------------------------------------------- */}
      <input
        ref={inputRef}
        id="rfid-reader-input"
        type="text"
        value={rfidInput}
        onChange={(e) => setRfidInput(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={() => {
          setTimeout(() => {
            if (!flashData) inputRef.current?.focus({ preventScroll: true });
          }, 50);
        }}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        maxLength={10}
        aria-hidden="true"
        tabIndex={-1}
        className="fixed top-0 left-0 w-0 h-0 opacity-0 pointer-events-none -z-50 m-0 p-0 border-0 outline-none select-none"
        autoFocus
      />

      {/* ------------------------------------------------------------- */}
      {/* 1. TOP HEADER: Centered School Brand & Digital Clock          */}
      {/* ------------------------------------------------------------- */}
      <header className="w-full bg-slate-900/90 border-b border-slate-800/80 px-6 py-4 grid grid-cols-1 md:grid-cols-3 items-center gap-4 backdrop-blur-xl z-30 shadow-lg">
        {/* Left: Return to Dashboard */}
        <div className="flex items-center justify-start">
          <Link
            href="/dashboard"
            className="p-2 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors flex items-center space-x-1.5 text-xs font-semibold shadow-sm"
            title="Return to App Dashboard"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Dashboard</span>
          </Link>
        </div>

        {/* Center: School Name & DepEd ID (Below) */}
        <div className="text-center flex flex-col items-center justify-center space-y-1">
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
            {school.name}
          </h1>
          <span className="inline-flex px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-blue-950/80 text-cyan-300 border border-cyan-800/60 shadow-sm">
            DepEd ID: {school.deped_school_id}
          </span>
        </div>

        {/* Right: iDentify Brand Emblem */}
        <div className="hidden md:flex items-center justify-end">
          <IdentifyLogo size="sm" showSubtitle={false} />
        </div>
      </header>

      {/* ------------------------------------------------------------- */}
      {/* 2. CENTER HERO AREA & AMBIENT SCANNING ZONE                   */}
      {/* ------------------------------------------------------------- */}
      <div className="relative flex-1 flex flex-col items-center justify-center p-6 z-10">
        {/* Background Watermark Logo (Enlarged) */}
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-300"
          style={{ opacity: 0.2 }}
        >
          <img
            src={school.logo_url}
            alt={`${school.name} Seal`}
            className="w-[85vw] max-w-[850px] h-[80vh] max-h-[850px] object-contain drop-shadow-2xl"
          />
        </div>

        {/* Ambient Listening & Scan Ready UI */}
        {!flashData ? (
          <div className="relative z-20 flex flex-col items-center text-center space-y-6 max-w-xl mx-auto">
            {/* DAY AND DATE (SAME SIZE & COLOR) AND CURRENT TIME (NO MILLISECONDS) */}
            <div className="text-center space-y-1.5">
              <h2 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-white uppercase drop-shadow-2xl">
                {currentWeekday}
              </h2>
              <h2 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-white uppercase drop-shadow-2xl">
                {currentUsDate}
              </h2>
              <div className="pt-2">
                <span className="font-mono text-2xl sm:text-4xl md:text-5xl font-black text-emerald-400 tracking-wider tabular-nums drop-shadow-xl bg-slate-900/60 px-6 py-2 rounded-2xl border border-emerald-500/20 shadow-inner inline-block">
                  {displayTime || '07:00:00 AM'}
                </span>
              </div>
            </div>

            {/* Animated Pulse Ring with iDentify Scanner Emblem */}
            <div className="relative flex items-center justify-center">
              <div className="absolute w-36 h-36 rounded-full bg-cyan-500/10 animate-ping pointer-events-none" />
              <div className="w-28 h-28 rounded-3xl bg-slate-900/90 border-2 border-cyan-500/50 shadow-2xl shadow-cyan-500/20 flex items-center justify-center backdrop-blur-xl">
                <Radio className="w-12 h-12 text-cyan-400 animate-pulse" />
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <h3 className="text-2xl sm:text-3xl font-black text-white tracking-wide">
                  READY TO SCAN
                </h3>
                <p className="text-sm font-medium text-slate-400">
                  Tap your RFID smart card or student ID on the turnstile reader
                </p>
              </div>

              {/* Live Scanner Hardware State Indicator */}
              <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-slate-900/80 border border-slate-800 text-xs font-mono shadow-inner">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-emerald-400 font-bold tracking-wide">RFID SENSOR ACTIVE</span>
                <span className="text-slate-600">&bull;</span>
                <span className="text-slate-400">READY FOR TAP</span>
              </div>
            </div>
          </div>
        ) : (
          /* ----------------------------------------------------------- */
          /* 3. TWO-SECOND FLASH FEEDBACK OVERLAY (WITH INVALID STATE)   */
          /* ----------------------------------------------------------- */
          <div className={`relative z-30 w-full max-w-md bg-slate-900/95 border-2 rounded-3xl p-7 shadow-2xl backdrop-blur-2xl animate-fade-in text-center transform transition-all duration-200 ${
            flashData.status === 'INVALID' ? 'border-rose-500 shadow-rose-950/60' : 'border-blue-500/80 shadow-cyan-950/50'
          }`}>
            {/* Status Header Badge */}
            <div className="flex justify-center mb-4">
              {flashData.status === 'INVALID' && (
                <span className="inline-flex items-center space-x-2 px-5 py-2 rounded-full text-sm font-black bg-rose-600 text-white shadow-xl shadow-rose-600/40 uppercase tracking-wider animate-bounce">
                  <ShieldAlert className="w-5 h-5" />
                  <span>INVALID ID / ACCESS DENIED</span>
                </span>
              )}

              {flashData.status === 'CLOCK_IN' && (
                <span className="inline-flex items-center space-x-2 px-5 py-2 rounded-full text-sm font-black bg-emerald-500 text-slate-950 shadow-xl shadow-emerald-500/30 uppercase tracking-wider animate-bounce">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>CLOCKED IN (TIME-IN)</span>
                </span>
              )}

              {flashData.status === 'CLOCK_OUT' && (
                <span className="inline-flex items-center space-x-2 px-5 py-2 rounded-full text-sm font-black bg-amber-400 text-slate-950 shadow-xl shadow-amber-400/30 uppercase tracking-wider animate-bounce">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>CLOCKED OUT (TIME-OUT)</span>
                </span>
              )}

              {flashData.status === 'DEBOUNCED' && (
                <span className="inline-flex items-center space-x-2 px-5 py-2 rounded-full text-sm font-black bg-blue-500 text-slate-950 shadow-xl shadow-blue-500/30 uppercase tracking-wider">
                  <AlertCircle className="w-5 h-5" />
                  <span>TAP DEBOUNCED (&lt;30 MIN)</span>
                </span>
              )}
            </div>

            {/* Photo / Alert Graphic */}
            <div className={`relative w-32 h-32 mx-auto rounded-3xl overflow-hidden border-4 shadow-2xl mb-4 flex items-center justify-center ${
              flashData.status === 'INVALID' ? 'border-rose-500/80 bg-rose-950/60' : 'border-white/20 bg-slate-800'
            }`}>
              {flashData.status === 'INVALID' ? (
                <div className="flex flex-col items-center justify-center text-rose-400 p-2 text-center">
                  <ShieldAlert className="w-14 h-14 text-rose-500 animate-pulse" />
                  <span className="text-[10px] font-mono font-black uppercase tracking-wider mt-1 text-rose-300">
                    NOT REGISTERED
                  </span>
                </div>
              ) : (
                <img
                  src={flashData.photoUrl}
                  alt={flashData.studentName}
                  className="w-full h-full object-cover"
                />
              )}
            </div>

            {/* Person Name & Academic/Role Information */}
            <h3 className={`text-2xl font-black tracking-tight ${flashData.status === 'INVALID' ? 'text-rose-400' : 'text-white'}`}>
              {flashData.studentName}
            </h3>
            <p className={`text-sm font-semibold mt-0.5 ${flashData.status === 'INVALID' ? 'text-rose-300' : 'text-cyan-400'}`}>
              {flashData.gradeSection}
            </p>
            <p className="text-xs font-mono text-slate-400 mt-1">
              {flashData.lrn}
            </p>

            <div className={`mt-3 p-2.5 rounded-xl border text-xs ${
              flashData.status === 'INVALID'
                ? 'bg-rose-950/80 border-rose-800/80 text-rose-200 font-medium'
                : 'bg-slate-950/70 border-slate-800 text-slate-300'
            }`}>
              {flashData.message}
            </div>

            {/* Real-time SMS Dispatch Status (Configurable in School Settings) */}
            {kioskConfig.showSmsStatus && flashData.status !== 'INVALID' && !flashData.isFaculty && (
              <div className="mt-3 p-2.5 rounded-xl bg-slate-950/90 border border-emerald-500/30 text-xs flex items-center justify-between shadow-inner">
                <div className="flex items-center space-x-2.5 text-left">
                  <div className={`p-1.5 rounded-lg ${
                    flashData.smsDispatched
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-slate-800 text-slate-400'
                  }`}>
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-white block text-xs">
                      {flashData.smsDispatched ? 'Parent SMS Notification' : 'SMS Notification Standby'}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {flashData.smsDispatched
                        ? `${flashData.parentPhone || 'Parent contact'} • ${flashData.smsProvider || 'EasySMS'}`
                        : 'Auto-dispatch disabled or duplicate tap debounced'}
                    </span>
                  </div>
                </div>

                <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase ${
                  flashData.smsDispatched
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/60 shadow-sm'
                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                }`}>
                  {flashData.smsDispatched ? 'DISPATCHED' : 'STANDBY'}
                </span>
              </div>
            )}

            {/* RFID Gate Turnstile Status Timestamp (US Format) */}
            <div className="mt-4 pt-3 border-t border-slate-800 text-center text-xs font-mono">
              <span className="text-[11px] text-cyan-400 font-bold block tracking-wider uppercase mb-0.5">
                RFID Gate Turnstile Status &amp; Timestamp
              </span>
              <span className="text-white font-semibold">
                {flashData.timestamp}
              </span>
            </div>

            {/* Configurable Auto-Reset Countdown Progress Bar */}
            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-4 overflow-hidden">
              <div
                className={`h-full w-full ${
                  flashData.status === 'INVALID'
                    ? 'bg-gradient-to-r from-rose-500 to-red-600'
                    : 'bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-400'
                }`}
                style={{
                  animation: `kioskProgressShrink ${kioskConfig.displayDurationSeconds}s linear forwards`,
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 4. FOOTER: Gate Status & Recent Ticker                        */}
      {/* ------------------------------------------------------------- */}
      <footer className="sticky bottom-0 w-full bg-slate-900/90 border-t border-slate-800/80 px-6 py-3.5 z-30 shadow-lg">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2 text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Turnstile Security Gate &bull; Multi-tap Debounce &bull; {kioskConfig.debounceMinutes}-Minute Next Tap Clock-Out Active</span>
          </div>

          {/* Quick Roster Ticker */}
          <div className="flex items-center space-x-2 overflow-x-auto max-w-xl py-1">
            {recentLogs.length === 0 ? (
              <span className="text-slate-500 italic">No recent scans logged this session</span>
            ) : (
              recentLogs.slice(0, 4).map((l, i) => (
                <span
                  key={i}
                  className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 font-mono text-[11px] text-slate-300 shrink-0"
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      l.status === 'INVALID'
                        ? 'bg-rose-500'
                        : l.status === 'CLOCK_IN'
                        ? 'bg-emerald-400'
                        : l.status === 'CLOCK_OUT'
                        ? 'bg-amber-400'
                        : 'bg-blue-400'
                    }`}
                  />
                  <span>{l.studentName.split(' ')[0]}</span>
                  <span className="text-slate-400 font-bold">
                    [{l.status === 'INVALID' ? 'INVALID' : l.status === 'DEBOUNCED' ? 'DEB' : l.status === 'CLOCK_IN' ? 'IN' : 'OUT'}]
                  </span>
                </span>
              ))
            )}
          </div>
        </div>
        <CopyrightNotice className="mt-2 text-center text-[11px] text-slate-500" />
      </footer>
    </div>
  );
}

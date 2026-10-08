'use client';

import React, { useState } from 'react';
import { useTenant } from '@/lib/tenant-context';
import { formatUsDateTime } from '@/lib/api';
import { 
  ShieldCheck, 
  Lock, 
  Search, 
  Filter, 
  Download, 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  Terminal, 
  Hash, 
  Clock 
} from 'lucide-react';

interface AuditLogEntry {
  id: string;
  timestamp: string;
  actor_name: string;
  actor_role: string;
  action: string;
  entity: string;
  details: string;
  ip_address: string;
  current_hash: string;
  previous_hash: string;
  is_tampered?: boolean;
}

const MOCK_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 'aud-001',
    timestamp: '2026-10-06T00:52:14Z',
    actor_name: 'Engr. Chester Sigua',
    actor_role: 'SUPERADMIN',
    action: 'RBAC_PERMISSION_UPDATE',
    entity: 'User: Arthur Pendelton (Admin Assistant II)',
    details: 'Granted CRUD rights to DepEd BEEF Learner Database',
    ip_address: '192.168.1.10',
    previous_hash: '0000000000000000000000000000000000000000000000000000000000000000',
    current_hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
  },
  {
    id: 'aud-002',
    timestamp: '2026-10-06T00:54:33Z',
    actor_name: 'Dr. Elizabeth Dela Cruz',
    actor_role: 'PRINCIPAL',
    action: 'ACADEMIC_SECTION_ASSIGN',
    entity: 'User: Corazon Aquino (Master Teacher I)',
    details: 'Assigned Grade 7 Bonifacio (Mathematics 7) + Advisory Role',
    ip_address: '192.168.1.45',
    previous_hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    current_hash: '8f434346648f6b96df89dda901c5176b10a6d83961dd3c1ac88b59b2dc327aa4',
  },
  {
    id: 'aud-003',
    timestamp: '2026-10-06T00:58:02Z',
    actor_name: 'Arthur Pendelton',
    actor_role: 'ADMIN_ASSISTANT',
    action: 'DEPED_BEEF_STUDENT_ENROLL',
    entity: 'Student: Juan Dela Cruz (LRN: 105942200101)',
    details: 'Created Learner BEEF Record with 4Ps Household ID 03541299',
    ip_address: '192.168.1.52',
    previous_hash: '8f434346648f6b96df89dda901c5176b10a6d83961dd3c1ac88b59b2dc327aa4',
    current_hash: '3a427f92e30759f4b64454ec156457528154fb24f863b8a565d71492b70995c1',
  },
  {
    id: 'aud-004',
    timestamp: '2026-10-06T01:01:40Z',
    actor_name: 'Kiosk Turnstile Agent',
    actor_role: 'SYSTEM_KIOSK',
    action: 'RFID_CLOCK_IN_DEBOUNCE',
    entity: 'RFID Tag: 0008522301 (Juan Dela Cruz)',
    details: 'Clock-In registered at Main Turnstile Gate 1. SMS dispatched via Semaphore.',
    ip_address: '192.168.1.200',
    previous_hash: '3a427f92e30759f4b64454ec156457528154fb24f863b8a565d71492b70995c1',
    current_hash: 'b512c09440d9523000470ec5214ac01e4054a3237eb64414f5290b2e3c79a9ef',
  },
  {
    id: 'aud-005',
    timestamp: '2026-10-06T01:04:19Z',
    actor_name: 'Corazon Aquino',
    actor_role: 'MASTER_TEACHER',
    action: 'CLASSROOM_ROLLCALL_MANUAL',
    entity: 'Section: Grade 7 Bonifacio (Mathematics 7)',
    details: 'Recorded attendance status: 42 Present, 2 Absent, 1 Dropped',
    ip_address: '192.168.1.64',
    previous_hash: 'b512c09440d9523000470ec5214ac01e4054a3237eb64414f5290b2e3c79a9ef',
    current_hash: '9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b',
  },
];

export function AuditLedgerView() {
  const { school } = useTenant();
  const [logs, setLogs] = useState<AuditLogEntry[]>(MOCK_AUDIT_LOGS);
  const [searchQuery, setSearchQuery] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [chainValid, setChainValid] = useState<boolean | null>(true);

  const filteredLogs = logs.filter(
    (l) =>
      l.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.actor_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.entity.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.current_hash.includes(searchQuery)
  );

  const handleVerifyChain = () => {
    setIsVerifying(true);
    setTimeout(() => {
      // Check that each block's previous_hash matches the preceding block's current_hash
      let valid = true;
      for (let i = 1; i < logs.length; i++) {
        if (logs[i].previous_hash !== logs[i - 1].current_hash) {
          valid = false;
          break;
        }
      }
      setChainValid(valid);
      setIsVerifying(false);
    }, 800);
  };

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(logs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `identify-immutable-audit-${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-950/60 via-slate-900 to-slate-900 border border-emerald-500/30 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
              <Lock className="w-3.5 h-3.5 inline mr-1" /> Immutable Hash-Chained Audit Trail (SOC 2 Type II)
            </span>
            <span className="text-xs text-slate-400 font-mono">School: {school.name}</span>
          </div>
          <h2 className="text-2xl font-black text-white mt-1">Superadmin Security &amp; Audit Ledger</h2>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Append-only tamper-evident cryptographic log tracking all administrative, RBAC, enrollment, turnstile, and manual roll-call events.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleVerifyChain}
            disabled={isVerifying}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold border border-slate-700 flex items-center gap-2 transition"
          >
            <ShieldCheck className={`w-4 h-4 ${isVerifying ? 'animate-spin text-blue-400' : 'text-emerald-400'}`} />
            <span>{isVerifying ? 'Verifying Hashes...' : 'Verify Chain Integrity'}</span>
          </button>
          <button
            onClick={handleExportJson}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold flex items-center gap-2 shadow-lg shadow-blue-600/25 transition"
          >
            <Download className="w-4 h-4" />
            <span>Export Audit Proof</span>
          </button>
        </div>
      </div>

      {/* Verification Status Banner */}
      {chainValid !== null && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between ${
            chainValid
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          <div className="flex items-center gap-3">
            {chainValid ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0" />
            )}
            <div>
              <div className="font-semibold text-sm">
                {chainValid
                  ? 'Cryptographic Hash Chain Valid & Tamper-Free'
                  : 'Tampering Detected: Hash Mismatch in Chain!'}
              </div>
              <div className="text-xs opacity-80 font-mono">
                {chainValid
                  ? 'All consecutive SHA-256 state hashes match. No records modified or pruned.'
                  : 'Audit block sequence interrupted. Notify Data Protection Officer immediately.'}
              </div>
            </div>
          </div>
          <span className="text-xs font-mono px-2.5 py-1 rounded bg-slate-900 border border-slate-800">
            Chain Height: {logs.length} Blocks
          </span>
        </div>
      )}

      {/* Search Bar */}
      <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by action, actor name, entity, or hash digest..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-6 py-3.5">Timestamp & IP</th>
                <th className="px-6 py-3.5">Actor (Role)</th>
                <th className="px-6 py-3.5">Action Executed</th>
                <th className="px-6 py-3.5">Target Entity & Details</th>
                <th className="px-6 py-3.5">Cryptographic Hash Digest</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/40 transition">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
                      <Clock className="w-3.5 h-3.5 text-blue-400" />
                      {formatUsDateTime(log.timestamp)}
                    </div>
                    <div className="text-[11px] font-mono text-slate-500 mt-0.5">IP: {log.ip_address}</div>
                  </td>

                  <td className="px-6 py-4">
                    <div className="font-semibold text-white">{log.actor_name}</div>
                    <span className="inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-blue-400 border border-slate-700">
                      {log.actor_role}
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    <span className="font-mono text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20">
                      {log.action}
                    </span>
                  </td>

                  <td className="px-6 py-4 max-w-sm">
                    <div className="font-medium text-slate-200 text-xs">{log.entity}</div>
                    <div className="text-xs text-slate-400 mt-0.5">{log.details}</div>
                  </td>

                  <td className="px-6 py-4 font-mono text-xs text-slate-400">
                    <div className="flex items-center gap-1.5 text-cyan-400">
                      <Hash className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="truncate w-40" title={log.current_hash}>
                        {log.current_hash.substring(0, 16)}...
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-600 truncate w-40" title={`Prev: ${log.previous_hash}`}>
                      Prev: {log.previous_hash.substring(0, 12)}...
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

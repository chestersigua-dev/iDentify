'use client';

import React, { useState } from 'react';
import {
  X,
  Send,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  Key,
  MessageSquare,
  ShieldCheck,
  ExternalLink,
  Copy,
  Check,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

interface TestSmsModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultProvider?: string;
  defaultApiKey?: string;
  defaultSenderName?: string;
}

export function TestSmsModal({
  isOpen,
  onClose,
  defaultProvider = 'EASYSMS',
  defaultApiKey = '',
  defaultSenderName = 'iDentify',
}: TestSmsModalProps) {
  const [provider, setProvider] = useState<string>(defaultProvider);
  const [recipient, setRecipient] = useState<string>('09171234567');
  const [apiKey, setApiKey] = useState<string>(defaultApiKey);
  const [senderName, setSenderName] = useState<string>(defaultSenderName);
  const [message, setMessage] = useState<string>(
    `[iDentify DepEd Notice] Test broadcast: Gate RFID turnstile SMS notification gateway is operational for Sawat ES. Timestamp: ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`
  );
  const [sending, setSending] = useState<boolean>(false);
  const [result, setResult] = useState<any>(null);
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setResult(null);

    try {
      const res = await fetch('/api/sms/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          recipient,
          message,
          apiKey,
          senderName,
        }),
      });

      const data = await res.json();
      setResult({
        ok: res.ok && data.success,
        ...data,
      });
    } catch (err: any) {
      setResult({
        ok: false,
        error: err.message || 'Failed to dispatch SMS request to server route.',
      });
    } finally {
      setSending(false);
    }
  };

  const copyResult = () => {
    if (!result) return;
    navigator.clipboard.writeText(JSON.stringify(result, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const charCount = message.length;
  const segmentCount = Math.ceil(charCount / 160) || 1;

  return (
    <div
      className="fixed inset-0 z-50 glass-modal-backdrop bg-slate-950/60 backdrop-blur-xl flex items-center justify-center p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl relative text-slate-900 dark:text-slate-100 max-h-[92vh] overflow-y-auto custom-scrollbar animate-fade-in">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
          title="Close modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <span>Send Test SMS Notification</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 uppercase tracking-wider">
                Live Gateway
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Verify Easy Send SMS (EasySMS) API credentials and carrier dispatch
            </p>
          </div>
        </div>

        {/* Provider Documentation Link */}
        <div className="mt-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span className="text-slate-700 dark:text-slate-300 font-medium">
              API Endpoint: <code className="text-emerald-600 dark:text-emerald-400 font-mono">https://restapi.easysendsms.app/v1/rest/sms/send</code>
            </span>
          </div>
          <a
            href="https://my.easysendsms.app/api_references"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1 font-semibold"
          >
            <span>API Docs</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {/* Form */}
        <form onSubmit={handleSend} className="mt-4 space-y-4 text-xs">
          {/* Provider Selection */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Select SMS Gateway Provider
            </label>
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white font-medium focus:outline-none focus:border-emerald-500"
            >
              <option value="EASYSMS">Easy Send SMS (https://restapi.easysendsms.app)</option>
              <option value="SEMAPHORE">Semaphore PH (https://api.semaphore.co)</option>
              <option value="PHILSMS">PhilSMS Gateway (https://dashboard.philsms.com)</option>
              <option value="MOCK">Local DepEd Mock Simulator</option>
            </select>
          </div>

          {/* Recipient Phone & Sender ID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                <span>Recipient Mobile Number</span>
                <span className="text-[10px] text-slate-400 font-normal">PH Format</span>
              </label>
              <input
                type="text"
                required
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="e.g. 09171234567 or +639171234567"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Sender ID / Mask
              </label>
              <input
                type="text"
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                placeholder="e.g. iDentify"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white font-medium focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* API Key */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-emerald-500" />
                <span>{provider === 'EASYSMS' ? 'EasySMS API Key' : `${provider} API Key / Token`}</span>
              </span>
              <span className="text-[10px] text-slate-400 font-normal">
                Passed in <code className="font-mono text-emerald-600 dark:text-emerald-400">apikey</code> header
              </span>
            </label>
            <input
              type="text"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Paste your API key here (e.g. from my.easysendsms.app)"
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white font-mono focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Message Textarea */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-emerald-500" />
                <span>Test SMS Body</span>
              </span>
              <span className="text-[10px] text-slate-400">
                {charCount} chars &bull; {segmentCount} SMS segment(s)
              </span>
            </label>
            <textarea
              rows={3}
              required
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 leading-relaxed font-sans"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={sending}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={sending}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold shadow-md shadow-emerald-900/30 flex items-center gap-2 transition disabled:opacity-50 cursor-pointer"
            >
              {sending ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Dispatching to EasySMS...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Test SMS Now</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Result Feedback Banner */}
        {result && (
          <div className="mt-4 animate-fade-in space-y-2">
            <div
              className={`p-4 rounded-2xl border ${
                result.ok
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                  : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  {result.ok ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
                  )}
                  <div>
                    <div className="font-bold text-xs">
                      {result.ok
                        ? result.mode === 'MOCK_SIMULATED'
                          ? 'Test SMS Verified & Simulated (Gateway Active)'
                          : 'SMS Dispatched Successfully to EasySMS Gateway!'
                        : 'SMS Dispatch Error'}
                    </div>
                    <div className="text-[11px] opacity-90 mt-0.5">
                      {result.error ||
                        result.message ||
                        `Status: ${result.status} • Provider ID: ${result.providerMessageId || 'N/A'}`}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={copyResult}
                  className="p-1.5 rounded-lg bg-black/10 hover:bg-black/20 dark:bg-white/10 dark:hover:bg-white/20 transition text-xs flex items-center gap-1"
                  title="Copy response payload"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* Payload Breakdown */}
              <div className="mt-3 pt-3 border-t border-black/10 dark:border-white/10 text-[10px] font-mono grid grid-cols-2 gap-2">
                <div>
                  <span className="opacity-70">Provider:</span>{' '}
                  <span className="font-bold">{result.provider}</span>
                </div>
                <div>
                  <span className="opacity-70">Recipient:</span>{' '}
                  <span className="font-bold">{result.recipient}</span>
                </div>
                <div>
                  <span className="opacity-70">Message ID:</span>{' '}
                  <span className="font-bold truncate">{result.providerMessageId || 'N/A'}</span>
                </div>
                <div>
                  <span className="opacity-70">Timestamp:</span>{' '}
                  <span className="font-bold">{new Date(result.timestamp).toLocaleTimeString()}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

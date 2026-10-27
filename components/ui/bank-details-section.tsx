'use client';

import { Landmark, MapPin, Phone, Mail, Play, Download, Copy, Check, CreditCard } from 'lucide-react';

export function BankDetailsSection() {
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      return true;
    }
  };

  const handleCopy = async (text: string, setCopied: (v: boolean) => void) => {
    const success = await copyToClipboard(text);
    if (success) setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="relative overflow-hidden rounded-xl bg-zinc-900/40 border border-amber-500/20 p-3">
      <div className="relative max-w-md mx-auto">
        <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 text-[10px] font-medium mb-2">
          <Landmark className="w-3 h-3 flex-shrink-0" />
          Give & Support — Official Bank Details
        </div>

        <div className="bg-zinc-900/40 border border-zinc-800/40 rounded-lg p-3 space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0">
              <Landmark className="w-4 h-4 text-amber-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider">Bank</p>
              <p className="text-sm font-semibold text-white">United Bank for Africa (UBA)</p>
            </div>
          </div>

          <div className="bg-zinc-900/30 rounded-lg p-3 border border-zinc-800/40 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-medium text-zinc-400 w-20 flex-shrink-0">Account Name</span>
              <div className="flex-1 flex items-center gap-2">
                <span className="font-mono text-sm font-bold text-white break-all">GLORIOUS ASSEMBLY MINISTRIES INTERNATIONAL</span>
                <button
                  onClick={() => navigator.clipboard.writeText('GLORIOUS ASSEMBLY MINISTRIES INTERNATIONAL')}
                  className="px-2 py-1 text-[10px] bg-zinc-800 text-zinc-400 hover:text-zinc-200 rounded transition flex-shrink-0"
                >
                  Copy
                </button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-medium text-zinc-400 w-20 flex-shrink-0">Account Number</span>
              <div className="flex-1 flex items-center gap-2">
                <span className="font-mono text-sm font-bold text-amber-400 tracking-widest break-all">2209113248</span>
                <button
                  onClick={() => navigator.clipboard.writeText('2209113248')}
                  className="px-2 py-1 text-[10px] bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 text-amber-300 rounded transition flex-shrink-0 font-medium"
                >
                  Copy Account Number
                </button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-medium text-zinc-400 w-20 flex-shrink-0">Bank</span>
              <span className="text-sm font-medium text-white">United Bank for Africa (UBA)</span>
            </div>
          </div>

          <div className="pt-2 border-t border-zinc-800/40">
            <p className="text-[10px] font-medium text-zinc-400 mb-1">For</p>
            <div className="flex flex-wrap gap-1.5">
              {['Tithes', 'General Offerings', 'Ministers\' Offerings', 'Building Fund', 'Missions & Outreach', 'All Contributions'].map((purpose) => (
                <span key={purpose} className="px-2 py-0.5 text-[10px] bg-zinc-800 text-zinc-300 rounded-full border border-zinc-700">
                  {purpose}
                </span>
              ))}
            </div>
          </div>

          <p className="text-[10px] text-zinc-500 italic bg-zinc-900/30 rounded p-2 border border-zinc-800/40">
            Use this account for ALL giving — Tithes, Offerings, Ministers' Offerings, and all other contributions.
          </p>
        </div>
      </div>
    </section>
  );
}
'use client';

import { Landmark, Copy, Check } from 'lucide-react';

interface BankDetailsProps {
  accountName: string;
  accountNumber: string;
  bankName: string;
  purposes: string[];
  note: string;
}

export function OfficialBankDetails({ 
  accountName = 'GLORIOUS ASSEMBLY MINISTRIES INTERNATIONAL',
  accountNumber = '2209113248',
  bankName = 'United Bank for Africa (UBA)',
  purposes = ['Tithes', 'General Offerings', 'Ministers\' Offerings', 'Building Fund', 'Missions & Outreach', 'All Contributions'],
  note = 'Use this account for ALL giving — Tithes, Offerings, Ministers\' Offerings, and all other contributions.'
}: BankDetailsProps) {
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

  return (
    <section className="relative overflow-hidden rounded-2xl bg-zinc-900/50 border border-amber-500/20 p-6 md:p-8">
      <div className="relative max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 text-xs font-medium mb-6">
          <Landmark className="w-3.5 h-3.5 flex-shrink-0" />
          Give & Support — Official Bank Details
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-amber-500/20 flex items-center justify-center flex-shrink-0">
              <Landmark className="w-7 h-7 text-amber-400" />
            </div>
            <div>
              <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Bank</p>
              <p className="font-semibold text-white">{bankName}</p>
            </div>
          </div>

          <div className="bg-zinc-900/30 rounded-xl p-5 border border-zinc-800/50 space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-xs font-medium text-zinc-400 w-28 flex-shrink-0">Account Name</span>
              <div className="flex-1 flex items-center gap-3">
                <span className="font-mono text-lg font-bold text-white break-all">{accountName}</span>
                <button
                  onClick={() => navigator.clipboard.writeText(accountName)}
                  className="px-3 py-1.5 text-xs bg-zinc-800 text-zinc-400 hover:text-zinc-200 rounded-lg transition flex-shrink-0"
                >
                  Copy
                </button>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-medium text-zinc-400 w-28 flex-shrink-0">Account Number</span>
              <div className="flex-1 flex items-center gap-3">
                <span className="font-mono text-2xl font-bold text-amber-400 tracking-widest break-all">{accountNumber}</span>
                <button
                  onClick={() => navigator.clipboard.writeText(accountNumber)}
                  className="px-4 py-2 text-xs bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 text-amber-300 rounded-lg transition flex-shrink-0 font-medium"
                >
                  Copy Account Number
                </button>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-medium text-zinc-400 w-28 flex-shrink-0">Bank</span>
              <span className="font-medium text-white">{bankName}</span>
            </div>
          </div>

          <div className="pt-3 border-t border-zinc-800/50">
            <p className="text-xs font-medium text-zinc-400 mb-3">For</p>
            <div className="flex flex-wrap gap-2">
              {purposes.map((purpose) => (
                <span key={purpose} className="px-3 py-1 text-xs bg-zinc-800 text-zinc-300 rounded-full border border-zinc-700">
                  {purpose}
                </span>
              ))}
            </div>
          </div>

          <p className="text-xs text-zinc-500 italic bg-zinc-900/30 rounded-lg p-4 border border-zinc-800/50">
            {note}
          </p>
        </div>
      </div>
    </section>
  );
}
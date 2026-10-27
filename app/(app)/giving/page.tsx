'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Heart, Building2, Landmark, Info } from 'lucide-react';
import Link from 'next/link';

interface BankItem {
  id: string;
  title: string;
  detail_value: string;
  extra_meta: string | null;
  display_order: number;
}

const OFFICIAL_BANK_DETAILS = {
  bankName: 'United Bank for Africa (UBA)',
  accountName: 'GLORIOUS ASSEMBLY MINISTRIES INTERNATIONAL',
  accountNumber: '2209113248',
  purposes: [
    'Tithes',
    'General Offerings',
    'Ministers\' Offerings',
    'Building Fund',
    'Missions & Outreach',
    'All Other Contributions'
  ],
  note: 'Use this account for ALL giving - Tithes, Offerings, Ministers\' Offerings, and all other contributions.'
};

export default function GivingPage() {
  const [accounts, setAccounts] = useState<BankItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAccounts = async () => {
      const supabase = createClient();
      const { data } = await supabase.from('church_directory').select('*').eq('category', 'bank_account').order('display_order', { ascending: true });
      setAccounts(data || []);
      setLoading(false);
    };
    fetchAccounts();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4 py-3 pb-32">
        <div className="empty-state">
          <Landmark className="empty-state-icon" />
          <p className="empty-state-title">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 py-3 pb-32">
      {/* Official Bank Details - Compact */}
      <section className="relative overflow-hidden rounded-xl bg-zinc-900/40 border border-amber-500/20 p-3">
        <div className="relative">
          <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 text-[10px] font-medium mb-2">
            <Info className="w-3 h-3 flex-shrink-0" />
            Official Bank Details — Tap to Copy
          </div>

          <div className="bg-zinc-900/40 border border-zinc-800/40 rounded-xl p-3 space-y-3">
            <div className="flex items-center gap-3">
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
                  <p className="font-mono text-sm font-bold text-white break-all" id="account-name">GLORIOUS ASSEMBLY MINISTRIES INTERNATIONAL</p>
                  <button
                    onClick={async () => {
                      await navigator.clipboard.writeText('GLORIOUS ASSEMBLY MINISTRIES INTERNATIONAL');
                    }}
                    className="px-2 py-1 text-[10px] bg-zinc-800 text-zinc-400 hover:text-zinc-200 rounded transition flex-shrink-0"
                  >
                    Copy
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-medium text-zinc-400 w-20 flex-shrink-0">Account Number</span>
                <div className="flex-1 flex items-center gap-2">
                  <p className="font-mono text-sm font-bold text-amber-400 tracking-widest break-all" id="account-number">2209113248</p>
                  <button
                    onClick={async () => {
                      await navigator.clipboard.writeText('2209113248');
                    }}
                    className="px-2 py-1 text-[10px] bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 text-amber-300 rounded transition flex-shrink-0 font-medium"
                  >
                    Copy
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-medium text-zinc-400 w-20 flex-shrink-0">Bank</span>
                <p className="text-sm font-medium text-white">United Bank for Africa (UBA)</p>
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

      <section className="p-3 space-y-2">
        <h2 className="text-xs font-bold text-white flex items-center gap-1">
          <Building2 className="w-3.5 h-3.5 text-primary" />
          Why We Give
        </h2>
        <p className="text-[10px] text-zinc-400 leading-relaxed">
          Your giving funds missions, community outreach, media production, and the upkeep of God's house. Every seed is a partnership with the vision.
        </p>
        <p className="text-[10px] text-zinc-500 italic">
          “Each of you should give what you have decided in your heart to give, not reluctantly or under compulsion, for God loves a cheerful giver.” — 2 Cor 9:7
        </p>
      </section>
    </div>
  );
}
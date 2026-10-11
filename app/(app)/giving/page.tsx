'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { CopyButton } from '@/components/giving/bank-card';
import { Heart, Building2, Landmark, Copy, Check, AlertCircle, Info } from 'lucide-react';

interface BankItem {
  id: string;
  title: string;
  detail_value: string;
  extra_meta: string | null;
  display_order: number;
}

// Hardcoded official bank details for easy access
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
      <div className="space-y-6 py-4 pb-32">
        <div className="empty-state">
          <Landmark className="empty-state-icon" />
          <p className="empty-state-title">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 py-4 pb-32">
      {/* Official Bank Details - Prominent & Copiable */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500/10 via-zinc-900/50 to-zinc-950 border border-amber-500/20 p-6">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(245,158,11,0.15),_transparent)]" />
        <div className="relative">
          {/* Alert Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 text-xs font-medium mb-4">
            <Info className="w-3.5 h-3.5 flex-shrink-0" />
            Official Bank Details — Tap to Copy
          </div>

          {/* Bank Card */}
          <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-5 space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-xl bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                <Landmark className="w-7 h-7 text-amber-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Bank</p>
                <p className="font-semibold text-white">United Bank for Africa (UBA)</p>
              </div>
            </div>

            <div className="bg-zinc-900/30 rounded-xl p-4 border border-zinc-800/50 space-y-3">
              <div className="flex items-center gap-3">
                <p className="text-xs font-medium text-zinc-400 w-32 flex-shrink-0">Account Name</p>
                <div className="flex-1 flex items-center gap-3">
                  <p className="font-mono text-lg font-bold text-white break-all" id="account-name">GLORIOUS ASSEMBLY MINISTRIES INTERNATIONAL</p>
                  <button
                    onClick={async () => {
                      await navigator.clipboard.writeText('GLORIOUS ASSEMBLY MINISTRIES INTERNATIONAL');
                    }}
                    className="px-3 py-1.5 text-xs bg-zinc-800 text-zinc-400 hover:text-zinc-200 rounded-lg transition flex-shrink-0"
                  >
                    Copy
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <p className="text-xs font-medium text-zinc-400 w-32 flex-shrink-0">Account Number</p>
                <div className="flex-1 flex items-center gap-3">
                  <p className="font-mono text-xl font-bold text-amber-400 tracking-widest break-all" id="account-number">2209113248</p>
                  <button
                    onClick={async () => {
                      await navigator.clipboard.writeText('2209113248');
                    }}
                    className="px-3 py-1.5 text-xs bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 text-amber-300 rounded-lg transition flex-shrink-0 font-medium"
                  >
                    Copy
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <p className="text-xs font-medium text-zinc-400 w-32 flex-shrink-0">Bank</p>
                <p className="font-medium text-white">United Bank for Africa (UBA)</p>
              </div>
            </div>

            {/* Purposes */}
            <div className="pt-2 border-t border-zinc-800/50">
              <p className="text-xs font-medium text-zinc-400 mb-2">For</p>
              <div className="flex flex-wrap gap-2">
                {['Tithes', 'General Offerings', 'Ministers\' Offerings', 'Building Fund', 'Missions & Outreach', 'All Contributions'].map((purpose) => (
                  <span key={purpose} className="px-2.5 py-1 text-xs bg-zinc-800 text-zinc-300 rounded-full border border-zinc-700">
                    {purpose}
                  </span>
                ))}
              </div>
            </div>

            {/* Note */}
            <p className="text-xs text-zinc-500 italic bg-zinc-900/30 rounded-lg p-3 border border-zinc-800/50">
              Use this account for ALL giving — Tithes, Offerings, Ministers' Offerings, and all other contributions.
            </p>
          </div>
        </div>
      </section>

      <section className="glass-card p-5 space-y-3">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <Building2 className="w-4 h-4 text-primary" />
          Why We Give
        </h2>
        <p className="text-xs text-zinc-400 leading-relaxed">
          Your giving funds missions, community outreach, media production, and the upkeep of God&apos;s house.
          Every seed is a partnership with the vision.
        </p>
        <p className="text-xs text-zinc-500 italic">
          &ldquo;Each of you should give what you have decided in your heart to give, not reluctantly or under compulsion, for God loves a cheerful giver.&rdquo; — 2 Cor 9:7
        </p>
      </section>
    </div>
  );
}
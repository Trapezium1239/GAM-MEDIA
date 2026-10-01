import { createClient } from '@/lib/supabase/server';
import { CopyButton } from '@/components/giving/bank-card';
import { Heart, Building2, Landmark } from 'lucide-react';

interface BankItem {
  id: string;
  title: string;
  detail_value: string;
  extra_meta: string | null;
  display_order: number;
}

export default async function GivingPage() {
  const supabase = await createClient();
  const { data: accounts } = await supabase.from('church_directory').select('*').eq('category', 'bank_account').order('display_order', { ascending: true });

  return (
    <div className="space-y-6 py-4 pb-32">
      <header className="text-center py-4">
        <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-3">
          <Heart className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-white">Give & Support</h1>
        <p className="text-xs text-zinc-400 mt-1">Seed into the vision of Glorious Assembly Ministries International</p>
      </header>

      {accounts && accounts.length > 0 ? (
        <div className="space-y-4">
          {accounts.map((account) => (
            <CopyButton key={account.id} title={account.title} value={account.detail_value} meta={account.extra_meta} />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <Landmark className="empty-state-icon" />
          <p className="empty-state-title">Giving details will appear here soon</p>
          <p className="empty-state-desc">The admin is setting up the accounts</p>
        </div>
      )}

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
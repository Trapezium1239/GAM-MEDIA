'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Send, Megaphone, AlertCircle, AlertTriangle, Info } from 'lucide-react';

const levelOptions = [
  { value: 'info', label: 'Info', icon: Info, color: 'text-blue-400' },
  { value: 'advisory', label: 'Advisory', icon: AlertTriangle, color: 'text-amber-400' },
  { value: 'urgent', label: 'Urgent', icon: AlertCircle, color: 'text-red-400' },
] as const;

const groupOptions = ['general', 'choir', 'media', 'ushers', 'youth'] as const;

export default function AdminAlertsPage() {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [level, setLevel] = useState<'info' | 'advisory' | 'urgent'>('info');
  const [targetGroup, setTargetGroup] = useState<string>('general');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (title.length < 3 || message.length < 5) {
      setResult({ ok: false, msg: 'Title needs 3+ chars, message needs 5+ chars' });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch('/api/admin/broadcast-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, message, level, target_group: targetGroup }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(typeof data.error === 'string' ? data.error : 'Broadcast failed');
      }

      setResult({ ok: true, msg: 'Alert broadcasted successfully!' });
      setTitle('');
      setMessage('');
      router.refresh();
    } catch (err) {
      setResult({ ok: false, msg: err instanceof Error ? err.message : 'Something went wrong' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 py-4">
      <header>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Megaphone className="w-6 h-6 text-red-400" />
          Broadcast Alert
        </h1>
        <p className="text-xs text-zinc-400 mt-1">Alerts auto-expire after 24 hours</p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-5 p-5 rounded-2xl bg-zinc-900 border border-zinc-800">
        <div className="space-y-1.5">
          <label htmlFor="alert-title" className="label-base text-zinc-300">Title</label>
          <input
            id="alert-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Service moved to Hall B"
            className="input-base"
            maxLength={100}
            required
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="alert-message" className="label-base text-zinc-300">Message</label>
          <textarea
            id="alert-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Full details for the congregation..."
            className="input-base min-h-[100px] resize-none"
            maxLength={500}
            required
          />
          <p className="text-[10px] text-zinc-600 text-right">{message.length}/500</p>
        </div>

        <div className="space-y-1.5">
          <p className="label-base text-zinc-300">Level</p>
          <div className="grid grid-cols-3 gap-2">
            {levelOptions.map((opt) => {
              const Icon = opt.icon;
              const isActive = level === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setLevel(opt.value)}
                  className={`flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-medium transition touch-manipulation border ${
                    isActive
                      ? 'bg-zinc-800 border-zinc-600 text-white'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300'
                  }`}
                  aria-pressed={isActive}
                >
                  <Icon className={`w-4 h-4 ${isActive ? opt.color : ''}`} />
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-1.5">
          <p className="label-base text-zinc-300">Target Group</p>
          <div className="flex flex-wrap gap-2">
            {groupOptions.map((group) => {
              const isActive = targetGroup === group;
              return (
                <button
                  key={group}
                  type="button"
                  onClick={() => setTargetGroup(group)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition capitalize touch-manipulation ${
                    isActive
                      ? 'bg-primary text-white'
                      : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                  aria-pressed={isActive}
                >
                  {group}
                </button>
              );
            })}
          </div>
        </div>

        {result && (
          <p className={`text-xs rounded-lg px-3 py-2 ${result.ok ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`} role="alert">
            {result.msg}
          </p>
        )}

        <button type="submit" disabled={loading} className="btn-primary w-full h-11">
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Broadcasting...
            </>
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              Broadcast Alert
            </>
          )}
        </button>
      </form>
    </div>
  );
}
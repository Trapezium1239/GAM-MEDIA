'use client';

import { useState } from 'react';
import { Copy, Check, Landmark } from 'lucide-react';

interface CopyButtonProps {
  title: string;
  value: string;
  meta?: string | null;
}

export function CopyButton({ title, value, meta }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = value;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="w-full p-4 rounded-2xl bg-zinc-900 border border-zinc-800 text-left transition hover:border-primary/50 active:scale-[0.98] touch-manipulation"
      aria-label={`Copy ${title} account number`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Landmark className="w-3.5 h-3.5 text-primary flex-shrink-0" />
            <p className="text-xs font-medium text-zinc-400 truncate">{title}</p>
          </div>
          <p className="text-lg font-bold text-white font-mono tracking-wider">{value}</p>
          {meta && <p className="text-[11px] text-zinc-500 mt-1">{meta}</p>}
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${copied ? 'bg-green-500/20 text-green-400' : 'bg-zinc-800 text-zinc-400'}`}>
          {copied ? <Check className="w-5 h-5" /> : <Copy className="w-4 h-4" />}
        </div>
      </div>
      <p className={`text-xs mt-2 transition-colors ${copied ? 'text-green-400' : 'text-zinc-600'}`}>
        {copied ? 'Account number copied!' : 'Tap to copy'}
      </p>
    </button>
  );
}
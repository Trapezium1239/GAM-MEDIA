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
      className="w-full p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-left transition hover:border-primary/50 active:scale-[0.98] touch-manipulation"
      aria-label={`Copy ${title} account number`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1 mb-1">
            <Landmark className="w-3 h-3 text-primary flex-shrink-0" />
            <p className="text-[10px] font-medium text-zinc-400 truncate">{title}</p>
          </div>
          <p className="text-sm font-bold text-white font-mono tracking-wider">{value}</p>
          {meta && <p className="text-[10px] text-zinc-500 mt-1">{meta}</p>}
        </div>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${copied ? 'bg-green-500/20 text-green-400' : 'bg-zinc-800 text-zinc-400'}`}>
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-3.5 h-3.5" />}
        </div>
      </div>
      <p className={`text-[10px] mt-1 transition-colors ${copied ? 'text-green-400' : 'text-zinc-600'}`}>
        {copied ? 'Account number copied!' : 'Tap to copy'}
      </p>
    </button>
  );
}
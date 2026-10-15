'use client';

import { Share2, Download } from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { triggerHaptic } from '@/lib/native/haptics';

export function DevotionalActions() {
  const { toast } = useToast();

  const handleShare = async () => {
    try {
      await triggerHaptic('light');
      if (typeof navigator === 'undefined') return;
      const nav = navigator as Navigator & { share?: (data: ShareData) => Promise<void> };
      if (typeof nav.share === 'function') {
        await nav.share({
          title: 'Daily Devotional',
          text: `Daily Devotional — ${new Date().toLocaleDateString()}`,
          url: window.location.href,
        });
      } else if (nav.clipboard) {
        await nav.clipboard.writeText(window.location.href);
        toast({ type: 'success', title: 'Link copied', description: 'Devotional link copied to clipboard.' });
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      toast({ type: 'error', title: 'Share failed', description: 'Could not share this devotional.' });
    }
  };

  const handleSave = async () => {
    try {
      await triggerHaptic('light');
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(window.location.href);
      }
      toast({ type: 'success', title: 'Saved', description: 'Devotional link ready — find it anytime in your archive.' });
    } catch {
      toast({ type: 'error', title: 'Save failed', description: 'Could not save right now. Try again.' });
    }
  };

  return (
    <>
      <button type="button" onClick={handleShare} className="btn-secondary flex items-center gap-2">
        <Share2 className="w-4 h-4" />
        Share
      </button>
      <button type="button" onClick={handleSave} className="btn-secondary flex items-center gap-2">
        <Download className="w-4 h-4" />
        Save
      </button>
    </>
  );
}

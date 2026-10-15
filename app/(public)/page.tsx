import Link from 'next/link';
import { ChevronRight, BookOpen } from 'lucide-react';

// MOBILE-ONLY: static splash entry — no server data fetching (output: 'export').
export default function HomePage() {
  return (
    <div className="min-h-[80dvh] flex flex-col items-center justify-center text-center gap-8 py-16">
      <div className="space-y-4">
        <div className="w-20 h-20 mx-auto rounded-3xl bg-primary/20 border border-primary/30 flex items-center justify-center">
          <BookOpen className="w-10 h-10 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white">GAM Church</h1>
          <p className="text-sm text-zinc-400 mt-2">
            Community, Word, and Spiritual Growth — All in One Vault
          </p>
        </div>
      </div>

      <Link
        href="/login"
        className="btn-primary h-12 px-8 flex items-center justify-center gap-2 touch-manipulation"
      >
        Continue
        <ChevronRight className="w-4 h-4" />
      </Link>
    </div>
  );
}

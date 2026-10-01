import { Home } from 'lucide-react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4 px-4">
      <div className="text-8xl font-bold text-amber-400/40">404</div>
      <h2 className="text-2xl font-bold text-white">Page Not Found</h2>
      <p className="text-sm text-zinc-500 max-w-sm">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Link href="/" className="btn-accent mt-4">
        <Home className="w-4 h-4 mr-2" /> Back to Home
      </Link>
    </div>
  );
}
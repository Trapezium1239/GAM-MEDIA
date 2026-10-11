'use client';

import BulkSermonImport from '@/components/admin/bulk-sermon-import';
import { BookOpen } from 'lucide-react';

export default function AdminSermonsBulkPage() {
  return (
    <div className="space-y-6 py-4">
      <header>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-blue-400" />
          Bulk Import Sermons
        </h1>
        <p className="text-xs text-zinc-400 mt-1">Import multiple sermons from Telegram export JSON</p>
      </header>
      <BulkSermonImport />
    </div>
  );
}
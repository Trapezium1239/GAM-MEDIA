'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, FileText, Upload, CheckCircle, AlertCircle, Plus, Minus } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface SermonInput {
  title: string;
  preacher: string;
  date: string;
  audio_url?: string | null;
  video_link?: string | null;
  notes?: string | null;
  topic_id?: string | null;
}

interface ParsedSermon extends SermonInput {
  source_message_id: number;
  raw_text: string;
}

export default function BulkSermonImport() {
  const [jsonFile, setJsonFile] = useState<File | null>(null);
  const [audioFiles, setAudioFiles] = useState<File[]>([]);
  const [parsedSermons, setParsedSermons] = useState<ParsedSermon[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; msg: string; data?: any } | null>(null);
  const [step, setStep] = useState<'upload' | 'review' | 'import'>('upload');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleJsonUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith('.json')) {
      setResult({ ok: false, msg: 'Please select a JSON file' });
      return;
    }
    setJsonFile(file);
    setResult(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (Array.isArray(data)) {
          setParsedSermons(data);
          setSelectedIndices(new Set(data.map((_, i) => i)));
          setStep('review');
        } else {
          setResult({ ok: false, msg: 'JSON must be an array of sermon objects' });
        }
      } catch {
        setResult({ ok: false, msg: 'Invalid JSON file' });
      }
    };
    reader.readAsText(file);
  };

  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAudioFiles(prev => [...prev, ...files]);
  };

  const toggleSelect = (index: number) => {
    const newSet = new Set(selectedIndices);
    if (newSet.has(index)) newSet.delete(index);
    else newSet.add(index);
    setSelectedIndices(newSet);
  };

  const toggleAll = () => {
    if (selectedIndices.size === parsedSermons.length) {
      setSelectedIndices(new Set());
    } else {
      setSelectedIndices(new Set(parsedSermons.map((_, i) => i)));
    }
  };

  const updateSermon = (index: number, field: keyof ParsedSermon, value: string) => {
    const updated = [...parsedSermons];
    updated[index] = { ...updated[index], [field]: value } as ParsedSermon;
    setParsedSermons(updated);
  };

  const handleImport = async () => {
    const toImport = parsedSermons.filter((_, i) => selectedIndices.has(i));
    if (toImport.length === 0) return;

    setLoading(true);
    setResult(null);

    try {
      // MOBILE-ONLY: insert directly via Supabase (no bulk API route in static export)
      const supabase = createClient();
      const rows = toImport.map((s) => ({
        title: s.title,
        preacher: s.preacher,
        date: s.date,
        audio_url: s.audio_url || null,
        video_link: s.video_link || null,
        notes: s.notes || null,
        topic_id: s.topic_id || null,
      }));
      const { data, error } = await supabase.from('sermons').insert(rows).select('id');
      if (error) throw new Error(error.message || 'Import failed');

      const inserted = data?.length || 0;
      setResult({ ok: true, msg: `Imported ${inserted} sermon${inserted === 1 ? '' : 's'}`, data: { inserted } });
      setSelectedIndices(new Set());
      router.refresh();
    } catch (err) {
      setResult({ ok: false, msg: err instanceof Error ? err.message : 'Import failed' });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    try { return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
    catch { return dateStr; }
  };

  if (step === 'upload') {
    return (
      <div className="space-y-6 py-4 max-w-2xl mx-auto">
        <header>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Upload className="w-6 h-6 text-blue-400" />
            Bulk Sermon Import
          </h1>
          <p className="text-xs text-zinc-400 mt-1">Import sermons from Telegram export JSON</p>
        </header>

        <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 text-center">
          <FileText className="w-16 h-16 mx-auto mb-4 text-zinc-600" />
          <p className="text-zinc-300 mb-4">Upload parsed-sermons.json from the Telegram parser script</p>
          <input
            type="file"
            accept=".json"
            onChange={handleJsonUpload}
            className="hidden"
            id="json-upload"
            ref={fileInputRef}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="btn-primary inline-flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            Choose JSON File
          </button>
        </div>

        <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800/50 text-xs text-zinc-500">
          <p className="font-medium text-zinc-400 mb-2">How to prepare:</p>
          <ol className="list-decimal list-inside space-y-1 text-zinc-500">
            <li>Export chat from Telegram Desktop: <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded">Chat</kbd> → <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded">Export chat history</kbd> → <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded">JSON</kbd></li>
            <li>Run parser: <code className="px-1.5 py-0.5 bg-zinc-800 rounded">npx tsx scripts/parse-telegram-sermons.ts telegram-export.json</code></li>
            <li>Review generated <code className="px-1.5 py-0.5 bg-zinc-800 rounded">parsed-sermons.json</code></li>
            <li>Upload here and import</li>
          </ol>
        </div>
      </div>
    );
  }

  if (step === 'review') {
    return (
      <div className="space-y-6 py-4">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Review Sermons</h1>
            <p className="text-xs text-zinc-400">{parsedSermons.length} parsed • {selectedIndices.size} selected</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={toggleAll} className="btn-secondary text-sm">
              {selectedIndices.size === parsedSermons.length ? 'Deselect All' : 'Select All'}
            </button>
            <button onClick={() => setStep('upload')} className="btn-ghost text-sm">Back</button>
          </div>
        </header>

        {result && (
          <p className={`p-3 rounded-lg text-sm ${result.ok ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`} role="alert">
            {result.msg}
          </p>
        )}

        <div className="rounded-2xl bg-zinc-900 border border-zinc-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs text-zinc-500 border-b border-zinc-800 bg-zinc-900/50">
                  <th className="p-3 w-12"><input type="checkbox" checked={selectedIndices.size === parsedSermons.length && parsedSermons.length > 0} onChange={toggleAll} /></th>
                  <th className="p-3">Title</th>
                  <th className="p-3 w-32">Preacher</th>
                  <th className="p-3 w-32">Date</th>
                  <th className="p-3 w-24">Topic</th>
                  <th className="p-3 w-20">Audio</th>
                  <th className="p-3 w-20">Video</th>
                </tr>
              </thead>
              <tbody>
                {parsedSermons.map((sermon, i) => (
                  <tr key={i} className="border-b border-zinc-800/50 hover:bg-zinc-900/50">
                    <td className="p-3">
                      <input type="checkbox" checked={selectedIndices.has(i)} onChange={() => toggleSelect(i)} />
                    </td>
                    <td className="p-3">
                      <input
                        type="text"
                        value={sermon.title}
                        onChange={(e) => updateSermon(i, 'title', e.target.value)}
                        className="input-base text-sm font-medium w-full max-w-xs"
                        maxLength={200}
                      />
                    </td>
                    <td className="p-3">
                      <input
                        type="text"
                        value={sermon.preacher}
                        onChange={(e) => updateSermon(i, 'preacher', e.target.value)}
                        className="input-base text-sm w-full"
                        maxLength={100}
                      />
                    </td>
                    <td className="p-3">
                      <input
                        type="date"
                        value={sermon.date}
                        onChange={(e) => updateSermon(i, 'date', e.target.value)}
                        className="input-base text-sm w-full"
                      />
                    </td>
                    <td className="p-3">
                      <input
                        type="text"
                        value={sermon.topic_id || ''}
                        onChange={(e) => updateSermon(i, 'topic_id', e.target.value)}
                        className="input-base text-sm w-full"
                        placeholder="faith, prayer, healing..."
                      />
                    </td>
                    <td className="p-3 text-center">
                      {sermon.audio_url ? (
                        <span className="text-xs text-green-400">✓ Audio</span>
                      ) : (
                        <span className="text-xs text-zinc-500">—</span>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      {sermon.video_link ? (
                        <span className="text-xs text-blue-400">✓ Video</span>
                      ) : (
                        <span className="text-xs text-zinc-500">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button onClick={() => setStep('upload')} className="btn-secondary" disabled={loading}>
            Back
          </button>
          <button onClick={handleImport} className="btn-primary" disabled={loading || selectedIndices.size === 0}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Importing...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Import {selectedIndices.size} Sermons
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  return null;
}
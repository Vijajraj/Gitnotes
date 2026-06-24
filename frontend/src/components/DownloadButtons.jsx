import React from 'react';
import { Download, FileCode, FileText } from 'lucide-react';

export default function DownloadButtons({ technicalContent, executiveContent, version }) {
  const triggerDownload = (content, filename) => {
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const verClean = version ? version.replace(/[^a-zA-Z0-9.-]/g, '') : 'release';

  return (
    <div className="flex flex-wrap gap-4 items-center justify-end">
      <button
        onClick={() => triggerDownload(technicalContent, `CHANGELOG-${verClean}.md`)}
        className="flex items-center gap-2 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-350 hover:text-white px-4 py-2.5 rounded-xl text-xs md:text-sm font-medium transition-all shadow-md active:scale-[0.98]"
      >
        <FileCode className="w-4 h-4 text-indigo-400" />
        <span>Export CHANGELOG.md</span>
        <Download className="w-3.5 h-3.5 opacity-60 ml-0.5" />
      </button>

      <button
        onClick={() => triggerDownload(executiveContent, `release-notes-${verClean}.md`)}
        className="flex items-center gap-2 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-350 hover:text-white px-4 py-2.5 rounded-xl text-xs md:text-sm font-medium transition-all shadow-md active:scale-[0.98]"
      >
        <FileText className="w-4 h-4 text-violet-400" />
        <span>Export release-notes.md</span>
        <Download className="w-3.5 h-3.5 opacity-60 ml-0.5" />
      </button>
    </div>
  );
}

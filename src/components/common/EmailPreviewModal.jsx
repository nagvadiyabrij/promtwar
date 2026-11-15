import React from 'react';
import { useNotification } from '../../context/NotificationContext';
import { Mail, X, CheckCircle2, Clock } from 'lucide-react';

export default function EmailPreviewModal() {
  const { previewEmail, setPreviewEmail } = useNotification();

  if (!previewEmail) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-teal-500/20 text-teal-400 rounded-lg">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base">Proactive Email Preview</h3>
              <p className="text-xs text-slate-400">Live render of simulated email dispatch from AuraCare Reminder Engine</p>
            </div>
          </div>
          <button
            onClick={() => setPreviewEmail(null)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Email Meta Bar */}
        <div className="bg-slate-100 px-6 py-3 border-b text-xs text-slate-600 flex flex-wrap gap-y-1 gap-x-6">
          <div><strong className="text-slate-800">To:</strong> {previewEmail.recipient_name || previewEmail.recipientName} &lt;{previewEmail.recipient_email || previewEmail.recipientEmail}&gt;</div>
          <div><strong className="text-slate-800">Subject:</strong> {previewEmail.subject}</div>
          <div className="flex items-center gap-1.5 ml-auto text-emerald-600 font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Dispatched via Proactive Cron</span>
          </div>
        </div>

        {/* Render HTML content safely inside iframe or html div */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-50">
          <div
            className="bg-white rounded-xl shadow-sm border p-4"
            dangerouslySetInnerHTML={{ __html: previewEmail.content || previewEmail.htmlContent }}
          />
        </div>

        {/* Modal Footer */}
        <div className="bg-white px-6 py-3.5 border-t flex items-center justify-between">
          <div className="text-xs text-slate-500">
            Automated compliance record ID: <code className="bg-slate-100 px-2 py-0.5 rounded font-mono text-teal-700">{previewEmail.id}</code>
          </div>
          <button
            onClick={() => setPreviewEmail(null)}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-sm font-medium transition"
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
}

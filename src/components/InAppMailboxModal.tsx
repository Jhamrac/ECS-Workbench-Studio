import React, { useState, useEffect } from 'react';
import {
  Mail,
  Inbox,
  X,
  CheckCircle2,
  Trash2,
  KeyRound,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  Clock,
  ArrowLeft,
} from 'lucide-react';
import {
  VirtualEmail,
  getVirtualEmails,
  markVirtualEmailRead,
  markAllVirtualEmailsRead,
  deleteVirtualEmail,
  subscribeVirtualMailbox,
} from '../lib/virtualMailbox';
import { useNiagaraTheme } from '../context/NiagaraThemeContext';

interface InAppMailboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAuthForReset?: () => void;
}

export const InAppMailboxModal: React.FC<InAppMailboxModalProps> = ({
  isOpen,
  onClose,
  onOpenAuthForReset,
}) => {
  const { theme, isDark } = useNiagaraTheme();

  const [emails, setEmails] = useState<VirtualEmail[]>([]);
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeVirtualMailbox((updated) => {
      setEmails(updated);
      if (updated.length > 0 && !selectedEmailId) {
        setSelectedEmailId(updated[0].id);
      }
    });
    return unsubscribe;
  }, []);

  if (!isOpen) return null;

  const selectedEmail = emails.find((e) => e.id === selectedEmailId) || emails[0];

  const handleSelectEmail = (id: string) => {
    setSelectedEmailId(id);
    markVirtualEmailRead(id);
  };

  const unreadCount = emails.filter((e) => !e.isRead).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className={`w-full max-w-4xl h-[85vh] rounded-2xl shadow-2xl border flex flex-col overflow-hidden transition-colors ${
          isDark ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-white border-slate-300 text-slate-900'
        }`}
      >
        {/* Header */}
        <div
          className={`px-6 py-4 border-b flex items-center justify-between shrink-0 ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-200'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-sky-500/20 text-sky-500 border border-sky-500/30">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base tracking-tight">Niagara In-App Email Inbox</h3>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black text-[10px]">
                    {unreadCount} NEW
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Out-of-the-box system notifications, verification emails, and password reset dispatches.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllVirtualEmailsRead}
                className="px-3 py-1.5 rounded-xl border border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-400 hover:bg-sky-500/20 text-xs font-bold transition-all cursor-pointer"
              >
                Mark All Read
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-black/20 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Main Content: Left List + Right Mail View */}
        <div className="flex-1 flex overflow-hidden min-h-0">
          {/* Left Email List */}
          <div
            className={`w-80 shrink-0 border-r flex flex-col overflow-hidden ${
              isDark ? 'border-slate-800 bg-slate-900/50' : 'border-slate-200 bg-slate-50'
            }`}
          >
            <div className="p-3 border-b border-slate-700/30 flex items-center justify-between text-xs font-bold opacity-75">
              <span>Dispatched Messages ({emails.length})</span>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-800/30">
              {emails.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  <Inbox className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  No messages in virtual inbox.
                </div>
              ) : (
                emails.map((m) => {
                  const isSelected = selectedEmail?.id === m.id;
                  return (
                    <div
                      key={m.id}
                      onClick={() => handleSelectEmail(m.id)}
                      className={`p-3 cursor-pointer transition-all ${
                        isSelected
                          ? isDark
                            ? 'bg-sky-950/80 border-l-4 border-sky-500'
                            : 'bg-sky-50 border-l-4 border-sky-600'
                          : !m.isRead
                          ? isDark
                            ? 'bg-amber-500/10 font-bold'
                            : 'bg-amber-50 font-bold'
                          : 'hover:bg-black/5 dark:hover:bg-white/5 opacity-80'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="font-semibold text-slate-400 truncate max-w-[130px]">{m.to}</span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 line-clamp-1 mb-1">
                        {!m.isRead && <span className="inline-block w-2 h-2 rounded-full bg-amber-500 mr-1.5" />}
                        {m.subject}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                        From: {m.from}
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Email Preview */}
          <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-slate-950">
            {selectedEmail ? (
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Email Subject / Metadata Header */}
                <div className={`p-4 border-b ${isDark ? 'border-slate-800 bg-slate-900/30' : 'border-slate-200 bg-slate-50/50'}`}>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100 leading-snug">
                      {selectedEmail.subject}
                    </h2>
                    <button
                      onClick={() => deleteVirtualEmail(selectedEmail.id)}
                      title="Delete email"
                      className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                    <div>
                      <div>
                        <strong>To:</strong> <span className="text-slate-800 dark:text-slate-200">{selectedEmail.to}</span>
                      </div>
                      <div>
                        <strong>From:</strong> {selectedEmail.from}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 font-mono text-[11px]">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{new Date(selectedEmail.timestamp).toLocaleString()}</span>
                    </div>
                  </div>

                  {selectedEmail.category === 'password_reset' && onOpenAuthForReset && (
                    <div className="mt-3 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-800 dark:text-amber-300">
                        🔑 Password reset token received.
                      </span>
                      <button
                        onClick={() => {
                          onClose();
                          onOpenAuthForReset();
                        }}
                        className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white text-xs font-black rounded-lg cursor-pointer transition-all flex items-center gap-1"
                      >
                        <KeyRound className="w-3.5 h-3.5" />
                        <span>Reset Password Now</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Rendered HTML Email Body */}
                <div className="flex-1 overflow-y-auto p-6 bg-slate-100 dark:bg-slate-900/60">
                  <div
                    className="prose dark:prose-invert max-w-none shadow-sm rounded-xl overflow-hidden"
                    dangerouslySetInnerHTML={{ __html: selectedEmail.bodyHtml }}
                  />
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
                <Mail className="w-12 h-12 mb-3 opacity-30" />
                <p className="text-sm">Select an email from the left list to read.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

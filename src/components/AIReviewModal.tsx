import React, { useState } from 'react';
import { NiagaraProgram } from '../types/niagara';
import { Activity, Sparkles, Loader2, ShieldAlert, CheckCircle, HelpCircle, Send } from 'lucide-react';

interface AIReviewModalProps {
  program: NiagaraProgram;
}

export const AIReviewModal: React.FC<AIReviewModalProps> = ({ program }) => {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [customQuery, setCustomQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  const runAnalysis = async (queryText?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/analyze-wiresheet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          blocks: program.blocks,
          links: program.links,
          prompt: queryText || customQuery,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to retrieve engineering analysis from server');
      }

      const data = await response.json();
      setAnalysis(data.analysis);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Analysis request failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 h-full overflow-y-auto bg-slate-950 text-slate-100 p-6 space-y-6 select-text">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-teal-500/20 text-teal-400 border border-teal-500/30">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">
                  BMS AI Senior Engineer Review & Troubleshooter
                </h1>
                <span className="text-xs text-slate-400">
                  Automated logic validation, safety audit & commissioning check
                </span>
              </div>
            </div>

            <button
              id="run-bms-analysis-btn"
              onClick={() => runAnalysis()}
              disabled={isLoading}
              className="flex items-center gap-1.5 bg-gradient-to-r from-teal-600 to-sky-600 hover:from-teal-500 hover:to-sky-500 disabled:opacity-50 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow transition-all cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Auditing Wire Sheet...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Audit Wire Sheet Logic</span>
                </>
              )}
            </button>
          </div>

          {/* Quick Query Input */}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Ask a specific question (e.g. Will this PID loop hunt? Are there safety interlocks missing?)..."
              value={customQuery}
              onChange={(e) => setCustomQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') runAnalysis();
              }}
              className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <button
              onClick={() => runAnalysis()}
              disabled={isLoading || !customQuery.trim()}
              className="bg-slate-800 hover:bg-slate-700 border border-slate-700 disabled:opacity-50 text-slate-200 px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>

          {/* Error display */}
          {error && (
            <div className="bg-rose-950/50 border border-rose-800 rounded-lg p-3 text-rose-300 text-xs flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Analysis Report Output */}
          {analysis ? (
            <div className="bg-slate-950 border border-slate-800 rounded-lg p-5 font-mono text-xs text-slate-300 whitespace-pre-wrap leading-relaxed space-y-4">
              {analysis}
            </div>
          ) : !isLoading ? (
            <div className="bg-slate-850 border border-slate-750 rounded-lg p-6 text-center text-xs text-slate-400 space-y-2">
              <Sparkles className="w-6 h-6 text-teal-400 mx-auto opacity-70" />
              <p className="font-semibold text-slate-300">
                Click "Audit Wire Sheet Logic" to analyze this control logic with Gemini 3.7 Flash.
              </p>
              <p className="text-[11px] text-slate-400 max-w-md mx-auto">
                The AI will inspect all PID loop actions, priority arrays, anti-short cycle timers, deadbands, and slot mappings for building automation compliance.
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

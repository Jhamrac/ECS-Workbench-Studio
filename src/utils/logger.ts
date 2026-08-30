export type LogCategory = 'UI' | 'WIRE' | 'ENGINE' | 'AI' | 'SYSTEM' | 'ERROR' | 'WARN';

export type LogLevel = 'info' | 'warn' | 'error' | 'debug' | 'success';

export interface LogEntry {
  id: string;
  timestamp: string;
  timeMs: number;
  category: LogCategory;
  message: string;
  details?: any;
  level: LogLevel;
  source?: string;
}

type LogListener = (logs: LogEntry[]) => void;

class DiagnosticLogger {
  private logs: LogEntry[] = [];
  private listeners: Set<LogListener> = new Set();
  private maxLogs = 500;
  private isInitialized = false;

  constructor() {
    // Initial system boot log
    this.addLog('SYSTEM', 'Diagnostic Engine initialized. Monitoring Niagara Workbench events.', 'info', undefined, 'SystemBoot');
  }

  public initGlobalInterceptors() {
    if (this.isInitialized || typeof window === 'undefined') return;
    this.isInitialized = true;

    // Global Error Interceptor
    window.addEventListener('error', (event) => {
      this.addLog(
        'ERROR',
        `Uncaught Exception: ${event.message || 'Unknown Runtime Error'}`,
        'error',
        {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          error: event.error?.stack || event.error,
        },
        'WindowError'
      );
    });

    // Global Promise Rejection Interceptor
    window.addEventListener('unhandledrejection', (event) => {
      this.addLog(
        'ERROR',
        `Unhandled Promise Rejection: ${event.reason?.message || String(event.reason)}`,
        'error',
        { reason: event.reason },
        'UnhandledRejection'
      );
    });

    // Global UI Click Listener for diagnostic user action logging
    document.addEventListener(
      'click',
      (e) => {
        try {
          const target = e.target as HTMLElement | null;
          if (!target) return;

          // Ignore clicks originating inside the dev console itself
          if (target.closest('#dev-diagnostic-console-root')) return;

          // 1. Check for wire sheet slot terminal / pin
          const slotEl = target.closest('[data-slot-name]') as HTMLElement | null;
          if (slotEl) {
            const slotName = slotEl.getAttribute('data-slot-name') || 'slot';
            const blockEl = slotEl.closest('[data-block-id]') as HTMLElement | null;
            const blockId = slotEl.getAttribute('data-slot-block-id') || blockEl?.getAttribute('data-block-id') || 'unknown';
            const blockName = blockEl?.getAttribute('data-block-name') || blockEl?.querySelector('h4')?.textContent?.trim() || blockId;
            const slotKind = slotEl.getAttribute('data-slot-kind') || (slotEl.getAttribute('data-slot-pin') ? 'Pin' : 'Slot');
            this.addLog(
              'UI',
              `Wire Sheet: Clicked ${slotKind} [${slotName}] on Block [${blockName}]`,
              'info',
              { blockId, slotName, kind: slotKind, type: slotEl.getAttribute('data-slot-type') },
              'WireSheet'
            );
            return;
          }

          // 2. Check for wire sheet block node
          const blockEl = target.closest('[data-block-id]') as HTMLElement | null;
          if (blockEl && !target.closest('button, input, select')) {
            const blockId = blockEl.getAttribute('data-block-id');
            const blockName = blockEl.getAttribute('data-block-name') || blockEl.querySelector('h4')?.textContent?.trim() || blockId;
            this.addLog(
              'UI',
              `Wire Sheet: Selected Block Node [${blockName}]`,
              'info',
              { blockId, blockName },
              'WireSheet'
            );
            return;
          }

          // 3. Check for specific wire link SVG
          const wireEl = target.closest('[data-link-id]') as HTMLElement | null;
          if (wireEl) {
            const linkId = wireEl.getAttribute('data-link-id');
            const fromBlock = wireEl.getAttribute('data-from-block') || '';
            const toBlock = wireEl.getAttribute('data-to-block') || '';
            this.addLog(
              'WIRE',
              `Wire Sheet: Clicked Connection Link [${linkId}] (${fromBlock} ➔ ${toBlock})`,
              'info',
              { linkId, fromBlock, toBlock },
              'WireSheet'
            );
            return;
          }

          // 4. Interactive elements (buttons, links, inputs, options, tabs, switches)
          const interactive = target.closest(
            'button, a, input, select, textarea, [role="button"], [role="tab"], [role="menuitem"], [role="option"], [role="checkbox"], [role="switch"], [data-action]'
          ) as HTMLElement | null;

          if (interactive) {
            let label = (
              interactive.getAttribute('aria-label') ||
              interactive.getAttribute('title') ||
              interactive.getAttribute('placeholder') ||
              (interactive as HTMLInputElement).value ||
              ''
            ).trim();

            if (!label) {
              // Extract clean 1-line text from child nodes, skipping SVGs
              const text = (interactive.textContent || '').replace(/[\r\n\t]+/g, ' ').replace(/\s+/g, ' ').trim();
              if (text && text.length <= 45) {
                label = text;
              }
            }

            if (!label && interactive.querySelector('title')) {
              label = interactive.querySelector('title')?.textContent || '';
            }

            if (!label) {
              label = interactive.id || interactive.getAttribute('data-action') || interactive.tagName.toLowerCase();
            }

            label = label.slice(0, 40);

            const elId = interactive.id ? `#${interactive.id}` : '';
            this.addLog(
              'UI',
              `User Action: Clicked [${label}]${elId ? ` (${elId})` : ''}`,
              'info',
              {
                tag: interactive.tagName,
                id: interactive.id || undefined,
                action: interactive.getAttribute('data-action') || undefined,
              },
              'UserInterface'
            );
            return;
          }

          // 5. Canvas blank grid background click
          if (target.closest('#wire-sheet-canvas-container') || target.closest('[data-canvas-bg]')) {
            this.addLog('UI', 'Wire Sheet Canvas: Clicked Canvas Grid Area (Deselect / Pan)', 'info', undefined, 'WireSheet');
            return;
          }

          // 6. Generic container click - ONLY if it has an explicit, non-generic ID
          const containerWithId = target.closest('[id]') as HTMLElement | null;
          if (containerWithId) {
            const cid = containerWithId.id;
            const genericIds = [
              'root',
              'app',
              'main',
              'content',
              'canvas-container',
              'workbench-body',
              'wiresheet-root',
              'dev-diagnostic-console-root',
            ];
            if (cid && !genericIds.includes(cid.toLowerCase())) {
              const label = (containerWithId.getAttribute('title') || containerWithId.getAttribute('aria-label') || cid).slice(0, 35);
              this.addLog('UI', `User Action: Clicked section [#${cid}] (${label})`, 'info', { id: cid }, 'DOMClick');
            }
          }
        } catch {
          // Ignore click tracking errors
        }
      },
      { capture: true, passive: true }
    );
  }

  public addLog(category: LogCategory, message: string, level: LogLevel = 'info', details?: any, source?: string) {
    const now = new Date();
    const timestamp = now.toTimeString().split(' ')[0] + '.' + String(now.getMilliseconds()).padStart(3, '0');

    const entry: LogEntry = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      timestamp,
      timeMs: now.getTime(),
      category,
      message,
      level,
      details,
      source,
    };

    this.logs.unshift(entry); // newest at top

    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }

    this.notify();
  }

  public logError(message: string, details?: any, source?: string) {
    this.addLog('ERROR', message, 'error', details, source);
  }

  public logWarn(message: string, details?: any, source?: string) {
    this.addLog('WARN', message, 'warn', details, source);
  }

  public logWire(message: string, details?: any) {
    this.addLog('WIRE', message, 'info', details, 'WireSheet');
  }

  public logEngine(message: string, details?: any) {
    this.addLog('ENGINE', message, 'debug', details, 'SimulationEngine');
  }

  public logAi(message: string, details?: any) {
    this.addLog('AI', message, 'success', details, 'AIAssist');
  }

  public clearLogs() {
    this.logs = [];
    this.addLog('SYSTEM', 'Diagnostic log buffer cleared by developer.', 'info', undefined, 'ConsoleClear');
    this.notify();
  }

  public getLogs(): LogEntry[] {
    return [...this.logs];
  }

  public subscribe(listener: LogListener): () => void {
    this.listeners.add(listener);
    listener([...this.logs]);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    const snapshot = [...this.logs];
    this.listeners.forEach((listener) => {
      try {
        listener(snapshot);
      } catch (err) {
        console.error('Logger listener error:', err);
      }
    });
  }
}

export const logger = new DiagnosticLogger();
logger.initGlobalInterceptors();

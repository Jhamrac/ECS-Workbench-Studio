import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X,
  Send,
  Sparkles,
  Plus,
  Trash2,
  MessageSquare,
  Zap,
  Check,
  Edit2,
  Copy,
  Paperclip,
  Maximize2,
  Minimize2,
  Settings,
  ThumbsUp,
  ThumbsDown,
  Mic,
  Search,
  PanelLeftClose,
  PanelLeft,
  FileText,
  GripVertical,
  LogIn,
  CloudCheck,
} from 'lucide-react';
import { useNiagaraTheme } from '../context/NiagaraThemeContext';
import { NiagaraProgram } from '../types/niagara';
import { useAuth } from '../context/AuthContext';
import {
  subscribeToChatConversations,
  saveChatConversationToCloud,
  deleteChatConversationFromCloud,
} from '../lib/firebase';

export interface AIChatAction {
  type: string;
  label: string;
  payload?: any;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  attachedFile?: {
    name: string;
    type: string;
    previewUrl?: string;
  };
  actions?: AIChatAction[];
  generatedProgram?: NiagaraProgram;
  feedback?: 'like' | 'dislike';
}

export interface ChatConversation {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: ChatMessage[];
}

export interface StudioContextInfo {
  activeStudioId?: 'wiresheet' | 'network' | string;
  activeStudio: string;
  onScreenSummary: string;
  activeNetworkTool?: string;
  deviceCount?: number;
  healthScore?: number;
  isCapturing?: boolean;
  programTitle?: string;
  programCategory?: string;
  blockCount?: number;
  linkCount?: number;
  isSimulating?: boolean;
  activeFaults?: string[];
  selectedBlockName?: string;
  stepClock?: number;
}

interface AIChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpen?: () => void;
  currentProgram?: NiagaraProgram;
  studioContext?: StudioContextInfo;
  initialPrompt?: string;
  onClearInitialPrompt?: () => void;
  onOpenAuthModal?: () => void;
  onExecuteAiAction?: (actionType: string, payload?: any) => void;
  onApplyProgram?: (program: NiagaraProgram) => void;
}

const STORAGE_KEY = 'niagara_ai_chat_conversations_v2';
const DRAWER_WIDTH_KEY = 'studio_copilot_drawer_width_v1';

interface SlashCommand {
  command: string;
  label: string;
  description: string;
  category: string;
  icon: string;
  prompt: string;
}

const SLASH_COMMANDS: SlashCommand[] = [
  {
    command: '/tune',
    label: 'Tune LoopPoint PID',
    description: 'PID loop gains, anti-hunting, and process deadband setup',
    category: 'Control & Tuning',
    icon: '🎛️',
    prompt: 'How do I tune a LoopPoint PID controller for discharge air temperature and avoid hunting?',
  },
  {
    command: '/ashrae',
    label: 'ASHRAE 36 Trim & Respond',
    description: 'Dynamic duct static pressure and supply temp resets',
    category: 'HVAC Sequences',
    icon: '📐',
    prompt: 'Explain ASHRAE Guideline 36 Trim & Respond and VAV Dual Maximum logic.',
  },
  {
    command: '/dualmax',
    label: 'VAV Dual Maximum Logic',
    description: 'Heating vs cooling minimum and maximum airflow CFM sequences',
    category: 'HVAC Sequences',
    icon: '🏢',
    prompt: 'Explain VAV Dual Maximum sequence of operation per ASHRAE Guideline 36.',
  },
  {
    command: '/modbus',
    label: 'Modbus & Byte Swapping',
    description: 'Function codes, 32-bit float CDAB/ABCD endianness, and RS-485 rules',
    category: 'Field Protocols',
    icon: '⚡',
    prompt: 'Explain Modbus RTU/TCP function codes, 32-bit float byte/word swapping, and RS-485 termination.',
  },
  {
    command: '/mstp',
    label: 'BACnet MS/TP & Max Master',
    description: 'Token ring timing, MAC address allocation, and 120Ω EOL termination',
    category: 'Field Protocols',
    icon: '🛰️',
    prompt: 'Explain BACnet MS/TP RS-485 Max Master setting, token ring passing, and 120-ohm EOL resistors.',
  },
  {
    command: '/priority',
    label: '16-Level Priority Array',
    description: 'Life Safety (1-2), Manual Overrides (8), Automation (16) rules',
    category: 'Niagara Architecture',
    icon: '🔢',
    prompt: 'Explain BACnet 16-level priority array rules and how Priority 8 overrides work in Niagara.',
  },
  {
    command: '/bql',
    label: 'BQL & oBIX REST API',
    description: 'Baja Query Language syntax, ORD resolutions, and web services',
    category: 'Niagara Architecture',
    icon: '🔍',
    prompt: 'Show useful Baja Query Language (BQL) queries and oBIX REST API endpoints for Niagara stations.',
  },
  {
    command: '/heap',
    label: 'JACE Heap & Memory Tuning',
    description: 'Java heap optimization, garbage collection, and OutOfMemory fixes',
    category: 'Platform Health',
    icon: '🛠️',
    prompt: 'How do I optimize JACE 8000/9000 Java heap memory and prevent OutOfMemory crashes?',
  },
  {
    command: '/gen',
    label: 'Generate Wire Sheet Program',
    description: 'Synthesize complete Niagara block program and load onto canvas',
    category: 'Logic Synthesis',
    icon: '🧩',
    prompt: 'Generate dual chilled water pump logic wire sheet with lead-lag failover.',
  },
];

const SUGGESTED_PILLS = [
  { label: '🎛️ Tune LoopPoint PID', prompt: 'How do I tune a LoopPoint PID controller for discharge air temperature and avoid hunting?' },
  { label: '📐 ASHRAE 36 Trim & Respond', prompt: 'Explain ASHRAE Guideline 36 Trim & Respond and VAV Dual Maximum logic.' },
  { label: '⚡ Modbus & Word Swap (CDAB)', prompt: 'Explain Modbus RTU/TCP function codes, 32-bit float byte/word swapping, and RS-485 termination.' },
  { label: '🛰️ MS/TP Token & Max Master', prompt: 'Explain BACnet MS/TP RS-485 Max Master setting, token ring passing, and 120-ohm EOL resistors.' },
  { label: '🔢 Priority 1-16 Overrides', prompt: 'Explain BACnet 16-level priority array rules and how Priority 8 overrides work in Niagara.' },
  { label: '🔍 BQL & oBIX API Endpoints', prompt: 'Show useful Baja Query Language (BQL) queries and oBIX REST API endpoints for Niagara stations.' },
];

function getTimeGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) {
    return 'Good morning';
  } else if (hour >= 12 && hour < 17) {
    return 'Good afternoon';
  } else {
    return 'Good evening';
  }
}

function formatUserName(user: any): string {
  if (!user) return 'there';
  if (user.displayName && user.displayName.trim()) {
    const first = user.displayName.trim().split(' ')[0];
    return first.charAt(0).toUpperCase() + first.slice(1);
  }
  if (user.email) {
    const raw = user.email.split('@')[0].replace(/[._-]/g, ' ');
    const first = raw.trim().split(' ')[0];
    return first.charAt(0).toUpperCase() + first.slice(1);
  }
  return 'there';
}

function parseActionTags(rawText: string): { cleanedText: string; actions: AIChatAction[] } {
  const actions: AIChatAction[] = [];
  const actionRegex = /\[\[ACTION:([A-Z_]+)(?::([^\]]+))?\]\]/g;

  const cleanedText = rawText.replace(actionRegex, (_, actionType: string, payload?: string) => {
    let label = 'Execute Action';
    switch (actionType) {
      case 'NAVIGATE_STUDIO':
        label = payload === 'network' ? '🌐 Switch to Network Studio' : '🧩 Switch to Logic Studio';
        break;
      case 'OPEN_NETWORK_TOOL': {
        const toolMap: Record<string, string> = {
          discovery: 'Device Discovery & Topology',
          packet_analyzer: 'Packet Analyzer',
          health_diagnostics: 'OT Diagnostics',
          serial_terminal: 'RS-485 Serial Bus',
          protocol_test: 'APDU Protocol Test',
          snapshot_diff: 'Snapshot Comparator',
          gateway_mapper: 'Multi-Protocol Gateways',
        };
        label = `🌐 Open ${toolMap[payload || ''] || (payload ? payload.replace(/_/g, ' ') : 'Network Tool')}`;
        break;
      }
      case 'NAVIGATE_WIRESHEET':
        label = '🧩 Open Wire Sheet';
        break;
      case 'NAVIGATE_SOO':
        label = '📜 Sequence of Operation';
        break;
      case 'NAVIGATE_GUIDE':
        label = '📖 Engineering Guide';
        break;
      case 'START_SIMULATION':
        label = '⚡ Start Simulation';
        break;
      case 'STOP_SIMULATION':
        label = '⏸️ Stop Simulation';
        break;
      case 'OPEN_SCHEDULE':
        label = '📅 Schedule Editor';
        break;
      case 'OPEN_PRIORITY':
        label = '🔢 Priority Array';
        break;
      case 'OPEN_DIAGNOSTICS':
        label = '💻 Diagnostic Console';
        break;
      case 'OPEN_SETTINGS':
        label = '⚙️ Workbench Settings';
        break;
      case 'OPEN_PALETTE':
        label = '🧰 Component Palette';
        break;
      case 'FIT_VIEW':
        label = '🔍 Fit View';
        break;
      case 'CLEAR_CANVAS':
        label = '🗑️ Clear Canvas';
        break;
      case 'GENERATE_PROGRAM':
        label = `⚡ Generate: ${payload ? payload.slice(0, 24) : 'Logic'}`;
        break;
      default:
        label = `⚡ ${actionType.replace(/_/g, ' ')}`;
    }
    actions.push({ type: actionType, label, payload });
    return '';
  });

  return { cleanedText: cleanedText.trim(), actions };
}

// Markdown Message Content Renderer
const MinimalMessageContent: React.FC<{
  content: string;
}> = ({ content }) => {
  const [copiedCodeIdx, setCopiedCodeIdx] = useState<number | null>(null);

  const handleCopyCode = (code: string, idx: number) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeIdx(idx);
    setTimeout(() => setCopiedCodeIdx(null), 2000);
  };

  const parts: React.ReactNode[] = [];
  const lines = content.split('\n');

  let inCodeBlock = false;
  let codeLang = '';
  let codeBuffer: string[] = [];
  let codeBlockCounter = 0;

  let inTable = false;
  let tableHeader: string[] = [];
  let tableRows: string[][] = [];

  const flushTable = () => {
    if (!inTable) return;
    const headerCols = tableHeader;
    const rowCols = tableRows;
    inTable = false;
    tableHeader = [];
    tableRows = [];

    parts.push(
      <div key={`table-${parts.length}`} className="my-3 overflow-x-auto rounded-xl border border-white/10 bg-white/[0.02]">
        <table className="min-w-full text-[12px] text-left border-collapse">
          <thead>
            <tr className="border-b border-white/10 text-sky-400 font-semibold bg-white/[0.04]">
              {headerCols.map((th, i) => (
                <th key={i} className="px-3.5 py-2">
                  {th.trim()}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {rowCols.map((row, rIdx) => (
              <tr key={rIdx} className="hover:bg-white/[0.03] transition-colors">
                {row.map((cell, cIdx) => (
                  <td key={cIdx} className="px-3.5 py-1.5 font-mono text-[11px] text-slate-300">
                    {cell.trim()}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.trim().startsWith('```')) {
      if (!inCodeBlock) {
        flushTable();
        inCodeBlock = true;
        codeLang = line.trim().slice(3).trim() || 'code';
        codeBuffer = [];
      } else {
        inCodeBlock = false;
        const codeText = codeBuffer.join('\n');
        const currentIdx = codeBlockCounter++;
        parts.push(
          <div key={`code-${currentIdx}`} className="my-3 rounded-2xl overflow-hidden border border-white/10 bg-[#131722]">
            <div className="flex items-center justify-between px-3.5 py-2 bg-[#181d2a] border-b border-white/5 text-[11px] font-mono text-slate-400">
              <span className="font-semibold uppercase text-sky-400 tracking-wide">{codeLang}</span>
              <button
                onClick={() => handleCopyCode(codeText, currentIdx)}
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                {copiedCodeIdx === currentIdx ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400 font-medium">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
            <pre className="p-3.5 text-[12px] font-mono text-slate-200 overflow-x-auto leading-relaxed whitespace-pre">
              <code>{codeText}</code>
            </pre>
          </div>
        );
      }
      continue;
    }

    if (inCodeBlock) {
      codeBuffer.push(line);
      continue;
    }

    if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
      const cols = line
        .split('|')
        .slice(1, -1)
        .map((c) => c.trim());

      if (cols.every((c) => /^[-:]+$/.test(c))) {
        continue;
      }

      if (!inTable) {
        inTable = true;
        tableHeader = cols;
        tableRows = [];
      } else {
        tableRows.push(cols);
      }
      continue;
    } else if (inTable) {
      flushTable();
    }

    if (line.startsWith('### ')) {
      parts.push(
        <h3 key={`h3-${i}`} className="font-semibold text-[14px] text-sky-300 mt-3.5 mb-1.5">
          {renderInlineTokens(line.replace('### ', ''))}
        </h3>
      );
      continue;
    }
    if (line.startsWith('## ')) {
      parts.push(
        <h2 key={`h2-${i}`} className="font-bold text-[16px] text-white mt-4 mb-2">
          {renderInlineTokens(line.replace('## ', ''))}
        </h2>
      );
      continue;
    }
    if (line.startsWith('# ')) {
      parts.push(
        <h1 key={`h1-${i}`} className="font-bold text-[18px] text-white mt-5 mb-2.5">
          {renderInlineTokens(line.replace('# ', ''))}
        </h1>
      );
      continue;
    }

    if (line.startsWith('> ')) {
      parts.push(
        <div key={`quote-${i}`} className="my-2 pl-3.5 py-1 border-l-2 border-sky-400 bg-sky-500/5 rounded-r-xl text-[13px] text-slate-300 italic">
          {renderInlineTokens(line.replace('> ', ''))}
        </div>
      );
      continue;
    }

    if (line.trim() === '---' || line.trim() === '***') {
      parts.push(<hr key={`hr-${i}`} className="my-3.5 border-white/10" />);
      continue;
    }

    if (line.trim().startsWith('• ') || line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
      const bullet = line.trim().replace(/^([•*-]\s*)/, '');
      parts.push(
        <div key={`b-${i}`} className="flex items-start gap-2 ml-1 my-1 text-[13px] leading-relaxed">
          <span className="text-sky-400 font-bold shrink-0 mt-0.5">•</span>
          <span className="text-slate-200">{renderInlineTokens(bullet)}</span>
        </div>
      );
      continue;
    }

    const numMatch = line.match(/^(\d+)\.\s+(.*)/);
    if (numMatch) {
      parts.push(
        <div key={`num-${i}`} className="flex items-start gap-2 ml-1 my-1 text-[13px] leading-relaxed">
          <span className="text-sky-400 font-mono text-[12px] font-semibold shrink-0 mt-0.5">{numMatch[1]}.</span>
          <span className="text-slate-200">{renderInlineTokens(numMatch[2])}</span>
        </div>
      );
      continue;
    }

    if (!line.trim()) {
      parts.push(<div key={`space-${i}`} className="h-2" />);
      continue;
    }

    parts.push(
      <p key={`p-${i}`} className="my-1 text-[13.5px] leading-relaxed text-slate-200">
        {renderInlineTokens(line)}
      </p>
    );
  }

  flushTable();

  return <div className="space-y-0.5">{parts}</div>;
};

function renderInlineTokens(text: string): React.ReactNode {
  const tokens = text.split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g);

  return tokens.map((token, idx) => {
    if (token.startsWith('`') && token.endsWith('`')) {
      return (
        <code
          key={idx}
          className="px-1.5 py-0.5 rounded-md font-mono text-[11.5px] font-medium bg-white/10 text-sky-300 mx-0.5"
        >
          {token.slice(1, -1)}
        </code>
      );
    }
    if (token.startsWith('**') && token.endsWith('**')) {
      return (
        <strong key={idx} className="font-semibold text-white">
          {token.slice(2, -2)}
        </strong>
      );
    }
    if (token.startsWith('*') && token.endsWith('*')) {
      return (
        <em key={idx} className="italic text-slate-300">
          {token.slice(1, -1)}
        </em>
      );
    }
    return token;
  });
}

export const AIChatDrawer: React.FC<AIChatDrawerProps> = ({
  isOpen,
  onClose,
  onOpen,
  currentProgram,
  studioContext,
  initialPrompt,
  onClearInitialPrompt,
  onOpenAuthModal,
  onExecuteAiAction,
  onApplyProgram,
}) => {
  const { user } = useAuth();

  // Layout presentation mode: 'drawer' (docked right with custom drag resize) or 'fullscreen'
  const [viewMode, setViewMode] = useState<'drawer' | 'fullscreen'>('drawer');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);

  // Resizable drawer width state (persisted)
  const [drawerWidth, setDrawerWidth] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(DRAWER_WIDTH_KEY);
      if (saved) {
        const val = parseInt(saved, 10);
        if (!isNaN(val) && val >= 200 && val <= 3000) {
          return val;
        }
      }
    } catch {}
    return typeof window !== 'undefined' && window.innerWidth < 768 ? window.innerWidth : 560;
  });

  const isDraggingRef = useRef(false);

  // Search in chats
  const [chatSearchQuery, setChatSearchQuery] = useState<string>('');

  // Slash commands
  const [slashQuery, setSlashQuery] = useState<string>('');
  const [isSlashMenuOpen, setIsSlashMenuOpen] = useState<boolean>(false);

  // Speech Dictation
  const [isListening, setIsListening] = useState<boolean>(false);
  const [speechSupported, setSpeechSupported] = useState<boolean>(false);
  const recognitionRef = useRef<any>(null);

  // Saved Conversations
  const [conversations, setConversations] = useState<ChatConversation[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Could not load chat conversations:', e);
    }
    return [
      {
        id: `conv_${Date.now()}`,
        title: 'Controls Logic & Engineering',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messages: [],
      },
    ];
  });

  const [activeConvId, setActiveConvId] = useState<string>(() => conversations[0]?.id || '');
  const [editingConvId, setEditingConvId] = useState<string | null>(null);
  const [editTitleText, setEditTitleText] = useState<string>('');

  const [inputMessage, setInputMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copyNoticeId, setCopyNoticeId] = useState<string | null>(null);

  // Attached File
  const [attachedFile, setAttachedFile] = useState<{
    file: File;
    name: string;
    type: string;
    previewUrl?: string;
    content?: string;
    base64Data?: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const activeConversation = conversations.find((c) => c.id === activeConvId) || conversations[0];

  const [isDragging, setIsDragging] = useState(false);
  const currentWidthRef = useRef<number>(drawerWidth);
  currentWidthRef.current = drawerWidth;

  // Window resize effect for AI Chat Drawer width
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const clientX = e.clientX;
      const screenW = typeof window !== 'undefined' ? window.innerWidth : 1200;
      
      // If dragged close to the right edge (remaining width < 60px), snap close!
      if (screenW - clientX < 60) {
        currentWidthRef.current = 0;
        setDrawerWidth(0);
        return;
      }

      // Allow dragging smoothly from 150px up to 100% full screen width
      const newWidth = Math.max(150, Math.min(screenW, screenW - clientX));
      currentWidthRef.current = newWidth;
      setDrawerWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';

      const latest = currentWidthRef.current;
      if (latest === 0 || latest < 80) {
        setDrawerWidth(560);
        onClose();
      } else {
        try {
          localStorage.setItem(DRAWER_WIDTH_KEY, latest.toString());
        } catch {}
      }
    };

    document.body.style.cursor = 'ew-resize';
    document.body.style.userSelect = 'none';
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, onClose]);

  // Drag Resizing Handlers
  const handleMouseDownResize = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  // Drag open directly from the closed expand tab
  const handleTabMouseDownToOpen = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onOpen) onOpen();
    const screenW = typeof window !== 'undefined' ? window.innerWidth : 1200;
    const initialWidth = Math.max(380, screenW - e.clientX);
    setDrawerWidth(initialWidth);
    setIsDragging(true);
  };

  // Persist drawer width on change
  useEffect(() => {
    try {
      localStorage.setItem(DRAWER_WIDTH_KEY, drawerWidth.toString());
    } catch {}
  }, [drawerWidth]);

  // Speech Recognition Init
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        setSpeechSupported(true);
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          if (transcript) {
            setInputMessage((prev) => (prev ? `${prev} ${transcript}` : transcript));
          }
          setIsListening(false);
        };

        recognition.onerror = () => setIsListening(false);
        recognition.onend = () => setIsListening(false);

        recognitionRef.current = recognition;
      }
    }
  }, []);

  const toggleSpeechRecognition = () => {
    if (!speechSupported || !recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        console.warn('Speech error:', e);
      }
    }
  };

  // Cloud Sync for Logged In User
  useEffect(() => {
    if (!user?.uid) return;
    const unsubscribe = subscribeToChatConversations(
      user.uid,
      (cloudConvs) => {
        if (cloudConvs && cloudConvs.length > 0) {
          setConversations(cloudConvs);
          if (!cloudConvs.some((c) => c.id === activeConvId)) {
            setActiveConvId(cloudConvs[0].id);
          }
        }
      },
      (err) => console.warn('Firebase chat sync error:', err)
    );
    return () => unsubscribe();
  }, [user?.uid]);

  // Persist Local
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
  }, [conversations]);

  // Scroll to Bottom
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeConversation?.messages, isLoading, isOpen]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [inputMessage]);

  // Initial Prompt Trigger
  useEffect(() => {
    if (initialPrompt && initialPrompt.trim() && isOpen) {
      handleSendMessage(initialPrompt);
      if (onClearInitialPrompt) onClearInitialPrompt();
    }
  }, [initialPrompt, isOpen]);

  // Create New Chat
  const handleNewChat = () => {
    const newConv: ChatConversation = {
      id: `conv_${Date.now()}`,
      title: 'New Controls Session',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [],
    };
    setConversations((prev) => [newConv, ...prev]);
    setActiveConvId(newConv.id);
    if (user?.uid) saveChatConversationToCloud(user.uid, newConv);
  };

  // Delete Chat
  const handleDeleteChat = (convId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (conversations.length <= 1) {
      handleNewChat();
      return;
    }
    const updated = conversations.filter((c) => c.id !== convId);
    setConversations(updated);
    if (activeConvId === convId) {
      setActiveConvId(updated[0].id);
    }
    if (user?.uid) deleteChatConversationFromCloud(user.uid, convId);
  };

  // Rename Chat
  const handleSaveRename = (convId: string) => {
    if (editTitleText.trim()) {
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id === convId) {
            const updated = { ...c, title: editTitleText.trim(), updatedAt: Date.now() };
            if (user?.uid) saveChatConversationToCloud(user.uid, updated);
            return updated;
          }
          return c;
        })
      );
    }
    setEditingConvId(null);
  };

  // Input Changes & Slash Menu
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setInputMessage(val);
    if (val.startsWith('/')) {
      setIsSlashMenuOpen(true);
      setSlashQuery(val.slice(1).toLowerCase());
    } else {
      setIsSlashMenuOpen(false);
    }
  };

  const handleSelectSlashCommand = (cmd: SlashCommand) => {
    setIsSlashMenuOpen(false);
    setInputMessage('');
    handleSendMessage(cmd.prompt);
  };

  // File Upload
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        setAttachedFile({
          file,
          name: file.name,
          type: 'image',
          previewUrl: evt.target?.result as string,
          base64Data: evt.target?.result as string,
        });
      };
      reader.readAsDataURL(file);
    } else {
      const reader = new FileReader();
      reader.onload = (evt) => {
        setAttachedFile({
          file,
          name: file.name,
          type: 'text',
          content: evt.target?.result as string,
        });
      };
      reader.readAsText(file);
    }
  };

  // Send Message
  const handleSendMessage = async (customPrompt?: string) => {
    const textToSend = customPrompt || inputMessage;
    if ((!textToSend.trim() && !attachedFile) || isLoading || !activeConversation) return;

    setIsSlashMenuOpen(false);

    const currentAttachment = attachedFile;
    setAttachedFile(null);

    const userMsg: ChatMessage = {
      id: `msg_user_${Date.now()}`,
      role: 'user',
      content: textToSend.trim() || `[Uploaded file: ${currentAttachment?.name}]`,
      timestamp: Date.now(),
      attachedFile: currentAttachment ? { name: currentAttachment.name, type: currentAttachment.type, previewUrl: currentAttachment.previewUrl } : undefined,
    };

    let updatedTitle = activeConversation.title;
    if (activeConversation.messages.length === 0 || activeConversation.title === 'New Controls Session') {
      updatedTitle = (textToSend || currentAttachment?.name || 'Controls Q&A').slice(0, 32);
    }

    const updatedMessages = [...activeConversation.messages, userMsg];
    const updatedConv: ChatConversation = {
      ...activeConversation,
      title: updatedTitle,
      updatedAt: Date.now(),
      messages: updatedMessages,
    };

    setConversations((prev) => prev.map((c) => (c.id === activeConversation.id ? updatedConv : c)));
    if (user?.uid) saveChatConversationToCloud(user.uid, updatedConv);

    if (!customPrompt) setInputMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend || 'Please analyze this attached controls file/image.',
          imageData: currentAttachment?.base64Data,
          fileContent: currentAttachment?.content,
          fileName: currentAttachment?.name,
          history: activeConversation.messages.map((m) => ({ role: m.role, content: m.content })),
          studioContext: studioContext || null,
          programContext: studioContext?.activeStudioId !== 'network' && currentProgram ? {
            title: currentProgram.title,
            category: currentProgram.category,
            blockCount: (currentProgram.blocks || []).length,
            linkCount: (currentProgram.links || []).length,
          } : null,
        }),
      });

      const data = await response.json();
      const rawText =
        (typeof data?.reply === 'string' && data.reply.trim().length > 0)
          ? data.reply.trim()
          : (typeof data?.message === 'string' && data.message.trim().length > 0)
          ? data.message.trim()
          : 'I have processed your Niagara controls request. How else can I assist your engineering work?';

      const { cleanedText, actions } = parseActionTags(rawText);

      if (actions.length > 0 && onExecuteAiAction) {
        actions.forEach((act) => onExecuteAiAction(act.type, act.payload));
      }

      const assistantMsg: ChatMessage = {
        id: `msg_ast_${Date.now()}`,
        role: 'assistant',
        content: cleanedText,
        timestamp: Date.now(),
        actions: actions.length > 0 ? actions : undefined,
      };

      const finalConv: ChatConversation = {
        ...updatedConv,
        updatedAt: Date.now(),
        messages: [...updatedMessages, assistantMsg],
      };

      setConversations((prev) => prev.map((c) => (c.id === activeConversation.id ? finalConv : c)));
      if (user?.uid) saveChatConversationToCloud(user.uid, finalConv);
    } catch (err: any) {
      console.error('AI Chat Error:', err);
      const errorMsg: ChatMessage = {
        id: `msg_err_${Date.now()}`,
        role: 'assistant',
        content: `⚠️ Could not reach Studio Copilot service. Please verify server connection and try again.`,
        timestamp: Date.now(),
      };
      setConversations((prev) =>
        prev.map((c) => (c.id === activeConversation.id ? { ...c, messages: [...updatedMessages, errorMsg] } : c))
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopyNoticeId(id);
    setTimeout(() => setCopyNoticeId(null), 2000);
  };

  const handleMessageFeedback = (msgId: string, feedback: 'like' | 'dislike') => {
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id === activeConversation.id) {
          return {
            ...c,
            messages: c.messages.map((m) => (m.id === msgId ? { ...m, feedback } : m)),
          };
        }
        return c;
      })
    );
  };

  // Filtered Conversations for Sidebar
  const filteredConversations = conversations.filter((c) =>
    c.title.toLowerCase().includes(chatSearchQuery.toLowerCase())
  );

  const filteredSlash = SLASH_COMMANDS.filter(
    (c) =>
      c.command.toLowerCase().includes(slashQuery) ||
      c.label.toLowerCase().includes(slashQuery) ||
      c.description.toLowerCase().includes(slashQuery)
  );

  // Time-aware greeting & User Name
  const timeGreeting = getTimeGreeting();
  const userName = formatUserName(user);
  const hasMessages = activeConversation && activeConversation.messages.length > 0;

  if (!isOpen) return null;

  return (
    <div
      id="studio-copilot-container"
      style={{
        width: viewMode === 'fullscreen' ? '100vw' : `${drawerWidth}px`,
      }}
      className={`${
        viewMode === 'fullscreen'
          ? 'fixed inset-0 z-50'
          : 'relative z-30 shrink-0 h-full border-l border-white/10 shadow-2xl'
      } flex overflow-hidden font-sans transition-[width] duration-75 bg-[#131314] text-[#e3e3e3]`}
    >
      {/* Draggable Left Resizer Handle (Only active when in docked drawer mode) */}
      {viewMode === 'drawer' && (
        <div
          onMouseDown={handleMouseDownResize}
          className="absolute left-0 top-0 bottom-0 w-2.5 -ml-1 cursor-ew-resize group z-40 flex items-center justify-center hover:bg-sky-500/20 active:bg-sky-500/30 transition-colors select-none"
          title="Drag to resize Studio Copilot width"
        >
          <div className="w-0.5 h-8 rounded-full bg-white/20 group-hover:bg-sky-400 group-active:bg-sky-400 transition-colors" />
        </div>
      )}

      {/* Subtle Central Ambient Glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center">
        <div className="w-[500px] h-[350px] rounded-full bg-gradient-to-tr from-sky-900/15 via-indigo-900/10 to-transparent blur-3xl opacity-70" />
      </div>

      {/* 1. MINIMALIST LEFT SIDEBAR (Chats, Recents, Profile) */}
      <div
        className={`relative z-20 flex flex-col justify-between border-r border-white/5 bg-[#171718] transition-all duration-300 ${
          isSidebarOpen ? 'w-64 min-w-[16rem]' : 'w-0 min-w-0 -translate-x-full overflow-hidden border-none'
        }`}
      >
        {/* Top Section */}
        <div className="p-3 space-y-3">
          {/* Logo & Brand Header */}
          <div className="flex items-center justify-between px-2 pt-1">
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-sky-400 via-indigo-400 to-purple-400 flex items-center justify-center text-black shadow-xs">
                <Sparkles className="w-3.5 h-3.5 fill-black text-black" />
              </div>
              <span className="font-semibold text-sm tracking-tight text-white">Studio Copilot</span>
            </div>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
              title="Collapse sidebar"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          </div>

          {/* New Chat Pill */}
          <button
            onClick={handleNewChat}
            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-full bg-white/5 hover:bg-white/10 text-white text-xs font-medium transition-colors cursor-pointer border border-white/5 shadow-xs"
          >
            <Plus className="w-4 h-4 text-sky-400" />
            <span>New chat</span>
          </button>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={chatSearchQuery}
              onChange={(e) => setChatSearchQuery(e.target.value)}
              placeholder="Search chats"
              className="w-full pl-8 pr-3 py-1.5 rounded-full bg-white/[0.03] border border-white/5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500/40"
            />
          </div>

          {/* Recents Navigation Section */}
          <div className="pt-2">
            <div className="flex items-center justify-between px-2 pb-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              <span>Saved Chats</span>
              {user && (
                <span className="text-[10px] text-emerald-400 font-mono normal-case flex items-center gap-1 font-normal">
                  <CloudCheck className="w-3 h-3" />
                  <span>Cloud Synced</span>
                </span>
              )}
            </div>
            <div className="max-h-[calc(100vh-290px)] overflow-y-auto space-y-0.5 pr-1 scrollbar-thin">
              {filteredConversations.map((conv) => {
                const isActive = conv.id === activeConvId;
                const isEditing = editingConvId === conv.id;

                return (
                  <div
                    key={conv.id}
                    onClick={() => setActiveConvId(conv.id)}
                    className={`group flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all cursor-pointer ${
                      isActive
                        ? 'bg-white/10 text-white font-medium'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate flex-1 mr-1">
                      <MessageSquare className="w-3.5 h-3.5 shrink-0 opacity-70" />
                      {isEditing ? (
                        <input
                          type="text"
                          value={editTitleText}
                          onChange={(e) => setEditTitleText(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSaveRename(conv.id)}
                          onBlur={() => handleSaveRename(conv.id)}
                          autoFocus
                          className="bg-black/50 border border-sky-500/50 rounded px-1.5 py-0.5 text-xs text-white w-full focus:outline-none"
                        />
                      ) : (
                        <span className="truncate">{conv.title}</span>
                      )}
                    </div>

                    <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingConvId(conv.id);
                          setEditTitleText(conv.title);
                        }}
                        className="p-1 text-slate-400 hover:text-white rounded"
                        title="Rename"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => handleDeleteChat(conv.id, e)}
                        className="p-1 text-slate-400 hover:text-red-400 rounded"
                        title="Delete"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom Profile & Authentication Area */}
        <div className="p-3 border-t border-white/5 bg-[#131314]/80 flex items-center justify-between">
          {user ? (
            <div className="flex items-center gap-2.5 truncate flex-1 mr-1">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shadow-sm shrink-0">
                {user.displayName?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="truncate">
                <div className="text-xs font-semibold text-white truncate">
                  {user.displayName || user.email?.split('@')[0] || 'User'}
                </div>
                <div className="text-[11px] text-slate-400 truncate">{user.email}</div>
              </div>
            </div>
          ) : (
            <button
              onClick={onOpenAuthModal}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 text-xs font-semibold transition-colors cursor-pointer border border-sky-400/30"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign in to save chats</span>
            </button>
          )}

          <button
            onClick={onOpenAuthModal}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer shrink-0"
            title="Account Settings & Cloud Station Backup"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. MAIN CONVERSATION / HERO CANVAS */}
      <div className="relative z-10 flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Sleek Navigation Bar */}
        <header className="px-4 py-3 flex items-center justify-between select-none border-b border-white/5 bg-[#131314]">
          <div className="flex items-center gap-3">
            {!isSidebarOpen && (
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer flex items-center gap-1.5 text-xs"
                title="Open saved chats history"
              >
                <PanelLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Chats</span>
              </button>
            )}

            {/* Studio Copilot Brand Title */}
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-sky-400 via-indigo-400 to-purple-400 flex items-center justify-center text-black">
                <Sparkles className="w-3.5 h-3.5 fill-black text-black" />
              </div>
              <span className="font-bold text-sm tracking-tight text-white">Studio Copilot</span>
            </div>
          </div>

          {/* Right Header Utilities: Fullscreen & Close */}
          <div className="flex items-center gap-1">
            {/* View Mode Toggle: Fullscreen vs Docked Resizable Drawer */}
            <button
              onClick={() => setViewMode(viewMode === 'fullscreen' ? 'drawer' : 'fullscreen')}
              className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
              title={viewMode === 'fullscreen' ? 'Dock to side panel' : 'Expand to full screen'}
            >
              {viewMode === 'fullscreen' ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
              title="Close Studio Copilot"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* 3. HERO / CHAT STREAM CONTAINER */}
        <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4 flex flex-col justify-between scrollbar-thin">
          {!hasMessages ? (
            /* EMPTY HERO STATE - Dynamic Machine Time Greeting */
            <div className="flex-1 flex flex-col items-center justify-center text-center max-w-xl mx-auto px-4 py-8 animate-in fade-in duration-300">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-400 via-indigo-400 to-purple-400 flex items-center justify-center shadow-lg shadow-sky-500/20 mb-6">
                <Sparkles className="w-6 h-6 text-black fill-black" />
              </div>

              <h1 className="text-2xl sm:text-3xl font-medium text-white tracking-tight mb-2.5">
                {timeGreeting} {userName}, how may I help you?
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 max-w-md leading-relaxed mb-8">
                Your intelligent Building Automation & Controls assistant. Ask anything about PID loop tuning, Guideline 36, BACnet MS/TP, Modbus registers, or generate Wire Sheet logic.
              </p>

              {/* Minimalist Suggested Query Capsules */}
              <div className="flex flex-wrap items-center justify-center gap-2 max-w-lg">
                {SUGGESTED_PILLS.map((pill, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(pill.prompt)}
                    className="px-3.5 py-2 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/5 text-xs text-slate-300 hover:text-white transition-all cursor-pointer hover:border-sky-500/30"
                  >
                    {pill.label}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* ACTIVE CONVERSATION STREAM */
            <div className="max-w-3xl w-full mx-auto space-y-6 pb-6">
              {activeConversation.messages.map((msg) => {
                const isUser = msg.role === 'user';

                return (
                  <div
                    key={msg.id}
                    className={`flex gap-3.5 ${isUser ? 'justify-end' : 'justify-start'} animate-in fade-in duration-150`}
                  >
                    {/* Assistant Avatar */}
                    {!isUser && (
                      <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-sky-400 to-indigo-500 flex items-center justify-center text-black shrink-0 mt-0.5 shadow-xs">
                        <Sparkles className="w-3.5 h-3.5 fill-black text-black" />
                      </div>
                    )}

                    {/* Message Body */}
                    <div
                      className={`max-w-[88%] sm:max-w-[82%] rounded-3xl p-4 sm:p-5 ${
                        isUser
                          ? 'bg-[#282a2c] text-white rounded-tr-sm shadow-sm'
                          : 'bg-[#1e1f20]/90 text-slate-100 rounded-tl-sm border border-white/5 shadow-md'
                      }`}
                    >
                      {/* Attached Image / File Preview */}
                      {msg.attachedFile && (
                        <div className="mb-3 rounded-xl overflow-hidden border border-white/10 bg-black/40">
                          {msg.attachedFile.previewUrl ? (
                            <img
                              src={msg.attachedFile.previewUrl}
                              alt="attachment"
                              className="max-h-48 w-auto object-cover rounded-lg"
                            />
                          ) : (
                            <div className="p-2.5 flex items-center gap-2 text-xs text-sky-300">
                              <FileText className="w-4 h-4" />
                              <span>{msg.attachedFile.name}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Content */}
                      <MinimalMessageContent content={msg.content} />

                      {/* Interactive Action Buttons */}
                      {msg.actions && msg.actions.length > 0 && (
                        <div className="mt-3.5 pt-3 border-t border-white/10 flex flex-wrap gap-2">
                          {msg.actions.map((act, actIdx) => (
                            <button
                              key={actIdx}
                              onClick={() => onExecuteAiAction && onExecuteAiAction(act.type, act.payload)}
                              className="px-3 py-1.5 rounded-full bg-sky-500/20 hover:bg-sky-500/30 border border-sky-400/40 text-sky-200 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer hover:scale-102 shadow-xs"
                            >
                              <Zap className="w-3 h-3 text-sky-300" />
                              <span>{act.label}</span>
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Assistant Utilities Footer: Copy, Feedback, Timestamp */}
                      {!isUser && (
                        <div className="mt-3 pt-2 flex items-center justify-between text-[11px] text-slate-500">
                          <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleCopyText(msg.id, msg.content)}
                              className="hover:text-white transition-colors cursor-pointer"
                              title="Copy response"
                            >
                              {copyNoticeId === msg.id ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                            <button
                              onClick={() => handleMessageFeedback(msg.id, 'like')}
                              className={`hover:text-white transition-colors cursor-pointer ${
                                msg.feedback === 'like' ? 'text-sky-400' : ''
                              }`}
                              title="Helpful"
                            >
                              <ThumbsUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleMessageFeedback(msg.id, 'dislike')}
                              className={`hover:text-white transition-colors cursor-pointer ${
                                msg.feedback === 'dislike' ? 'text-red-400' : ''
                              }`}
                              title="Not helpful"
                            >
                              <ThumbsDown className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* User Avatar */}
                    {isUser && (
                      <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-white font-bold text-xs shrink-0 mt-0.5">
                        {userName.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Live Loading Typing Beacon */}
              {isLoading && (
                <div className="flex gap-3.5 items-start animate-in fade-in duration-200">
                  <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-sky-400 to-indigo-500 flex items-center justify-center text-black shrink-0">
                    <Sparkles className="w-3.5 h-3.5 fill-black text-black" />
                  </div>
                  <div className="px-4 py-3 rounded-2xl bg-[#1e1f20] border border-white/5 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
                    <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse delay-75" />
                    <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse delay-150" />
                    <span className="text-xs text-slate-400 ml-1">Analyzing controls sequence...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* 4. THE ICONIC FLOATING CAPSULE INPUT BAR */}
        <div className="p-4 md:px-6 pb-6 bg-gradient-to-t from-[#131314] via-[#131314] to-transparent">
          <div className="max-w-2xl w-full mx-auto relative">
            {/* Slash Command Autocomplete Menu */}
            {isSlashMenuOpen && filteredSlash.length > 0 && (
              <div className="absolute bottom-full mb-3 left-0 right-0 max-h-64 overflow-y-auto rounded-2xl bg-[#1e1f20] border border-white/10 shadow-2xl p-1.5 z-50 scrollbar-thin animate-in fade-in duration-100">
                <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Controls Commands (Click command to run)
                </div>
                {filteredSlash.map((cmd, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelectSlashCommand(cmd)}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs hover:bg-white/10 transition-colors flex items-center gap-2.5 text-slate-200 cursor-pointer"
                  >
                    <span className="text-base">{cmd.icon}</span>
                    <div className="flex-1 truncate">
                      <div className="font-semibold text-white flex items-center gap-1.5">
                        <span className="text-sky-400 font-mono">{cmd.command}</span>
                        <span>•</span>
                        <span>{cmd.label}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">{cmd.description}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Attached File Chip Preview */}
            {attachedFile && (
              <div className="mb-2 flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/10 text-xs text-slate-200 w-fit">
                <Paperclip className="w-3.5 h-3.5 text-sky-400" />
                <span className="truncate max-w-[200px]">{attachedFile.name}</span>
                <button
                  onClick={() => setAttachedFile(null)}
                  className="p-0.5 hover:text-red-400 text-slate-400 ml-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Capsule Container */}
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#1e1f20] border border-white/10 shadow-xl focus-within:border-sky-500/50 focus-within:ring-1 focus-within:ring-sky-500/30 transition-all">
              {/* Left Plus Attachment / Command Button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-1.5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer shrink-0"
                title="Attach sequence document, PDF, or diagram"
              >
                <Plus className="w-4 h-4" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf,.txt,.bql,.bog,.json,.csv,.pcap"
                onChange={handleFileSelect}
                className="hidden"
              />

              {/* Text Input */}
              <textarea
                ref={textareaRef}
                value={inputMessage}
                onChange={handleInputChange}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                rows={1}
                placeholder="Ask Studio Copilot or type '/' for commands..."
                className="flex-1 bg-transparent border-none text-sm text-white placeholder-slate-400 focus:outline-none resize-none max-h-32 py-1 leading-relaxed"
              />

              {/* Right Utilities: Voice & Send */}
              <div className="flex items-center gap-1.5 shrink-0">
                {/* Voice Dictation Button */}
                {speechSupported && (
                  <button
                    onClick={toggleSpeechRecognition}
                    className={`p-2 rounded-full transition-all cursor-pointer ${
                      isListening
                        ? 'bg-red-500/20 text-red-400 animate-pulse ring-1 ring-red-400'
                        : 'hover:bg-white/10 text-slate-400 hover:text-white'
                    }`}
                    title={isListening ? 'Listening...' : 'Voice dictation'}
                  >
                    <Mic className="w-4 h-4" />
                  </button>
                )}

                {/* Send Button */}
                <button
                  onClick={() => handleSendMessage()}
                  disabled={isLoading || (!inputMessage.trim() && !attachedFile)}
                  className={`p-2 rounded-full transition-all cursor-pointer ${
                    inputMessage.trim() || attachedFile
                      ? 'bg-white text-black hover:bg-slate-200 shadow-md'
                      : 'text-slate-600 bg-white/5 cursor-not-allowed'
                  }`}
                  title="Send message"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Bottom Subtle Disclaimer */}
            <div className="text-center mt-2 text-[10.5px] text-slate-500">
              Studio Copilot can assist with building automation sequences. Always verify safety interlocks before commissioning.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

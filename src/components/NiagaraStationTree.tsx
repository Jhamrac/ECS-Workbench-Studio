import React, { useState } from 'react';
import {
  Folder,
  FolderOpen,
  Server,
  Cpu,
  Layers,
  FileCode,
  Sliders,
  Bell,
  Clock,
  Shield,
  ChevronRight,
  ChevronDown,
  Database,
  RefreshCw,
  HardDrive,
  Radio,
  Search,
  X,
} from 'lucide-react';
import { NiagaraProgram } from '../types/niagara';
import { useNiagaraTheme } from '../context/NiagaraThemeContext';

interface NiagaraStationTreeProps {
  currentProgram: NiagaraProgram;
  onSelectProgram?: (prog: NiagaraProgram) => void;
  isOpen: boolean;
  onClose: () => void;
  isMobile: boolean;
  onOpenPalette: () => void;
}

interface TreeNode {
  id: string;
  name: string;
  type: 'station' | 'folder' | 'wiresheet' | 'service' | 'driver' | 'point' | 'palette';
  ord: string;
  children?: TreeNode[];
  badge?: string;
  iconColor?: string;
}

export const NiagaraStationTree: React.FC<NiagaraStationTreeProps> = ({
  currentProgram,
  isOpen,
  onClose,
  isMobile,
  onOpenPalette,
}) => {
  const { theme, isDark } = useNiagaraTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(
    new Set(['root', 'station', 'config', 'drivers', 'bacnet', 'services'])
  );

  const toggleNode = (nodeId: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  const treeData: TreeNode = {
    id: 'root',
    name: 'My Host (127.0.0.1)',
    type: 'folder',
    ord: 'host:|',
    children: [
      {
        id: 'station',
        name: 'Station (JACE_8000_BMS)',
        type: 'station',
        ord: 'station:|',
        badge: 'RUNNING',
        children: [
          {
            id: 'config',
            name: 'Config',
            type: 'folder',
            ord: 'station:|slot:/',
            children: [
              {
                id: 'drivers',
                name: 'Drivers',
                type: 'driver',
                ord: 'station:|slot:/Drivers',
                children: [
                  {
                    id: 'bacnet',
                    name: 'BacnetNetwork',
                    type: 'driver',
                    ord: 'station:|slot:/Drivers/BacnetNetwork',
                    children: [
                      {
                        id: 'current_unit',
                        name: currentProgram.title.replace(/[\s/]/g, '_'),
                        type: 'folder',
                        ord: `station:|slot:/Drivers/BacnetNetwork/${currentProgram.title.replace(/[\s/]/g, '_')}`,
                        children: [
                          {
                            id: 'wiresheet',
                            name: 'wireSheet (Active)',
                            type: 'wiresheet',
                            ord: `station:|slot:/Drivers/BacnetNetwork/${currentProgram.title.replace(/[\s/]/g, '_')}/wireSheet`,
                            badge: `${currentProgram.blocks.length} blks`,
                          },
                          {
                            id: 'points_folder',
                            name: 'Points',
                            type: 'folder',
                            ord: `station:|slot:/Drivers/BacnetNetwork/${currentProgram.title.replace(/[\s/]/g, '_')}/Points`,
                            children: currentProgram.blocks
                              .filter((b) => b.palette.includes('points'))
                              .map((b) => ({
                                id: `pt_${b.id}`,
                                name: b.name,
                                type: 'point' as const,
                                ord: `station:|slot:/Drivers/BacnetNetwork/Points/${b.name}`,
                              })),
                          },
                        ],
                      },
                    ],
                  },
                  {
                    id: 'niagara_network',
                    name: 'NiagaraNetwork',
                    type: 'driver',
                    ord: 'station:|slot:/Drivers/NiagaraNetwork',
                  },
                ],
              },
              {
                id: 'services',
                name: 'Services',
                type: 'service',
                ord: 'station:|slot:/Services',
                children: [
                  {
                    id: 'alarm_svc',
                    name: 'AlarmService',
                    type: 'service',
                    ord: 'station:|slot:/Services/AlarmService',
                  },
                  {
                    id: 'history_svc',
                    name: 'HistoryService',
                    type: 'service',
                    ord: 'station:|slot:/Services/HistoryService',
                  },
                  {
                    id: 'schedule_svc',
                    name: 'ScheduleService',
                    type: 'service',
                    ord: 'station:|slot:/Services/ScheduleService',
                  },
                  {
                    id: 'control_engine',
                    name: 'ControlEngine (50ms)',
                    type: 'service',
                    ord: 'station:|slot:/Services/ControlEngine',
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  };

  const renderIcon = (type: TreeNode['type'], isExpanded: boolean) => {
    switch (type) {
      case 'station':
        return <Server className="w-3.5 h-3.5 text-emerald-500 shrink-0" />;
      case 'driver':
        return <Radio className="w-3.5 h-3.5 text-sky-500 shrink-0" />;
      case 'wiresheet':
        return <FileCode className="w-3.5 h-3.5 text-amber-500 shrink-0" />;
      case 'service':
        return <Cpu className="w-3.5 h-3.5 text-purple-500 shrink-0" />;
      case 'point':
        return <Layers className="w-3.5 h-3.5 text-teal-500 shrink-0" />;
      default:
        return isExpanded ? (
          <FolderOpen className="w-3.5 h-3.5 text-amber-400 shrink-0" />
        ) : (
          <Folder className="w-3.5 h-3.5 text-amber-400 shrink-0" />
        );
    }
  };

  const renderNode = (node: TreeNode, depth = 0) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedNodes.has(node.id);
    const matchesSearch = !searchTerm || node.name.toLowerCase().includes(searchTerm.toLowerCase());

    if (searchTerm && !matchesSearch && (!node.children || !node.children.some((c) => c.name.toLowerCase().includes(searchTerm.toLowerCase())))) {
      return null;
    }

    return (
      <div key={node.id} className="select-none font-sans text-xs">
        <div
          onClick={() => {
            if (hasChildren) toggleNode(node.id);
          }}
          style={{ paddingLeft: depth === 0 ? '6px' : '4px' }}
          className={`flex items-center gap-1.5 py-1 px-1.5 rounded cursor-pointer transition-colors ${
            node.type === 'wiresheet'
              ? isDark
                ? 'bg-sky-950/70 text-sky-200 font-semibold border-l-2 border-sky-400'
                : 'bg-sky-100 text-sky-900 font-semibold border-l-2 border-sky-600'
              : isDark
              ? 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              : 'text-slate-700 hover:bg-slate-200/80 hover:text-slate-950'
          }`}
        >
          {hasChildren ? (
            <span className="w-3.5 h-3.5 flex items-center justify-center text-slate-400">
              {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            </span>
          ) : (
            <span className="w-3.5" />
          )}

          {renderIcon(node.type, isExpanded)}

          <span className="truncate flex-1 font-mono text-[11px]">{node.name}</span>

          {node.badge && (
            <span
              className={`text-[9px] px-1 rounded font-mono uppercase font-bold shrink-0 ${
                node.badge === 'RUNNING'
                  ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-700/50'
                  : isDark
                  ? 'bg-slate-800 text-slate-300 border border-slate-700'
                  : 'bg-slate-200 text-slate-700 border border-slate-300'
              }`}
            >
              {node.badge}
            </span>
          )}
        </div>

        {hasChildren && isExpanded && (
          <div
            className={`space-y-0.5 mt-0.5 ml-[11px] pl-2.5 border-l border-dotted ${
              isDark ? 'border-slate-800' : 'border-slate-300'
            }`}
          >
            {(node.children || []).map((child) => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <aside
      id="niagara-nav-tree-sidebar"
      className={`${
        isMobile
          ? 'fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] shadow-2xl animate-in slide-in-from-left duration-200'
          : 'relative w-64 shrink-0'
      } flex flex-col border-r ${
        isDark
          ? 'bg-[#0f172a] border-slate-800 text-slate-200'
          : 'bg-[#f1f5f9] border-[#cbd5e1] text-slate-800'
      }`}
    >
      {/* Header bar styled like Niagara Workbench Nav Header */}
      <div
        className={`flex items-center justify-between px-3 py-2 border-b select-none ${
          isDark
            ? 'bg-gradient-to-r from-slate-900 to-slate-800 border-slate-700 text-slate-200'
            : 'bg-gradient-to-r from-slate-200 to-slate-100 border-[#cbd5e1] text-slate-800'
        }`}
      >
        <div className="flex items-center gap-2 font-bold text-xs tracking-wider uppercase">
          <Database className="w-3.5 h-3.5 text-sky-500" />
          <span>Nav Tree</span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={onOpenPalette}
            title="Open Niagara Palettes"
            className={`px-1.5 py-0.5 text-[10px] rounded font-medium cursor-pointer border ${
              isDark
                ? 'bg-slate-800 hover:bg-slate-700 text-sky-300 border-slate-700'
                : 'bg-white hover:bg-slate-50 text-sky-700 border-slate-300'
            }`}
          >
            Palette
          </button>

          {isMobile && (
            <button
              onClick={onClose}
              className="p-1 rounded text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Filter / Search Box */}
      <div className={`p-2 border-b ${isDark ? 'border-slate-800 bg-slate-900/50' : 'border-[#cbd5e1] bg-slate-100'}`}>
        <div className="relative">
          <Search className="w-3 h-3 absolute left-2 top-2 text-slate-400" />
          <input
            type="text"
            placeholder="Filter Niagara slots..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full text-xs pl-7 pr-2 py-1 rounded border font-mono outline-none ${
              isDark
                ? 'bg-slate-950 border-slate-700 text-slate-200 placeholder-slate-500 focus:border-sky-500'
                : 'bg-white border-slate-300 text-slate-800 placeholder-slate-400 focus:border-sky-500'
            }`}
          />
        </div>
      </div>

      {/* Tree Content */}
      <div className="flex-1 overflow-y-auto p-1.5 space-y-0.5 font-mono">
        {renderNode(treeData)}
      </div>

      {/* Station Details Footer */}
      <div
        className={`p-2 border-t text-[10px] font-mono select-none ${
          isDark ? 'border-slate-800 bg-slate-950/60 text-slate-400' : 'border-[#cbd5e1] bg-slate-200/60 text-slate-600'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1 text-emerald-500 font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Fox: 1911 (TLS)
          </span>
          <span>N4.13.0.64</span>
        </div>
        <div className="truncate text-slate-400 mt-0.5">ORD: station:|slot:/Drivers</div>
      </div>
    </aside>
  );
};

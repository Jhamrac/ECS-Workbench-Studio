import React, { useState, useEffect } from 'react';
import { NiagaraProgram } from '../types/niagara';
import { LibraryFolder } from '../types/library';
import { Save, FolderPlus, X, Folder, Layers, Sparkles, Check } from 'lucide-react';
import { useNiagaraTheme } from '../context/NiagaraThemeContext';

interface SaveLogicModalProps {
  isOpen: boolean;
  onClose: () => void;
  program: NiagaraProgram;
  folders: LibraryFolder[];
  onSave: (folderId: string, title: string, description: string) => void;
  onCreateFolder: (name: string) => LibraryFolder;
}

export const SaveLogicModal: React.FC<SaveLogicModalProps> = ({
  isOpen,
  onClose,
  program,
  folders,
  onSave,
  onCreateFolder,
}) => {
  const { theme, isDark } = useNiagaraTheme();

  const [title, setTitle] = useState(program.title || 'Custom Logic Sequence');
  const [description, setDescription] = useState(program.description || '');
  const [selectedFolderId, setSelectedFolderId] = useState<string>(
    folders[0]?.id || 'f_custom'
  );
  const [isCreatingNewFolder, setIsCreatingNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  useEffect(() => {
    if (isOpen) {
      setTitle(program.title || 'Custom Logic Sequence');
      setDescription(program.description || '');
      if (folders.length > 0 && !folders.some((f) => f.id === selectedFolderId)) {
        setSelectedFolderId(folders[0].id);
      }
    }
  }, [isOpen, program, folders]);

  if (!isOpen) return null;

  const handleCreateFolderInline = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    const created = onCreateFolder(newFolderName.trim());
    setSelectedFolderId(created.id);
    setNewFolderName('');
    setIsCreatingNewFolder(false);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSave(selectedFolderId, title.trim(), description.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-150 select-none">
      <div
        className={`border rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] transition-colors ${
          isDark
            ? 'bg-[#0f172a] border-slate-700 text-slate-100'
            : 'bg-white border-slate-300 text-slate-900'
        }`}
      >
        {/* Modal Header */}
        <div
          className={`flex items-center justify-between px-5 py-3.5 border-b ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-500 border border-emerald-500/30">
              <Save className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight">
                Save Logic to Workbench Library
              </h2>
              <span className="text-xs opacity-75 font-mono">
                {program.blocks.length} Blocks • {program.links.length} Link Connections
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-black/20 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleFormSubmit} className="p-5 flex-1 overflow-y-auto space-y-4 text-xs">
          {/* Logic Title */}
          <div>
            <label className="block font-bold mb-1 opacity-90">
              Sequence / Application Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. AHU-1 Dual Fan Economizer with Heat Recovery"
              className={`w-full border rounded-lg px-3 py-2 outline-none font-semibold ${
                isDark
                  ? 'bg-slate-800 border-slate-700 text-amber-400 focus:border-amber-500'
                  : 'bg-white border-slate-300 text-slate-900 focus:border-amber-500'
              }`}
            />
          </div>

          {/* Target Folder Selection */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-bold opacity-90">Select Library Folder</label>
              {!isCreatingNewFolder && (
                <button
                  type="button"
                  onClick={() => setIsCreatingNewFolder(true)}
                  className="text-emerald-500 hover:text-emerald-400 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                >
                  <FolderPlus className="w-3.5 h-3.5" />
                  <span>+ New Folder</span>
                </button>
              )}
            </div>

            {isCreatingNewFolder ? (
              <div
                className={`p-2.5 rounded-lg border flex items-center gap-2 ${
                  isDark ? 'bg-slate-900 border-slate-700' : 'bg-slate-100 border-slate-300'
                }`}
              >
                <Folder className="w-4 h-4 text-emerald-500 shrink-0" />
                <input
                  type="text"
                  autoFocus
                  placeholder="Enter new folder name..."
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  className={`flex-1 px-2 py-1 text-xs rounded border outline-none ${
                    isDark
                      ? 'bg-slate-800 border-slate-700 text-white focus:border-emerald-500'
                      : 'bg-white border-slate-300 text-slate-900 focus:border-emerald-500'
                  }`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCreateFolderInline(e);
                    if (e.key === 'Escape') setIsCreatingNewFolder(false);
                  }}
                />
                <button
                  type="button"
                  onClick={handleCreateFolderInline}
                  className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold cursor-pointer"
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => setIsCreatingNewFolder(false)}
                  className="px-2 py-1 hover:bg-black/20 text-slate-400 rounded cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto p-1 border rounded-lg border-black/10 dark:border-white/10">
                {folders.map((folder) => {
                  const isSelected = selectedFolderId === folder.id;
                  return (
                    <button
                      key={folder.id}
                      type="button"
                      onClick={() => setSelectedFolderId(folder.id)}
                      className={`flex items-center gap-2 p-2 rounded-lg text-left transition-all cursor-pointer border ${
                        isSelected
                          ? isDark
                            ? 'bg-emerald-950/70 border-emerald-500 text-emerald-300 font-bold'
                            : 'bg-emerald-50 border-emerald-500 text-emerald-900 font-bold'
                          : isDark
                          ? 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:border-slate-600'
                          : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <Folder
                        className="w-4 h-4 shrink-0"
                        style={{ color: folder.color || '#10b981' }}
                      />
                      <span className="truncate text-xs flex-1">{folder.name}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Description & Commissioning Notes */}
          <div>
            <label className="block font-bold mb-1 opacity-90">
              Sequence Description / Engineer Notes (Optional)
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add key sequence notes, design conditions, sensor ranges, or tuning guidelines..."
              className={`w-full border rounded-lg px-3 py-2 outline-none ${
                isDark
                  ? 'bg-slate-800 border-slate-700 text-slate-200 placeholder-slate-500 focus:border-emerald-500'
                  : 'bg-white border-slate-300 text-slate-800 placeholder-slate-400 focus:border-emerald-500'
              }`}
            />
          </div>

          {/* Program Overview Summary Card */}
          <div
            className={`border rounded-lg p-3 space-y-1.5 ${
              isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="opacity-75">Components:</span>
              <span className="font-bold text-amber-500">{program.blocks.length} blocks</span>
            </div>
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="opacity-75">Interconnects:</span>
              <span className="font-bold text-sky-500">{program.links.length} wires</span>
            </div>
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="opacity-75">Workbench Guide Steps:</span>
              <span className="font-bold text-emerald-500">
                {program.rebuildSteps?.length || 0} steps
              </span>
            </div>
          </div>

          {/* Action Footer */}
          <div className="pt-3 border-t border-black/10 dark:border-white/10 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className={`px-3 py-1.5 rounded-lg font-semibold cursor-pointer ${
                isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-200'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-md cursor-pointer transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>Save to Library</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

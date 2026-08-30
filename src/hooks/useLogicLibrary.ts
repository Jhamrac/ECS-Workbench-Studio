import { useState, useEffect, useCallback } from 'react';
import { LibraryFolder, SavedLogicItem, LibraryState } from '../types/library';
import { NiagaraProgram } from '../types/niagara';
import { NIAGARA_TEMPLATES } from '../data/templates';

const STORAGE_KEY_FOLDERS = 'niagara_library_folders_v2';
const STORAGE_KEY_ITEMS = 'niagara_library_items_v2';

const DEFAULT_FOLDERS: LibraryFolder[] = [
  { id: 'f_hydronics', name: 'Hydronics & Pumping Systems', parentId: null, color: '#0284c7', isDefault: true },
  { id: 'f_ahu', name: 'Air Handling Units (AHU)', parentId: null, color: '#059669', isDefault: true },
  { id: 'f_boilers', name: 'Boiler & Heating Plants', parentId: null, color: '#ea580c', isDefault: true },
  { id: 'f_vav', name: 'VAV & Terminal Units', parentId: null, color: '#7c3aed', isDefault: true },
  { id: 'f_lighting', name: 'Lighting & Auxiliary Controls', parentId: null, color: '#d97706', isDefault: true },
  { id: 'f_custom', name: 'My Custom Sequences', parentId: null, color: '#10b981', isDefault: false },
];

function seedDefaultItems(): SavedLogicItem[] {
  return NIAGARA_TEMPLATES.map((tmpl, idx) => {
    let folderId = 'f_custom';
    if (tmpl.category?.includes('Hydronics') || tmpl.category?.includes('Pumps')) {
      folderId = 'f_hydronics';
    } else if (tmpl.category?.includes('Air Handling') || tmpl.category?.includes('AHU')) {
      folderId = 'f_ahu';
    } else if (tmpl.category?.includes('Boiler') || tmpl.category?.includes('Heating')) {
      folderId = 'f_boilers';
    } else if (tmpl.category?.includes('VAV') || tmpl.category?.includes('Terminal')) {
      folderId = 'f_vav';
    } else if (tmpl.category?.includes('Lighting')) {
      folderId = 'f_lighting';
    }

    return {
      id: `saved_logic_tpl_${idx + 1}`,
      folderId,
      title: tmpl.title,
      description: tmpl.description,
      category: tmpl.category || 'BMS Control',
      tags: [tmpl.category || 'HVAC', 'Niagara 4', `${tmpl.blocks.length} Blocks`],
      program: tmpl,
      createdAt: new Date(Date.now() - (idx + 1) * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - (idx + 1) * 86400000).toISOString(),
      isDefaultTemplate: true,
    };
  });
}

export function useLogicLibrary() {
  const [folders, setFolders] = useState<LibraryFolder[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_FOLDERS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Error loading library folders:', e);
    }
    return DEFAULT_FOLDERS;
  });

  const [items, setItems] = useState<SavedLogicItem[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_ITEMS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Error loading library items:', e);
    }
    return seedDefaultItems();
  });

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_FOLDERS, JSON.stringify(folders));
    } catch (e) {
      console.error('Error persisting folders:', e);
    }
  }, [folders]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_ITEMS, JSON.stringify(items));
    } catch (e) {
      console.error('Error persisting items:', e);
    }
  }, [items]);

  // Create folder
  const createFolder = useCallback((name: string, parentId: string | null = null, color?: string): LibraryFolder => {
    const newFolder: LibraryFolder = {
      id: `folder_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      name: name.trim() || 'New Folder',
      parentId: parentId || null,
      color: color || '#38bdf8',
      isDefault: false,
    };
    setFolders((prev) => [...prev, newFolder]);
    return newFolder;
  }, []);

  // Rename folder
  const renameFolder = useCallback((folderId: string, newName: string) => {
    setFolders((prev) =>
      prev.map((f) => (f.id === folderId ? { ...f, name: newName.trim() || f.name } : f))
    );
  }, []);

  // Delete folder (moves contained items to default or custom folder)
  const deleteFolder = useCallback((folderId: string) => {
    setFolders((prev) => prev.filter((f) => f.id !== folderId && f.parentId !== folderId));
    setItems((prev) =>
      prev.map((item) => (item.folderId === folderId ? { ...item, folderId: 'f_custom' } : item))
    );
  }, []);

  // Save or Update a logic program
  const saveLogicProgram = useCallback(
    (
      program: NiagaraProgram,
      folderId: string,
      title?: string,
      description?: string,
      existingItemId?: string
    ): SavedLogicItem => {
      const now = new Date().toISOString();
      const itemTitle = (title || program.title || 'Untitled Sequence').trim();
      const itemDesc = (description || program.description || '').trim();

      if (existingItemId) {
        // Update existing item cleanly
        let updatedItem: SavedLogicItem | null = null;
        setItems((prev) => {
          const existing = prev.find((i) => i.id === existingItemId);
          if (!existing) return prev;
          updatedItem = {
            ...existing,
            folderId,
            title: itemTitle,
            description: itemDesc,
            category: program.category || existing.category,
            program: { ...program, title: itemTitle, description: itemDesc },
            updatedAt: now,
          };
          return prev.map((item) => (item.id === existingItemId ? updatedItem! : item));
        });

        if (updatedItem) return updatedItem;

        // Fallback if existing item was not in state
        return {
          id: existingItemId,
          folderId,
          title: itemTitle,
          description: itemDesc,
          category: program.category || 'HVAC Controls',
          tags: [program.category || 'HVAC', `${program.blocks.length} Blocks`],
          program: { ...program, title: itemTitle, description: itemDesc },
          createdAt: now,
          updatedAt: now,
          isDefaultTemplate: false,
        };
      }

      // Create new item
      const newItem: SavedLogicItem = {
        id: `logic_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        folderId,
        title: itemTitle,
        description: itemDesc,
        category: program.category || 'HVAC Controls',
        tags: [program.category || 'HVAC', `${program.blocks.length} Blocks`],
        program: { ...program, title: itemTitle, description: itemDesc },
        createdAt: now,
        updatedAt: now,
        isDefaultTemplate: false,
      };

      setItems((prev) => [newItem, ...prev]);
      return newItem;
    },
    []
  );

  // Duplicate an item
  const duplicateLogicItem = useCallback((itemId: string): SavedLogicItem | null => {
    let duplicated: SavedLogicItem | null = null;
    setItems((prev) => {
      const target = prev.find((i) => i.id === itemId);
      if (!target) return prev;
      const now = new Date().toISOString();
      duplicated = {
        ...target,
        id: `logic_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        title: `${target.title} (Copy)`,
        program: {
          ...target.program,
          title: `${target.program.title} (Copy)`,
        },
        createdAt: now,
        updatedAt: now,
        isDefaultTemplate: false,
      };
      return [duplicated, ...prev];
    });
    return duplicated;
  }, []);

  // Rename an item
  const renameLogicItem = useCallback((itemId: string, newTitle: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? {
              ...item,
              title: newTitle.trim() || item.title,
              program: { ...item.program, title: newTitle.trim() || item.program.title },
              updatedAt: new Date().toISOString(),
            }
          : item
      )
    );
  }, []);

  // Move item to another folder
  const moveLogicItem = useCallback((itemId: string, targetFolderId: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, folderId: targetFolderId, updatedAt: new Date().toISOString() } : item
      )
    );
  }, []);

  // Delete an item
  const deleteLogicItem = useCallback((itemId: string) => {
    setItems((prev) => prev.filter((i) => i.id !== itemId));
  }, []);

  // Reset to default templates
  const resetLibraryToDefaults = useCallback(() => {
    setFolders(DEFAULT_FOLDERS);
    setItems(seedDefaultItems());
  }, []);

  return {
    folders,
    items,
    createFolder,
    renameFolder,
    deleteFolder,
    saveLogicProgram,
    duplicateLogicItem,
    renameLogicItem,
    moveLogicItem,
    deleteLogicItem,
    resetLibraryToDefaults,
  };
}

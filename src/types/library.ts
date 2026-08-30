import { NiagaraProgram } from './niagara';

export interface LibraryFolder {
  id: string;
  name: string;
  parentId?: string | null;
  color?: string;
  isDefault?: boolean;
}

export interface SavedLogicItem {
  id: string;
  folderId: string;
  title: string;
  description: string;
  category?: string;
  tags?: string[];
  program: NiagaraProgram;
  createdAt: string;
  updatedAt: string;
  isDefaultTemplate?: boolean;
}

export interface LibraryState {
  folders: LibraryFolder[];
  items: SavedLogicItem[];
}

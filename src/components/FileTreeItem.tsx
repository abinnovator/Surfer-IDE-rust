import { useState } from "react";
import { File, Folder, FolderOpen, ChevronRight, ChevronDown } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "./ui/context-menu"
import { useStore } from "../lib/zustand";
interface FileNode { name: string; path: string; is_dir: boolean }

const FileTreeItem = ({
  entry,
  depth = 0,
  onFileClick,
  onChanged
}: {
  entry: FileNode;
  depth?: number;
  onFileClick?: (entry: FileNode) => void;
  onChanged?: () => void;
}) => {
  const [open, setOpen] = useState(false);
  const [children, setChildren] = useState<FileNode[] | null>(null);
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (entry.is_dir) {
      const next = !open;
      setOpen(next);
      if (next && children === null) {
        setLoading(true);
        try {
          const kids = await invoke<FileNode[]>("get_all_files_in_folder", { path: entry.path });
          kids.sort((a, b) => Number(b.is_dir) - Number(a.is_dir) || a.name.localeCompare(b.name));
          setChildren(kids);
        } finally {
          setLoading(false);
        }
      }
    } else {
      onFileClick?.(entry);
    }
  };

  const handleDeleteFile = async () => {
    if (entry.is_dir) {
      const deleteFolder = await invoke("delete_folder", { path: entry.path });
      onChanged?.();
    } else {
      const deleteFile = await invoke("delete_file", { path: entry.path });
      const tabs = useStore.openTabs.getState().openTabs;
      useStore.openTabs.getState().setOpenTabs(tabs.filter(t => t.path !== entry.path));
      onChanged?.();
    }
  }
  const refetch = async () => {
    if (!entry.is_dir) return;
    const kids = await invoke<FileNode[]>("get_all_files_in_folder", { path: entry.path });
    kids.sort((a, b) => Number(b.is_dir) - Number(a.is_dir) || a.name.localeCompare(b.name));
    setChildren(kids);
  };
  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <div>
          {/*Actual file tree item*/}
          <div
            onClick={handleClick}

            className="flex items-center gap-1 py-0.5 rounded transition-colors cursor-pointer text-[#9A8A78] hover:bg-[#3D3020]"
            style={{ paddingLeft: `${depth * 12 + 8}px` }}
          >
            <span className="w-[10px] flex-shrink-0">
              {entry.is_dir && (open ? <ChevronDown size={10} /> : <ChevronRight size={10} />)}
            </span>
            {entry.is_dir
              ? (open ? <FolderOpen size={12} className="flex-shrink-0" /> : <Folder size={12} className="flex-shrink-0" />)
              : <File size={12} className="flex-shrink-0" />}
            <span className="truncate">{entry.name}</span>
          </div>

          {open && children?.map((child) => (
            <FileTreeItem
              key={child.path}
              entry={child}
              depth={depth + 1}
              onFileClick={onFileClick}
              onChanged={refetch}
            />
          ))}
        </div>
      </ContextMenuTrigger>
      {/*Context Menu*/}
      <ContextMenuContent className="bg-[#3D3020] text-[#9A8A78]">
        <ContextMenuItem onClick={handleDeleteFile}>Delete {entry.is_dir ? 'Folder': 'File'} </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
};

export default FileTreeItem;

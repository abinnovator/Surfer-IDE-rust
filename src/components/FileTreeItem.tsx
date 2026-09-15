import { File, Folder } from "lucide-react";

interface FileNode { name: string; path: string; is_dir: boolean }

const FileTreeItem = ({ entry, onClick }: { entry: FileNode; onClick?: () => void }) => {
  return (
    <div onClick={onClick ? onClick : undefined}>
      <div className="flex items-center gap-1.5 y-0.5 rounded transition-colors cursor-pointer pl-2 text-[#9A8A78]">
        <span className="w-[10px] flex-shrink-0" />
        {entry.is_dir ? <Folder size={12} className="flex-shrink-0" /> : <File size={12} className="flex-shrink-0" />}
        <span className="truncate">{entry.name}</span>
      </div>
    </div>
  )
}

export default FileTreeItem

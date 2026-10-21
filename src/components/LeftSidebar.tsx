import { useStore } from "../lib/zustand";
import { Files, GitGraph, List, Package, Search, Send } from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import FileTreeItem from "./FileTreeItem";
import { readFile } from "../lib/actions/FileActions";
import { invoke } from "@tauri-apps/api/core";

interface SidebarColors {
  iconColor: string
  iconActiveColor: string
  iconHoverBg: string
  border: string
  panelBg: string
  borderRadius?: string
  paddingX?: string
  paddingY?: string
  tabPaddingX?: string
  tabPaddingY?: string
  tabBorderRadius?: string
}
interface FileNode { name: string; path: string; is_dir: boolean }
interface GitStatus { is_clean: boolean; current_branch: string; ahead: number; behind: number; changes: { path: string; file: string; status: string }[] }
interface GitCommit { author: string; date: string; message: string }

const LeftSidebar = () => {
  const fileExplorerOpen = useStore.fileExplorerOpen((state) => state.fileExplorerOpen)
  const searchMenuOpen = useStore.searchMenuOpen((state) => state.searchMenuOpen)
  const gitMenuOpen = useStore.gitMenuOpen((state) => state.gitMenuOpen)
  const taskListOpen = useStore.taskListOpen((state) => state.taskListOpen)
  const langPackOpen = useStore.langPackOpen((state) => state.langPackOpen)
  const folderName = useStore.folderName((state) => state.folderName)
  const folderPath = useStore.folderPath((state) => state.folderPath)
  const files = useStore.files((state) => state.files)
  const theme = useStore.theme((state) => state.theme)

  const [gitExists, setGitExists] = useState(false)
  const [gitChanges, setGitChanges] = useState<GitStatus>({ is_clean: true, ahead: 0, behind: 0, current_branch: '', changes: [] })
  const [gitHistory, setGitHistory] = useState<GitCommit[]>([])
  const [commitMessage, setCommitMessage] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchFiles, setSearchFiles] = useState<FileNode[]>([])
  const editorFloating = useStore.editorFloating((state) => state.floating)
  const [allFiles, setAllFiles] = useState<FileNode[]>([])


  const ls = theme?.colors?.['left-sidebar']
  const ed = theme?.colors?.editor
  const stripBg = theme?.colors?.titlebar?.background || '#1E1710'
  const sc: SidebarColors = {
    iconColor: ls?.['icon-color'] || "#9a8178",
    iconActiveColor: ls?.['icon-hover-color'] || '#E8C088',
    iconHoverBg: ls?.['icon-hover-background'] || '#3D3020',
    border: ls?.border || '#3D3020',
    panelBg: ed?.tabsBackground || '#1A1208',
    borderRadius: ls?.['border-radius'],
    paddingX: ls?.['padding-x'],
    paddingY: ls?.['padding-y'],
    tabPaddingX: ls?.['tab-padding-x'],
    tabPaddingY: ls?.['tab-padding-y'],
    tabBorderRadius: ls?.['tab-border-radius'],
  }

  const loadGitStatus = async () => {
    if (!folderPath) return
    try {
      const status = await invoke<GitStatus>("git_status", { path: folderPath })
      setGitChanges(status)
      setGitExists(true)
    } catch (e) {
      setGitExists(false)
      console.error(e)
    }
  }

  const getGitHistory = async () => {
    if (!folderPath) return
    try {
      const history = await invoke<GitCommit[]>("get_git_history", { path: folderPath })
      setGitHistory(history)
    } catch (e) {
      setGitHistory([])
      console.error(e)
    }
  }

  useEffect(() => {
    if (!folderPath) {
      setGitExists(false)
      setGitChanges({ is_clean: true, ahead: 0, behind: 0, current_branch: '', changes: [] })
      setGitHistory([])
      return
    }
    loadGitStatus()
    getGitHistory()
  }, [folderPath])

  useEffect(() => {
    if (!searchMenuOpen || !folderPath) return
    invoke<FileNode[]>("get_all_files_recursive", { path: folderPath }).then(setAllFiles)
  }, [folderPath, searchMenuOpen])

  const handleOpenFile = async (entry: { path: string; name: string }) => {
    const currentTabs = useStore.openTabs.getState().openTabs
    if (!currentTabs.find(t => t.path === entry.path)) {
      const content = await readFile(entry.path)
      useStore.openTabs.getState().setOpenTabs([...currentTabs, { path: entry.path, name: entry.name, content }])
    }
    useStore.activeTabPath.getState().setActiveTabPath(entry.path)
  }

  const refreshRoot = async () => {
    if (!folderPath) return
    const refreshed = await invoke<FileNode[]>("get_all_files_in_folder", { path: folderPath })
    useStore.files.getState().setFiles([...refreshed].sort((a, b) => Number(b.is_dir) - Number(a.is_dir) || a.name.localeCompare(b.name)))
  }

  const commitAndPush = async () => {
    if (!commitMessage.trim()) return
    try {
      const result = await invoke<string>("git_commit", { path: folderPath, message: commitMessage })
      console.log(result)
      setCommitMessage("")
      await loadGitStatus()
      await getGitHistory()
    } catch (e) {
      console.error(e)
    }
  }

  const togglePanel = useCallback(({ panel }: { panel: 'file-explorer' | 'search' | 'git' | 'task-list' | 'langPackPanel' }) => {
    const fe = useStore.fileExplorerOpen.getState()
    const sm = useStore.searchMenuOpen.getState()
    const gm = useStore.gitMenuOpen.getState()
    const tl = useStore.taskListOpen.getState()
    const lp = useStore.langPackOpen.getState()

    if (panel === 'file-explorer') {
      fe.setFileExplorerOpen(!fe.fileExplorerOpen); sm.setSearchMenuOpen(false); gm.setGitMenuOpen(false); tl.setTaskListOpen(false); lp.setLangPackOpen(false)
    } else if (panel === 'search') {
      sm.setSearchMenuOpen(!sm.searchMenuOpen); fe.setFileExplorerOpen(false); gm.setGitMenuOpen(false); tl.setTaskListOpen(false); lp.setLangPackOpen(false)
    } else if (panel === 'git') {
      gm.setGitMenuOpen(!gm.gitMenuOpen); fe.setFileExplorerOpen(false); sm.setSearchMenuOpen(false); tl.setTaskListOpen(false); lp.setLangPackOpen(false)
    } else if (panel === 'task-list') {
      tl.setTaskListOpen(!tl.taskListOpen); fe.setFileExplorerOpen(false); sm.setSearchMenuOpen(false); gm.setGitMenuOpen(false); lp.setLangPackOpen(false)
    } else if (panel === 'langPackPanel') {
      lp.setLangPackOpen(!lp.langPackOpen); fe.setFileExplorerOpen(false); sm.setSearchMenuOpen(false); gm.setGitMenuOpen(false); tl.setTaskListOpen(false)
    }
  }, [])

  const panelClass = `flex flex-col w-52 flex-shrink-0 ${editorFloating ? "rounded-2xl mx-3.5 border-2": "border-r-2"}`
  const panelHeaderStyle = { color: sc.iconColor, opacity: 0.5 }
  const panelBorderStyle = { borderColor: sc.border }
  const sortedFiles = [...files].sort((a, b) => Number(b.is_dir) - Number(a.is_dir))

  return (
    <div className={`flex flex-row shrink-0 overflow-hidden ${editorFloating ? "rounded-2xl px-9 py-4": ""}`}>
      <div
        className={`flex flex-col px-2 py-4 gap-6 w-12 flex-shrink-0  ${editorFloating ? "rounded-2xl border-2": "border-r-2"}`}
        style={{ background: stripBg, borderColor: sc.border }}
      >
        {([
          { panel: 'file-explorer' as const, Icon: Files, open: fileExplorerOpen },
          { panel: 'search' as const, Icon: Search, open: searchMenuOpen },
          { panel: 'git' as const, Icon: GitGraph, open: gitMenuOpen },
          { panel: 'task-list' as const, Icon: List, open: taskListOpen },
          { panel: 'langPackPanel' as const, Icon: Package, open: langPackOpen },
        ]).map(({ panel, Icon, open }) => (
          <button
            key={panel}
            onClick={() => togglePanel({ panel })}
            className="cursor-pointer transition-colors flex items-center justify-center"
            style={{
              padding: (sc.tabPaddingX || sc.tabPaddingY) ? `${sc.tabPaddingY || '0px'} ${sc.tabPaddingX || '0px'}` : undefined,
              borderRadius: sc.tabBorderRadius,
              background: open && sc.tabBorderRadius ? sc.iconHoverBg : undefined,
            }}
          >
            <Icon size={22} style={{ color: open ? sc.iconActiveColor : sc.iconColor }} />
          </button>
        ))}
      </div>

      {/* File explorer */}
      {fileExplorerOpen && (
        <div style={{ background: sc.panelBg, borderColor: sc.border }} className={panelClass}>
          <div className="px-3 py-2.5 border-b flex-shrink-0" style={panelBorderStyle}>
            <h1 className="text-[11px] uppercase tracking-widest text-white" style={panelHeaderStyle}>
              {folderName || 'No folder opened'}
            </h1>
          </div>
          <div className="pt-4 overflow-x-hidden overflow-y-auto flex-1 min-h-0 thin-scroll">
            {sortedFiles.map((file) => (
              <FileTreeItem key={file.path} entry={file} depth={0} onFileClick={handleOpenFile} onChanged={refreshRoot} />
            ))}
          </div>
        </div>
      )}

      {/* Search */}
      {searchMenuOpen && (
        <div style={{ background: sc.panelBg, borderColor: sc.border }} className={panelClass}>
          <div className="px-3 py-2.5 border-b flex-shrink-0" style={panelBorderStyle}>
            <h1 className="text-[11px] uppercase tracking-widest text-white" style={panelHeaderStyle}>Search through code</h1>
          </div>
          {folderPath ? (
            <div className="flex flex-col gap-2 p-2 flex-1 min-h-0">
              <input
                className="w-full px-2 py-1 text-[12px] rounded outline-none"
                style={{ background: sc.iconHoverBg, color: sc.iconActiveColor }}
                placeholder="Search files…"
                value={searchQuery}
                onChange={(e) => {
                  const q = e.target.value
                  setSearchQuery(q)
                  setSearchFiles(q ? allFiles.filter(f=> f.name.toLowerCase().includes(q.toLowerCase())) : [])
                }}
              />
              <div className="flex flex-col gap-1 overflow-y-auto flex-1 min-h-0 panel-scroll">
                {(searchQuery ? searchFiles : allFiles).map((file) => (
                  <FileTreeItem key={file.path} entry={file} depth={0} onFileClick={handleOpenFile} />
                ))}
              </div>
            </div>
          ) : (
            <p className="p-3 text-[11px]" style={{ color: sc.iconColor }}>Please open a project first</p>
          )}
        </div>
      )}

      {/* Source Control */}
      {gitMenuOpen && (
        <div style={{ background: sc.panelBg, borderColor: sc.border }} className={panelClass}>
          <div className="px-3 py-2.5 border-b flex-shrink-0" style={panelBorderStyle}>
            <h1 className="text-[11px] uppercase tracking-widest text-white" style={panelHeaderStyle}>Source Control</h1>
          </div>
          {folderPath ? gitExists ? (
            <div className="flex flex-col flex-1 min-h-0">
              {/* Commit box */}
              <div className="flex flex-row border-b-2 border-b-[#3d3020] gap-2 p-2 flex-shrink-0">
                <input
                  value={commitMessage}
                  onChange={(e) => setCommitMessage(e.target.value)}
                  className="flex-1 min-w-0 px-2 py-1.5 text-[12px] text-white bg-transparent outline-none"
                  placeholder="Commit message"
                />
                <button
                  className="flex items-center justify-center rounded-sm bg-[#3d3020] px-2.5 text-[#E8C088] transition-colors hover:bg-[#4d3d2a] disabled:opacity-40 cursor-pointer flex-shrink-0"
                  onClick={commitAndPush}
                  disabled={!commitMessage.trim()}
                >
                  <Send size={12} />
                </button>
              </div>

              {/* Changed files */}
              <div className="flex flex-col gap-1 flex-1 min-h-0 overflow-y-auto px-2 py-1 text-white text-[12px] panel-scroll">
                {gitChanges.changes.length === 0 ? (
                  <p className="text-[11px]" style={{ color: sc.iconColor }}>No changes</p>
                ) : gitChanges.changes.map((change) => (
                  <p
                    key={change.path}
                    onClick={() => handleOpenFile({ path: `${folderPath}/${change.path}`, name: change.file || change.path })}
                    className="truncate cursor-pointer hover:text-[#E8C088]"
                  >
                    {change.file || change.path}
                  </p>
                ))}
              </div>

              {/* History */}
              <div className="flex flex-col gap-1 border-t border-t-[#3d3020] flex-shrink-0 max-h-[40%] overflow-y-auto px-2 py-2 panel-scroll">
                <h1 className="text-[#3d3020] text-[10px] uppercase tracking-widest">Commit history</h1>
                <div className="flex flex-col gap-1 text-white text-[11px]">
                  {gitHistory.map((commit, i) => (
                    <div key={i} className="border-b border-b-[#3d3020] py-1 truncate">{commit.message}</div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <p className="p-3 text-[11px]">Not a git repository</p>
          ) : (
            <h1 className="text-[#3D3020] text-[12px] px-2">Open a folder to see source control</h1>
          )}
        </div>
      )}

      {/* Task List */}
      {taskListOpen && (
        <div style={{ background: sc.panelBg, borderColor: sc.border }} className={panelClass}>
          <div className="px-3 py-2.5 border-b flex-shrink-0" style={panelBorderStyle}>
            <h1 className="text-[11px] uppercase tracking-widest text-white" style={panelHeaderStyle}>Task List</h1>
          </div>
        </div>
      )}

      {/* Language Pack */}
      {langPackOpen && (
        <div style={{ background: sc.panelBg, borderColor: sc.border }} className={panelClass}>
          <div className="px-3 py-2.5 border-b flex-shrink-0" style={panelBorderStyle}>
            <h1 className="text-[11px] uppercase tracking-widest text-white" style={panelHeaderStyle}>Language Pack</h1>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeftSidebar;

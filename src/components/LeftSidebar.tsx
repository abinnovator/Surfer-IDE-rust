import { useStore } from "../lib/zustand";
import { Files, GitGraph, List, Package, Search } from "lucide-react";
import React, { useCallback, useRef, useState } from "react";
import FileTreeItem from "./FileTreeItem";
import { readFile } from "../lib/actions/FileActions";

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


const LeftSidebar = () => {
  const fileExplorerOpen = useStore.fileExplorerOpen((state) => state.fileExplorerOpen)
  const searchMenuOpen=useStore.searchMenuOpen((state) => state.searchMenuOpen)
  const gitMenuOpen = useStore.gitMenuOpen((state) => state.gitMenuOpen)
  const taskListOpen = useStore.taskListOpen((state) => state.taskListOpen)
  const langPackOpen = useStore.langPackOpen((state) => state.langPackOpen)
  const folderName = useStore.folderName((state) => state.folderName)
  const folderPath  = useStore.folderPath((state) => state.folderPath)
  const files= useStore.files((state) => state.files)
  const packs= useStore.packs((state) => state.packs)
  const theme   = useStore.theme((state) => state.theme)

  const [rootCreatingFile, setRootCreatingFile] = useState(false)
  const [rootCreatingFolder, setRootCreatingFolder] = useState(false)
  const [rootInputName, setRootInputName] = useState('')
  const [gitExists, setGitExists] = useState(false)
  const [gitChanges, setGitChanges] = useState({ isClean: true, ahead: 0, behind: 0, currentBranch: '', changes: [] as { path: string; file: string; status: string }[] })
  const [commitMessage, setCommitMessage]  = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [results, setResults]= useState([] as { filePath: string; line: number; content: string }[])
  const ls = theme?.colors?.['left-sidebar']
  const ed = theme?.colors?.editor
  const floating = theme?.floating
  const stripBg = theme?.colors?.titlebar?.background || '#1E1710'
  const sc: SidebarColors = {
    iconColor: ls?.['icon-color'] || "9a8178",
    iconActiveColor: ls?.['icon-hover-color']     || '#E8C088',
    iconHoverBg:    ls?.['icon-hover-background'] || '#3D3020',
    border:         ls?.border                    || '#3D3020',
    panelBg:        ed?.tabsBackground            || '#1A1208',
    borderRadius:   ls?.['border-radius'],
    paddingX:       ls?.['padding-x'],
    paddingY:       ls?.['padding-y'],
    tabPaddingX:    ls?.['tab-padding-x'],
    tabPaddingY:    ls?.['tab-padding-y'],
    tabBorderRadius: ls?.['tab-border-radius'],
  }
  const openTabs = useStore.openTabs((state) => state.openTabs)

  const handleOpenFile = async (entry: any) => {
      const currentTabs = useStore.openTabs.getState().openTabs
      if (!currentTabs.find(t => t.path === entry.path)) {
        const content = await readFile(entry.path)
        useStore.openTabs.getState().setOpenTabs([...currentTabs, { path: entry.path, name: entry.name, content }])
      }
      useStore.activeTabPath.getState().setActiveTabPath(entry.path)
    }
  const togglePanel = useCallback(({ panel }: { panel: 'file-explorer' | 'search' | 'git' | 'task-list' | 'langPackPanel' }) => {
      const fe = useStore.fileExplorerOpen.getState()
      const sm = useStore.searchMenuOpen.getState()
      const gm = useStore.gitMenuOpen.getState()
      const tl = useStore.taskListOpen.getState()
      const lp = useStore.langPackOpen.getState()

      if (panel === 'file-explorer') {
        fe.setFileExplorerOpen(!fe.fileExplorerOpen); sm.setSearchMenuOpen(false); gm.setGitMenuOpen(false); tl.setTaskListOpen(false); lp.setLangPackOpen(false);
      } else if (panel === 'search') {
        sm.setSearchMenuOpen(!sm.searchMenuOpen); fe.setFileExplorerOpen(false); gm.setGitMenuOpen(false); tl.setTaskListOpen(false); lp.setLangPackOpen(false);
      } else if (panel === 'git') {
        gm.setGitMenuOpen(!gm.gitMenuOpen); fe.setFileExplorerOpen(false); sm.setSearchMenuOpen(false); tl.setTaskListOpen(false); lp.setLangPackOpen(false);
      } else if (panel === 'task-list') {
        tl.setTaskListOpen(!tl.taskListOpen); fe.setFileExplorerOpen(false); sm.setSearchMenuOpen(false); gm.setGitMenuOpen(false); lp.setLangPackOpen(false);
      } else if (panel === 'langPackPanel') {
        lp.setLangPackOpen(!lp.langPackOpen); fe.setFileExplorerOpen(false); sm.setSearchMenuOpen(false); gm.setGitMenuOpen(false); tl.setTaskListOpen(false);
      }
    }, [])
  const panelClass = "flex flex-col w-52 border-r-2 flex-shrink-0"
  const panelHeaderStyle = { color: sc.iconColor, opacity: 0.5 }
    const panelBorderStyle = { borderColor: sc.border }
  const inputStyle = { background: sc.iconHoverBg, color: sc.iconActiveColor }
  console.log(files)
  const sortedFiles = files.sort((a, b) => Number(b.isDir) - Number(a.isDir));
  return (
    <div className="flex flex-row shrink-0 overflow-hidden">
      <div
              className="flex flex-col px-2 py-4 gap-6 w-12 flex-shrink-0 border-r-2"
              style={{ background: stripBg, borderColor: sc.border }}
            >
              {([
                { panel: 'file-explorer' as const, Icon: Files,    open: fileExplorerOpen },
                { panel: 'search'        as const, Icon: Search,   open: searchMenuOpen   },
                { panel: 'git'           as const, Icon: GitGraph, open: gitMenuOpen      },
                { panel: 'task-list'     as const, Icon: List,     open: taskListOpen     },
                { panel: 'langPackPanel' as const, Icon: Package,  open: langPackOpen     },
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
                  <Icon
                    size={22}
                    className="hover:text-[var(--ls-active)]"
                    style={{ color: open ? sc.iconActiveColor : sc.iconColor }}
                  />
                </button>
              ))}
      </div>
      {/*The file explorer*/}
      {fileExplorerOpen && (
        <div style={{ background: sc.panelBg, borderColor: sc.border }} className={panelClass}>
          <div className="px-3 py-2.5 border-b flex-shrink-0" style={panelBorderStyle}>
            <h1 className="text-[11px] uppercase tracking-widest text-white" style={panelHeaderStyle}>
              {folderName || 'No folder opened'}
            </h1>
          </div>
          <div className="pt-4 overflow-x-hidden overflow-y-auto flex-1 min-h-0 thin-scroll">
            {sortedFiles.map((file) => (
              <FileTreeItem key={file.path} entry={file} onClick={() => handleOpenFile(file)} />
            ))}
          </div>
        </div>
      )}
      {/*Search Menu*/}
      {searchMenuOpen && (
        <div style={{ background: sc.panelBg, borderColor: sc.border }} className={panelClass}>
          <div className="px-3 py-2.5 border-b flex-shrink-0" style={panelBorderStyle}>
            <h1 className="text-[11px] uppercase tracking-widest text-white" style={panelHeaderStyle}>
              Search through code
            </h1>
          </div>
        </div>
      )}
      {gitMenuOpen && (
        <div style={{ background: sc.panelBg, borderColor: sc.border }} className={panelClass}>
          <div className="px-3 py-2.5 border-b flex-shrink-0" style={panelBorderStyle}>
            <h1 className="text-[11px] uppercase tracking-widest text-white" style={panelHeaderStyle}>
              Source Control
            </h1>
          </div>
        </div>
      )}
      {taskListOpen && (
        <div style={{ background: sc.panelBg, borderColor: sc.border }} className={panelClass}>
          <div className="px-3 py-2.5 border-b flex-shrink-0" style={panelBorderStyle}>
            <h1 className="text-[11px] uppercase tracking-widest text-white" style={panelHeaderStyle}>
              Task List
            </h1>
          </div>
        </div>
      )}
      {langPackOpen && (
        <div style={{ background: sc.panelBg, borderColor: sc.border }} className={panelClass}>
          <div className="px-3 py-2.5 border-b flex-shrink-0" style={panelBorderStyle}>
            <h1 className="text-[11px] uppercase tracking-widest text-white" style={panelHeaderStyle}>
              Language Pack
            </h1>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeftSidebar;

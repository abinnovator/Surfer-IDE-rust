  import { useStore } from '../lib/zustand'
  import React, { useCallback, useState } from 'react'
  import { ChevronDown, Maximize, Minimize, Minus, Play, ScanSearch, Settings, X } from 'lucide-react'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { open } from '@tauri-apps/plugin-dialog';
import { readAllFilesInFolder } from '../lib/actions/FileActions'
interface FileNode { name: string; path: string; isDir: boolean }


const Titlebar = () => {
    const fileMenuOpen = useStore.fileMenuOpen((state) => state.fileMenuOpen)
    const setFileMenuOpen = useStore.fileMenuOpen((state) => state.setFileMenuOpen)
    const recentFolders = useStore.recentFolders((state) => state.recentFolders)
  const setRecentFolders = useStore.recentFolders((state) => state.setRecentFolders)
    const setFiles = useStore.files((state) => state.setFiles)

    const appWindow = getCurrentWindow()

  const folderPath = useStore.folderPath((state) => state.folderPath)
  const setFolderPath = useStore.folderPath((state) => state.setFolderPath)
    const indexing = useStore.isIndexing((state) => state.isIndexing)
    const indexLog = useStore.indexLog((state) => state.indexLog)
    const minimized = useStore.minimized((state) => state.minimized)
    const setMinimized = useStore.minimized((state) => state.setMinimized)
    const btnClass      = "text-[var(--tb-btn)] cursor-pointer bg-none text-white focus:outline-none shadow-none"
    const menuItemClass = "w-full text-left px-3 py-1.5 text-[11px] transition-colors cursor-pointer"
    const maximizeWindow = useCallback(() => {
      appWindow.maximize()
      appWindow.setFullscreen(true);
    }, [appWindow])
    const minimizeWindow = useCallback(() => {
      appWindow.minimize()

    }, [appWindow])
    const closeWindow = useCallback(() => {
      appWindow.close()
    }, [appWindow])

    const toggleMaximize = useCallback(async () => {
      await appWindow.toggleMaximize()
      setMinimized(await appWindow.isMaximized())
    }, [appWindow, setMinimized])
    const theme = useStore.theme((state) => state.theme)
      const tb = theme?.colors?.titlebar
      const floating = theme?.floating
      const tbBorderRadius = tb?.['border-radius']
      const tbPaddingX = tb?.['padding-x']
      const tbPaddingY = tb?.['padding-y']

      const titleColor= tb?.titleTextColor || tb?.['title-text-color'] || '#C8B898'
      const btnColor  = tb?.rightButtonsColor || '#9A8A78'
      const btnHoverColor = tb?.rightButtonsHoverColor || '#E8C088'
      const menuBg = tb?.fileMenuBackground || '#1E1710'
      const menuBorder   = tb?.fileMenuBorder || '#3D3020'
      const menuItemText = tb?.fileMenuItemTextColor || '#9A8A78'
      const menuHoverBg = tb?.fileMenuItemHoverBackground || '#3D3020'
      const menuHoverText = tb?.fileMenuItemHoverTextColor || '#E8C088'
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
    const openFolder = async () => {
      const folder = await open({ multiple: false, directory: true })
      if (folder) {
        useStore.folderName.getState().setFolderName(folder.split(/[\\/]/).filter(Boolean).pop() || folder)
        console.log(folder)
        const fe = useStore.fileExplorerOpen.getState()
        const sm = useStore.searchMenuOpen.getState()
        const gm = useStore.gitMenuOpen.getState()
        const tl = useStore.taskListOpen.getState()
        const lp = useStore.langPackOpen.getState()
        fe.setFileExplorerOpen(true); sm.setSearchMenuOpen(false); gm.setGitMenuOpen(false); tl.setTaskListOpen(false); lp.setLangPackOpen(false);
        setFileMenuOpen(false)
        setRecentFolders([...recentFolders, folder])
        const filesInFolder = await readAllFilesInFolder(folder) as FileNode[];
        console.log(filesInFolder)
        setFiles(filesInFolder)
      }
    }
    return (
      <div className="flex flex-row items-center h-10 px-4 gap-4 flex-shrink-0 relative z-50 justify-between bg-[#1E1710] border-b-[#3d3020] border-b-2">
        {/*Left side*/}
        <div className="flex flex-row items-center gap-4">
          <div className="flex flex-row gap-4 items-center">
          <h1 className='text-[12px] mr-2 text-white'>Surfer IDE</h1>
            <div className="relative">
              {/*File Menu*/}
                    <button
                      onClick={() => setFileMenuOpen(!fileMenuOpen)}
                      className={`flex items-center gap-1  text-[11px] px-2 py-1 rounded  ${btnClass} text-white`}
                      style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
                    >
                      File <ChevronDown size={10} />
                    </button>

                    {fileMenuOpen && (
                      <div
                        className="absolute top-full left-0 mt-1 rounded shadow-xl z-50 w-56 py-1 border"
                        style={{ background: menuBg, borderColor: menuBorder }}
                      >
                        <button
                          className={menuItemClass}
                          style={{ color: menuItemText }}
                          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = menuHoverBg; (e.currentTarget as HTMLElement).style.color = menuHoverText }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = ''; (e.currentTarget as HTMLElement).style.color = menuItemText }}
                          title="ctrl+o"
                          onClick={openFolder}
                        >
                          Open Folder
                        </button>

                        {recentFolders.length > 0 && (
                          <>
                            <div className="my-1" style={{ borderTop: `1px solid ${menuBorder}` }} />
                            <p className="px-3 py-0.5 text-[9px] uppercase tracking-widest" style={{ color: menuItemText, opacity: 0.5 }}>Recent</p>
                            {recentFolders.map(p => (
                              <button
                                key={p}
                                className={`${menuItemClass} truncate`}
                                style={{ color: menuItemText }}
                                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = menuHoverBg; (e.currentTarget as HTMLElement).style.color = menuHoverText }}
                                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = ''; (e.currentTarget as HTMLElement).style.color = menuItemText }}
                                title={p}
                                                          >
                                {p.split(/[\\/]/).filter(Boolean).pop()}
                                <span className="block text-[9px] truncate" style={{ color: menuItemText, opacity: 0.5 }}>{p}</span>
                              </button>
                            ))}
                          </>
                        )}

                        <div className="my-1" style={{ borderTop: `1px solid ${menuBorder}` }} />
                        <button
                          className={menuItemClass}
                          style={{ color: menuItemText }}
                          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = menuHoverBg; (e.currentTarget as HTMLElement).style.color = menuHoverText }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = ''; (e.currentTarget as HTMLElement).style.color = menuItemText }}
                        >
                          New File
                        </button>
                        <button
                          className={menuItemClass}
                          style={{ color: menuItemText }}
                          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = menuHoverBg; (e.currentTarget as HTMLElement).style.color = menuHoverText }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = ''; (e.currentTarget as HTMLElement).style.color = menuItemText }}
                        >
                          Save
                        </button>
                        <button
                          className={menuItemClass}
                          style={{ color: menuItemText }}
                          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = menuHoverBg; (e.currentTarget as HTMLElement).style.color = menuHoverText }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = ''; (e.currentTarget as HTMLElement).style.color = menuItemText }}
                                                  title="shift+n"
                        >
                          Create new window
                        </button>
                        <div className="my-1" style={{ borderTop: `1px solid ${menuBorder}` }} />
                        <button
                          className={menuItemClass}
                          style={{ color: menuItemText }}
                          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = menuHoverBg; (e.currentTarget as HTMLElement).style.color = menuHoverText }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = ''; (e.currentTarget as HTMLElement).style.color = menuItemText }}
                        >
                          Quit
                        </button>
                      </div>
            )}

            </div>
            <button
                    className={`text-[11px] px-2 py-1 rounded ${btnClass}`}
                    style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
                  >
                    Edit
                  </button>
                  <button
                    className={`text-[11px] px-2 py-1 rounded ${btnClass}`}
                    style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
                  >
                    View
                  </button>


          </div>

        </div>
        {/*Right Side*/}
        <div className="flex flex-row gap-2 items-center">
                <button
                  // onClick={runProject}
                  disabled={!folderPath}
                  title="Run project"
                  className={`${btnClass} disabled:opacity-40`}
            data-tauri-drag-region
                >
                  <Play size={20} />
                </button>
                <button
                  // onClick={() => window.ipcRenderer.openSettings()}
                  title="Settings"
                  className={btnClass}
                  style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
                >
                  <Settings size={20} />
                </button>
                <button
                  // onClick={indexProject}
                  disabled={indexing || !folderPath}
                  title="Index Project"
                  className={`${btnClass} disabled:opacity-40`}
                  style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
                >
                  <ScanSearch size={20} />
                </button>
                <button
                  onClick={toggleMaximize}
                  className={btnClass}
                >
                  <Minus size={20} />
                </button>
                <button
                  onClick={toggleMaximize}
                  className={btnClass}
                >
                  {minimized ? <Maximize size={20} /> : <Minimize size={20} />}
                </button>
                <button
                  // onClick={closeWindow}
                  className={btnClass}
                  onClick={closeWindow}
                >
                  <X size={20} />
                </button>
              </div>

              {indexing && (
                <p className="absolute left-1/2 -translate-x-1/2 text-[9px] px-3 animate-pulse pointer-events-none" style={{ color: titleColor }}>
                  {indexLog}
                </p>
              )}

      </div>
    )
  }

  export default Titlebar

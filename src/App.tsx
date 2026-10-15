import { useEffect, useRef, useState } from "react";
import reactLogo from "./assets/react.svg";
import { invoke } from "@tauri-apps/api/core";
import { convertFileSrc } from '@tauri-apps/api/core'
import "./App.css";
import Titlebar from "./components/Titlebar";
import videoSrc from "./assets/Chillhop_White_Oak.mp4";
import LeftSidebar from "./components/LeftSidebar";
import { useStore } from "./lib/zustand";
import Editor from "./components/Editor";
import { X } from "lucide-react";
import RightSidebar from "./components/RightSidebar";
import StatusBar from "./components/Statusbar";
import Terminal from "./components/Terminal";

function App() {
  const [greetMsg, setGreetMsg] = useState("");
  const [name, setName] = useState("");
  const openTabs = useStore.openTabs((state) => state.openTabs);
  const activeTabPath = useStore.activeTabPath((state) => state.activeTabPath);
  const unsavedFiles = useStore.unsavedFiles((state) => state.unsavedFiles);
  const folderPath = useStore.folderPath((state) => state.folderPath);
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoPlaying = useStore.video((state) => state.video);
  const AIChatOpen = useStore.aiChatOpen((state) => state.aiChatOpen)
  const setAIChatOpen = useStore.aiChatOpen((state) => state.setOpen)
  const terminalOpen = useStore.terminalOpen((state) => state.terminalOpen);
  const setTerminalOpen = useStore.terminalOpen((state)=> state.setTerminalOpen)
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    if (videoPlaying) {
      el.play().catch(() => {});
    } else {
      el.pause();
    }
  }, [videoPlaying]);
  const handleCloseTab = (path: string, e: React.MouseEvent) => {
      e.stopPropagation();
      const current = useStore.openTabs.getState().openTabs;
      const remaining = current.filter((t) => t.path !== path);
      useStore.openTabs.getState().setOpenTabs(remaining);
      if (activeTabPath === path) {
        useStore.activeTabPath
          .getState()
          .setActiveTabPath(
            remaining.length > 0 ? remaining[remaining.length - 1].path : '',
          );
      }
      const currentUnsaved = useStore.unsavedFiles.getState().unsavedFiles;
      useStore.unsavedFiles
        .getState()
        .setUnsavedFiles(currentUnsaved.filter((p) => p !== path));
    };
  async function greet() {
    setGreetMsg(await invoke("greet", { name }));
  }
  useEffect(() => {
    const handleKeyDown = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'b') {
        event.preventDefault();

        const currentChatState = useStore.aiChatOpen.getState().aiChatOpen;

        setAIChatOpen(!currentChatState);
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 't') {
        event.preventDefault();
        const currentTerminalState = useStore.terminalOpen.getState().terminalOpen;

        setTerminalOpen(!currentTerminalState);
      }

    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [setAIChatOpen, setTerminalOpen]);

  const activeTab = openTabs.find((t) => t.path === activeTabPath) ?? null;
  const quotes = [
      "You're Editor should understand what you're building.",
      'Your editor should adapt to you. Not the other way around.',
      "Your editor should understand what you're building,not just what you're typing.",
    ];
  const quote = quotes[Math.floor(Math.random() * quotes.length)];
  const imageExtensions = ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'svg'];
  const videoHidden = useStore.videoEnabled((state) => state.videoEnabled);
  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#1e1e1e]">
      <video
      src={videoSrc}
      loop
      muted
      className="absolute inset-0 w-full h-full object-cover pointer-events-none"
      style={{ opacity: 0.15, zIndex: 0 }}
      hidden={videoHidden}
       ref={videoRef}
      onLoadedData={() => {
                  if (!videoPlaying) videoRef.current?.play().catch(() => {});
                }}
      />
      <div className="h-full w-full overflow-hidden flex flex-col">
        <Titlebar />
        <div className="flex flex-row flex-1 overflow-hidden">
          <LeftSidebar />
          {/*Tabs bar*/}
          <div
            className="flex-1 overflow-hidden flex flex-col"
            style={{ backgroundColor:'#0F0B08',  borderRadius:'0px', paddingLeft: '0px', paddingRight: '0px', paddingTop:'0px', paddingBottom:'0px' }}
          >
            {/* Tab bar */}
            {openTabs.length > 0 && (
              <div
                className="flex flex-row overflow-x-auto shrink-0 border-b border-b-[#3D3020]"
                style={{
                  backgroundColor:'#1A1208',
                  scrollbarWidth: 'none',
                  borderTopLeftRadius:'0px',
                  borderTopRightRadius: '0px',
                }}
              >
                {openTabs.map((tab) => (
                  <div
                    key={tab.path}
                    onClick={() =>
                      useStore.activeTabPath
                        .getState()
                        .setActiveTabPath(tab.path)
                    }
                    className="flex items-center gap-2 px-3 py-1.5 text-[11px] cursor-pointer shrink-0 border-r border-r-[#3D3020] group transition-colors"
                    style={
                      tab.path === activeTabPath
                        ? {
                            color: '#E8C088',
                            backgroundColor:
                             '#0F0B08',
                            borderTop: `1px solid ${'#E8C088'}`,
                          }
                        : {
                            color:
                              '#6B5D4A',
                          }
                    }
                  >
                    <span className="truncate max-w-32">{tab.name}</span>

                    {unsavedFiles.includes(tab.path) && (
                      <div className="rounded-[100px] bg-[#E8C088] w-2 h-2"></div>
                    )}
                    <button
                      onClick={(e) => handleCloseTab(tab.path, e)}
                      className="opacity-0 group-hover:opacity-100 hover:text-[#E8C088] transition-opacity shrink-0 cursor-pointer"
                    >
                      <X size={10} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex-1 overflow-hidden">
              {activeTab ? imageExtensions.includes(activeTab.path.split('.').pop() || '') ? (
                <div>
                  <img src={convertFileSrc(activeTab.path)} alt={activeTab.name} />
                </div>
              )  : (
                <Editor content={activeTab.content} fileName={activeTab.name} filePath={activeTab.path} />


              ) : (
                <>
                  {folderPath ? (
                    <div className="h-full flex items-center justify-center flex-col gap-2">
                      <p className="text-[#3D3020] text-[12px]">
                        Open a file to start editing
                      </p>
                      <p className="text-[#2a2018] text-[10px]">{quote}</p>
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center flex-col gap-2">
                      <p className="text-[#3D3020] text-[12px]">
                        Open a folder to start editing
                      </p>
                      <p className="text-[#2a2018] text-[10px]">{quote}</p>
                    </div>
                  )}
                </>
              )}
            </div>
            {terminalOpen && (
                <div
                  className="border-t-2 border-t-[#3d3020] flex-shrink-0"
                  style={{ height: 240, background: '#0f0b08' }}
                >
                  <Terminal path={folderPath} id="1" />
                </div>
              )}

          </div>
          {/*AI sidebar*/}
          {AIChatOpen && <RightSidebar />}
        </div>
        {/*Right Sidebar*/}
        {/*<div className={AIChatOpen ? 'block' : 'hidden'}>
          <div className="absolute top-10 right-0 bottom-10">
            <RightSidebar />
          </div>
        </div>*/}


        {/*Status Bar*/}
        <div className="shrink-0">
          <StatusBar />
        </div>


      </div>
    </div>
  );
}

export default App;

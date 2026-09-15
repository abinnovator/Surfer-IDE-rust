import { useState } from "react";
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

function App() {
  const [greetMsg, setGreetMsg] = useState("");
  const [name, setName] = useState("");
  const openTabs = useStore.openTabs((state) => state.openTabs);
  const activeTabPath = useStore.activeTabPath((state) => state.activeTabPath);
  const unsavedFiles = useStore.unsavedFiles((state) => state.unsavedFiles);
  const folderPath = useStore.folderPath((state) => state.folderPath);
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
    // Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
    setGreetMsg(await invoke("greet", { name }));
  }
  const activeTab = openTabs.find((t) => t.path === activeTabPath) ?? null;
  const quotes = [
      "You're Editor should understand what you're building.",
      'Your editor should adapt to you. Not the other way around.',
      "Your editor should understand what you're building,not just what you're typing.",
    ];
  const quote = quotes[Math.floor(Math.random() * quotes.length)];
  const imageExtensions = ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'svg'];

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#1e1e1e]">
      <video
      src={videoSrc}
      loop
      muted
      className="absolute inset-0 w-full h-full object-cover pointer-events-none"
      style={{ opacity: 0.15, zIndex: 0 }}
      autoPlay
      />
      <div className="h-screen w-screen overflow-hidden flex flex-col">
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
        </div>
        </div>
        <div className="relative">
          <div className="absolute top-10 right-0 max-h-">
            <RightSidebar />
          </div>
        </div>


      </div>
    </div>
  );
}

export default App;

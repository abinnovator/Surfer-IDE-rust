import { useState } from "react";
import reactLogo from "./assets/react.svg";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";
import Titlebar from "./components/Titlebar";
import videoSrc from "./assets/Chillhop_White_Oak.mp4";
import LeftSidebar from "./components/LeftSidebar";

function App() {
  const [greetMsg, setGreetMsg] = useState("");
  const [name, setName] = useState("");

  async function greet() {
    // Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
    setGreetMsg(await invoke("greet", { name }));
  }

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
        </div>
      </div>

    </div>
  );
}

export default App;

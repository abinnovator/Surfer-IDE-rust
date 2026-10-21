import { invoke } from '@tauri-apps/api/core'
import { readAllFilesInFolder } from './FileActions';
import { useStore } from '../zustand';

// AI Chat
export async function getAiResponse(messages: {role: string, content: string}[], token: string, workspaceRoot: string | null) {
  const projectFolder = useStore.folderPath.getState().folderPath
  if (!projectFolder) {
    return "Please open a project first"
  }
    try {
        const formattedMessages = messages.map(msg => ({
            role: msg.role || 'user',
            content: msg.content || msg.text || ''
        }));

        console.log('Sending payload to Rust:', formattedMessages);
      const index = await invoke("read_file", { path: `${projectFolder}/surfer/index.json` })
      console.log(index)
      const response = await invoke('get_ai_response', { messages: formattedMessages, index: index , token: token});
        console.log('Received response from Rust:', response);

        return response;
    } catch (error) {
        console.error('Tauri invoke error:', error);
        throw error;
    }
}


// Indexing
interface FileIndex {
  path: string;
  name: string;
  extension: string;
  summary: string;
}

interface FileNode {
  path: string;
  name: string;
  is_dir: boolean;
}

export async function indexProject(folderPath: string) {
  if (!folderPath) {
    console.error("indexProject: no folderPath");
    return;
  }

  const setIndexing = useStore.isIndexing.getState().setIsIndexing;
  const setIndexLog = useStore.indexLog.getState().setIndexLog;

  setIndexing(true);
  const token = localStorage.getItem('surfer_token') ?? ''
  if (token === '') {
    return
  }
  try {
    const codeExts = ['ts','tsx','js','jsx','py','rs','go','gd','cs','java','css','html','json','md','c','cpp','h','hpp','vue','svelte','rb','php','swift','kt']

    const files = await invoke<FileNode[]>("get_all_files_recursive", { path: folderPath })
    const toIndex = files.filter(f =>
      !f.is_dir &&
      codeExts.includes(f.name.split('.').pop()?.toLowerCase() ?? '')
    )

    const index: FileIndex[] = [];

    for (let i = 0; i < toIndex.length; i++) {
      const file = toIndex[i];
      setIndexLog(`Indexing ${i + 1}/${toIndex.length}: ${file.name}`);

      try {
        const summary = await invoke<string>("summarize_file", { path: file.path, token: token });

        index.push({
          path: file.path,
          name: file.name,
          extension: file.name.includes(".") ? file.name.split(".").pop()! : "",
          summary,
        });
      } catch (e) {
        console.error(`Error summarizing ${file.path}:`, e);
      }
    }

    const indexJsonContent = JSON.stringify(index, null, 2);

    await invoke("create_file", {
      path: `${folderPath}/surfer/index.json`,
      content: indexJsonContent,
    });

    setIndexLog(`Indexed ${index.length} files`);
    console.log(`Index written to ${folderPath}/surfer/index.json`);
    setIndexing(false)
  } catch (e) {
    console.error("indexProject failed:", e);
    setIndexLog("Index failed");
  } finally {
    setIndexing(false);
  }
}

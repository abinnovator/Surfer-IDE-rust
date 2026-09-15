import {invoke} from "@tauri-apps/api/core"

export const readAllFilesInFolder = async (path: string) => {
  const files = await invoke("get_all_files_in_folder", { path })
  console.log(files)
  return files
}

export const readFile = async (path: string) => {
  const content = await invoke("read_file", { path })
  return content
}

export const saveFile = async (path: string, content: string) => {
  await invoke("save_file", { path, content })
}

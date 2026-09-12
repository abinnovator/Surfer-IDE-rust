import {invoke} from "@tauri-apps/api/core"

export const readAllFilesInFolder = async (path: string) => {
  const files = await invoke("get_all_files_in_folder", { path })
  console.log(files)
  return files
}

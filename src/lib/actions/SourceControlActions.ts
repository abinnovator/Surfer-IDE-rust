import { invoke } from "@tauri-apps/api/core"

export const getSourceStatus = async (folderPath: string) => {
  const gitStatus = await invoke("git_status", { path: folderPath })
  console.log(gitStatus)
  if (gitStatus === "Unhandled Promise Rejection: git error: fatal: not a git repository (or any of the parent directories): .git") {
    return "Git not initializ"
  }
  return gitStatus
}

export const commitHistory = async (folderPath: string) => {

}

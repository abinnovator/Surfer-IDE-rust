interface UnsavedChangesModalProps {
  fileName: string
  onSave: () => Promise<void>
  onDiscard: () => void
  onCancel: () => void
}

export default function UnsavedChangesModal({
  fileName,
  onSave,
  onDiscard,
  onCancel,
}: UnsavedChangesModalProps) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50">
      <div className="w-80 rounded border border-[#3D3020] bg-[#1A1208] p-4 text-white shadow-xl">
        <h2 className="text-sm font-medium">Save changes to {fileName}?</h2>
        <p className="mt-2 text-xs text-[#9a8178]">
          Your changes will be lost if you close this file without saving.
        </p>
        <div className="mt-4 flex justify-end gap-2 text-xs">
          <button
            onClick={onCancel}
            className="rounded px-3 py-1.5 text-[#9a8178] hover:bg-[#3D3020]"
          >
            Cancel
          </button>
          <button
            onClick={onDiscard}
            className="rounded px-3 py-1.5 text-[#E8C088] hover:bg-[#3D3020]"
          >
            Discard
          </button>
          <button
            onClick={() => void onSave()}
            className="rounded bg-[#E8C088] px-3 py-1.5 text-[#1A1208] hover:bg-[#d6aa6e]"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}

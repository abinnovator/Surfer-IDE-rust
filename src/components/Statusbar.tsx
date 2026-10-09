import { useStore } from '../lib/zustand'
import { Pause, Play, VideoIcon, VideoOff } from 'lucide-react'

const StatusBar = () => {
  const folder = useStore.folderName((state) => state.folderName)
  const videoEnabled = useStore.videoEnabled((state) => state.videoEnabled)
  const setVideoEnabled = useStore.videoEnabled((state) => state.setVideoEnabled)
  const videoState = useStore.video((state) => state.video)

  return (
    <div className='flex flex-row justify-between items-center py-2 px-2 text-[#3D3020] bg-[#130E0B]/50'>
      <div className='flex flex-row gap-3 items-center'>
        <h1 className='text-[13px]'>Project: {folder}</h1>
        <button onClick={() => useStore.video.getState().setVideo(!useStore.video.getState().video)} className="cursor-pointer">
          {videoState ? <Pause size={12} /> : <Play size={12} />}
        </button>
        <button className='cursor-pointer' onClick={() => setVideoEnabled(!videoEnabled)}>{videoEnabled ? <VideoOff /> : <VideoIcon />}</button>
      </div>
    </div>
  )
}

export default StatusBar

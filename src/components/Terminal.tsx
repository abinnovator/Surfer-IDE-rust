import { Channel, invoke } from '@tauri-apps/api/core'
import { useEffect, useRef } from 'react'
import { Terminal as XTerm } from 'xterm'
import { FitAddon } from 'xterm-addon-fit'
import 'xterm/css/xterm.css'
// Contect i ported this completely from elctron cause i only need to change very few things so not much time spent NOT Ai.

export default function Terminal({path, id = "term-1"}: {path: string | null, id: string}) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const term = new XTerm({
      theme: {
        background: '#0f0b08',
        foreground: '#d4d4d4',
        cursor: '#E8C088',
        cursorAccent: '#0f0b08',
        selectionBackground: '#3D3020',
        black: '#3a3a3a',
        red: '#f44747',
        green: '#6a9955',
        yellow: '#d7ba7d',
        blue: '#569cd6',
        magenta: '#c586c0',
        cyan: '#4ec9b0',
        white: '#d4d4d4',
        brightBlack: '#808080',
        brightRed: '#f44747',
        brightGreen: '#b5cea8',
        brightYellow: '#f0e080',
        brightBlue: '#9cdcfe',
        brightMagenta: '#c586c0',
        brightCyan: '#4ec9b0',
        brightWhite: '#ffffff',
      },
      fontFamily: 'Geist Mono, monospace',
      fontSize: 12,
      lineHeight: 1.6,
      cursorBlink: true,
      convertEol: true,
      scrollOnUserInput: true,
    })

    const fitAddon = new FitAddon()
    term.loadAddon(fitAddon)
    term.open(containerRef.current!)
    const onData = new Channel<number[]>()
    onData.onmessage = (bytes) => {
      term.write(new Uint8Array(bytes))
    }

    const setup = async () => {
      await invoke("spawn_terminal", { id, cwd: path ?? null, onData })
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          fitAddon.fit()
          invoke("resize_terminal", {id, cols: term.cols, rows: term.rows})
        })
      })
      const dataHandler = (_: unknown, data: string) => term.write(data)

      term.onData((data) => {
        invoke('write_to_terminal', { id, data }).catch(() => {})
      })
    }

    setup()

    const observer = new ResizeObserver(() => {
      fitAddon.fit()
      invoke("resize_terminal", {id, cols: term.cols, rows: term.rows})
    })
    observer.observe(containerRef.current!)

    return () => {
      observer.disconnect()
      invoke("close_terminal", {id})
      term.dispose()
    }
  }, [path])

  return (
    <div style={{ width: '100%', height: '100%', padding: '4px' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
    </div>
  )
}

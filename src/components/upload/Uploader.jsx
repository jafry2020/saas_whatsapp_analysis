import { useCallback, useRef, useState } from 'react'
import { Upload, FileText, ShieldCheck, Sparkles, AlertCircle, Loader2, Database } from 'lucide-react'
import { parseChatAsync } from '../../lib/parser.js'
import { generateSampleChat, generateLargeSample } from '../../lib/sampleData.js'
import { useApp } from '../../context/AppContext.jsx'
import { Button } from '../ui/primitives.jsx'
import { cn } from '../../lib/format.js'

/**
 * The functional entry point. Reads a .txt locally, parses it off the main
 * thread in chunks (progress bar), and hands the result to app state.
 * Nothing here uploads anything — `file.text()` reads straight from disk.
 */
export function Uploader({ compact = false }) {
  const { loadParsed } = useApp()
  const inputRef = useRef(null)
  const [drag, setDrag] = useState(false)
  const [status, setStatus] = useState('idle') // idle | working | error
  const [progress, setProgress] = useState(0)
  const [note, setNote] = useState('')
  const [error, setError] = useState('')

  const runParse = useCallback(async (text, label) => {
    setStatus('working'); setProgress(0); setError(''); setNote(label || 'Parsing messages…')
    try {
      const parsed = await parseChatAsync(text, setProgress)
      if (!parsed.stats.userMessages) {
        setStatus('error')
        setError("We couldn't find any messages. Make sure it's a WhatsApp .txt export.")
        return
      }
      // Tiny beat so the 100% bar is visible before transitioning.
      setNote('Crunching the numbers…')
      await new Promise((r) => setTimeout(r, 250))
      loadParsed(parsed)
    } catch (e) {
      setStatus('error')
      setError('Something went wrong reading that file. Try exporting it again.')
    }
  }, [loadParsed])

  const onFile = useCallback(async (file) => {
    if (!file) return
    if (!/\.txt$/i.test(file.name) && file.type !== 'text/plain') {
      setStatus('error'); setError('Please choose the .txt file from “Export chat”.')
      return
    }
    setStatus('working'); setNote('Reading file…')
    const text = await file.text()
    runParse(text, 'Parsing messages…')
  }, [runParse])

  const onDrop = (e) => {
    e.preventDefault(); setDrag(false)
    onFile(e.dataTransfer.files?.[0])
  }

  const working = status === 'working'

  return (
    <div className={cn('w-full', compact ? 'max-w-md' : 'max-w-xl')}>
      <div
        onDragOver={(e) => { e.preventDefault(); setDrag(true) }}
        onDragLeave={() => setDrag(false)}
        onDrop={onDrop}
        onClick={() => !working && inputRef.current?.click()}
        className={cn(
          'group relative cursor-pointer rounded-xl2 border-2 border-dashed transition-all duration-200 grain',
          'flex flex-col items-center justify-center text-center',
          compact ? 'p-7' : 'p-9 md:p-11',
          drag ? 'border-accent bg-accent/[0.06] scale-[1.01]' : 'border-line hover:border-hairline bg-surface/60',
        )}
      >
        <input ref={inputRef} type="file" accept=".txt,text/plain" className="hidden"
          onChange={(e) => onFile(e.target.files?.[0])} />

        {working ? (
          <div className="w-full max-w-xs">
            <Loader2 className="mx-auto text-accent animate-spin" size={26} />
            <p className="mt-3 text-sm font-medium text-ink">{note}</p>
            <div className="mt-3 h-2 w-full rounded-full bg-line overflow-hidden">
              <div className="h-full rounded-full bg-accent transition-all duration-200"
                style={{ width: `${Math.round(progress * 100)}%` }} />
            </div>
            <p className="mt-2 text-xs text-faint tnum">{Math.round(progress * 100)}%</p>
          </div>
        ) : (
          <>
            <span className={cn('grid place-items-center rounded-2xl mb-4 transition-colors',
              compact ? 'h-12 w-12' : 'h-14 w-14',
              drag ? 'bg-accent text-on-accent' : 'bg-accent/10 text-accent-text group-hover:bg-accent/15')}>
              <Upload size={compact ? 22 : 26} />
            </span>
            <p className="font-display text-lg font-semibold text-ink">
              Drop your chat export here
            </p>
            <p className="text-sm text-muted mt-1">
              or <span className="text-accent-text font-medium">browse</span> for the <span className="font-mono text-[13px]">.txt</span> file
            </p>
            <div className="flex items-center gap-1.5 mt-4 text-[12px] text-faint">
              <ShieldCheck size={13} className="text-positive" />
              Processed entirely on your device — never uploaded
            </div>
          </>
        )}
      </div>

      {status === 'error' && (
        <div className="mt-3 flex items-start gap-2 rounded-xl border border-negative/25 bg-negative/[0.06] px-3.5 py-2.5 text-sm text-negative animate-fade-up">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {!working && (
        <div className="mt-4 flex flex-col sm:flex-row items-center gap-2.5">
          <Button variant="primary" className="w-full sm:w-auto" onClick={() => runParse(generateSampleChat(), 'Loading sample chat…')}>
            <Sparkles size={15} /> Try with sample data
          </Button>
          <Button variant="ghost" size="md" className="w-full sm:w-auto"
            onClick={() => runParse(generateLargeSample(), 'Generating 12k-message demo…')}>
            <Database size={15} /> Load 12k-message demo
          </Button>
        </div>
      )}
      <p className="mt-3 flex items-center justify-center gap-1.5 text-[12px] text-faint">
        <FileText size={12} /> Works with iPhone & Android exports · groups and 1:1
      </p>
    </div>
  )
}

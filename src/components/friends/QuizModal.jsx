import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, X as XIcon, Sparkles, RotateCcw } from 'lucide-react'
import { Modal } from '../ui/Modal.jsx'
import { Avatar, Button } from '../ui/primitives.jsx'
import { useApp } from '../../context/AppContext.jsx'
import { buildQuiz } from '../../lib/quiz.js'
import { cn } from '../../lib/format.js'

const TIERS = [
  { min: 0.9, label: "You ARE this group chat.", emoji: '🏆' },
  { min: 0.7, label: 'Certified lurker with excellent recall.', emoji: '🧠' },
  { min: 0.4, label: 'Reads the chat, doesn\'t always remember it.', emoji: '🙂' },
  { min: 0, label: 'Might want to actually read the messages next time.', emoji: '👀' },
]

/** "Guess who said it" — a small game built from real messages in the chat,
 *  meant to be played together, not just looked at solo. */
export function QuizModal() {
  const { quizOpen, closeQuiz, viewParsed, analytics } = useApp()
  const people = analytics.perPerson.map((p) => p.name)

  const [questions, setQuestions] = useState([])
  const [index, setIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [picked, setPicked] = useState(null) // the guess for the current question, or null

  const newRound = () => {
    setQuestions(buildQuiz(viewParsed.messages, 8))
    setIndex(0); setScore(0); setPicked(null)
  }

  useEffect(() => { if (quizOpen) newRound() }, [quizOpen]) // eslint-disable-line react-hooks/exhaustive-deps

  const current = questions[index]
  const finished = questions.length > 0 && index >= questions.length
  const notEnoughData = quizOpen && questions.length === 0

  const guess = (name) => {
    if (picked) return
    setPicked(name)
    if (name === current.author) setScore((s) => s + 1)
  }
  const next = () => { setPicked(null); setIndex((i) => i + 1) }

  const tier = useMemo(() => {
    if (!questions.length) return TIERS[TIERS.length - 1]
    const ratio = score / questions.length
    return TIERS.find((t) => ratio >= t.min) || TIERS[TIERS.length - 1]
  }, [score, questions.length])

  return (
    <Modal open={quizOpen} onClose={closeQuiz} size="md">
      <div className="p-6 md:p-7 min-h-[380px] flex flex-col">
        {notEnoughData ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-6">
            <Sparkles size={28} className="text-faint mb-3" />
            <h3 className="font-display text-lg font-semibold text-ink">Not quite enough material</h3>
            <p className="text-sm text-muted mt-1.5 max-w-xs">
              This chat needs a few more varied messages (and at least 2 active people) before there's enough to quiz on.
            </p>
          </div>
        ) : finished ? (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="flex-1 flex flex-col items-center justify-center text-center py-4">
            <span className="text-5xl mb-3">{tier.emoji}</span>
            <div className="font-display text-3xl font-semibold text-ink tnum">{score} / {questions.length}</div>
            <p className="text-sm text-muted mt-2 max-w-xs">{tier.label}</p>
            <div className="flex gap-2 mt-6">
              <Button variant="primary" onClick={newRound}><RotateCcw size={15} /> Play again</Button>
              <Button variant="ghost" onClick={closeQuiz}>Close</Button>
            </div>
          </motion.div>
        ) : current ? (
          <>
            <div className="flex items-center justify-between shrink-0">
              <span className="eyebrow">Guess who said it</span>
              <span className="text-xs text-faint tnum">{index + 1} / {questions.length} · {score} correct</span>
            </div>

            <AnimatePresence mode="wait">
              <motion.div key={index} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.25 }} className="flex-1 flex flex-col mt-5">
                <div className="rounded-2xl clay-well p-5 flex-1 flex items-center">
                  <p className="font-display text-xl text-ink leading-snug">"{current.body}"</p>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-4">
                  {people.map((name) => {
                    const isCorrect = name === current.author
                    const isPicked = name === picked
                    const revealed = !!picked
                    return (
                      <button key={name} onClick={() => guess(name)} disabled={!!picked}
                        className={cn(
                          'flex items-center gap-2 rounded-xl px-3 py-2.5 text-left transition',
                          !revealed && 'bg-surface-2 hover:bg-surface clay-inset',
                          revealed && isCorrect && 'bg-positive/15 ring-1 ring-positive',
                          revealed && isPicked && !isCorrect && 'bg-negative/15 ring-1 ring-negative',
                          revealed && !isPicked && !isCorrect && 'bg-surface-2 opacity-50',
                        )}>
                        <Avatar name={name} size={26} />
                        <span className="text-sm font-medium text-ink truncate flex-1">{name}</span>
                        {revealed && isCorrect && <Check size={16} className="text-positive shrink-0" />}
                        {revealed && isPicked && !isCorrect && <XIcon size={16} className="text-negative shrink-0" />}
                      </button>
                    )
                  })}
                </div>

                {picked && (
                  <Button variant="primary" className="mt-4 w-full" onClick={next}>
                    {index + 1 < questions.length ? 'Next' : 'See results'}
                  </Button>
                )}
              </motion.div>
            </AnimatePresence>
          </>
        ) : null}
      </div>
    </Modal>
  )
}

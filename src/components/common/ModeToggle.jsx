import { Sparkles, LineChart } from 'lucide-react'
import { Segmented } from '../ui/primitives.jsx'
import { useApp } from '../../context/AppContext.jsx'

/** Switches between the two products. Each mode is a whole identity, not a colour. */
export function ModeToggle({ size = 'md' }) {
  const { mode, setMode } = useApp()
  return (
    <Segmented
      size={size}
      value={mode}
      onChange={setMode}
      options={[
        { value: 'friends', label: 'Friends', icon: <Sparkles size={size === 'sm' ? 13 : 15} /> },
        { value: 'pro', label: 'Pro', icon: <LineChart size={size === 'sm' ? 13 : 15} /> },
      ]}
    />
  )
}

import { useApp } from './context/AppContext.jsx'
import { Landing } from './components/landing/Landing.jsx'
import { Navbar } from './components/common/Navbar.jsx'
import { UpgradeModal } from './components/common/UpgradeModal.jsx'
import { Dashboard } from './components/dashboard/Dashboard.jsx'
import { Wrapped } from './components/friends/Wrapped.jsx'

export default function App() {
  const { stage, parsed, mode } = useApp()

  if (stage === 'landing' || !parsed) {
    return (
      <>
        <Landing />
        <UpgradeModal />
      </>
    )
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <Dashboard />
      <UpgradeModal />
      {mode === 'friends' && <Wrapped />}
    </div>
  )
}

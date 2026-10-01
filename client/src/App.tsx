import { Routes, Route } from 'react-router'
import Landing from './pages/Landing'
import SessionView from './pages/SessionView'
import SessionCreated from './pages/SessionCreated'
import './index.css'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/session/:code" element={<SessionView />} />
      <Route path="/session/:code/created" element={<SessionCreated />} />
    </Routes>
  )
}

export default App

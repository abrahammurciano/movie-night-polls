import { createRoot } from 'react-dom/client'
import { polyfill } from 'mobile-drag-drop'
import { scrollBehaviourDragImageTranslateOverride } from 'mobile-drag-drop/scroll-behaviour'
import './index.css'
import App from './App.tsx'

polyfill({ holdToDrag: 200, dragImageTranslateOverride: scrollBehaviourDragImageTranslateOverride })

createRoot(document.getElementById('root')!).render(<App />)

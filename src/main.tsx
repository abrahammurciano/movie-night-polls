import { createRoot } from 'react-dom/client'
import { polyfill } from 'mobile-drag-drop'
import { scrollBehaviourDragImageTranslateOverride } from 'mobile-drag-drop/scroll-behaviour'
import './index.css'
import App from './App.tsx'

polyfill({
	holdToDrag: 200,
	dragImageTranslateOverride: scrollBehaviourDragImageTranslateOverride,
	forceApply: /Android.+Firefox/i.test(navigator.userAgent),
})

createRoot(document.getElementById('root')!).render(<App />)

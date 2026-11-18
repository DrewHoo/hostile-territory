import React from 'react'
import { hydrateRoot } from 'react-dom/client'
import App from './App.jsx'
import './styles.css'
import { setBaked } from './readNext.js'

// What to read next as the prerender baked it, so the hydrate starts from the same list
const readNext = document.getElementById('readnext-data')
if (readNext) setBaked(JSON.parse(readNext.textContent))

// The markup is already in the HTML: scripts/prerender.mjs bakes it in at
// build time so crawlers get the whole page without running anything.
// Hydrate onto it rather than throwing it away (createRoot would).
hydrateRoot(
  document.getElementById('root'),
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

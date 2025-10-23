import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import Visualizations from './Visualizations.jsx'
import Navigation from './Navigation.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
  <BrowserRouter>
  <Navigation />
  <Routes>
  <Route path="/" element={<App />} />
  <Route path="/visualizations" element={<Visualizations />} />
  </Routes>
  </BrowserRouter>
  </StrictMode>,
)

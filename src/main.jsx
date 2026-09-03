import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import AppErrorBoundary from './components/AppErrorBoundary'
import { AuthProvider } from './hooks/useAuth'
import './styles/global.css'
import './styles/product-blue.css'

window.addEventListener('vite:preloadError', () => {
  const reloadKey = 'uni-form-preload-reload'
  if (!sessionStorage.getItem(reloadKey)) {
    sessionStorage.setItem(reloadKey, '1')
    window.location.reload()
  }
})
window.addEventListener('load', () => sessionStorage.removeItem('uni-form-preload-reload'), { once: true })

createRoot(document.getElementById('root')).render(
  <StrictMode><AppErrorBoundary><BrowserRouter><AuthProvider><App /></AuthProvider></BrowserRouter></AppErrorBoundary></StrictMode>,
)

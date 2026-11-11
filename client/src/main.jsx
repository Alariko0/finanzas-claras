import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext'
import { HogarProvider } from './context/HogarContext'
import './styles/global.css'
import './styles/componentes.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <HogarProvider>
        <App />
      </HogarProvider>
    </AuthProvider>
  </React.StrictMode>,
)

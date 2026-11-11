import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext'
import { HogarProvider } from './context/HogarContext'
import { PlanProvider } from './context/PlanContext'
import { NominasProvider } from './context/NominasContext'
import './styles/global.css'
import './styles/componentes.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <HogarProvider>
        <PlanProvider>
          <NominasProvider>
            <App />
          </NominasProvider>
        </PlanProvider>
      </HogarProvider>
    </AuthProvider>
  </React.StrictMode>,
)

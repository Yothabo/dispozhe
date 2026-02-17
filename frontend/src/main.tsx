import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { router } from './router'
import './styles/index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  // Temporarily disable StrictMode to fix double-mount issues
  // <React.StrictMode>
    <RouterProvider router={router} />
  // </React.StrictMode>
)

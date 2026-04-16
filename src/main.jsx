// Entry point for the React application.
// ReactDOM.createRoot attaches the app to the <div id="root"> in index.html.
// React.StrictMode enables extra runtime warnings during development (no effect in production).
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

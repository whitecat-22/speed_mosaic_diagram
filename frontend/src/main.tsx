import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  // 修正点: 以下の <React.StrictMode> タグをコメントアウトします。
  // これにより、開発モードでのダブルマウント（アンマウント->再マウント）を防ぎ、
  // MapLibreの初期化エラー(maxTextureDimension2D)を回避します。
  
  // <React.StrictMode>
    <App />
  // </React.StrictMode>,
)

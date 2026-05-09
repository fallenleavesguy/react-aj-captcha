import { useRef, useState } from 'react'
import Verify from './components/captcha/Verify'
import type { VerifyRef, VerifySuccessPayload } from './components/captcha/types'
import './App.css'

function App() {
  const verifyRef = useRef<VerifyRef>(null)
  const [lastResult, setLastResult] = useState('')
  const [statusText, setStatusText] = useState('等待验证')

  return (
    <main className="demo-page">
      <section className="demo-card">
        <div className="demo-copy">
          <p className="demo-eyebrow">React AJ Captcha</p>
          <h1>滑动验证码 Demo</h1>
          <p className="demo-description">
            这个 demo 只保留滑动验证，实现和 Vue 版保持同一套接口协议、坐标换算和成功失败时序。
          </p>
        </div>

        <div className="demo-actions">
          <button
            type="button"
            className="demo-button primary"
            onClick={() => verifyRef.current?.show()}
          >
            打开验证
          </button>
          <button
            type="button"
            className="demo-button"
            onClick={() => verifyRef.current?.refresh()}
          >
            刷新验证码
          </button>
        </div>

        <div className="demo-status">
          <span className="demo-label">当前状态</span>
          <strong>{statusText}</strong>
        </div>

        <div className="demo-result">
          <span className="demo-label">最近一次 captchaVerification</span>
          <code>{lastResult || '暂无'}</code>
        </div>
      </section>

      <Verify
        ref={verifyRef}
        mode="pop"
        explain="向右滑动完成验证"
        onReady={() => {
          setStatusText('验证码已就绪')
        }}
        onError={() => {
          setStatusText('验证失败')
        }}
        onSuccess={({ captchaVerification }: VerifySuccessPayload) => {
          setStatusText('验证成功')
          setLastResult(captchaVerification)
        }}
      />
    </main>
  )
}

export default App

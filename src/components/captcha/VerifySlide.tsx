import { useCallback, useEffect, useRef, useState } from 'react'
import { reqCheck, reqGet } from './api'
import styles from './VerifySlide.module.scss'
import type {
  CaptchaGetResult,
  SlidePoint,
  VerifySlideProps,
} from './types'

const UI_COLORS = {
  active: '#337ab7',
  success: '#5cb85c',
  error: '#d9534f',
  border: '#ddd',
  white: '#fff',
  black: '#000',
}

const DEFAULT_IMG_SIZE = { width: '310px', height: '155px' }
const DEFAULT_BLOCK_SIZE = { width: '50px', height: '50px' }
const DEFAULT_BAR_SIZE = { width: '310px', height: '40px' }

export default function VerifySlide({
  mode = 'fixed',
  visible = true,
  type = '2',
  vSpace = 5,
  explain = '向右滑动完成验证',
  imgSize = DEFAULT_IMG_SIZE,
  blockSize = DEFAULT_BLOCK_SIZE,
  barSize = DEFAULT_BAR_SIZE,
  onReady,
  onSuccess,
  onError,
  onRequestClose,
  onRequestHide,
  onRegisterRefresh,
}: VerifySlideProps) {
  const barAreaRef = useRef<HTMLDivElement | null>(null)
  const panelRef = useRef<HTMLDivElement | null>(null)

  const [captcha, setCaptcha] = useState<CaptchaGetResult | null>(null)
  const [tipWords, setTipWords] = useState('')
  const [text, setText] = useState(explain)
  const [finishText, setFinishText] = useState('')
  const [passFlag, setPassFlag] = useState(false)
  const [showRefresh, setShowRefresh] = useState(true)
  const [moveBlockLeft, setMoveBlockLeft] = useState<string | number>(0)
  const [leftBarWidth, setLeftBarWidth] = useState<string | number | undefined>(
    undefined,
  )
  const [moveBlockBackgroundColor, setMoveBlockBackgroundColor] = useState(
    UI_COLORS.white,
  )
  const [leftBarBorderColor, setLeftBarBorderColor] = useState(UI_COLORS.border)
  const [iconColor, setIconColor] = useState(UI_COLORS.black)
  const [iconClass, setIconClass] = useState<'icon-right' | 'icon-check' | 'icon-close'>('icon-right')
  const [transitionLeft, setTransitionLeft] = useState('')
  const [transitionWidth, setTransitionWidth] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [isEnd, setIsEnd] = useState(false)
  const [renderedImgWidth, setRenderedImgWidth] = useState(
    parseInt(imgSize.width, 10),
  )
  const [imageHeight, setImageHeight] = useState(parseInt(imgSize.height, 10))

  const startLeftRef = useRef(0)
  const startMoveTimeRef = useRef(0)
  const endMoveTimeRef = useRef(0)
  const wasVisibleRef = useRef(false)
  const onReadyRef = useRef(onReady)

  const blockHalfWidth = parseInt(blockSize.width, 10) / 2
  const sliderBlockWidth = Math.floor((renderedImgWidth * 47) / 310)

  const getClientX = (event: MouseEvent | TouchEvent | React.MouseEvent | React.TouchEvent) => {
    if ('touches' in event && event.touches.length > 0) {
      return event.touches[0].pageX
    }
    return 'clientX' in event ? event.clientX : 0
  }

  const setDraggingStyle = () => {
    setMoveBlockBackgroundColor(UI_COLORS.active)
    setLeftBarBorderColor(UI_COLORS.active)
    setIconColor(UI_COLORS.white)
  }

  const setSuccessStyle = () => {
    setMoveBlockBackgroundColor(UI_COLORS.success)
    setLeftBarBorderColor(UI_COLORS.success)
    setIconColor(UI_COLORS.white)
    setIconClass('icon-check')
  }

  const setErrorStyle = () => {
    setMoveBlockBackgroundColor(UI_COLORS.error)
    setLeftBarBorderColor(UI_COLORS.error)
    setIconColor(UI_COLORS.white)
    setIconClass('icon-close')
  }

  const resetTrackStyle = () => {
    setLeftBarBorderColor(UI_COLORS.border)
    setMoveBlockBackgroundColor(UI_COLORS.white)
    setIconColor(UI_COLORS.black)
    setIconClass('icon-right')
  }

  const buildSlidePoint = (distance: number): SlidePoint => ({
    indexX: Math.round(distance),
    indexY: 5,
  })

  const buildCaptchaVerification = useCallback((slidePoint: SlidePoint) =>
    JSON.stringify({
      captchaId: captcha?.captchaId ?? '',
      token: captcha?.token ?? '',
      slidePoint,
    }), [captcha])

  const getMoveDistance = useCallback(() => {
    const currentLeft =
      parseInt(String(moveBlockLeft ?? 0).replace('px', ''), 10) || 0
    return (currentLeft * 310) / renderedImgWidth
  }, [moveBlockLeft, renderedImgWidth])

  const loadCaptcha = useCallback(async () => {
    const response = await reqGet()
    if (response.success && response.result) {
      setCaptcha(response.result)
      return
    }
    setTipWords(response.message || '获取验证码失败')
  }, [])

  const resetState = useCallback(() => {
    setShowRefresh(true)
    setFinishText('')
    setTransitionLeft('left .3s')
    setTransitionWidth('width .3s')
    setMoveBlockLeft(0)
    setLeftBarWidth(undefined)
    setIsEnd(false)
    setIsDragging(false)
    setPassFlag(false)
    resetTrackStyle()
    setText(explain)
  }, [explain])

  const refresh = useCallback(async () => {
    resetState()
    if (!visible) {
      return
    }
    await loadCaptcha()
    window.setTimeout(() => {
      setTransitionWidth('')
      setTransitionLeft('')
      setText(explain)
    }, 300)
  }, [explain, loadCaptcha, resetState, visible])

  const handleSuccess = useCallback((slidePoint: SlidePoint) => {
    setSuccessStyle()
    setShowRefresh(false)
    setIsEnd(true)
    setPassFlag(true)
    setTipWords(
      `${((endMoveTimeRef.current - startMoveTimeRef.current) / 1000).toFixed(2)}s验证成功`,
    )

    if (mode === 'pop') {
      window.setTimeout(() => {
        onRequestHide?.()
        resetState()
      }, 1500)
    }

    const captchaVerification = buildCaptchaVerification(slidePoint)
    window.setTimeout(() => {
      setTipWords('')
      onRequestClose?.()
      onSuccess?.({ captchaVerification })
    }, 1000)
  }, [buildCaptchaVerification, mode, onRequestClose, onRequestHide, onSuccess, resetState])

  const handleFail = useCallback((message?: string) => {
    setErrorStyle()
    setPassFlag(false)
    setTipWords(message || '验证失败')
    onError?.()
    window.setTimeout(() => {
      void refresh()
    }, 1000)
    window.setTimeout(() => {
      setTipWords('')
    }, 1000)
  }, [onError, refresh])

  const end = useCallback(async () => {
    endMoveTimeRef.current = Date.now()
    if (!isDragging || isEnd || !captcha) {
      return
    }

    setIsDragging(false)
    const slidePoint = buildSlidePoint(getMoveDistance())
    const response = await reqCheck({
      captchaId: captcha.captchaId,
      token: captcha.token,
      slidePoint,
    })

    if (response.success) {
      handleSuccess(slidePoint)
      return
    }

    handleFail(response.message)
  }, [captcha, getMoveDistance, handleFail, handleSuccess, isDragging, isEnd])

  const move = useCallback((event: MouseEvent | TouchEvent) => {
    if (!isDragging || isEnd || !barAreaRef.current) {
      return
    }

    let moveBlockOffset =
      getClientX(event) - barAreaRef.current.getBoundingClientRect().left
    const maxOffset = barAreaRef.current.offsetWidth - blockHalfWidth - 2
    const minOffset = blockHalfWidth

    if (moveBlockOffset >= maxOffset) {
      moveBlockOffset = maxOffset
    }
    if (moveBlockOffset <= minOffset) {
      moveBlockOffset = minOffset
    }

    const leftValue = `${moveBlockOffset - startLeftRef.current}px`
    setMoveBlockLeft(leftValue)
    setLeftBarWidth(leftValue)
  }, [blockHalfWidth, isDragging, isEnd])

  const start = useCallback((event: React.MouseEvent | React.TouchEvent) => {
    if (isEnd || !barAreaRef.current) {
      return
    }

    startLeftRef.current = Math.floor(
      getClientX(event) - barAreaRef.current.getBoundingClientRect().left,
    )
    startMoveTimeRef.current = Date.now()
    setText('')
    setDraggingStyle()
    event.stopPropagation()
    setIsDragging(true)
  }, [isEnd])

  useEffect(() => {
    onReadyRef.current = onReady
  }, [onReady])

  useEffect(() => {
    if (!visible) {
      wasVisibleRef.current = false
      return
    }

    if (wasVisibleRef.current) {
      return
    }

    wasVisibleRef.current = true
    queueMicrotask(() => {
      void refresh().then(() => {
        onReadyRef.current?.()
      })
    })
  }, [refresh, visible])

  useEffect(() => {
    onRegisterRefresh?.(() => {
      void refresh()
    })
  }, [onRegisterRefresh, refresh])

  useEffect(() => {
    const updatePanelSize = () => {
      if (!panelRef.current) {
        return
      }
      setRenderedImgWidth(panelRef.current.clientWidth || parseInt(imgSize.width, 10))
      setImageHeight(panelRef.current.clientHeight || parseInt(imgSize.height, 10))
    }

    updatePanelSize()
    const observer = new ResizeObserver(() => {
      updatePanelSize()
    })

    if (panelRef.current) {
      observer.observe(panelRef.current)
    }

    return () => {
      observer.disconnect()
    }
  }, [imgSize.height, imgSize.width, captcha])

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => move(event)
    const handleTouchMove = (event: TouchEvent) => move(event)
    const handleMouseUp = () => {
      void end()
    }
    const handleTouchEnd = () => {
      void end()
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('touchmove', handleTouchMove)
    window.addEventListener('mouseup', handleMouseUp)
    window.addEventListener('touchend', handleTouchEnd)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('mouseup', handleMouseUp)
      window.removeEventListener('touchend', handleTouchEnd)
    }
  }, [end, move])

  const leftBarActualWidth =
    leftBarWidth !== undefined ? leftBarWidth : barSize.height

  return (
    <div className={styles['captcha-slide']}>
      {type === '2' ? (
        <div
          className={styles['verify-img-out']}
          style={{ height: `${imageHeight + vSpace}px` }}
        >
          <div
            ref={panelRef}
            className={styles['verify-img-panel']}
            style={{ width: imgSize.width, height: imgSize.height }}
          >
            {captcha ? (
              <img
                src={`data:image/png;base64,${captcha.backgroundImage}`}
                alt=""
                className={styles['verify-background-image']}
              />
            ) : null}
            <button
              type="button"
              className={styles['verify-refresh']}
              onClick={() => void refresh()}
              style={{ display: showRefresh ? 'flex' : 'none' }}
              aria-label="刷新验证码"
            >
              ↻
            </button>
            {tipWords ? (
              <span
                className={`${styles['verify-tips']} ${passFlag ? styles['suc-bg'] : styles['err-bg']}`}
              >
                {tipWords}
              </span>
            ) : null}
          </div>
        </div>
      ) : null}

      <div
        ref={barAreaRef}
        className={styles['verify-bar-area']}
        style={{
          width: imgSize.width,
          height: barSize.height,
          lineHeight: barSize.height,
        }}
      >
        <span className={styles['verify-msg']}>{text}</span>
        <div
          className={styles['verify-left-bar']}
          style={{
            width: leftBarActualWidth,
            height: barSize.height,
            borderColor: leftBarBorderColor,
            transition: transitionWidth,
          }}
        >
          <span className={styles['verify-msg']}>{finishText}</span>
          <div
            className={styles['verify-move-block']}
            onTouchStart={start}
            onMouseDown={start}
            style={{
              width: barSize.height,
              height: barSize.height,
              backgroundColor: moveBlockBackgroundColor,
              left: moveBlockLeft,
              transition: transitionLeft,
            }}
          >
            <i
              className={`${styles['verify-icon']} ${styles[iconClass]}`}
              style={{ color: iconColor }}
            >
              {iconClass === 'icon-check'
                ? '✓'
                : iconClass === 'icon-close'
                  ? '✕'
                  : '→'}
            </i>
            {type === '2' && captcha ? (
              <div
                className={styles['verify-sub-block']}
                style={{
                  width: `${sliderBlockWidth}px`,
                  height: `${imageHeight}px`,
                  top: `-${imageHeight + vSpace}px`,
                  backgroundSize: `${renderedImgWidth}px ${imageHeight}px`,
                }}
              >
                <img
                  src={`data:image/png;base64,${captcha.sliderImage}`}
                  alt=""
                  className={styles['verify-slider-image']}
                />
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}

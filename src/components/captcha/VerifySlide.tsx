import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import styles from './VerifySlide.module.scss'
import type {
  CaptchaGetResult,
  CaptchaCheckPayload,
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
  vSpace = 5,
  explain = '向右滑动完成验证',
  imgSize = DEFAULT_IMG_SIZE,
  blockSize = DEFAULT_BLOCK_SIZE,
  barSize = DEFAULT_BAR_SIZE,
  onReady,
  onSuccess,
  onError,
  onGetCaptcha,
  onVerifyCaptcha,
  onRequestClose,
  onRequestHide,
  onRegisterRefresh,
}: VerifySlideProps) {
  const barAreaRef = useRef<HTMLDivElement | null>(null)
  const panelRef = useRef<HTMLDivElement | null>(null)

  const [captchaData, setCaptchaData] = useState<CaptchaGetResult | null>(null)
  const [statusMessage, setStatusMessage] = useState('')
  const [instructionText, setInstructionText] = useState(explain)
  const [isVerified, setIsVerified] = useState(false)
  const [isRefreshVisible, setIsRefreshVisible] = useState(true)
  const [sliderOffset, setSliderOffset] = useState<string | number>(0)
  const [progressWidth, setProgressWidth] = useState<string | number | undefined>(
    undefined,
  )
  const [sliderHandleColor, setSliderHandleColor] = useState(
    UI_COLORS.white,
  )
  const [progressBorderColor, setProgressBorderColor] = useState(UI_COLORS.border)
  const [iconColor, setIconColor] = useState(UI_COLORS.black)
  const [sliderIconClass, setSliderIconClass] = useState<'icon-right' | 'icon-check' | 'icon-close'>('icon-right')
  const [sliderOffsetTransition, setSliderOffsetTransition] = useState('')
  const [progressWidthTransition, setProgressWidthTransition] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [hasCompleted, setHasCompleted] = useState(false)
  const [panelWidth, setPanelWidth] = useState(
    parseInt(imgSize.width, 10),
  )
  const [panelHeight, setPanelHeight] = useState(parseInt(imgSize.height, 10))

  const dragStartOffsetRef = useRef(0)
  const dragStartTimeRef = useRef(0)
  const dragEndTimeRef = useRef(0)
  const hasInitializedVisibleRef = useRef(false)
  const onReadyRef = useRef(onReady)

  const blockHalfWidth = parseInt(blockSize.width, 10) / 2
  const sliderBlockWidth = Math.floor((panelWidth * 47) / 310)
  const backgroundImageSrc = useMemo(
    () =>
      captchaData ? `data:image/png;base64,${captchaData.backgroundImage}` : '',
    [captchaData],
  )
  const sliderImageSrc = useMemo(
    () => (captchaData ? `data:image/png;base64,${captchaData.sliderImage}` : ''),
    [captchaData],
  )

  const getClientX = (event: MouseEvent | TouchEvent | React.MouseEvent | React.TouchEvent) => {
    if ('touches' in event && event.touches.length > 0) {
      return event.touches[0].pageX
    }
    return 'clientX' in event ? event.clientX : 0
  }

  const setDraggingStyle = () => {
    setSliderHandleColor(UI_COLORS.active)
    setProgressBorderColor(UI_COLORS.active)
    setIconColor(UI_COLORS.white)
  }

  const setSuccessStyle = () => {
    setSliderHandleColor(UI_COLORS.success)
    setProgressBorderColor(UI_COLORS.success)
    setIconColor(UI_COLORS.white)
    setSliderIconClass('icon-check')
  }

  const setErrorStyle = () => {
    setSliderHandleColor(UI_COLORS.error)
    setProgressBorderColor(UI_COLORS.error)
    setIconColor(UI_COLORS.white)
    setSliderIconClass('icon-close')
  }

  const resetTrackStyle = () => {
    setProgressBorderColor(UI_COLORS.border)
    setSliderHandleColor(UI_COLORS.white)
    setIconColor(UI_COLORS.black)
    setSliderIconClass('icon-right')
  }

  const buildSlidePoint = (distance: number): SlidePoint => ({
    indexX: Math.round(distance),
    indexY: 5,
  })

  const buildCaptchaVerification = useCallback((slidePoint: SlidePoint) =>
    JSON.stringify({
      captchaId: captchaData?.captchaId ?? '',
      token: captchaData?.token ?? '',
      slidePoint,
    }), [captchaData])

  const getMoveDistance = useCallback(() => {
    const currentLeft =
      parseInt(String(sliderOffset ?? 0).replace('px', ''), 10) || 0
    return (currentLeft * 310) / panelWidth
  }, [panelWidth, sliderOffset])

  const loadCaptcha = useCallback(async () => {
    const nextCaptchaData = await onGetCaptcha()
    if (nextCaptchaData) {
      setCaptchaData(nextCaptchaData)
      return
    }
    setStatusMessage('获取验证码失败')
  }, [onGetCaptcha])

  const resetState = useCallback(() => {
    setIsRefreshVisible(true)
    setSliderOffsetTransition('left .3s')
    setProgressWidthTransition('width .3s')
    setSliderOffset(0)
    setProgressWidth(undefined)
    setHasCompleted(false)
    setIsDragging(false)
    setIsVerified(false)
    resetTrackStyle()
    setInstructionText(explain)
  }, [explain])

  const refresh = useCallback(async () => {
    resetState()
    if (!visible) {
      return
    }
    await loadCaptcha()
    window.setTimeout(() => {
      setProgressWidthTransition('')
      setSliderOffsetTransition('')
      setInstructionText(explain)
    }, 300)
  }, [explain, loadCaptcha, resetState, visible])

  const handleSuccess = useCallback((slidePoint: SlidePoint) => {
    setSuccessStyle()
    setIsRefreshVisible(false)
    setHasCompleted(true)
    setIsVerified(true)
    setStatusMessage(
      `${((dragEndTimeRef.current - dragStartTimeRef.current) / 1000).toFixed(2)}s验证成功`,
    )

    if (mode === 'pop') {
      window.setTimeout(() => {
        onRequestHide?.()
        resetState()
      }, 1500)
    }

    const captchaVerification = buildCaptchaVerification(slidePoint)
    window.setTimeout(() => {
      setStatusMessage('')
      onRequestClose?.()
      onSuccess?.({ captchaVerification })
    }, 1000)
  }, [buildCaptchaVerification, mode, onRequestClose, onRequestHide, onSuccess, resetState])

  const handleFail = useCallback((message?: string) => {
    setErrorStyle()
    setIsVerified(false)
    setStatusMessage(message || '验证失败')
    onError?.()
    window.setTimeout(() => {
      void refresh()
    }, 1000)
    window.setTimeout(() => {
      setStatusMessage('')
    }, 1000)
  }, [onError, refresh])

  const end = useCallback(async () => {
    dragEndTimeRef.current = Date.now()
    if (!isDragging || hasCompleted || !captchaData) {
      return
    }

    setIsDragging(false)
    const slidePoint = buildSlidePoint(getMoveDistance())
    const verifyPayload: CaptchaCheckPayload = {
      captchaId: captchaData.captchaId,
      token: captchaData.token,
      slidePoint,
    }
    const isPassed = await onVerifyCaptcha(verifyPayload)

    if (isPassed) {
      handleSuccess(slidePoint)
      return
    }

    handleFail()
  }, [captchaData, getMoveDistance, handleFail, handleSuccess, hasCompleted, isDragging, onVerifyCaptcha])

  const move = useCallback((event: MouseEvent | TouchEvent) => {
    if (!isDragging || hasCompleted || !barAreaRef.current) {
      return
    }

    let nextSliderOffset =
      getClientX(event) - barAreaRef.current.getBoundingClientRect().left
    const maxOffset = barAreaRef.current.offsetWidth - blockHalfWidth - 2
    const minOffset = blockHalfWidth

    if (nextSliderOffset >= maxOffset) {
      nextSliderOffset = maxOffset
    }
    if (nextSliderOffset <= minOffset) {
      nextSliderOffset = minOffset
    }

    const nextLeftValue = `${nextSliderOffset - dragStartOffsetRef.current}px`
    setSliderOffset(nextLeftValue)
    setProgressWidth(nextLeftValue)
  }, [blockHalfWidth, hasCompleted, isDragging])

  const start = useCallback((event: React.MouseEvent | React.TouchEvent) => {
    if (hasCompleted || !barAreaRef.current) {
      return
    }

    dragStartOffsetRef.current = Math.floor(
      getClientX(event) - barAreaRef.current.getBoundingClientRect().left,
    )
    dragStartTimeRef.current = Date.now()
    setInstructionText('')
    setDraggingStyle()
    event.stopPropagation()
    setIsDragging(true)
  }, [hasCompleted])

  useEffect(() => {
    onReadyRef.current = onReady
  }, [onReady])

  useEffect(() => {
    if (!visible) {
      hasInitializedVisibleRef.current = false
      return
    }

    if (hasInitializedVisibleRef.current) {
      return
    }

    hasInitializedVisibleRef.current = true
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
      setPanelWidth(panelRef.current.clientWidth || parseInt(imgSize.width, 10))
      setPanelHeight(panelRef.current.clientHeight || parseInt(imgSize.height, 10))
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
  }, [captchaData, imgSize.height, imgSize.width])

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

  const progressActualWidth =
    progressWidth !== undefined ? progressWidth : barSize.height

  return (
    <div className={styles['captcha-slide']}>
      <div
        className={styles['verify-img-out']}
        style={{ height: `${panelHeight + vSpace}px` }}
      >
        <div
          ref={panelRef}
          className={styles['verify-img-panel']}
          style={{ width: imgSize.width, height: imgSize.height }}
        >
          {captchaData ? (
            <img
              src={backgroundImageSrc}
              alt=""
              className={styles['verify-background-image']}
            />
          ) : null}
          <button
            type="button"
            className={styles['verify-refresh']}
            onClick={() => void refresh()}
            style={{ display: isRefreshVisible ? 'flex' : 'none' }}
            aria-label="刷新验证码"
          >
            ↻
          </button>
          {statusMessage ? (
            <span
              className={`${styles['verify-tips']} ${isVerified ? styles['suc-bg'] : styles['err-bg']}`}
            >
              {statusMessage}
            </span>
          ) : null}
        </div>
      </div>

      <div
        ref={barAreaRef}
        className={styles['verify-bar-area']}
        style={{
          width: imgSize.width,
          height: barSize.height,
          lineHeight: barSize.height,
        }}
      >
        <span className={styles['verify-msg']}>{instructionText}</span>
        <div
          className={styles['verify-left-bar']}
          style={{
            width: progressActualWidth,
            height: barSize.height,
            borderColor: progressBorderColor,
            transition: progressWidthTransition,
          }}
        >
          <div
            className={styles['verify-move-block']}
            onTouchStart={start}
            onMouseDown={start}
            style={{
              width: barSize.height,
              height: barSize.height,
              backgroundColor: sliderHandleColor,
              left: sliderOffset,
              transition: sliderOffsetTransition,
            }}
          >
            <i
              className={`${styles['verify-icon']} ${styles[sliderIconClass]}`}
              style={{ color: iconColor }}
            >
              {sliderIconClass === 'icon-check'
                ? '✓'
                : sliderIconClass === 'icon-close'
                  ? '✕'
                  : '→'}
            </i>
            {captchaData ? (
              <div
                className={styles['verify-sub-block']}
                style={{
                  width: `${sliderBlockWidth}px`,
                  height: `${panelHeight}px`,
                  top: `-${panelHeight + vSpace}px`,
                  backgroundSize: `${panelWidth}px ${panelHeight}px`,
                }}
              >
                <img
                  src={sliderImageSrc}
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

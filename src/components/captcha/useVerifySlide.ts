import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type {
  CaptchaCheckPayload,
  CaptchaGetResult,
  SizeConfig,
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
} as const

export const DEFAULT_IMG_SIZE: SizeConfig = { width: '310px', height: '155px' }
export const DEFAULT_BLOCK_SIZE: SizeConfig = { width: '50px', height: '50px' }
export const DEFAULT_BAR_SIZE: SizeConfig = { width: '310px', height: '40px' }

type VerifySlideLogicProps = Pick<
  VerifySlideProps,
  | 'mode'
  | 'visible'
  | 'vSpace'
  | 'explain'
  | 'imgSize'
  | 'blockSize'
  | 'barSize'
  | 'onReady'
  | 'onSuccess'
  | 'onError'
  | 'onGetCaptcha'
  | 'onVerifyCaptcha'
  | 'onRequestClose'
  | 'onRequestHide'
  | 'onRegisterRefresh'
>

export function useVerifySlide({
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
}: VerifySlideLogicProps) {
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
  const [sliderHandleColor, setSliderHandleColor] = useState<string>(UI_COLORS.white)
  const [progressBorderColor, setProgressBorderColor] = useState<string>(UI_COLORS.border)
  const [iconColor, setIconColor] = useState<string>(UI_COLORS.black)
  const [sliderIconClass, setSliderIconClass] = useState<
    'icon-right' | 'icon-check' | 'icon-close'
  >('icon-right')
  const [sliderOffsetTransition, setSliderOffsetTransition] = useState('')
  const [progressWidthTransition, setProgressWidthTransition] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [hasCompleted, setHasCompleted] = useState(false)
  const [panelWidth, setPanelWidth] = useState(parseInt(imgSize.width, 10))
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
  const progressActualWidth =
    progressWidth !== undefined ? progressWidth : barSize.height

  const getClientX = (
    event: MouseEvent | TouchEvent | React.MouseEvent | React.TouchEvent,
  ) => {
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

  const buildCaptchaVerification = useCallback(
    (slidePoint: SlidePoint) =>
      JSON.stringify({
        captchaId: captchaData?.captchaId ?? '',
        token: captchaData?.token ?? '',
        slidePoint,
      }),
    [captchaData],
  )

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

  const handleSuccess = useCallback(
    (slidePoint: SlidePoint) => {
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
    },
    [
      buildCaptchaVerification,
      mode,
      onRequestClose,
      onRequestHide,
      onSuccess,
      resetState,
    ],
  )

  const handleFail = useCallback(
    (message?: string) => {
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
    },
    [onError, refresh],
  )

  const handleDragEnd = useCallback(async () => {
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
  }, [
    captchaData,
    getMoveDistance,
    handleFail,
    handleSuccess,
    hasCompleted,
    isDragging,
    onVerifyCaptcha,
  ])

  const handleDragMove = useCallback(
    (event: MouseEvent | TouchEvent) => {
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
    },
    [blockHalfWidth, hasCompleted, isDragging],
  )

  const handleDragStart = useCallback(
    (event: React.MouseEvent | React.TouchEvent) => {
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
    },
    [hasCompleted],
  )

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
    const handleMouseMove = (event: MouseEvent) => handleDragMove(event)
    const handleTouchMove = (event: TouchEvent) => handleDragMove(event)
    const handleMouseUp = () => {
      void handleDragEnd()
    }
    const handleTouchEnd = () => {
      void handleDragEnd()
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
  }, [handleDragEnd, handleDragMove])

  return {
    barAreaRef,
    panelRef,
    vSpace,
    imgSize,
    barSize,
    panelWidth,
    panelHeight,
    backgroundImageSrc,
    sliderImageSrc,
    statusMessage,
    instructionText,
    isVerified,
    isRefreshVisible,
    progressActualWidth,
    progressBorderColor,
    progressWidthTransition,
    sliderHandleColor,
    sliderOffset,
    sliderOffsetTransition,
    sliderIconClass,
    iconColor,
    sliderBlockWidth,
    captchaData,
    refresh,
    handleDragStart,
  }
}

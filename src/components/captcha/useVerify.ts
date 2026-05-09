import { useCallback, useImperativeHandle, useRef, useState } from 'react'
import type { VerifyProps, VerifyRef } from './types'
import { DEFAULT_IMG_SIZE } from './useVerifySlide'

type UseVerifyParams = Pick<VerifyProps, 'mode' | 'imgSize'> & {
  ref: React.ForwardedRef<VerifyRef>
}

export function useVerify({ mode = 'pop', imgSize = DEFAULT_IMG_SIZE, ref }: UseVerifyParams) {
  const [isPopupVisible, setIsPopupVisible] = useState(false)
  const slideRefreshRef = useRef<(() => void) | null>(null)

  const closeVerify = useCallback(() => {
    setIsPopupVisible(false)
  }, [])

  const hideVerify = useCallback(() => {
    setIsPopupVisible(false)
  }, [])

  const registerRefresh = useCallback((refreshHandler: () => void) => {
    slideRefreshRef.current = refreshHandler
  }, [])

  useImperativeHandle(ref, () => ({
    show: () => {
      if (mode === 'pop') {
        setIsPopupVisible(true)
      }
    },
    close: closeVerify,
  }), [closeVerify, mode])

  return {
    mode,
    imgSize,
    closeVerify,
    hideVerify,
    registerRefresh,
    isVisible: mode === 'pop' ? isPopupVisible : true,
    containerClassName: mode === 'pop' ? 'mask' : undefined,
    boxClassName: mode === 'pop' ? 'verify-box' : undefined,
    isPopupMode: mode === 'pop',
    boxMaxWidth: `${parseInt(imgSize.width, 10) + 30}px`,
  }
}

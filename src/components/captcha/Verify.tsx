import { forwardRef, useImperativeHandle, useRef, useState } from 'react'
import VerifySlide from './VerifySlide'
import styles from './Verify.module.scss'
import type {
  VerifyMode,
  VerifyRef,
  VerifySlideProps,
  VerifySuccessPayload,
} from './types'

interface VerifyProps {
  mode?: VerifyMode
  vSpace?: number
  explain?: string
  imgSize?: VerifySlideProps['imgSize']
  blockSize?: VerifySlideProps['blockSize']
  barSize?: VerifySlideProps['barSize']
  onReady?: () => void
  onSuccess?: (payload: VerifySuccessPayload) => void
  onError?: () => void
}

const Verify = forwardRef<VerifyRef, VerifyProps>(function Verify(
  {
    mode = 'pop',
    vSpace,
    explain,
    imgSize,
    blockSize,
    barSize,
    onReady,
    onSuccess,
    onError,
  },
  ref,
) {
  const [clickShow, setClickShow] = useState(false)
  const slideRefreshRef = useRef<(() => void) | null>(null)

  const closeBox = () => {
    setClickShow(false)
  }

  useImperativeHandle(ref, () => ({
    show: () => {
      if (mode === 'pop') {
        setClickShow(true)
      }
    },
    close: closeBox,
  }))

  const showBox = mode === 'pop' ? clickShow : true

  return (
    <div
      className={mode === 'pop' ? styles.mask : undefined}
      style={{ display: showBox ? 'block' : 'none' }}
    >
      <div
        className={mode === 'pop' ? styles['verify-box'] : undefined}
        style={{ maxWidth: `${parseInt(imgSize?.width ?? '310', 10) + 30}px` }}
      >
        {mode === 'pop' ? (
          <div className={styles['verify-box-top']}>
            请完成安全验证
            <button
              type="button"
              className={styles['verify-box-close']}
              onClick={closeBox}
            >
              ✕
            </button>
          </div>
        ) : null}
        <div
          className={styles['verify-box-bottom']}
          style={{ padding: mode === 'pop' ? '15px' : '0' }}
        >
          <VerifySlide
            mode={mode}
            visible={showBox}
            type="2"
            vSpace={vSpace}
            explain={explain}
            imgSize={imgSize}
            blockSize={blockSize}
            barSize={barSize}
            onReady={onReady}
            onSuccess={onSuccess}
            onError={onError}
            onRequestClose={closeBox}
            onRequestHide={() => setClickShow(false)}
            onRegisterRefresh={(refreshHandler) => {
              slideRefreshRef.current = refreshHandler
            }}
          />
        </div>
      </div>
    </div>
  )
})

export default Verify

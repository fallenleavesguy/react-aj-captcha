import { forwardRef } from 'react'
import VerifySlide from './VerifySlide'
import styles from './Verify.module.scss'
import type { VerifyProps, VerifyRef } from './types'
import { useVerify } from './useVerify'

const Verify = forwardRef<VerifyRef, VerifyProps>(function Verify(
  props,
  ref,
) {
  const {
    mode,
    imgSize,
    closeVerify,
    hideVerify,
    registerRefresh,
    isVisible,
    containerClassName,
    boxClassName,
    isPopupMode,
    boxMaxWidth,
  } = useVerify({
    mode: props.mode,
    imgSize: props.imgSize,
    ref,
  })

  return (
    <div
      className={containerClassName ? styles[containerClassName] : undefined}
      style={{ display: isVisible ? 'block' : 'none' }}
    >
      <div
        className={boxClassName ? styles[boxClassName] : undefined}
        style={{ maxWidth: boxMaxWidth }}
      >
        {isPopupMode ? (
          <div className={styles['verify-box-top']}>
            请完成安全验证
            <button
              type="button"
              className={styles['verify-box-close']}
              onClick={closeVerify}
            >
              ✕
            </button>
          </div>
        ) : null}
        <div
          className={styles['verify-box-bottom']}
          style={{ padding: isPopupMode ? '15px' : '0' }}
        >
          <VerifySlide
            mode={mode}
            visible={isVisible}
            vSpace={props.vSpace}
            explain={props.explain}
            imgSize={imgSize}
            blockSize={props.blockSize}
            barSize={props.barSize}
            onReady={props.onReady}
            onSuccess={props.onSuccess}
            onError={props.onError}
            onGetCaptcha={props.onGetCaptcha}
            onVerifyCaptcha={props.onVerifyCaptcha}
            onRequestClose={closeVerify}
            onRequestHide={hideVerify}
            onRegisterRefresh={registerRefresh}
          />
        </div>
      </div>
    </div>
  )
})

export default Verify

import styles from './VerifySlide.module.scss'
import type { VerifySlideProps } from './types'
import { useVerifySlide } from './useVerifySlide'

export default function VerifySlide(props: VerifySlideProps) {
  const {
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
  } = useVerifySlide(props)

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
            onTouchStart={handleDragStart}
            onMouseDown={handleDragStart}
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

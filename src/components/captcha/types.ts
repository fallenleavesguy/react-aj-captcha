export type VerifyMode = 'pop' | 'fixed'

export interface SizeConfig {
  width: string
  height: string
}

export interface CaptchaGetResult {
  captchaId: string
  token: string
  backgroundImage: string
  sliderImage: string
}

export interface CaptchaGetResponse {
  code: number
  message: string
  result: CaptchaGetResult | null
  success: boolean
}

export interface SlidePoint {
  indexX: number
  indexY: 5
}

export interface CaptchaCheckPayload {
  captchaId: string
  token: string
  slidePoint: SlidePoint
}

export interface CaptchaCheckResponse {
  code: number
  message: string
  result: null
  success: boolean
}

export interface VerifySuccessPayload {
  captchaVerification: string
}

export interface VerifyApiHandlers {
  onGetCaptcha: () => Promise<CaptchaGetResult | null>
  onVerifyCaptcha: (payload: CaptchaCheckPayload) => Promise<boolean>
}

export interface VerifyProps extends VerifyApiHandlers {
  mode?: VerifyMode
  vSpace?: number
  explain?: string
  imgSize?: SizeConfig
  blockSize?: SizeConfig
  barSize?: SizeConfig
  onReady?: () => void
  onSuccess?: (payload: VerifySuccessPayload) => void
  onError?: () => void
}

export interface VerifySlideProps {
  mode?: VerifyMode
  visible?: boolean
  vSpace?: number
  explain?: string
  imgSize?: SizeConfig
  blockSize?: SizeConfig
  barSize?: SizeConfig
  onReady?: () => void
  onSuccess?: (payload: VerifySuccessPayload) => void
  onError?: () => void
  onGetCaptcha: VerifyApiHandlers['onGetCaptcha']
  onVerifyCaptcha: VerifyApiHandlers['onVerifyCaptcha']
  onRequestClose?: () => void
  onRequestHide?: () => void
  onRegisterRefresh?: (refresh: () => void) => void
}

export interface VerifyRef {
  show: () => void
  close: () => void
}

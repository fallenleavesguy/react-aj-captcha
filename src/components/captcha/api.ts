import type {
  CaptchaCheckPayload,
  CaptchaCheckResponse,
  CaptchaGetResponse,
} from './types'

const JSON_HEADERS = {
  Accept: '*/*',
  'Content-Type': 'application/json',
}

const GET_URL =
  'https://appwebuat.megahubhk.com:10443/gateway/captcha/api/v1/get'
const CHECK_URL =
  'https://appwebuat.megahubhk.com:10443/gateway/captcha/api/v1/check'

export async function reqGet(): Promise<CaptchaGetResponse> {
  const response = await fetch(GET_URL, {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify({
      businessType: 'AppRegister',
      supplier: 'AJ',
      type: 'SLIDE',
    }),
  })

  return response.json()
}

export async function reqCheck(
  payload: CaptchaCheckPayload,
): Promise<CaptchaCheckResponse> {
  const response = await fetch(CHECK_URL, {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify({
      businessType: 'AppRegister',
      captchaId: payload.captchaId,
      slidePoint: payload.slidePoint,
      supplier: 'AJ',
      token: payload.token,
      type: 'SLIDE',
    }),
  })

  return response.json()
}

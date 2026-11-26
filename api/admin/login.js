import {
  createSessionCookie, getAdminConfiguration, isSameOriginRequest,
  passwordMatches, sendJson,
} from '../../server/adminAuth.js'

export default function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return sendJson(res, 405, { error: 'Method not allowed.' })
  }
  if (!isSameOriginRequest(req)) return sendJson(res, 403, { error: 'Request origin was rejected.' })

  let configuration
  try {
    configuration = getAdminConfiguration()
  } catch (error) {
    return sendJson(res, 503, { error: error.message })
  }

  let body = req.body
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body)
    } catch {
      return sendJson(res, 400, { error: 'Invalid request body.' })
    }
  }
  if (!body || typeof body.password !== 'string' || body.password.length > 512
    || !passwordMatches(body.password, configuration.password)) {
    return sendJson(res, 401, { error: 'The password is incorrect.' })
  }

  res.setHeader('Set-Cookie', createSessionCookie(req, configuration.secret))
  return sendJson(res, 200, { authenticated: true })
}

import {
  clearSessionCookie, isSameOriginRequest, sendJson,
} from '../../server/adminAuth.js'

export default function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return sendJson(res, 405, { error: 'Method not allowed.' })
  }
  if (!isSameOriginRequest(req)) return sendJson(res, 403, { error: 'Request origin was rejected.' })
  res.setHeader('Set-Cookie', clearSessionCookie(req))
  return sendJson(res, 200, { authenticated: false, loggedOut: true })
}

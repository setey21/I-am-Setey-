import { isAuthorized, sendJson } from '../../server/adminAuth.js'

export default function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return sendJson(res, 405, { error: 'Method not allowed.' })
  }
  if (!isAuthorized(req)) return sendJson(res, 401, { authenticated: false })
  return sendJson(res, 200, { authenticated: true })
}

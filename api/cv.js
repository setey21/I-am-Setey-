import { list } from '@vercel/blob'
import { sendJson } from '../server/adminAuth.js'

const CV_PREFIX = 'portfolio-cv/'
const DEFAULT_CV = '/Setey-Brhaney-Haftie-CV.pdf'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return sendJson(res, 405, { error: 'Method not allowed.' })
  }

  try {
    const { blobs } = await list({ prefix: CV_PREFIX, limit: 1 })
    const latestCv = blobs.find((blob) => blob.pathname === `${CV_PREFIX}Setey-Brhaney-Haftie-CV.pdf`)
    return sendJson(res, 200, {
      downloadUrl: latestCv?.downloadUrl || DEFAULT_CV,
      managedUpload: Boolean(latestCv),
      uploadedAt: latestCv?.uploadedAt || null,
    })
  } catch (error) {
    console.error('CV metadata lookup failed:', error)
    return sendJson(res, 503, { error: 'CV storage is not available.' })
  }
}

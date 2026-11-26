import { handleUpload } from '@vercel/blob/client'
import {
  isAuthorized, isSameOriginRequest, sendJson,
} from '../../server/adminAuth.js'

const MAX_FILE_BYTES = 50 * 1024 * 1024
const CV_PATH = 'portfolio-cv/Setey-Brhaney-Haftie-CV.pdf'
const TOKEN_PAYLOAD = 'portfolio-cv-admin-upload-v1'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return sendJson(res, 405, { error: 'Method not allowed.' })
  }

  let body = req.body
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body)
    } catch {
      return sendJson(res, 400, { error: 'Invalid upload request.' })
    }
  }
  if (!body || typeof body !== 'object') {
    return sendJson(res, 400, { error: 'Invalid upload request.' })
  }

  if (body.type === 'blob.generate-client-token') {
    if (!isSameOriginRequest(req)) return sendJson(res, 403, { error: 'Request origin was rejected.' })
    if (!isAuthorized(req)) return sendJson(res, 401, { error: 'Sign in to upload a CV.' })
    if (body.payload?.pathname !== CV_PATH) {
      return sendJson(res, 400, { error: 'Only the portfolio CV can be updated.' })
    }
  } else if (body.type !== 'blob.upload-completed') {
    return sendJson(res, 400, { error: 'Unsupported upload request.' })
  }

  try {
    const result = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async (pathname) => {
        if (!isSameOriginRequest(req) || !isAuthorized(req)) {
          throw new Error('You must be signed in to upload a CV.')
        }
        if (pathname !== CV_PATH) {
          throw new Error('Only the portfolio CV can be updated.')
        }
        return {
          allowedContentTypes: ['application/pdf'],
          maximumSizeInBytes: MAX_FILE_BYTES,
          validUntil: Date.now() + 60 * 60 * 1000,
          addRandomSuffix: false,
          allowOverwrite: true,
          cacheControlMaxAge: 60,
          tokenPayload: TOKEN_PAYLOAD,
        }
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        if (blob.pathname !== CV_PATH || tokenPayload !== TOKEN_PAYLOAD) {
          throw new Error('The completed upload did not match the authorized CV.')
        }
      },
    })
    return sendJson(res, 200, result)
  } catch (error) {
    console.error('CV client upload failed:', error)
    return sendJson(res, 400, { error: 'Vercel could not authorize or complete this upload. Check the Blob connection and try again.' })
  }
}

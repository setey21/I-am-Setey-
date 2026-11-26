import { personalInfo } from '../src/data/content.js'
import { isSameOriginRequest, sendJson } from '../server/adminAuth.js'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const FIELD_LIMITS = { name: 100, email: 254, subject: 160, message: 5000 }

function parseBody(body) {
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body)
    } catch {
      return null
    }
  }
  return body && typeof body === 'object' && !Array.isArray(body) ? body : null
}

function validateMessage(body) {
  const values = {}
  for (const [field, limit] of Object.entries(FIELD_LIMITS)) {
    if (typeof body[field] !== 'string') return { error: 'Please complete all contact fields.' }
    values[field] = body[field].trim()
    if (!values[field] || values[field].length > limit) {
      return { error: `Please check the ${field} field and try again.` }
    }
  }
  if (!EMAIL_PATTERN.test(values.email)) return { error: 'Please enter a valid email address.' }
  if (typeof body.website === 'string' && body.website.trim()) {
    return { error: 'The message could not be sent. Please try again.' }
  }
  values.subject = values.subject.replace(/[\r\n]+/g, ' ')
  return { values }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return sendJson(res, 405, { error: 'Method not allowed.' })
  }
  if (!isSameOriginRequest(req)) return sendJson(res, 403, { error: 'Request origin was rejected.' })

  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.RESEND_FROM_EMAIL
  if (!apiKey || !from) {
    return sendJson(res, 503, { error: 'Message delivery is not configured yet. Please use the email link on this page.' })
  }

  const body = parseBody(req.body)
  if (!body) return sendJson(res, 400, { error: 'Invalid message request.' })
  const validation = validateMessage(body)
  if (validation.error) return sendJson(res, 400, { error: validation.error })

  const { name, email, subject, message } = validation.values
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [personalInfo.email],
        reply_to: email,
        subject: `Portfolio contact: ${subject}`,
        text: `New portfolio contact message\n\nName: ${name}\nEmail: ${email}\n\n${message}`,
      }),
    })
    if (!response.ok) {
      console.error('Resend rejected a portfolio contact message:', response.status)
      return sendJson(res, 502, { error: 'Your message could not be delivered. Please try again later or use the email link.' })
    }
    return sendJson(res, 200, { sent: true })
  } catch (error) {
    console.error('Portfolio contact email request failed:', error)
    return sendJson(res, 502, { error: 'Your message could not be delivered. Please try again later or use the email link.' })
  }
}

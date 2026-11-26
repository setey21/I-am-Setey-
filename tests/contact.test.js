import { afterEach, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import contactHandler from '../api/contact.js'
import { personalInfo } from '../src/data/content.js'

const originalApiKey = process.env.RESEND_API_KEY
const originalFrom = process.env.RESEND_FROM_EMAIL
const originalFetch = globalThis.fetch

function createResponse() {
  return {
    headers: {},
    statusCode: 200,
    body: null,
    setHeader(name, value) { this.headers[name.toLowerCase()] = value },
    status(code) { this.statusCode = code; return this },
    json(payload) { this.body = payload; return this },
  }
}

function createRequest(body, headers = {}) {
  return {
    method: 'POST',
    headers: {
      origin: 'https://portfolio.example',
      host: 'portfolio.example',
      ...headers,
    },
    body,
  }
}

function configureEmail() {
  process.env.RESEND_API_KEY = 'test-resend-key'
  process.env.RESEND_FROM_EMAIL = 'Portfolio <contact@example.com>'
}

afterEach(() => {
  if (originalApiKey === undefined) delete process.env.RESEND_API_KEY
  else process.env.RESEND_API_KEY = originalApiKey
  if (originalFrom === undefined) delete process.env.RESEND_FROM_EMAIL
  else process.env.RESEND_FROM_EMAIL = originalFrom
  globalThis.fetch = originalFetch
})

describe('contact email endpoint', () => {
  it('sends a validated message to the portfolio email and sets reply-to', async () => {
    configureEmail()
    let sentRequest
    globalThis.fetch = async (url, options) => {
      sentRequest = { url, options }
      return { ok: true, status: 200 }
    }

    const res = createResponse()
    await contactHandler(createRequest({
      name: 'Visitor',
      email: 'visitor@example.com',
      subject: 'Project question',
      message: 'Please contact me.',
    }), res)

    assert.equal(res.statusCode, 200)
    assert.equal(res.body.sent, true)
    assert.equal(sentRequest.url, 'https://api.resend.com/emails')
    assert.equal(sentRequest.options.headers.Authorization, 'Bearer test-resend-key')
    const payload = JSON.parse(sentRequest.options.body)
    assert.deepEqual(payload.to, [personalInfo.email])
    assert.equal(payload.reply_to, 'visitor@example.com')
    assert.equal(payload.subject, 'Portfolio contact: Project question')
  })

  it('rejects invalid addresses and honeypot submissions without sending', async () => {
    configureEmail()
    let requestCount = 0
    globalThis.fetch = async () => {
      requestCount += 1
      return { ok: true, status: 200 }
    }
    const invalidAddress = createResponse()
    await contactHandler(createRequest({
      name: 'Visitor',
      email: 'not-an-email',
      subject: 'Hello',
      message: 'Test',
    }), invalidAddress)
    assert.equal(invalidAddress.statusCode, 400)

    const honeypot = createResponse()
    await contactHandler(createRequest({
      name: 'Bot',
      email: 'bot@example.com',
      subject: 'Hello',
      message: 'Test',
      website: 'https://spam.example',
    }), honeypot)
    assert.equal(honeypot.statusCode, 400)
    assert.equal(requestCount, 0)
  })

  it('rejects cross-origin and oversized submissions without sending', async () => {
    configureEmail()
    let requestCount = 0
    globalThis.fetch = async () => {
      requestCount += 1
      return { ok: true, status: 200 }
    }

    const message = {
      name: 'Visitor',
      email: 'visitor@example.com',
      subject: 'Hello',
      message: 'Test',
    }
    const crossOrigin = createResponse()
    await contactHandler(createRequest(message, { origin: 'https://other.example' }), crossOrigin)
    assert.equal(crossOrigin.statusCode, 403)

    const oversized = createResponse()
    await contactHandler(createRequest({ ...message, message: 'x'.repeat(5001) }), oversized)
    assert.equal(oversized.statusCode, 400)
    assert.equal(requestCount, 0)
  })

  it('reports missing delivery configuration instead of claiming success', async () => {
    delete process.env.RESEND_API_KEY
    delete process.env.RESEND_FROM_EMAIL

    const res = createResponse()
    await contactHandler(createRequest({
      name: 'Visitor',
      email: 'visitor@example.com',
      subject: 'Hello',
      message: 'Test',
    }), res)

    assert.equal(res.statusCode, 503)
    assert.match(res.body.error, /not configured/)
  })

  it('reports provider failures without returning a success response', async () => {
    configureEmail()
    globalThis.fetch = async () => ({ ok: false, status: 429 })

    const res = createResponse()
    await contactHandler(createRequest({
      name: 'Visitor',
      email: 'visitor@example.com',
      subject: 'Hello',
      message: 'Test',
    }), res)

    assert.equal(res.statusCode, 502)
    assert.match(res.body.error, /could not be delivered/)
  })
})

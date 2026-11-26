import { after, before, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import loginHandler from '../api/admin/login.js'
import sessionHandler from '../api/admin/session.js'
import uploadHandler from '../api/admin/upload.js'
import {
  createSessionCookie, hasValidSession, isSameOriginRequest, passwordMatches,
} from '../server/adminAuth.js'

const originalPassword = process.env.ADMIN_PASSWORD
const originalSecret = process.env.SESSION_SECRET
const password = 'secure-example-password-for-tests-123'
const secret = 'test-session-signing-secret-with-enough-length'

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

before(() => {
  process.env.ADMIN_PASSWORD = password
  process.env.SESSION_SECRET = secret
})

after(() => {
  if (originalPassword === undefined) delete process.env.ADMIN_PASSWORD
  else process.env.ADMIN_PASSWORD = originalPassword
  if (originalSecret === undefined) delete process.env.SESSION_SECRET
  else process.env.SESSION_SECRET = originalSecret
})

describe('admin authentication', () => {
  it('creates a signed session cookie after a same-origin password login', () => {
    const req = {
      method: 'POST',
      headers: { origin: 'https://portfolio.example', host: 'portfolio.example', 'x-forwarded-proto': 'https' },
      body: { password },
    }
    const res = createResponse()
    loginHandler(req, res)

    assert.equal(res.statusCode, 200)
    assert.match(res.headers['set-cookie'], /HttpOnly/)
    assert.match(res.headers['set-cookie'], /Secure/)
    assert.match(res.headers['set-cookie'], /SameSite=Strict/)

    const authenticatedReq = {
      headers: { cookie: res.headers['set-cookie'].split(';')[0], host: 'portfolio.example' },
    }
    assert.equal(hasValidSession(authenticatedReq, secret), true)
    const sessionResponse = createResponse()
    sessionHandler({ method: 'GET', ...authenticatedReq }, sessionResponse)
    assert.equal(sessionResponse.statusCode, 200)
  })

  it('rejects a wrong password and cross-origin login', () => {
    const wrongPassword = createResponse()
    loginHandler({
      method: 'POST',
      headers: { origin: 'https://portfolio.example', host: 'portfolio.example' },
      body: { password: 'wrong-password' },
    }, wrongPassword)
    assert.equal(wrongPassword.statusCode, 401)

    const crossOrigin = createResponse()
    loginHandler({
      method: 'POST',
      headers: { origin: 'https://attacker.example', host: 'portfolio.example' },
      body: { password },
    }, crossOrigin)
    assert.equal(crossOrigin.statusCode, 403)
  })

  it('rejects a tampered session and compares passwords safely', () => {
    assert.equal(hasValidSession({ headers: { cookie: 'admin_session=123456.tampered' } }, secret), false)
    assert.equal(passwordMatches(password, password), true)
    assert.equal(passwordMatches('not-the-password', password), false)
    assert.equal(passwordMatches(null, password), false)
  })

  it('blocks CV uploads without an authenticated same-origin session', () => {
    const unauthorized = createResponse()
    uploadHandler({
      method: 'POST',
      headers: { origin: 'https://portfolio.example', host: 'portfolio.example', 'content-type': 'application/pdf' },
      body: { type: 'blob.generate-client-token', payload: { pathname: 'portfolio-cv/Setey-Brhaney-Haftie-CV.pdf' } },
    }, unauthorized)
    assert.equal(unauthorized.statusCode, 401)

    const crossOriginRequest = createResponse()
    uploadHandler({
      method: 'POST',
      headers: { origin: 'https://other.example', host: 'portfolio.example', 'content-type': 'application/pdf' },
      body: { type: 'blob.generate-client-token', payload: { pathname: 'portfolio-cv/Setey-Brhaney-Haftie-CV.pdf' } },
    }, crossOriginRequest)
    assert.equal(crossOriginRequest.statusCode, 403)
    assert.equal(isSameOriginRequest({ headers: { origin: 'https://portfolio.example', host: 'portfolio.example' } }), true)
  })

  it('rejects uploads targeting a different Blob pathname', async () => {
    const cookie = createSessionCookie({
      headers: { host: 'portfolio.example', 'x-forwarded-proto': 'https' },
    }, secret).split(';')[0]
    const req = {
      method: 'POST',
      headers: { origin: 'https://portfolio.example', host: 'portfolio.example', cookie },
      body: { type: 'blob.generate-client-token', payload: { pathname: 'someone-else.pdf' } },
    }
    const res = createResponse()

    await uploadHandler(req, res)

    assert.equal(res.statusCode, 400)
    assert.equal(res.body.error, 'Only the portfolio CV can be updated.')
  })
})

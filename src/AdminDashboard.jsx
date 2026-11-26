import { useEffect, useState } from 'react'
import { upload } from '@vercel/blob/client'
import { ArrowLeft, CheckCircle2, FileText, LogOut, ShieldCheck, Upload } from 'lucide-react'

const MAX_FILE_BYTES = 50 * 1024 * 1024
const CV_PATH = 'portfolio-cv/Setey-Brhaney-Haftie-CV.pdf'
const ADMIN_API_HELP = 'Vite preview does not run the admin API. Link this project to Vercel, configure Blob and the admin secrets, then run `npm run dev:vercel`.'

async function readResponse(response) {
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    const error = new Error(payload.error || 'The request could not be completed.')
    error.status = response.status
    throw error
  }
  return payload
}

export default function AdminDashboard() {
  const [authStatus, setAuthStatus] = useState('checking')
  const [password, setPassword] = useState('')
  const [selectedFile, setSelectedFile] = useState(null)
  const [uploadStatus, setUploadStatus] = useState('')
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [currentCv, setCurrentCv] = useState(null)

  useEffect(() => {
    document.title = 'Private CV Dashboard | Setey Brhaney Haftie'
    let cancelled = false
    fetch('/api/admin/session', { cache: 'no-store' })
      .then(async (response) => {
        if (cancelled) return
        const contentType = response.headers.get('content-type') || ''
        if (response.ok && contentType.includes('application/json')) {
          const session = await response.json()
          setAuthStatus(session.authenticated ? 'authenticated' : 'signed-out')
          if (!session.authenticated) return
          const cvResponse = await fetch('/api/cv', { cache: 'no-store' })
          if (cvResponse.ok && !cancelled) setCurrentCv(await cvResponse.json())
          return
        }
        setAuthStatus('signed-out')
        if (response.status !== 401) {
          setError(ADMIN_API_HELP)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setAuthStatus('signed-out')
          setError(ADMIN_API_HELP)
        }
      })
    return () => { cancelled = true }
  }, [])

  const signIn = async (event) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      await readResponse(await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ password }),
      }))
      setPassword('')
      setAuthStatus('authenticated')
      const response = await fetch('/api/cv', { cache: 'no-store' })
      if (response.ok) setCurrentCv(await response.json())
    } catch (requestError) {
      setPassword('')
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  const uploadCv = async (event) => {
    event.preventDefault()
    const form = event.currentTarget
    if (!selectedFile) {
      setError('Choose a PDF file before uploading.')
      return
    }
    if (selectedFile.size > MAX_FILE_BYTES) {
      setError('The CV must be 50 MB or smaller.')
      return
    }
    if ((selectedFile.type && selectedFile.type !== 'application/pdf') || !selectedFile.name.toLowerCase().endsWith('.pdf')) {
      setError('Please choose a PDF file.')
      return
    }

    setBusy(true)
    setError('')
    setUploadStatus('')
    setUploadProgress(0)
    try {
      const result = await upload(CV_PATH, selectedFile, {
        access: 'public',
        contentType: 'application/pdf',
        handleUploadUrl: '/api/admin/upload',
        multipart: selectedFile.size > 4 * 1024 * 1024,
        onUploadProgress: ({ percentage }) => setUploadProgress(Math.round(percentage)),
      })
      setUploadStatus('CV updated and published. Cached copies may take up to 60 seconds to refresh.')
      setSelectedFile(null)
      form.reset()
      setCurrentCv({ managedUpload: true, downloadUrl: result.downloadUrl, uploadedAt: new Date().toISOString() })
    } catch (requestError) {
      if (requestError.status === 401) setAuthStatus('signed-out')
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  const signOut = async () => {
    setBusy(true)
    setError('')
    try {
      await readResponse(await fetch('/api/admin/logout', {
        method: 'POST',
        credentials: 'same-origin',
      }))
      setAuthStatus('signed-out')
      setCurrentCv(null)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="admin-shell">
      <a className="admin-back-link" href="/"><ArrowLeft /> Back to portfolio</a>
      <section className="admin-panel" aria-labelledby="admin-title">
        <div className="admin-heading-icon"><ShieldCheck /></div>
        <p className="eyebrow">Private administration</p>
        <h1 id="admin-title">CV upload dashboard</h1>
        <p className="admin-intro">Sign in to replace the public CV. The dashboard and upload action require your password; visitors can only download the published PDF.</p>

        {authStatus === 'checking' && <p className="admin-status">Checking your sign-in…</p>}

        {authStatus === 'signed-out' && (
          <form className="admin-form" onSubmit={signIn}>
            <label htmlFor="admin-password">Admin password</label>
            <input id="admin-password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
            <button className="button" type="submit" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
          </form>
        )}

        {authStatus === 'authenticated' && (
          <div className="admin-content">
            <div className="admin-current-cv">
              <FileText />
              <div><strong>Current public CV</strong><span>{currentCv?.managedUpload ? 'Published in Vercel Blob' : 'Using the included default CV'}</span></div>
            </div>
            <form className="admin-form" onSubmit={uploadCv}>
              <label htmlFor="cv-file">Select replacement CV (PDF, max 50 MB)</label>
              <input id="cv-file" type="file" accept="application/pdf,.pdf" disabled={busy} onChange={(event) => { setSelectedFile(event.target.files?.[0] || null); setError(''); setUploadStatus(''); setUploadProgress(0) }} />
              {selectedFile && <p className="selected-file">{selectedFile.name} · {(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>}
              {busy && <progress className="upload-progress" max="100" value={uploadProgress} aria-label={`Upload progress: ${uploadProgress}%`} />}
              <button className="button" type="submit" disabled={busy || !selectedFile}><Upload /> {busy ? `Uploading ${uploadProgress}%…` : 'Upload and publish CV'}</button>
            </form>
            {uploadStatus && <p className="admin-success" role="status"><CheckCircle2 /> {uploadStatus}</p>}
            <button className="admin-logout" type="button" onClick={signOut} disabled={busy}><LogOut /> Sign out</button>
          </div>
        )}

        {error && <p className="admin-error" role="alert">{error}</p>}
        <p className="admin-privacy-note">Keep your password private. It is sent only to the sign-in API over HTTPS and is never shown to portfolio visitors.</p>
      </section>
    </main>
  )
}

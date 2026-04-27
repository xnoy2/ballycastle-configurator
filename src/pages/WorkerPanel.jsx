import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import './WorkerPanel.css'

// ─── Top-level shell ───────────────────────────────────────────────────────
export default function WorkerPanel() {
  const [session,  setSession]  = useState(null)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setChecking(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s)
      setChecking(false)
    })
    return () => subscription.unsubscribe()
  }, [])

  if (checking) return <div className="wp-loading"><div className="wp-spinner" /><p>Loading…</p></div>
  if (!session)  return <WorkerLogin />
  return <WorkerDashboard session={session} />
}

// ─── Login ─────────────────────────────────────────────────────────────────
function WorkerLogin() {
  const [email, setEmail] = useState('')
  const [sent,  setSent]  = useState(false)
  const [error, setError] = useState('')
  const [busy,  setBusy]  = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!email.trim() || !email.includes('@')) { setError('Please enter a valid email.'); return }
    setBusy(true)
    setError('')
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.href },
    })
    if (error) { setError(error.message); setBusy(false); return }
    setSent(true)
    setBusy(false)
  }

  return (
    <div className="wp-login-wrap">
      <div className="wp-login-card">
        <img src="/images/bcf.png" alt="BCF" className="wp-login-logo" />
        <h1>Worker Panel</h1>
        <p className="wp-login-sub">Ballycastle Climbing Frames</p>

        {sent ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: 44, marginBottom: 12 }}>📧</div>
            <p style={{ fontWeight: 700, color: '#1a2e44', marginBottom: 8 }}>Check Your Email!</p>
            <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6 }}>
              Login link sent to <strong>{email}</strong>.<br />
              Click the link to access the worker panel.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <label>Email
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required autoFocus placeholder="your@email.com" />
            </label>
            {error && <p className="wp-error">{error}</p>}
            <button type="submit" className="wp-btn-primary" disabled={busy}>
              {busy ? 'Sending…' : '✉️ Send Login Link'}
            </button>
            <p style={{ fontSize: 12, color: '#94a3b8', textAlign: 'center', marginTop: 8 }}>No password needed — we'll email you a secure link.</p>
          </form>
        )}
      </div>
    </div>
  )
}

// ─── Main Dashboard ────────────────────────────────────────────────────────
function WorkerDashboard({ session }) {
  const [profile,      setProfile]      = useState(null)
  const [jobs,         setJobs]         = useState([])
  const [selectedJob,  setSelectedJob]  = useState(null)
  const [stages,       setStages]       = useState([])
  const [photos,       setPhotos]       = useState([])
  const [loading,      setLoading]      = useState(true)
  const [saving,       setSaving]       = useState(null)
  const [flash,        setFlash]        = useState('')
  const [uploading,    setUploading]    = useState(false)
  const fileRef = useRef(null)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)

    // Get worker profile
    const { data: profileData } = await supabase
      .from('worker_profiles')
      .select('*')
      .eq('id', session.user.id)
      .single()
    setProfile(profileData)

    // Get assigned jobs
    const { data: jobsData } = await supabase
      .from('orders')
      .select('*, client:client_profiles(name, email, phone)')
      .eq('worker_id', session.user.id)
      .order('created_at', { ascending: false })
    setJobs(jobsData || [])

    // Auto-select first job
    if (jobsData?.length > 0) {
      await selectJob(jobsData[0])
    }

    setLoading(false)
  }

  async function selectJob(job) {
    setSelectedJob(job)

    const [{ data: stagesData }, { data: photosData }] = await Promise.all([
      supabase.from('build_stages').select('*').eq('order_id', job.id).order('stage_number'),
      supabase.from('order_photos').select('*').eq('order_id', job.id).order('created_at', { ascending: false }),
    ])

    setStages(stagesData || [])
    setPhotos(photosData || [])
  }

  async function updateStage(stage, newStatus) {
    setSaving(stage.id)
    const update = {
      status:       newStatus,
      updated_by:   session.user.id,
      completed_at: newStatus === 'done' ? new Date().toISOString() : null,
    }
    const { error } = await supabase
      .from('build_stages')
      .update(update)
      .eq('id', stage.id)

    if (!error) {
      setStages(prev => prev.map(s => s.id === stage.id ? { ...s, ...update } : s))
      showFlash('Stage updated!')
    }
    setSaving(null)
  }

  async function uploadPhoto(e) {
    const files = Array.from(e.target.files)
    if (!files.length || !selectedJob) return
    setUploading(true)

    for (const file of files) {
      const ext  = file.name.split('.').pop()
      const path = `${selectedJob.id}/${Date.now()}.${ext}`

      const { error: upErr } = await supabase.storage
        .from('order-photos')
        .upload(path, file, { contentType: file.type })

      if (!upErr) {
        await supabase.from('order_photos').insert({
          order_id:     selectedJob.id,
          storage_path: path,
          uploaded_by:  session.user.id,
        })
      }
    }

    // Refresh photos
    const { data: photosData } = await supabase
      .from('order_photos')
      .select('*')
      .eq('order_id', selectedJob.id)
      .order('created_at', { ascending: false })
    setPhotos(photosData || [])
    setUploading(false)
    showFlash('Photo uploaded!')
  }

  function showFlash(msg) {
    setFlash(msg)
    setTimeout(() => setFlash(''), 2500)
  }

  const doneCount   = stages.filter(s => s.status === 'done').length
  const progressPct = stages.length > 0 ? Math.round((doneCount / stages.length) * 100) : 0

  if (loading) return <div className="wp-loading"><div className="wp-spinner" /><p>Loading your jobs…</p></div>

  return (
    <div className="wp-shell">

      {/* ── Sidebar ──────────────────────────────────────────────── */}
      <aside className="wp-sidebar">
        <div className="wp-sidebar-header">
          <img src="/images/bcf.png" alt="BCF" className="wp-sidebar-logo" />
          <div>
            <div className="wp-sidebar-title">Worker Panel</div>
            <div className="wp-sidebar-name">👷 {profile?.name || session.user.email}</div>
          </div>
        </div>

        <div className="wp-sidebar-section">My Jobs ({jobs.length})</div>

        {jobs.length === 0 ? (
          <div className="wp-no-jobs">No jobs assigned yet.</div>
        ) : (
          jobs.map(job => (
            <button
              key={job.id}
              className={`wp-job-btn${selectedJob?.id === job.id ? ' active' : ''}`}
              onClick={() => selectJob(job)}
            >
              <div className="wp-job-btn-name">{job.client?.name || '—'}</div>
              <div className="wp-job-btn-order">#{job.order_number}</div>
              <div className={`wp-job-btn-status ${getOverallStatus(stages, job)}`}>
                {getOverallStatus(stages, job) === 'done' ? '✅ Complete' :
                 getOverallStatus(stages, job) === 'active' ? '🔄 In Progress' : '⏳ Pending'}
              </div>
            </button>
          ))
        )}

        <button className="wp-signout" onClick={() => supabase.auth.signOut()}>Sign Out</button>
      </aside>

      {/* ── Main Content ─────────────────────────────────────────── */}
      <main className="wp-main">

        {flash && <div className="wp-flash">{flash}</div>}

        {!selectedJob ? (
          <div className="wp-empty">
            <div style={{ fontSize: 48 }}>🔨</div>
            <h2>Select a job from the sidebar</h2>
          </div>
        ) : (
          <>
            {/* Job Header */}
            <div className="wp-job-header">
              <div>
                <h1 className="wp-job-title">{selectedJob.client?.name || '—'}</h1>
                <div className="wp-job-meta">
                  <span>📋 {selectedJob.order_number}</span>
                  {selectedJob.address && <span>📍 {selectedJob.address}</span>}
                  {selectedJob.installation_date && (
                    <span>📅 {new Date(selectedJob.installation_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                  )}
                </div>
              </div>
              <div className="wp-progress-badge">
                <div className="wp-progress-pct">{progressPct}%</div>
                <div className="wp-progress-label">Complete</div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="wp-progress-bar">
              <div className="wp-progress-fill" style={{ width: `${progressPct}%` }} />
            </div>

            <div className="wp-grid">

              {/* ── Build Stages ──────────────────────────────────── */}
              <div className="wp-card">
                <div className="wp-card-title">🏗️ Build Stages</div>
                <div className="wp-stages">
                  {stages.map(stage => (
                    <div key={stage.id} className={`wp-stage wp-stage--${stage.status}`}>
                      <div className="wp-stage-icon">
                        {stage.status === 'done'        ? '✅' :
                         stage.status === 'in_progress' ? '🔄' : '⏳'}
                      </div>
                      <div className="wp-stage-info">
                        <div className="wp-stage-label">{stage.label}</div>
                        {stage.completed_at && (
                          <div className="wp-stage-date">
                            Completed {new Date(stage.completed_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                          </div>
                        )}
                      </div>
                      <div className="wp-stage-actions">
                        {stage.status !== 'done' && (
                          <button
                            className="wp-btn-done"
                            disabled={saving === stage.id}
                            onClick={() => updateStage(stage, 'done')}
                          >
                            {saving === stage.id ? '…' : '✓ Mark Done'}
                          </button>
                        )}
                        {stage.status !== 'in_progress' && stage.status !== 'done' && (
                          <button
                            className="wp-btn-progress"
                            disabled={saving === stage.id}
                            onClick={() => updateStage(stage, 'in_progress')}
                          >
                            Start
                          </button>
                        )}
                        {stage.status === 'done' && (
                          <button
                            className="wp-btn-undo"
                            disabled={saving === stage.id}
                            onClick={() => updateStage(stage, 'pending')}
                          >
                            Undo
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Right Column ──────────────────────────────────── */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                {/* Client Info */}
                <div className="wp-card">
                  <div className="wp-card-title">👤 Client Details</div>
                  <div className="wp-detail-row">
                    <span>Name</span>
                    <strong>{selectedJob.client?.name || '—'}</strong>
                  </div>
                  <div className="wp-detail-row">
                    <span>Email</span>
                    <strong>{selectedJob.client?.email || '—'}</strong>
                  </div>
                  <div className="wp-detail-row">
                    <span>Phone</span>
                    <strong>{selectedJob.client?.phone || '—'}</strong>
                  </div>
                  <div className="wp-detail-row">
                    <span>Address</span>
                    <strong>{selectedJob.address || '—'}</strong>
                  </div>
                  {selectedJob.access_notes && (
                    <div className="wp-access-notes">
                      <strong>📝 Access Notes:</strong> {selectedJob.access_notes}
                    </div>
                  )}
                </div>

                {/* Photos */}
                <div className="wp-card">
                  <div className="wp-card-title">📸 Site Photos</div>
                  <input
                    ref={fileRef}
                    type="file"
                    multiple
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={uploadPhoto}
                  />
                  <button
                    className="wp-btn-primary wp-upload-btn"
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                  >
                    {uploading ? '⏳ Uploading…' : '📷 Upload Photos'}
                  </button>
                  {photos.length === 0 ? (
                    <p className="wp-no-photos">No photos yet — upload the first one!</p>
                  ) : (
                    <div className="wp-photos-grid">
                      {photos.map(p => (
                        <PhotoThumb key={p.id} photo={p} />
                      ))}
                    </div>
                  )}
                </div>

              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}

// ─── Photo Thumbnail ────────────────────────────────────────────────────────
function PhotoThumb({ photo }) {
  const [url, setUrl] = useState(null)

  useEffect(() => {
    supabase.storage
      .from('order-photos')
      .createSignedUrl(photo.storage_path, 3600)
      .then(({ data }) => setUrl(data?.signedUrl))
  }, [photo.storage_path])

  if (!url) return <div className="wp-photo-thumb wp-photo-loading" />

  return (
    <a href={url} target="_blank" rel="noreferrer">
      <img src={url} alt="Site photo" className="wp-photo-thumb" />
    </a>
  )
}

// ─── Helper ─────────────────────────────────────────────────────────────────
function getOverallStatus(stages, job) {
  if (!stages.length) return 'pending'
  if (stages.every(s => s.status === 'done')) return 'done'
  if (stages.some(s => s.status === 'in_progress' || s.status === 'done')) return 'active'
  return 'pending'
}

import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import LoadingScreen from '../components/LoadingScreen'
import './WorkerPanel.css'


function playPop() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const osc  = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = 'sine'
    osc.frequency.setValueAtTime(660, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.07)
    gain.gain.setValueAtTime(0.12, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.12)
    osc.onended = () => ctx.close()
  } catch {}
}

// ─── Top-level shell ───────────────────────────────────────────────────────
export default function WorkerPanel() {
  const navigate               = useNavigate()
  const [session,   setSession]   = useState(null)
  const [checking,  setChecking]  = useState(true)
  const [resetMode, setResetMode] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setChecking(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, s) => {
      if (event === 'PASSWORD_RECOVERY') {
        setSession(s)
        setResetMode(true)
        setChecking(false)
      } else {
        setSession(s)
        setChecking(false)
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!checking && !session && !resetMode) navigate('/login', { replace: true })
  }, [checking, session, resetMode, navigate])

  if (checking)  return <LoadingScreen subtitle="Loading worker panel…" />
  if (resetMode) return <WorkerSetPassword onDone={() => setResetMode(false)} />
  if (!session)  return null
  return <WorkerDashboard session={session} />
}

// ─── Set / Reset Password (first login or forgot password) ─────────────────
function WorkerSetPassword({ onDone }) {
  const [password,  setPassword]  = useState('')
  const [confirm,   setConfirm]   = useState('')
  const [error,     setError]     = useState('')
  const [busy,      setBusy]      = useState(false)
  const [done,      setDone]      = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (password.length < 8)        { setError('Password must be at least 8 characters.'); return }
    if (password !== confirm)        { setError('Passwords do not match.'); return }
    setBusy(true); setError('')
    const { error } = await supabase.auth.updateUser({ password })
    setBusy(false)
    if (error) { setError(error.message); return }
    setDone(true)
    // onAuthStateChange will fire SIGNED_IN and set session automatically
    setTimeout(onDone, 1500)
  }

  return (
    <div className="wp-login-wrap">
      <div className="wp-login-card">
        <img src="/images/bcf.png" alt="BCF" className="wp-login-logo" />
        <h1>Set Your Password</h1>
        <p className="wp-login-sub">Ballycastle Climbing Frames — Worker Panel</p>
        {done ? (
          <div style={{ textAlign: 'center', padding: '20px 0', color: '#1E3070' }}>
            <div style={{ fontSize: 44 }}>✅</div>
            <p style={{ fontWeight: 700, marginTop: 12 }}>Password set! Logging you in…</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <label>New Password
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required autoFocus placeholder="Min. 8 characters" />
            </label>
            <label>Confirm Password
              <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required placeholder="Repeat password" />
            </label>
            {error && <p className="wp-error">{error}</p>}
            <button type="submit" className="wp-btn-primary" disabled={busy}>
              {busy ? 'Saving…' : '🔒 Set Password & Log In'}
            </button>
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
  const [galleryOpen,  setGalleryOpen]  = useState(false)
  const [profileOpen,  setProfileOpen]  = useState(false)
  const [notifs,       setNotifs]       = useState([])
  const [notifOpen,    setNotifOpen]    = useState(false)
  const [mobileBotTab, setMobileBotTab] = useState(() => window.innerWidth <= 700 ? 'jobs' : 'detail')
  const realtimeRef    = useRef(null)
  const avatarInputRef = useRef(null)

  useEffect(() => { loadData() }, [])

  // Real-time: new worker notifications
  useEffect(() => {
    const channel = supabase
      .channel(`worker-notif:${session.user.id}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'worker_notifications',
        filter: `worker_id=eq.${session.user.id}`,
      }, ({ new: notif }) => {
        setNotifs(ns => [notif, ...ns])
      })
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [session.user.id])

  // Real-time subscription — listens for order/stage changes
  useEffect(() => {
    if (!selectedJob?.id) return

    // Clean up previous subscription
    if (realtimeRef.current) supabase.removeChannel(realtimeRef.current)

    const channel = supabase
      .channel(`order-${selectedJob.id}`)
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'orders',
        filter: `id=eq.${selectedJob.id}`,
      }, payload => {
        setSelectedJob(prev => {
          if (payload.new.access_notes && payload.new.access_notes !== prev.access_notes) {
            showFlash('📝 Client updated access notes!')
          }
          return { ...prev, ...payload.new }
        })
      })
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'build_stages',
        filter: `order_id=eq.${selectedJob.id}`,
      }, payload => {
        setStages(prev => prev.map(s => s.id === payload.new.id ? { ...s, ...payload.new } : s))
      })
      .subscribe()

    realtimeRef.current = channel
    return () => supabase.removeChannel(channel)
  }, [selectedJob?.id])

  async function loadData() {
    setLoading(true)

    const [{ data: profileData }, { data: jobsData }, { data: notifData }] = await Promise.all([
      supabase.from('worker_profiles').select('*').eq('id', session.user.id).maybeSingle(),
      supabase.from('orders').select('*, client:client_profiles(name, email, phone)').eq('worker_id', session.user.id).order('created_at', { ascending: false }),
      supabase.from('worker_notifications').select('*').eq('worker_id', session.user.id).order('created_at', { ascending: false }).limit(40),
    ])
    setProfile(profileData)
    setJobs(jobsData || [])
    setNotifs(notifData || [])

    if (jobsData?.length > 0) {
      await selectJob(jobsData[0], true)
    }

    setLoading(false)
  }

  async function selectJob(job, fromInit = false) {
    setSelectedJob(job)
    if (!fromInit) setMobileBotTab('detail')

    const [{ data: stagesData }, { data: photosData }] = await Promise.all([
      supabase.from('build_stages').select('*').eq('order_id', job.id).order('stage_number'),
      supabase.from('order_photos')
        .select('*, stage:build_stages(id, label, stage_number), task:stage_tasks(id, label)')
        .eq('order_id', job.id)
        .order('created_at'),
    ])

    setStages(stagesData || [])
    setPhotos(photosData || [])
  }

  async function refreshPhotos(orderId) {
    const { data } = await supabase
      .from('order_photos')
      .select('*, stage:build_stages(id, label, stage_number), task:stage_tasks(id, label)')
      .eq('order_id', orderId)
      .order('created_at')
    setPhotos(data || [])
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
    if (error) { setSaving(null); return }

    setStages(prev => prev.map(s => s.id === stage.id ? { ...s, ...update } : s))
    showFlash('Stage updated!')
    setSaving(null)
  }

  function showFlash(msg) {
    setFlash(msg)
    setTimeout(() => setFlash(''), 2500)
  }

  async function markNotifRead(notifId) {
    await supabase.from('worker_notifications').update({ read: true }).eq('id', notifId)
    setNotifs(ns => ns.map(n => n.id === notifId ? { ...n, read: true } : n))
  }

  async function markAllNotifsRead() {
    const ids = notifs.filter(n => !n.read).map(n => n.id)
    if (!ids.length) return
    await supabase.from('worker_notifications').update({ read: true }).in('id', ids)
    setNotifs(ns => ns.map(n => ({ ...n, read: true })))
  }

  function formatNotifTime(ts) {
    const d = new Date(ts)
    const now = new Date()
    const diffM = Math.floor((now - d) / 60000)
    if (diffM < 1) return 'Just now'
    if (diffM < 60) return `${diffM}m ago`
    if (diffM < 1440) return `${Math.floor(diffM / 60)}h ago`
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
  }

  async function uploadAvatar(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const ext  = file.name.split('.').pop().toLowerCase()
    const path = `${session.user.id}/avatar.${ext}`
    const { error: storageError } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
    if (storageError) { showFlash('❌ Upload failed'); return }
    const publicUrl = supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl
    const avatarUrl = `${publicUrl}?t=${Date.now()}`
    const { error: dbError } = await supabase
      .from('worker_profiles')
      .update({ avatar_url: avatarUrl })
      .eq('id', session.user.id)
    if (dbError) { showFlash('❌ Failed to save avatar'); return }
    setProfile(p => ({ ...p, avatar_url: avatarUrl }))
    showFlash('✅ Avatar updated!')
  }

  const doneCount   = stages.filter(s => s.status === 'done').length
  const progressPct = stages.length > 0 ? Math.round((doneCount / stages.length) * 100) : 0
  const unreadCount = notifs.filter(n => !n.read).length

  if (loading) return <div className="wp-loading"><div className="wp-spinner" /><p>Loading your jobs…</p></div>

  return (
    <div className="wp-shell" onClick={() => notifOpen && setNotifOpen(false)}>

      {/* ── Sidebar ──────────────────────────────────────────────── */}
      <aside className="wp-sidebar">

        {/* Logo bar */}
        <div className="wp-sidebar-header">
          <img src="/images/bcf.png" alt="BCF" className="wp-sidebar-logo" />
          <div className="wp-sidebar-title">Worker Panel</div>
        </div>

        {/* Worker profile card — click to edit */}
        <div className="wp-profile-card-mini" onClick={() => { setProfileOpen(true); setMobileBotTab('detail') }} title="Edit Profile">
          <div className="wp-profile-avatar-mini">
            {profile?.avatar_url
              ? <img src={profile.avatar_url} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <span>{(profile?.name || session.user.email || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}</span>}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="wp-profile-card-name">{profile?.name || 'Worker'}</div>
            <div className="wp-profile-card-role">👷 BCF Worker · Edit Profile</div>
          </div>
          <span style={{ color: 'rgba(249,200,0,0.5)', fontSize: 14, flexShrink: 0 }}>›</span>
        </div>

        <div className="wp-sidebar-section">My Jobs ({jobs.length})</div>

        <div className="wp-jobs-row">
          {jobs.length === 0 ? (
            <div className="wp-no-jobs">No jobs assigned yet.</div>
          ) : (
            jobs.map(job => (
              <button
                key={job.id}
                className={`wp-job-btn${selectedJob?.id === job.id ? ' active' : ''}`}
                onClick={() => { playPop(); selectJob(job) }}
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
        </div>

        <button className="wp-signout" onClick={() => supabase.auth.signOut()}>🚪 Sign Out</button>
      </aside>

      {/* ── Main Content ─────────────────────────────────────────── */}
      <main className="wp-main">

        {/* Topbar — logo (mobile) + notification bell */}
        <div className="wp-topbar">
          <img src="/images/bcf.png" alt="BCF" className="wp-topbar-logo" />
          <div style={{ flex: 1 }} />
          <div className="wp-notif-wrap" onClick={e => e.stopPropagation()}>
            <button className="wp-notif-btn" onClick={() => setNotifOpen(o => !o)} title="Notifications">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
              {unreadCount > 0 && (
                <span className="wp-notif-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
              )}
            </button>
          </div>
        </div>

        {flash && <div className="wp-flash">{flash}</div>}

        <div className="wp-main-content">

        {/* ── Mobile: Jobs list (shown when mobileBotTab === 'jobs') ── */}
        {mobileBotTab === 'jobs' && (
          <div className="wp-mobile-jobs-view">
            <div className="wp-mobile-profile-row" onClick={() => { setProfileOpen(true); setMobileBotTab('detail') }}>
              <div className="wp-profile-avatar-mini">
                {profile?.avatar_url
                  ? <img src={profile.avatar_url} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <span>{(profile?.name || session.user.email || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}</span>}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 800, fontSize: 14, color: '#1e293b' }}>{profile?.name || 'Worker'}</div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 1 }}>👷 Tap to edit profile</div>
              </div>
              <span style={{ color: '#cbd5e1', fontSize: 18, flexShrink: 0 }}>›</span>
            </div>

            <div className="wp-mobile-jobs-label">My Jobs ({jobs.length})</div>

            {jobs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 0', color: '#94a3b8' }}>
                <div style={{ fontSize: 44, marginBottom: 10 }}>🔨</div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>No jobs assigned yet</div>
              </div>
            ) : (
              jobs.map(job => {
                const st = getOverallStatus(stages, job)
                return (
                  <button key={job.id} className="wp-mobile-job-card" onClick={() => { playPop(); selectJob(job) }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 800, fontSize: 15, color: '#1e293b', marginBottom: 2 }}>{job.client?.name || '—'}</div>
                        <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>#{job.order_number}</div>
                        {job.address && <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 2 }}>📍 {job.address}</div>}
                        {job.installation_date && <div style={{ fontSize: 12, color: '#94a3b8' }}>📅 {new Date(job.installation_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</div>}
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <span className={`wp-job-btn-status ${st}`}>{st === 'done' ? '✅ Complete' : st === 'active' ? '🔄 In Progress' : '⏳ Pending'}</span>
                        {job.is_birthday_booking && <div style={{ fontSize: 11, color: '#d97706', fontWeight: 700, marginTop: 5 }}>🎂 Birthday</div>}
                      </div>
                    </div>
                  </button>
                )
              })
            )}
          </div>
        )}

        {/* ── Profile Panel ─────────────────────────────────────── */}
        {mobileBotTab !== 'jobs' && profileOpen && (
          <WorkerProfilePanel
            session={session}
            profile={profile}
            setProfile={setProfile}
            avatarInputRef={avatarInputRef}
            uploadAvatar={uploadAvatar}
            onClose={() => { setProfileOpen(false); setMobileBotTab('detail') }}
            showFlash={showFlash}
          />
        )}

        {mobileBotTab !== 'jobs' && !profileOpen && !selectedJob && (
          <div className="wp-empty">
            <div style={{ fontSize: 48 }}>🔨</div>
            <h2>Select a job from the sidebar</h2>
          </div>
        )}

        {mobileBotTab !== 'jobs' && !profileOpen && selectedJob && (
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
                  {stages.map((stage, idx) => {
                    const anyLaterDone = stages.slice(idx + 1).some(s => s.status === 'done')
                    const prevDone     = idx === 0 || stages[idx - 1].status === 'done'
                    return (
                      <WorkerStageRow
                        key={stage.id}
                        stage={stage}
                        prevDone={prevDone}
                        canUndo={!anyLaterDone}
                        saving={saving}
                        session={session}
                        selectedJob={selectedJob}
                        onUpdate={(s, status) => updateStage(s, status)}
                        onStageUpdated={updatedStage => setStages(prev => prev.map(s => s.id === updatedStage.id ? updatedStage : s))}
                        onPhotosUploaded={() => refreshPhotos(selectedJob.id)}
                        showFlash={showFlash}
                      />
                    )
                  })}
                </div>
              </div>

              {/* ── Right Column ──────────────────────────────────── */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                {/* Client Info */}
                <div className="wp-card">
                  {/* Birthday booking alert */}
                  {selectedJob.is_birthday_booking && (
                    <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 10, padding: '12px 14px', background: '#FFFDE7', border: '2px solid #F9C800', borderRadius: 10, marginBottom: 14 }}>
                      <span style={{ fontSize: 26, flexShrink: 0 }}>🎂</span>
                      <div style={{ flex: '1 1 140px', minWidth: 0 }}>
                        <div style={{ fontWeight: 800, fontSize: 14, color: '#7a5800' }}>Birthday Booking</div>
                        <div style={{ fontSize: 12, color: '#a16207', marginTop: 2 }}>Remember to bring freebies for this installation!</div>
                      </div>
                    </div>
                  )}
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
                  {selectedJob.product_order && (
                    <div className="wp-detail-row">
                      <span>Product</span>
                      <strong>{selectedJob.product_order}</strong>
                    </div>
                  )}
                  {selectedJob.notes && (
                    <div style={{ marginTop: 10, padding: '10px 12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 5 }}>📌 Notes</div>
                      <div style={{ fontSize: 13, color: '#334155', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{selectedJob.notes}</div>
                    </div>
                  )}
                  {selectedJob.access_notes && (
                    <div className="wp-access-notes">
                      <strong>📝 Access Notes:</strong> {selectedJob.access_notes}
                    </div>
                  )}
                </div>

                {/* Photos & Files */}
                <div className="wp-card">
                  <div className="wp-card-title">📸 Build Photos & Files</div>
                  <button
                    className="wp-btn-primary wp-upload-btn"
                    onClick={() => setGalleryOpen(true)}
                  >
                    📂 View All by Stage & Task
                  </button>
                  {(() => {
                    // Only show photos that are properly linked:
                    // - site photos (no stage_id) OR
                    // - task photos where the task still exists (p.task join is not null)
                    const validPhotos = photos.filter(p => !p.stage_id || p.task)
                    const previewPhotos = validPhotos.slice(0, 6)
                    return validPhotos.length === 0 ? (
                      <p className="wp-no-photos">No photos yet — complete a task to add files.</p>
                    ) : (
                      <>
                        <div className="wp-photos-grid">
                          {previewPhotos.map(p => (
                            <PhotoThumb key={p.id} photo={p} />
                          ))}
                        </div>
                        {validPhotos.length > 6 && (
                          <button onClick={() => setGalleryOpen(true)} style={{ marginTop: 8, width: '100%', padding: '7px', background: 'none', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 12, color: '#64748b', cursor: 'pointer', fontWeight: 600 }}>
                            +{validPhotos.length - 6} more — View All
                          </button>
                        )}
                      </>
                    )
                  })()}
                </div>

              </div>
            </div>
          </>
        )}

        </div>{/* end wp-main-content */}

        {/* ── Notification Dropdown ────────────────────────────────── */}
        {notifOpen && <NotifDropdown notifs={notifs} unreadCount={unreadCount} markNotifRead={markNotifRead} markAllNotifsRead={markAllNotifsRead} formatNotifTime={formatNotifTime} />}

        {/* ── Gallery Modal ────────────────────────────────────────── */}
        {galleryOpen && selectedJob && (
          <GalleryModal photos={photos} job={selectedJob} onClose={() => setGalleryOpen(false)} />
        )}

      </main>

      {/* ── Bottom Nav (mobile only) ─────────────────────────────── */}
      <nav className="wp-bottom-nav">
        <button
          className={`wp-bottom-tab${mobileBotTab === 'jobs' && !notifOpen ? ' active' : ''}`}
          onClick={() => { setMobileBotTab('jobs'); setProfileOpen(false); setNotifOpen(false) }}
        >
          <span>🏠</span>
          <span>Jobs</span>
        </button>
        <button
          className={`wp-bottom-tab${notifOpen ? ' active' : ''}`}
          onClick={e => { e.stopPropagation(); setNotifOpen(o => !o) }}
        >
          <span style={{ position: 'relative', display: 'inline-flex', lineHeight: 1 }}>
            🔔
            {unreadCount > 0 && (
              <span className="wp-bottom-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
            )}
          </span>
          <span>Alerts</span>
        </button>
        <button
          className={`wp-bottom-tab${mobileBotTab !== 'jobs' && profileOpen && !notifOpen ? ' active' : ''}`}
          onClick={() => { setMobileBotTab('detail'); setProfileOpen(true); setNotifOpen(false) }}
        >
          <div className="wp-bottom-avatar">
            {profile?.avatar_url
              ? <img src={profile.avatar_url} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <span style={{ fontSize: 10, fontWeight: 800 }}>
                  {(profile?.name || session.user.email || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                </span>}
          </div>
          <span>Profile</span>
        </button>
        <button className="wp-bottom-tab" onClick={() => supabase.auth.signOut()}>
          <span>🚪</span>
          <span>Sign Out</span>
        </button>
      </nav>
    </div>
  )
}

// ─── Notification Dropdown ──────────────────────────────────────────────────
function NotifDropdown({ notifs, unreadCount, markNotifRead, markAllNotifsRead, formatNotifTime }) {
  return (
    <div className="wp-notif-dropdown" onClick={e => e.stopPropagation()}>
      <div className="wp-notif-dhead">
        <span>🔔 Notifications{unreadCount > 0 ? ` (${unreadCount})` : ''}</span>
        {unreadCount > 0 && (
          <button className="wp-notif-readall" onClick={markAllNotifsRead}>Mark all read</button>
        )}
      </div>
      {notifs.length === 0 ? (
        <div className="wp-notif-empty">No notifications yet.</div>
      ) : (
        <div className="wp-notif-list">
          {notifs.map(n => (
            <div
              key={n.id}
              className={`wp-notif-item${!n.read ? ' unread' : ''}`}
              onClick={() => { if (!n.read) markNotifRead(n.id) }}
            >
              <div className="wp-notif-title">{n.title}</div>
              {n.body && <div className="wp-notif-body">{n.body}</div>}
              <div className="wp-notif-time">{formatNotifTime(n.created_at)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Worker Profile Panel ───────────────────────────────────────────────────
function WorkerProfilePanel({ session, profile, setProfile, avatarInputRef, uploadAvatar, onClose, showFlash }) {
  const [name,       setName]       = useState(profile?.name || '')
  const [nameBusy,   setNameBusy]   = useState(false)
  const [newPwd,     setNewPwd]     = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')
  const [pwdErr,     setPwdErr]     = useState('')
  const [pwdBusy,    setPwdBusy]    = useState(false)
  const [pwdDone,    setPwdDone]    = useState(false)

  const initials = (profile?.name || session.user.email || '?')
    .split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  async function saveName(e) {
    e.preventDefault()
    if (!name.trim()) return
    setNameBusy(true)
    const { error } = await supabase
      .from('worker_profiles')
      .update({ name: name.trim() })
      .eq('id', session.user.id)
    setNameBusy(false)
    if (error) { showFlash('❌ Failed to save name'); return }
    setProfile(p => ({ ...p, name: name.trim() }))
    showFlash('✅ Name updated!')
  }

  async function changePassword(e) {
    e.preventDefault()
    setPwdErr('')
    if (newPwd.length < 8)      { setPwdErr('Password must be at least 8 characters.'); return }
    if (newPwd !== confirmPwd)  { setPwdErr('Passwords do not match.'); return }
    setPwdBusy(true)
    const { error } = await supabase.auth.updateUser({ password: newPwd })
    setPwdBusy(false)
    if (error) { setPwdErr(error.message); return }
    setNewPwd(''); setConfirmPwd('')
    setPwdDone(true)
    showFlash('✅ Password changed!')
    setTimeout(() => setPwdDone(false), 3000)
  }

  return (
    <div className="wp-profile-wrap">
      {/* Header */}
      <div className="wp-profile-header">
        <h2 className="wp-profile-title">👤 My Profile</h2>
        <button className="wp-profile-close" onClick={onClose}>✕ Back to Jobs</button>
      </div>

      <div className="wp-profile-body">

        {/* ── Avatar ── */}
        <div className="wp-profile-card">
          <div className="wp-profile-section-title">Profile Photo</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
            <div
              className="wp-avatar-ring"
              onClick={() => avatarInputRef.current?.click()}
              title="Click to change photo"
            >
              {profile?.avatar_url
                ? <img src={profile.avatar_url} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <span style={{ fontSize: 36, lineHeight: 1 }}>{initials}</span>}
              <div className="wp-avatar-overlay">📷</div>
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: '#1e293b', marginBottom: 4 }}>
                {profile?.name || 'Worker'}
              </div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 12 }}>{session.user.email}</div>
              <button className="wp-btn-primary" style={{ fontSize: 13, padding: '8px 18px' }} onClick={() => avatarInputRef.current?.click()}>
                📷 Change Photo
              </button>
            </div>
          </div>
          <input ref={avatarInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={uploadAvatar} />
        </div>

        {/* ── Name + Password (side by side on desktop) ── */}
        <div className="wp-profile-row">

          {/* ── Name ── */}
          <div className="wp-profile-card">
            <div className="wp-profile-section-title">Display Name</div>
            <form onSubmit={saveName} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>Full Name</label>
                <input
                  className="wp-profile-input"
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Your full name"
                  required
                />
              </div>
              <button type="submit" className="wp-btn-primary" style={{ fontSize: 13, padding: '9px 20px', alignSelf: 'flex-start' }} disabled={nameBusy || !name.trim()}>
                {nameBusy ? 'Saving…' : '💾 Save Name'}
              </button>
            </form>
          </div>

          {/* ── Change Password ── */}
          <div className="wp-profile-card">
            <div className="wp-profile-section-title">Change Password</div>
            {pwdDone ? (
              <div style={{ textAlign: 'center', padding: '20px 0', color: '#16a34a' }}>
                <div style={{ fontSize: 36 }}>✅</div>
                <div style={{ fontWeight: 700, marginTop: 8 }}>Password changed successfully!</div>
              </div>
            ) : (
              <form onSubmit={changePassword} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>New Password</label>
                  <input
                    className="wp-profile-input"
                    type="password"
                    value={newPwd}
                    onChange={e => setNewPwd(e.target.value)}
                    placeholder="Min. 8 characters"
                    autoComplete="new-password"
                  />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>Confirm New Password</label>
                  <input
                    className="wp-profile-input"
                    type="password"
                    value={confirmPwd}
                    onChange={e => setConfirmPwd(e.target.value)}
                    placeholder="Repeat new password"
                    autoComplete="new-password"
                  />
                </div>
                {pwdErr && <div style={{ fontSize: 13, color: '#dc2626', fontWeight: 600 }}>⚠️ {pwdErr}</div>}
                <button type="submit" className="wp-btn-primary" style={{ alignSelf: 'flex-start', fontSize: 13, padding: '9px 22px' }} disabled={pwdBusy || !newPwd || !confirmPwd}>
                  {pwdBusy ? 'Updating…' : '🔒 Update Password'}
                </button>
              </form>
            )}
          </div>

        </div>

      </div>
    </div>
  )
}

// ─── Gallery Modal ──────────────────────────────────────────────────────────
function GalleryModal({ photos, job, onClose }) {
  // Exclude orphaned photos (stage_id set but task was deleted — task join is null)
  const validPhotos = photos.filter(p => !p.stage_id || p.task)

  // Group valid photos by stage, then by task within each stage
  const stageMap = {}
  validPhotos.forEach(p => {
    const sKey   = p.stage_id   || '__none'
    const sLabel = p.stage?.label || 'General'
    const sNum   = p.stage?.stage_number ?? 999
    const tKey   = p.task_id    || '__none'
    const tLabel = p.task?.label || 'General Upload'

    if (!stageMap[sKey]) stageMap[sKey] = { label: sLabel, num: sNum, tasks: {} }
    if (!stageMap[sKey].tasks[tKey]) stageMap[sKey].tasks[tKey] = { label: tLabel, photos: [] }
    stageMap[sKey].tasks[tKey].photos.push(p)
  })
  const stageGroups = Object.values(stageMap).sort((a, b) => a.num - b.num)
  const totalCount  = validPhotos.length

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.75)', zIndex: 2000, display: 'flex', flexDirection: 'column' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{ background: '#fff', width: '100%', maxWidth: 800, margin: '0 auto', height: '100%', display: 'flex', flexDirection: 'column', boxShadow: '0 0 60px rgba(0,0,0,0.4)' }}>

        {/* Header */}
        <div style={{ padding: '18px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 12, background: '#1E3070', flexShrink: 0 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: 17, color: '#fff' }}>📸 Build Photos & Files</div>
            <div style={{ fontSize: 12, color: '#93c5fd', marginTop: 2 }}>
              {job.client?.name} · {totalCount} file{totalCount !== 1 ? 's' : ''} across {stageGroups.length} stage{stageGroups.length !== 1 ? 's' : ''}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', borderRadius: 8, width: 36, height: 36, fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          {totalCount === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
              <div style={{ fontWeight: 700, fontSize: 16 }}>No photos or files yet</div>
              <div style={{ fontSize: 13, marginTop: 6 }}>Complete tasks to add photos & files.</div>
            </div>
          ) : (
            stageGroups.map(sg => (
              <div key={sg.label} style={{ marginBottom: 28 }}>
                {/* Stage heading */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                  <div style={{ height: 2, flex: 1, background: '#e2e8f0' }} />
                  <span style={{ fontSize: 13, fontWeight: 800, color: '#1E3070', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>
                    🏗️ {sg.label}
                  </span>
                  <div style={{ height: 2, flex: 1, background: '#e2e8f0' }} />
                </div>

                {/* Tasks within this stage */}
                {Object.values(sg.tasks).map(tg => (
                  <div key={tg.label} style={{ marginBottom: 18 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 6, padding: '2px 8px' }}>
                        ✅ {tg.label}
                      </span>
                      <span style={{ color: '#94a3b8', fontWeight: 400 }}>{tg.photos.length} file{tg.photos.length !== 1 ? 's' : ''}</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: 10 }}>
                      {tg.photos.map(p => (
                        <div key={p.id} style={{ aspectRatio: '1', minHeight: 90 }}>
                          <PhotoThumb photo={p} />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Shared file-type helpers (used by WorkerStageRow modal + PhotoThumb) ───
const IMAGE_EXTS = new Set(['jpg','jpeg','png','gif','webp','heic','heif','bmp','svg'])

const FILE_TYPE_STYLE = {
  pdf:  { icon: '📕', bg: '#fee2e2', color: '#dc2626' },
  doc:  { icon: '📘', bg: '#dbeafe', color: '#2563eb' },
  docx: { icon: '📘', bg: '#dbeafe', color: '#2563eb' },
  xls:  { icon: '📗', bg: '#dcfce7', color: '#16a34a' },
  xlsx: { icon: '📗', bg: '#dcfce7', color: '#16a34a' },
  csv:  { icon: '📗', bg: '#dcfce7', color: '#16a34a' },
  zip:  { icon: '🗜️', bg: '#fef9c3', color: '#ca8a04' },
  mp4:  { icon: '🎬', bg: '#ede9fe', color: '#7c3aed' },
  mov:  { icon: '🎬', bg: '#ede9fe', color: '#7c3aed' },
}

// ─── Worker Stage Row ───────────────────────────────────────────────────────
function WorkerStageRow({ stage, prevDone, canUndo, saving, session, selectedJob, onUpdate, onStageUpdated, onPhotosUploaded, showFlash }) {
  const [open,       setOpen]       = useState(false)
  const [doneModal,  setDoneModal]  = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // ── Task state ──
  const [tasks,              setTasks]              = useState(null)  // null = loading
  const [pendingTasks,       setPendingTasks]       = useState([])    // [{uid, value}]
  const [taskModal,          setTaskModal]          = useState(null)  // {task, isEdit}
  const [taskNotes,          setTaskNotes]          = useState('')
  const [taskFiles,          setTaskFiles]          = useState([])    // new files to upload
  const [taskExistingPhotos, setTaskExistingPhotos] = useState([])    // [{id, storage_path, url}]
  const [taskSubmitting,     setTaskSubmitting]     = useState(false)
  const taskSavedRef  = React.useRef(new Set())
  const taskFileRef   = React.useRef(null)

  useEffect(() => { loadTasks() }, [stage.id])

  async function loadTasks() {
    const { data } = await supabase.from('stage_tasks').select('*').eq('stage_id', stage.id).order('created_at')
    setTasks(data || [])
  }

  function addPendingTask() {
    const uid = Math.random().toString(36).slice(2)
    setPendingTasks(p => [...p, { uid, value: '' }])
    if (!open) setOpen(true)
  }

  function updatePendingTask(uid, value) {
    setPendingTasks(p => p.map(t => t.uid === uid ? { ...t, value } : t))
  }

  function removePendingTask(uid) {
    setPendingTasks(p => p.filter(t => t.uid !== uid))
  }

  async function savePendingTask(uid) {
    const key = `${stage.id}-${uid}`
    if (taskSavedRef.current.has(key)) return
    taskSavedRef.current.add(key)
    const entry = pendingTasks.find(t => t.uid === uid)
    const label = entry?.value?.trim()
    removePendingTask(uid)
    if (label) {
      const { data } = await supabase.from('stage_tasks').insert({ stage_id: stage.id, label }).select().single()
      if (data) { setTasks(p => [...(p || []), data]); showFlash('Task added') }
    }
    taskSavedRef.current.delete(key)
  }

  function openCompleteTask(task) {
    setTaskModal({ task, isEdit: false })
    setTaskNotes('')
    setTaskFiles([])
    setTaskExistingPhotos([])
  }

  async function openEditTask(task) {
    setTaskModal({ task, isEdit: true })
    setTaskNotes(task.notes || '')
    setTaskFiles([])
    setTaskExistingPhotos([])

    // Load photos — check by task_id column + both path conventions (admin and worker)
    const adminPrefix  = `${selectedJob.id}/${stage.id}/task_${task.id}/`
    const workerPrefix = `${selectedJob.id}/${stage.id}/tasks/${task.id}/`
    const [{ data: byTaskId }, { data: byAdminPath }, { data: byWorkerPath }] = await Promise.all([
      supabase.from('order_photos').select('*').eq('task_id', task.id).order('created_at'),
      supabase.from('order_photos').select('*').eq('order_id', selectedJob.id).like('storage_path', `${adminPrefix}%`).order('created_at'),
      supabase.from('order_photos').select('*').eq('order_id', selectedJob.id).like('storage_path', `${workerPrefix}%`).order('created_at'),
    ])
    const seen = new Set()
    const allPhotos = [...(byTaskId || []), ...(byAdminPath || []), ...(byWorkerPath || [])].filter(p => {
      if (seen.has(p.id)) return false; seen.add(p.id); return true
    })
    if (allPhotos.length) {
      const withUrls = await Promise.all(
        allPhotos.map(async p => {
          const { data: signed } = await supabase.storage
            .from('order-photos')
            .createSignedUrl(p.storage_path, 3600)
          return { ...p, url: signed?.signedUrl || null }
        })
      )
      setTaskExistingPhotos(withUrls)
    }
  }

  async function toggleTaskUncomplete(task) {
    await supabase.from('stage_tasks').update({ completed: false, notes: null }).eq('id', task.id)
    setTasks(p => p.map(t => t.id === task.id ? { ...t, completed: false, notes: null } : t))
    showFlash('Task unchecked')
  }

  async function removeExistingTaskPhoto(photo) {
    await supabase.storage.from('order-photos').remove([photo.storage_path])
    await supabase.from('order_photos').delete().eq('id', photo.id)
    setTaskExistingPhotos(p => p.filter(ph => ph.id !== photo.id))
  }

  async function confirmTaskAction() {
    if (!taskModal) return
    setTaskSubmitting(true)
    const { task, isEdit } = taskModal
    const notesVal = taskNotes.trim()

    // Upload new files — stored under tasks/{taskId}/ so they're queryable on next edit
    for (const file of taskFiles) {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
      const path = `${selectedJob.id}/${stage.id}/tasks/${task.id}/${Date.now()}_${safeName}`
      const { error: upErr } = await supabase.storage.from('order-photos').upload(path, file, { contentType: file.type })
      if (!upErr) {
        await supabase.from('order_photos').insert({
          order_id:     selectedJob.id,
          stage_id:     stage.id,
          task_id:      task.id,
          storage_path: path,
          uploaded_by:  session.user.id,
        })
      }
    }

    await supabase.from('stage_tasks').update({ completed: true, notes: notesVal || null }).eq('id', task.id)
    setTasks(p => p.map(t => t.id === task.id ? { ...t, completed: true, notes: notesVal || null } : t))
    if (taskFiles.length > 0) onPhotosUploaded()

    setTaskModal(null)
    setTaskSubmitting(false)
    showFlash(isEdit ? 'Task updated' : '✅ Task marked complete!')
  }

  function handleToggle() {
    playPop()
    setOpen(o => !o)
  }

  const tasksDone        = (tasks || []).filter(t => t.completed).length
  const tasksTotal       = (tasks || []).length
  const allTasksDone     = tasks === null || tasksTotal === 0 || tasksDone === tasksTotal
  const hasIncompleteTasks = tasks !== null && tasksTotal > 0 && !allTasksDone
  const effectiveStatus  = stage.status === 'done' ? 'done' : hasIncompleteTasks ? 'in_progress' : stage.status
  // A stage is locked (shows as pending) whenever the previous stage isn't done yet,
  // unless this stage itself is already done (respect completed work).
  const isLocked = !prevDone && stage.status !== 'done'

  function openDoneModal() { setDoneModal(true) }

  async function confirmDone() {
    setSubmitting(true)
    const completedAt = new Date().toISOString()
    await supabase.from('build_stages').update({
      status:       'done',
      completed_at: completedAt,
      updated_by:   session.user.id,
    }).eq('id', stage.id)

    onStageUpdated({ ...stage, status: 'done', completed_at: completedAt })

    // Advance GHL opportunity to next pipeline stage (non-blocking)
    supabase.functions.invoke('advance-ghl-stage', {
      body: {
        order_id:       selectedJob.id,
        opportunity_id: selectedJob.ghl_opportunity_id || null,
        stage_number:   stage.stage_number,
      },
    }).catch(console.warn)

    setDoneModal(false)
    setSubmitting(false)
    showFlash('✅ Stage marked as done!')
  }


  return (
    <>
      {/* ── Task Action Modal ──────────────────────────────────────────── */}
      {taskModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onClick={e => { if (e.target === e.currentTarget && !taskSubmitting) setTaskModal(null) }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 28, width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <div style={{ fontWeight: 800, fontSize: 17, color: '#1e293b', marginBottom: 4 }}>
              {taskModal.isEdit ? '✏️ Edit Task' : '✅ Complete Task'}
            </div>
            <p style={{ fontSize: 13, color: '#64748b', marginBottom: 18 }}><strong>{taskModal.task.label}</strong></p>

            {/* Notes */}
            <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 6 }}>
              📋 Notes <span style={{ color: '#94a3b8', fontWeight: 400 }}>(visible to client)</span>
              {!taskModal.isEdit && <span style={{ color: '#ef4444', marginLeft: 4 }}>*</span>}
            </label>
            <textarea
              autoFocus
              value={taskNotes}
              onChange={e => setTaskNotes(e.target.value)}
              rows={3}
              style={{ width: '100%', border: `2px solid ${!taskModal.isEdit && !taskNotes.trim() ? '#fca5a5' : '#e2e8f0'}`, borderRadius: 10, padding: '10px 12px', fontFamily: 'inherit', fontSize: 14, resize: 'vertical', marginBottom: 16, outline: 'none', boxSizing: 'border-box' }}
              placeholder="Describe what was done…"
            />

            {/* Existing uploaded files (edit mode) */}
            {taskModal.isEdit && taskExistingPhotos.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 8 }}>📁 Previously uploaded files</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {taskExistingPhotos.map(photo => {
                    const pathPart = photo.storage_path?.split('/').pop() || ''
                    const origName = pathPart.replace(/^\d+_/, '') || pathPart
                    const ext      = origName.split('.').pop()?.toLowerCase() || ''
                    const isImg    = IMAGE_EXTS.has(ext)
                    const fStyle   = FILE_TYPE_STYLE[ext] || { icon: '📄', bg: '#f1f5f9', color: '#475569' }
                    return (
                      <div key={photo.id} style={{ position: 'relative', flexShrink: 0 }}>
                        {isImg ? (
                          <a href={photo.url} target="_blank" rel="noreferrer" style={{ display: 'block', width: 72, height: 72, borderRadius: 8, overflow: 'hidden', border: '2px solid #e2e8f0' }}>
                            <img src={photo.url} alt={origName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </a>
                        ) : (
                          <a href={photo.url} target="_blank" rel="noreferrer"
                            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3, width: 72, height: 72, background: fStyle.bg, borderRadius: 8, border: `1.5px solid ${fStyle.color}33`, textDecoration: 'none' }}>
                            <span style={{ fontSize: 24 }}>{fStyle.icon}</span>
                            <span style={{ fontSize: 9, fontWeight: 800, color: fStyle.color, textTransform: 'uppercase', padding: '1px 4px', background: `${fStyle.color}18`, borderRadius: 3 }}>{ext}</span>
                          </a>
                        )}
                        <button onClick={() => removeExistingTaskPhoto(photo)}
                          style={{ position: 'absolute', top: -6, right: -6, width: 18, height: 18, borderRadius: '50%', background: '#ef4444', border: '2px solid #fff', color: '#fff', fontSize: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, zIndex: 1 }}>✕</button>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Add new files */}
            <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 8 }}>
              📎 {taskModal.isEdit ? 'Add more photos & files' : 'Photos & Files'} <span style={{ color: '#94a3b8', fontWeight: 400 }}>(optional)</span>
            </label>
            <input ref={taskFileRef} type="file" multiple style={{ display: 'none' }}
              onChange={e => setTaskFiles(prev => [...prev, ...Array.from(e.target.files)])} />
            <button type="button" onClick={() => taskFileRef.current?.click()}
              style={{ border: '2px dashed #cbd5e1', borderRadius: 10, padding: '10px 16px', background: '#f8fafc', cursor: 'pointer', fontSize: 13, color: '#475569', width: '100%', marginBottom: taskFiles.length ? 10 : 20 }}>
              📎 {taskFiles.length ? `${taskFiles.length} new file${taskFiles.length > 1 ? 's' : ''} — tap to add more` : 'Tap to add photos or files'}
            </button>
            {taskFiles.length > 0 && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
                {taskFiles.map((f, i) => (
                  f.type.startsWith('image/') ? (
                    <div key={i} style={{ position: 'relative', width: 64, height: 64, borderRadius: 8, overflow: 'hidden', border: '2px solid #e2e8f0', flexShrink: 0 }}>
                      <img src={URL.createObjectURL(f)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <button onClick={() => setTaskFiles(p => p.filter((_, j) => j !== i))}
                        style={{ position: 'absolute', top: 2, right: 2, width: 16, height: 16, borderRadius: '50%', background: 'rgba(0,0,0,0.55)', border: 'none', color: '#fff', fontSize: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>✕</button>
                    </div>
                  ) : (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 8, padding: '6px 10px', fontSize: 12, color: '#475569', maxWidth: 180, flexShrink: 0 }}>
                      <span>📄</span>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{f.name}</span>
                      <button onClick={() => setTaskFiles(p => p.filter((_, j) => j !== i))}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: 12, padding: 0, flexShrink: 0 }}>✕</button>
                    </div>
                  )
                ))}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              {(() => {
                const notesRequired = !taskModal.isEdit && !taskNotes.trim()
                return (
                  <button onClick={confirmTaskAction} disabled={taskSubmitting || notesRequired}
                    title={notesRequired ? 'Please describe what was done' : ''}
                    style={{ flex: 1, padding: '12px', background: '#1E3070', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 800, fontSize: 15, cursor: notesRequired ? 'not-allowed' : 'pointer', opacity: taskSubmitting || notesRequired ? 0.5 : 1 }}>
                    {taskSubmitting ? 'Saving…' : taskModal.isEdit ? '💾 Save Changes' : '✅ Mark Complete'}
                  </button>
                )
              })()}
              <button onClick={() => setTaskModal(null)}
                style={{ padding: '12px 18px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Done Confirmation Modal ────────────────────────────────────── */}
      {doneModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onClick={e => { if (e.target === e.currentTarget && !submitting) setDoneModal(false) }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 28, width: '100%', maxWidth: 400, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <div style={{ fontWeight: 800, fontSize: 18, color: '#1e293b', marginBottom: 10 }}>✓ Mark Stage Complete</div>
            <p style={{ fontSize: 14, color: '#1e293b', marginBottom: 6 }}>
              {tasksTotal > 0
                ? <>All tasks for <strong>{stage.label}</strong> have been completed.</>
                : <>Mark <strong>{stage.label}</strong> as complete?</>
              }
            </p>
            <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 24 }}>Are you sure you want to mark this stage as complete?</p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={confirmDone}
                disabled={submitting}
                style={{ flex: 1, padding: '12px', background: '#EA580C', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 800, fontSize: 15, cursor: 'pointer', opacity: submitting ? 0.6 : 1 }}>
                {submitting ? 'Saving…' : '✓ Yes, Mark Complete'}
              </button>
              <button
                onClick={() => setDoneModal(false)}
                style={{ padding: '12px 18px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Stage Row ─────────────────────────────────────────────────── */}
      <div style={{ borderRadius: 10, border: `1.5px solid ${isLocked ? '#e2e8f0' : open ? '#FFD740' : '#e2e8f0'}`, overflow: 'hidden', transition: 'border-color 0.15s', opacity: isLocked ? 0.55 : 1 }}>
        <div className={`wp-stage wp-stage--${isLocked ? 'pending' : effectiveStatus}`} style={{ borderRadius: 0, border: 'none', cursor: isLocked ? 'default' : 'pointer' }} onClick={isLocked ? undefined : handleToggle}>
          <div className="wp-stage-icon">
            {isLocked ? '⏳' : effectiveStatus === 'done' ? '✅' : effectiveStatus === 'in_progress' ? '🔄' : '⏳'}
          </div>
          <div className="wp-stage-info">
            <div className="wp-stage-label" style={{ color: isLocked ? '#94a3b8' : undefined }}>{stage.label}</div>
            {isLocked && (
              <div className="wp-stage-date" style={{ color: '#94a3b8' }}>Complete the previous stage first</div>
            )}
            {!isLocked && stage.status === 'done' && stage.completed_at && (
              <div className="wp-stage-date">Completed {new Date(stage.completed_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</div>
            )}
            {!isLocked && stage.status !== 'done' && tasksTotal > 0 && (
              <div className="wp-stage-date" style={{ color: hasIncompleteTasks ? '#EA580C' : '#22c55e' }}>
                {hasIncompleteTasks ? `${tasksDone}/${tasksTotal} tasks done — complete all to mark stage Done` : `All ${tasksTotal} tasks done`}
              </div>
            )}
          </div>
          <div className="wp-stage-actions" onClick={e => e.stopPropagation()}>
            {!isLocked && stage.status !== 'done' && (
              <button
                onClick={addPendingTask}
                style={{ padding: '5px 10px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 7, fontSize: 12, fontWeight: 700, color: '#475569', cursor: 'pointer' }}>
                + Task{tasksTotal > 0 ? ` (${tasksDone}/${tasksTotal})` : ''}
              </button>
            )}
            {!isLocked && stage.status === 'done' && tasksTotal > 0 && (
              <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>✅ {tasksDone}/{tasksTotal}</span>
            )}
            {!isLocked && stage.status !== 'done' && (
              <button
                className="wp-btn-done"
                disabled={saving === stage.id || hasIncompleteTasks}
                title={hasIncompleteTasks ? 'Complete all tasks first' : ''}
                style={{ opacity: hasIncompleteTasks ? 0.45 : 1, cursor: hasIncompleteTasks ? 'not-allowed' : 'pointer' }}
                onClick={() => { if (!hasIncompleteTasks) openDoneModal() }}>
                {saving === stage.id ? '…' : '✓ Done'}
              </button>
            )}
            {!isLocked && stage.status !== 'in_progress' && stage.status !== 'done' && !hasIncompleteTasks && (
              <button className="wp-btn-progress" disabled={saving === stage.id} onClick={() => onUpdate(stage, 'in_progress')}>Start</button>
            )}
            {!isLocked && stage.status === 'done' && (
              <button
                className="wp-btn-undo"
                disabled={saving === stage.id || !canUndo}
                title={!canUndo ? 'Undo later stages first' : ''}
                style={{ opacity: !canUndo ? 0.4 : 1, cursor: !canUndo ? 'not-allowed' : 'pointer' }}
                onClick={() => { if (canUndo) onUpdate(stage, 'pending') }}>
                Undo
              </button>
            )}
          </div>
          {!isLocked && <span style={{ color: '#94a3b8', fontSize: 12, marginLeft: 4 }}>{open ? '▲' : '▼'}</span>}
        </div>

        {/* Expanded: tasks + notes + photos */}
        {open && !isLocked && (
          <div style={{ padding: '14px 16px', borderTop: '1px solid #FFFDE7', background: '#fafffe', display: 'flex', flexDirection: 'column', gap: 12 }}>

            {/* Tasks section */}
            {(tasks === null || (tasks && tasks.length > 0) || pendingTasks.length > 0) && (
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 8 }}>
                  ✅ Tasks {tasksTotal > 0 ? `(${tasksDone}/${tasksTotal} done)` : ''}
                </div>

                {tasks === null && <div style={{ fontSize: 12, color: '#94a3b8' }}>Loading…</div>}

                {tasks !== null && tasks.length === 0 && pendingTasks.length === 0 && (
                  <div style={{ fontSize: 12, color: '#94a3b8', fontStyle: 'italic' }}>No tasks yet.</div>
                )}

                {(tasks || []).map(task => (
                  <div key={task.id} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '7px 10px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, marginBottom: 4 }}>
                    <input
                      type="checkbox"
                      checked={task.completed}
                      disabled={stage.status === 'done'}
                      onChange={() => {
                        if (stage.status === 'done') return
                        if (!task.completed) openCompleteTask(task)
                        else toggleTaskUncomplete(task)
                      }}
                      style={{ width: 20, height: 20, flexShrink: 0, accentColor: '#1E3070', cursor: stage.status === 'done' ? 'default' : 'pointer' }}
                    />
                    <span style={{ flex: 1, fontSize: 13, color: task.completed ? '#94a3b8' : '#1e293b', textDecoration: task.completed ? 'line-through' : 'none' }}>
                      {task.label}
                    </span>
                    {task.notes && (
                      <span style={{ fontSize: 11, color: '#94a3b8', fontStyle: 'italic', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={task.notes}>
                        {task.notes}
                      </span>
                    )}
                    {stage.status !== 'done' && task.completed && (
                      <button onClick={() => openEditTask(task)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: 11, fontWeight: 600, padding: '0 4px' }}>Edit</button>
                    )}
                  </div>
                ))}

                {/* Pending new task inputs */}
                {pendingTasks.map(({ uid, value }) => (
                  <div key={uid} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '6px 10px', background: '#fff', border: '1px dashed #93c5fd', borderRadius: 8, marginBottom: 4 }}>
                    <input type="checkbox" disabled style={{ width: 20, height: 20, flexShrink: 0, opacity: 0.3 }} />
                    <input
                      autoFocus
                      type="text"
                      placeholder="Describe the task… (Enter to save, Esc to cancel)"
                      value={value}
                      onChange={e => updatePendingTask(uid, e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') savePendingTask(uid)
                        if (e.key === 'Escape') removePendingTask(uid)
                      }}
                      onBlur={() => savePendingTask(uid)}
                      style={{ flex: 1, border: 'none', outline: 'none', fontSize: 13, background: 'transparent', color: '#1e293b' }}
                    />
                    <button onClick={() => removePendingTask(uid)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#cbd5e1', fontSize: 13, padding: 0, lineHeight: 1 }}>✕</button>
                  </div>
                ))}

                {stage.status !== 'done' && (
                  <button onClick={addPendingTask}
                    style={{ fontSize: 12, color: '#1E3070', background: 'none', border: '1px dashed #93c5fd', borderRadius: 7, padding: '5px 12px', cursor: 'pointer', fontWeight: 700, marginTop: 2 }}>
                    + Add Task
                  </button>
                )}
              </div>
            )}

          </div>
        )}
      </div>
    </>
  )
}

// ─── File Thumbnail ─────────────────────────────────────────────────────────
function PhotoThumb({ photo }) {
  const [url, setUrl] = useState(null)

  useEffect(() => {
    supabase.storage
      .from('order-photos')
      .createSignedUrl(photo.storage_path, 3600)
      .then(({ data }) => setUrl(data?.signedUrl))
  }, [photo.storage_path])

  // Extract original filename from path (format: orderId/timestamp_originalName)
  const pathPart  = photo.storage_path?.split('/').pop() || ''
  const origName  = pathPart.replace(/^\d+_/, '') || pathPart
  const ext       = origName.split('.').pop()?.toLowerCase() || ''
  const isImage   = IMAGE_EXTS.has(ext)
  const fileStyle = FILE_TYPE_STYLE[ext] || { icon: '📄', bg: '#f1f5f9', color: '#475569' }

  if (!url) return <div className="wp-photo-thumb wp-photo-loading" />

  if (isImage) {
    return (
      <a href={url} target="_blank" rel="noreferrer" className="wp-photo-thumb" style={{ display: 'block', overflow: 'hidden', borderRadius: 8 }}>
        <img src={url} alt={origName} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
      </a>
    )
  }

  return (
    <a href={url} target="_blank" rel="noreferrer" className="wp-photo-thumb"
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, background: fileStyle.bg, borderRadius: 8, border: `1.5px solid ${fileStyle.color}22`, textDecoration: 'none', padding: 6 }}>
      <span style={{ fontSize: 26 }}>{fileStyle.icon}</span>
      <span style={{ fontSize: 9, fontWeight: 800, color: fileStyle.color, textTransform: 'uppercase', letterSpacing: '0.05em', background: `${fileStyle.color}18`, borderRadius: 4, padding: '1px 5px' }}>{ext}</span>
      <span style={{ fontSize: 9, color: '#64748b', textAlign: 'center', lineHeight: 1.2, overflow: 'hidden', maxWidth: '100%', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{origName}</span>
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

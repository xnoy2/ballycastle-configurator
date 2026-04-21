import React, { useState, useRef } from 'react'

const DEMO = [
  { id:1, emoji:'🌱', label:'Site cleared',       date:'4 Apr' },
  { id:2, emoji:'🪵', label:'Groundwork done',    date:'4 Apr' },
  { id:3, emoji:'🏗️', label:'First uprights up',  date:'10 Apr' },
  { id:4, emoji:'🔩', label:'Cross beams fitted', date:'11 Apr' },
]

export default function Photos() {
  const [photos, setPhotos]   = useState(DEMO)
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef()

  const addFiles = (files) => {
    Array.from(files).filter(f => f.type.startsWith('image/')).forEach(f => {
      const url = URL.createObjectURL(f)
      setPhotos(prev => [...prev, { id: Date.now()+Math.random(), url, label: f.name.replace(/\.[^.]+$/,''), date:'Just now' }])
    })
  }

  return (
    <div>
      <div className="p-sh">
        <h2>Build Photos</h2>
        <span className="p-badge p-badge-green">{photos.length} photos</span>
      </div>

      {/* Upload */}
      <div
        className={`p-upload${dragging?' drag':''}`}
        style={{ marginBottom:22 }}
        onClick={() => inputRef.current.click()}
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files) }}
      >
        <div style={{ fontSize:32, marginBottom:8 }}>📷</div>
        <div style={{ fontWeight:700, fontSize:14, color:'var(--p-text)' }}>Drop photos here or click to upload</div>
        <div style={{ fontSize:12, color:'var(--p-text-3)', marginTop:4 }}>PNG, JPG, HEIC · up to 20MB each</div>
        <button className="p-btn p-btn-primary" style={{ marginTop:14 }} onClick={e => { e.stopPropagation(); inputRef.current.click() }}>Choose Files</button>
        <input ref={inputRef} type="file" accept="image/*" multiple style={{display:'none'}} onChange={e => addFiles(e.target.files)} />
      </div>

      {/* Grid */}
      <div className="p-photos">
        {photos.map(p => (
          <div key={p.id} className="p-photo">
            {p.url
              ? <img src={p.url} alt={p.label} />
              : (
                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', width:'100%', height:'100%', padding:10 }}>
                  <span style={{ fontSize:30 }}>{p.emoji}</span>
                  <span style={{ fontSize:10.5, color:'var(--p-text-3)', textAlign:'center', marginTop:5 }}>{p.label}</span>
                  <span style={{ fontSize:10, color:'var(--p-text-3)' }}>{p.date}</span>
                </div>
              )
            }
          </div>
        ))}
      </div>
    </div>
  )
}

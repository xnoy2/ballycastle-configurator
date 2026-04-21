import React, { useState, useCallback } from 'react'
import { X, Send, Phone, Mail, User } from 'lucide-react'
import { supabase } from '../lib/supabase'
import './QuoteModal.css'

// ─── PDF builder ──────────────────────────────────────────────────────────────
async function buildPDF({ name, email, phone, lineItems, totalPrice, sceneImage }) {
  // jsPDF is loaded globally via CDN script tag in index.html
  const { jsPDF } = window.jspdf
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })

  const W = 210   // A4 width mm
  const MARGIN = 18
  const COL_R = W - MARGIN  // right edge

  // ── Brand colours ──
  const GREEN      = [46, 107, 62]
  const GREEN_DARK = [30, 74, 42]
  const GREY       = [107, 104, 96]
  const LIGHT      = [244, 243, 239]

  let y = 0

  // ── Header bar ──
  doc.setFillColor(...GREEN_DARK)
  doc.rect(0, 0, W, 44, 'F')

  // Embed logo image from the public /images/ folder
  try {
    const logoImg = await new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width  = img.naturalWidth
        canvas.height = img.naturalHeight
        canvas.getContext('2d').drawImage(img, 0, 0)
        resolve(canvas.toDataURL('image/png'))
      }
      img.onerror = reject
      img.src = '/images/bcf.png'
    })
    // Draw logo in top-left of header — height 28mm, width proportional
    doc.addImage(logoImg, 'PNG', MARGIN, 7, 28, 28)
  } catch {
    // Fallback: text logo if image fails to load
    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(22)
    doc.text('Ballycastle', MARGIN, 16)
    doc.setFontSize(11)
    doc.setFont('helvetica', 'normal')
    doc.text('Climbing Frames', MARGIN, 23)
  }

  // Tagline right-aligned
  doc.setFontSize(9)
  doc.setTextColor(180, 220, 190)
  doc.text('ballycastleclimbingframes.co.uk', COL_R, 18, { align: 'right' })
  doc.text('info@ballycastleclimbingframes.co.uk', COL_R, 25, { align: 'right' })
  doc.text('+44 (0) 28 2076 9090', COL_R, 32, { align: 'right' })

  y = 56

  // ── Quote title ──
  doc.setTextColor(...GREEN_DARK)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.text('Your Custom Quote', MARGIN, y)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...GREY)
  const today = new Date().toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
  doc.text(`Generated: ${today}`, COL_R, y, { align: 'right' })

  y += 10

  // ── Divider ──
  doc.setDrawColor(...GREEN)
  doc.setLineWidth(0.5)
  doc.line(MARGIN, y, COL_R, y)
  y += 8

  // ── Customer details ──
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(...GREEN_DARK)
  doc.text('Customer Details', MARGIN, y)
  y += 6

  const details = [
    ['Name',  name],
    ['Email', email],
    ['Phone', phone],
  ]
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  details.forEach(([label, value]) => {
    doc.setTextColor(...GREY)
    doc.text(label + ':', MARGIN, y)
    doc.setTextColor(30, 30, 30)
    doc.text(value || '—', MARGIN + 22, y)
    y += 6
  })

  y += 4
  doc.setDrawColor(220, 218, 212)
  doc.setLineWidth(0.3)
  doc.line(MARGIN, y, COL_R, y)
  y += 8

  // ── Line items table ──
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(...GREEN_DARK)
  doc.text('Selected Configuration', MARGIN, y)
  y += 7

  // Table header
  doc.setFillColor(...LIGHT)
  doc.rect(MARGIN, y - 4, COL_R - MARGIN, 8, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(...GREY)
  doc.text('Item', MARGIN + 2, y + 1)
  doc.text('Price (inc. VAT)', COL_R - 2, y + 1, { align: 'right' })
  y += 8

  // Rows
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  lineItems.forEach((item, i) => {
    if (i % 2 === 0) {
      doc.setFillColor(250, 249, 246)
      doc.rect(MARGIN, y - 4, COL_R - MARGIN, 7, 'F')
    }
    doc.setTextColor(30, 30, 30)
    doc.text(item.label, MARGIN + 2, y)
    doc.setTextColor(...GREEN_DARK)
    doc.text(`£${item.price.toLocaleString()}`, COL_R - 2, y, { align: 'right' })
    y += 7
  })

  y += 2
  doc.setDrawColor(220, 218, 212)
  doc.setLineWidth(0.3)
  doc.line(MARGIN, y, COL_R, y)
  y += 6

  // ── Total ──
  doc.setFillColor(...GREEN)
  doc.rect(MARGIN, y - 4, COL_R - MARGIN, 12, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.setTextColor(255, 255, 255)
  doc.text('ESTIMATED TOTAL', MARGIN + 3, y + 4)
  doc.text(`£${totalPrice.toLocaleString()}`, COL_R - 3, y + 4, { align: 'right' })
  y += 18

  // ── Scene design image ──
  if (sceneImage) {
    y += 4
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(...GREEN_DARK)
    doc.text('Your Configuration Design', MARGIN, y)
    y += 5

    // Image fills the content width with a 16:9-ish crop
    const imgW = COL_R - MARGIN
    const imgH = imgW * 0.58   // ~16:9 aspect
    doc.addImage(sceneImage, 'PNG', MARGIN, y, imgW, imgH)
    y += imgH + 6

    // Thin border around image
    doc.setDrawColor(220, 218, 212)
    doc.setLineWidth(0.3)
    doc.rect(MARGIN, y - imgH - 6, imgW, imgH)
  }

  // ── Small print ──
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(...GREY)
  const note = 'This is an indicative estimate. Final pricing may vary based on site survey, delivery, and installation requirements.'
  doc.text(note, MARGIN, y, { maxWidth: COL_R - MARGIN })
  y += 10

  // ── Next steps box ──
  doc.setFillColor(232, 242, 235)
  doc.setDrawColor(...GREEN)
  doc.setLineWidth(0.4)
  doc.roundedRect(MARGIN, y, COL_R - MARGIN, 26, 2, 2, 'FD')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(...GREEN_DARK)
  doc.text('What happens next?', MARGIN + 4, y + 7)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...GREY)
  doc.text('Our team will be in touch within 24 hours to discuss your quote and', MARGIN + 4, y + 13)
  doc.text('arrange a convenient time to finalise your order.', MARGIN + 4, y + 19)

  // ── Footer ──
  const footerY = 278
  doc.setFillColor(...GREEN_DARK)
  doc.rect(0, footerY, W, 20, 'F')
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(180, 220, 190)
  doc.text('Ballycastle Climbing Frames  ·  ballycastleclimbingframes.co.uk', W / 2, footerY + 7, { align: 'center' })
  doc.text('+44 (0) 28 2076 9090  ·  info@ballycastleclimbingframes.co.uk', W / 2, footerY + 13, { align: 'center' })

  return doc
}

// ─── Modal ────────────────────────────────────────────────────────────────────
export default function QuoteModal({ lineItems, totalPrice, sceneImage, onClose }) {
  const [name,    setName]    = useState('')
  const [email,   setEmail]   = useState('')
  const [phone,   setPhone]   = useState('')
  const [step,    setStep]    = useState('form')   // 'form' | 'sending' | 'done'
  const [error,   setError]   = useState('')
  const [pdfDoc,  setPdfDoc]  = useState(null)     // kept for fallback download

  const validate = () => {
    if (!name.trim())  return 'Please enter your name.'
    if (!email.trim() || !email.includes('@')) return 'Please enter a valid email.'
    if (!phone.trim()) return 'Please enter your phone number.'
    return ''
  }

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault()
    const err = validate()
    if (err) { setError(err); return }
    setError('')
    setStep('sending')

    try {
      const fullPhone = phone.startsWith('+') ? phone : `+44 ${phone.replace(/^0/, '')}`
      const doc = await buildPDF({ name, email, phone: fullPhone, lineItems, totalPrice, sceneImage })
      setPdfDoc(doc)

      // Convert PDF to base64 for email attachment
      const pdfBase64 = doc.output('datauristring').split(',')[1]

      // Send email with PDF attached via Supabase Edge Function → Resend
      const { error: fnError } = await supabase.functions.invoke('send-quote', {
        body: { name, email, phone: fullPhone, lineItems, totalPrice, pdfBase64 },
      })
      if (fnError) throw fnError

      // Save quote record to DB (non-blocking)
      supabase.from('quotes').insert({
        name,
        email,
        phone: fullPhone,
        total_price: totalPrice,
        line_items: lineItems,
      }).then(({ error: dbErr }) => {
        if (dbErr) console.warn('Quote not saved to DB:', dbErr.message)
      })

      setStep('done')
    } catch (err) {
      console.error(err)
      setError('Failed to send your quote. Please try again or contact us directly.')
      setStep('form')
    }
  }, [name, email, phone, lineItems, totalPrice, sceneImage])

  return (
    <div className="qm-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="qm-panel">

        {/* Header */}
        <div className="qm-header">
          <div className="qm-header__text">
            <img src="/images/bcf.png" alt="Ballycastle Climbing Frames" className="qm-logo" />
            <h2 className="qm-title">Generate Your Quote</h2>
          </div>
          <button className="qm-close" onClick={onClose} title="Close">
            <X size={18} />
          </button>
        </div>

        {step === 'form' && (
          <form className="qm-form" onSubmit={handleSubmit} noValidate>
            <p className="qm-intro">
              Enter your details and we'll email you a personalised PDF quote for your
              <strong> £{totalPrice.toLocaleString()}</strong> configuration.
            </p>

            {sceneImage && (
              <div className="qm-scene-preview">
                <img src={sceneImage} alt="Your configuration design" className="qm-scene-img" />
                <span className="qm-scene-label">Your design will be included in the PDF</span>
              </div>
            )}

            <div className="qm-field">
              <label className="qm-label"><User size={13} /> Full Name</label>
              <input
                className="qm-input"
                type="text"
                placeholder="Nicola Graham"
                value={name}
                onChange={e => setName(e.target.value)}
                autoFocus
              />
            </div>

            <div className="qm-field">
              <label className="qm-label"><Mail size={13} /> Email Address</label>
              <input
                className="qm-input"
                type="email"
                placeholder="nicola@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>

            <div className="qm-field">
              <label className="qm-label"><Phone size={13} /> Phone Number</label>
              <div className="qm-phone-wrap">
                <span className="qm-phone-prefix">+44</span>
                <input
                  className="qm-input qm-input--phone"
                  type="tel"
                  placeholder="7911 123456"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                />
              </div>
              <span className="qm-field-note">
                We may call to discuss your quote
              </span>
            </div>

            {error && <p className="qm-error">{error}</p>}

            <button className="qm-submit" type="submit">
              <Send size={16} />
              Send Quote to My Email
            </button>

            <p className="qm-footer-note">
              A PDF quote will be sent to your email address. Our team will follow up within 24 hours.
            </p>
          </form>
        )}

        {step === 'sending' && (
          <div className="qm-state qm-state--loading">
            <div className="qm-spinner" />
            <p>Sending your quote to <strong>{email}</strong>…</p>
          </div>
        )}

        {step === 'done' && (
          <div className="qm-state qm-state--done">
            <div className="qm-check">✓</div>
            <h3>Quote Sent!</h3>
            <p>
              Your PDF quote has been emailed to<br />
              <strong>{email}</strong>
            </p>
            <p className="qm-done-sub">
              Our team will be in touch within 24 hours.<br />
              Can't find the email? Check your spam folder.
            </p>
            {pdfDoc && (
              <button
                className="qm-submit qm-submit--outline"
                onClick={() => pdfDoc.save(`BCF-Quote-${name.replace(/\s+/g, '-')}.pdf`)}
                style={{ marginBottom: 10 }}
              >
                Download PDF copy
              </button>
            )}
            <button className="qm-submit qm-submit--outline" onClick={onClose}>
              Close
            </button>
          </div>
        )}

        {/* Order summary sidebar */}
        <div className="qm-summary">
          <h3 className="qm-summary__title">Your Selection</h3>
          <div className="qm-summary__items">
            {lineItems.map((item, i) => (
              <div key={i} className="qm-summary__row">
                <span>{item.label}</span>
                <span>£{item.price.toLocaleString()}</span>
              </div>
            ))}
          </div>
          <div className="qm-summary__total">
            <span>Estimated Total</span>
            <strong>£{totalPrice.toLocaleString()}</strong>
          </div>
          <p className="qm-summary__note">inc. VAT · updates live</p>
        </div>

      </div>
    </div>
  )
}

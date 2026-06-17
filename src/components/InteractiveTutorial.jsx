import { useState, useEffect, useCallback } from 'react'
import step1Img from '../assets/step1.svg'
import step2Img from '../assets/step2.svg'
import step3Img from '../assets/step3.svg'
import step4Img from '../assets/step4.svg'
import sheetsIcon from '../assets/sheet.svg'
import mailIcon from '../assets/mail.svg'
import logoIcon from '../assets/logo.svg'

/* ── Slide Data ── */
const SLIDES = [
  {
    id: 1,
    step: 'Step 1',
    title: 'Upload Foto Form Fisik',
    subtitle: 'Ambil & lampirkan dokumen nasabah',
    description: 'Foto atau scan formulir fisik nasabah (KYC). OCR AI akan otomatis membaca NIK, Nama, Tanggal Lahir, Ibu Kandung, dan data lainnya.',
    bullets: [
      'Format: JPG, PNG, atau PDF scan',
      'AI membaca formulir secara otomatis',
      'Field yang dibaca: NIK, Nama, Tgl Lahir, Ibu Kandung',
    ],
    illustration: step1Img,
    accent: '#1AC1DD',
    accentLight: 'rgba(26,193,221,0.08)',
    pill: 'Upload',
    pillColor: '#1AC1DD',
    action: null,
  },
  {
    id: 2,
    step: 'Step 2',
    title: 'Input ke Google Sheets',
    subtitle: 'Data otomatis masuk spreadsheet',
    description: 'Setelah OCR selesai, AI akan langsung memasukkan data terstruktur ke Google Sheets via MCP. Setiap field terverifikasi dengan confidence score.',
    bullets: [
      'Ekstraksi data otomatis via AI',
      'Disimpan ke Google Sheets via MCP',
      'Confidence score untuk setiap field',
    ],
    illustration: step2Img,
    accent: '#10B981',
    accentLight: 'rgba(16,185,129,0.08)',
    pill: 'Sheets',
    pillColor: '#10B981',
    action: { label: 'Mulai Input Data', msg: 'Saya ingin input data nasabah baru dari form fisik.' },
  },
  {
    id: 3,
    step: 'Step 3',
    title: 'Review & Edit via Chat',
    subtitle: 'Koreksi data langsung di chat',
    description: 'Spreadsheet interaktif muncul di chat. Klik sel mana saja untuk mengedit data secara langsung. AI secara otomatis mengirim koreksi ke Sheets via MCP.',
    bullets: [
      'Spreadsheet interaktif muncul di chat',
      'Klik sel untuk mengedit secara langsung',
      'Koreksi otomatis dikirim via MCP ke Sheets',
    ],
    illustration: step3Img,
    accent: '#6366F1',
    accentLight: 'rgba(99,102,241,0.08)',
    pill: 'Review',
    pillColor: '#6366F1',
    action: null,
  },
  {
    id: 4,
    step: 'Step 4',
    title: 'Kirim Email ke CTO',
    subtitle: 'Laporan batch siap dikirim',
    description: 'Setelah data diverifikasi, klik tombol untuk mengirim laporan batch nasabah ke CTO melalui Gmail MCP, beserta lampiran PDF dan Excel.',
    bullets: [
      'Email laporan dikirim via Gmail MCP',
      'Penerima: CTO di cto@bankmandiri.co.id',
      'Attachment: PDF & Excel batch nasabah',
    ],
    illustration: step4Img,
    accent: '#F59E0B',
    accentLight: 'rgba(245,158,11,0.08)',
    pill: 'Kirim',
    pillColor: '#F59E0B',
    action: { label: 'Kirim Email ke CTO', msg: 'Tolong kirim email batch ke CTO untuk pembukaan rekening.' },
  },
]

/* ── Animated counter for progress bar ── */
function usePrevious(value) {
  const [prev, setPrev] = useState(value)
  useEffect(() => { setPrev(value) }, [value])
  return prev
}

export default function InteractiveTutorial({ onQuickAction }) {
  const [current, setCurrent] = useState(0)
  const [animDir, setAnimDir] = useState('next') // 'next' | 'prev'
  const [isAnimating, setIsAnimating] = useState(false)

  const goTo = useCallback((idx, dir = 'next') => {
    if (isAnimating || idx === current) return
    setAnimDir(dir)
    setIsAnimating(true)
    setTimeout(() => {
      setCurrent(idx)
      setIsAnimating(false)
    }, 350)
  }, [isAnimating, current])

  const goNext = () => {
    if (current < SLIDES.length - 1) goTo(current + 1, 'next')
  }

  const goPrev = () => {
    if (current > 0) goTo(current - 1, 'prev')
  }

  /* Keyboard navigation */
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowRight') goNext()
      if (e.key === 'ArrowLeft') goPrev()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [current, isAnimating])

  const slide = SLIDES[current]

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col items-center gap-0 px-4 py-2 fade-in">
      {/* ── Header ── */}
      <div className="flex flex-col items-center mb-5">
        <div
          className="w-20 h-20 mb-3 rounded-[20px] overflow-hidden border-2 shadow-lg bg-white"
          style={{ borderColor: 'rgba(26,193,221,0.4)', boxShadow: '0 6px 24px rgba(26,193,221,0.4)' }}
        >
          <img src={logoIcon} alt="BulkBuddy Logo" className="w-full h-full object-cover" />
        </div>
        <h2 className="text-xl font-bold text-slate-800 text-center leading-tight">
          BulkBuddy — Asisten Pembuka Rekening
        </h2>
        <p className="text-xs text-slate-400 text-center mt-1 max-w-xs">
          Ikuti 4 langkah di bawah untuk memproses batch pembukaan rekening nasabah
        </p>
      </div>

      {/* ── Slide Card ── */}
      <div
        className="w-full rounded-3xl border overflow-hidden flex flex-col md:flex-row"
        style={{
          background: '#fff',
          borderColor: `${slide.accent}30`,
          boxShadow: `0 8px 40px ${slide.accent}18`,
          minHeight: 340,
          transition: 'box-shadow 0.4s, border-color 0.4s',
        }}
      >
        {/* Left — Illustration */}
        <div
          className="flex-shrink-0 flex items-center justify-center md:w-[340px] w-full p-6 relative"
          style={{ background: slide.accentLight, minHeight: 220 }}
        >
          {/* Step badge */}
          <div
            className="absolute top-4 left-4 text-[11px] font-bold px-3 py-1 rounded-full shadow"
            style={{ background: slide.accent, color: '#fff', letterSpacing: '0.04em' }}
          >
            {slide.step}
          </div>

          <img
            key={current}
            src={slide.illustration}
            alt={slide.title}
            className={`w-full max-w-[260px] h-auto object-contain select-none transition-all duration-350
              ${isAnimating
                ? animDir === 'next'
                  ? 'translate-x-8 opacity-0'
                  : '-translate-x-8 opacity-0'
                : 'translate-x-0 opacity-100'
              }`}
            style={{ transition: 'opacity 0.35s, transform 0.35s' }}
            draggable={false}
          />
        </div>

        {/* Right — Content */}
        <div
          className={`flex-1 flex flex-col justify-between p-7 transition-all duration-350
            ${isAnimating ? 'opacity-0 translate-x-3' : 'opacity-100 translate-x-0'}`}
          style={{ transition: 'opacity 0.35s, transform 0.35s' }}
        >
          {/* Title block */}
          <div>
            <span
              className="text-[11px] font-semibold uppercase tracking-widest"
              style={{ color: slide.accent }}
            >
              {slide.pill}
            </span>
            <h3 className="text-2xl font-extrabold text-slate-800 mt-1 leading-tight">
              {slide.title}
            </h3>
            <p className="text-sm text-slate-500 mt-1">{slide.subtitle}</p>
            <p className="text-sm text-slate-600 mt-3 leading-relaxed">{slide.description}</p>

            {/* Bullet points */}
            <ul className="mt-4 space-y-2">
              {slide.bullets.map((b, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                  <span
                    className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold mt-0.5"
                    style={{ background: `${slide.accent}22`, color: slide.accent }}
                  >
                    {i + 1}
                  </span>
                  {b}
                </li>
              ))}
            </ul>
          </div>

          {/* Bottom — Nav + Action */}
          <div className="flex items-center justify-between mt-6 flex-wrap gap-3">
            {/* Prev / Next */}
            <div className="flex items-center gap-2">
              <button
                onClick={goPrev}
                disabled={current === 0 || isAnimating}
                className={`w-9 h-9 rounded-full border flex items-center justify-center text-sm font-bold transition-all duration-200
                  ${current === 0 ? 'opacity-30 cursor-not-allowed border-slate-200 text-slate-300' : 'border-slate-300 text-slate-600 hover:bg-slate-100 hover:scale-105'}`}
              >
                ‹
              </button>
              <button
                onClick={goNext}
                disabled={current === SLIDES.length - 1 || isAnimating}
                className={`w-9 h-9 rounded-full border flex items-center justify-center text-sm font-bold transition-all duration-200
                  ${current === SLIDES.length - 1 ? 'opacity-30 cursor-not-allowed border-slate-200 text-slate-300' : 'border-slate-300 text-slate-600 hover:bg-slate-100 hover:scale-105'}`}
              >
                ›
              </button>
            </div>

            {/* Action button */}
            {slide.action && (
              <button
                onClick={() => onQuickAction(slide.action.msg)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold text-white shadow-md transition-all duration-200 hover:scale-[1.04] active:scale-[0.97]"
                style={{ background: `linear-gradient(135deg, ${slide.accent}, ${slide.accent}cc)` }}
              >
                {slide.id === 2 && <img src={sheetsIcon} alt="" className="w-4 h-4 object-contain" />}
                {slide.id === 4 && <img src={mailIcon} alt="" className="w-4 h-4 object-contain" />}
                {slide.action.label}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Dot indicators + step progress ── */}
      <div className="flex flex-col items-center gap-3 mt-5">
        {/* Dots */}
        <div className="flex items-center gap-2">
          {SLIDES.map((s, i) => (
            <button
              key={s.id}
              onClick={() => goTo(i, i > current ? 'next' : 'prev')}
              aria-label={`Pergi ke ${s.title}`}
              className="transition-all duration-300"
              style={{
                width: i === current ? 28 : 8,
                height: 8,
                borderRadius: 9999,
                background: i === current ? slide.accent : '#CBD5E1',
                opacity: isAnimating && i !== current ? 0.6 : 1,
              }}
            />
          ))}
        </div>

        {/* Step label */}
        <p className="text-[11px] text-slate-400 font-medium">
          {current + 1} dari {SLIDES.length} langkah
        </p>
      </div>
    </div>
  )
}

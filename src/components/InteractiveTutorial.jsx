import { useState } from 'react'
import { Sparkles, Camera, CheckCircle2 } from 'lucide-react'
import sheetsIcon from '../assets/sheets.png'
import mailIcon from '../assets/mail.png'

const STEPS = [
  {
    id: 1,
    icon: <Camera size={22} className="text-slate-600" />,
    iconBg: 'bg-white border border-slate-200',
    label: 'Upload Foto Form',
    desc: 'Foto / scan form fisik nasabah (JPEG, PNG, atau PDF)',
    actionLabel: null,
    actionIcon: null,
    color: 'white',
  },
  {
    id: 2,
    icon: null, // will use image
    iconImg: sheetsIcon,
    iconBg: 'bg-white border border-slate-200',
    label: 'Input ke Google Sheets',
    desc: 'OCR otomatis membaca form & memasukkan data ke spreadsheet',
    actionLabel: 'Buka Sheets',
    actionImg: sheetsIcon,
    color: 'white',
  },
  {
    id: 3,
    icon: <span className="text-xl">🤖</span>,
    iconBg: 'bg-white border border-slate-200',
    label: 'Review & Edit via Chat',
    desc: 'AI menampilkan spreadsheet di chat. Klik sel untuk koreksi data langsung.',
    actionLabel: null,
    actionIcon: null,
    color: 'white',
  },
  {
    id: 4,
    icon: null,
    iconImg: mailIcon,
    iconBg: 'bg-white border border-slate-200',
    label: 'Kirim Email ke CTO',
    desc: 'Setelah OK, kirim batch ke CTO via Gmail MCP untuk pembukaan rekening',
    actionLabel: 'Kirim Email',
    actionImg: mailIcon,
    color: 'white',
  },
]

const COLOR_MAP = {
  white: {
    ring: 'ring-slate-200',
    bg: 'bg-white',
    border: 'border-slate-200',
    pill: 'bg-white text-slate-700',
    glow: 'shadow-sm',
    connector: 'bg-slate-200',
    activeBorder: 'border-slate-300',
    activeBg: 'bg-slate-50',
  },
}

export default function InteractiveTutorial({ onQuickAction }) {
  const [activeStep, setActiveStep] = useState(null)
  const [completedSteps, setCompletedSteps] = useState([])

  const handleStepClick = (stepId) => {
    setActiveStep(prev => prev === stepId ? null : stepId)
  }

  const handleActionClick = (step, e) => {
    e.stopPropagation()
    if (!completedSteps.includes(step.id)) {
      setCompletedSteps(prev => [...prev, step.id])
    }
    if (step.id === 2) {
      onQuickAction('Saya ingin input data nasabah baru dari form fisik.')
    } else if (step.id === 4) {
      onQuickAction('Tolong kirim email batch ke CTO untuk pembukaan rekening.')
    }
  }

  const progressPct = Math.round((completedSteps.length / STEPS.length) * 100)

  return (
    <div className="flex flex-col items-center justify-center flex-1 px-6 py-8 fade-in overflow-y-auto">
      {/* Header */}
      <div className="flex flex-col items-center mb-8">
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-primary-500 to-blue-400 flex items-center justify-center shadow-xl shadow-primary-500/20 mb-4">
          <Sparkles size={28} className="text-white" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-1 text-center">BulkBuddy, asisten AI pembuka rekening!</h2>
        <p className="text-sm text-slate-400 text-center max-w-sm">Ikuti langkah-langkah di bawah untuk memproses batch pembukaan rekening nasabah</p>

        {/* Progress bar */}
        <div className="mt-5 w-72">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-xs text-slate-400 font-medium">Progress</span>
            <span className="text-xs font-bold text-primary-600">{completedSteps.length}/{STEPS.length} selesai</span>
          </div>
          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary-500 to-blue-400 rounded-full transition-all duration-700 ease-out"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Steps */}
      <div className="w-full max-w-2xl space-y-3">
        {STEPS.map((step, idx) => {
          const c = COLOR_MAP[step.color]
          const isActive = activeStep === step.id
          const isDone = completedSteps.includes(step.id)

          return (
            <div key={step.id}>
              {/* Step card */}
              <button
                onClick={() => handleStepClick(step.id)}
                className={`w-full text-left rounded-2xl border-2 transition-all duration-300 cursor-pointer group
                  ${isDone
                    ? 'border-emerald-300 bg-emerald-50/60 shadow-md shadow-emerald-500/10'
                    : isActive
                      ? `${c.activeBorder} ${c.activeBg} shadow-lg ${c.glow}`
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-md'
                  }`}
              >
                <div className="flex items-center gap-4 px-5 py-4">
                  {/* Step number / done indicator */}
                  <div className="relative shrink-0">
                    {isDone ? (
                      <div className="w-11 h-11 rounded-2xl bg-emerald-100 flex items-center justify-center">
                        <CheckCircle2 size={22} className="text-emerald-500" />
                      </div>
                    ) : (
                      <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${step.iconBg} flex items-center justify-center shadow-md ${c.glow}`}>
                        {step.iconImg
                          ? <img src={step.iconImg} alt="" className="w-8 h-8 object-contain" />
                          : step.icon
                        }
                      </div>
                    )}
                    <span className={`absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center
                      ${isDone ? 'bg-emerald-500 text-white' : `${c.pill}`}`}>
                      {step.id}
                    </span>
                  </div>

                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <p className={`font-bold text-sm ${isDone ? 'text-emerald-700 line-through decoration-emerald-400/50' : 'text-slate-800'}`}>
                      {step.label}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{step.desc}</p>
                  </div>

                  {/* Action button */}
                  {step.actionLabel && !isDone && (
                    <button
                      onClick={(e) => handleActionClick(step, e)}
                      className={`shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold
                        border-2 ${c.border} ${c.bg} ${c.pill.replace('text-', 'text-')}
                        hover:scale-[1.04] active:scale-[0.97] transition-all duration-200 shadow-sm`}
                    >
                      {step.actionImg && (
                        <img src={step.actionImg} alt="" className="w-4 h-4 object-contain" />
                      )}
                      {step.actionLabel}
                    </button>
                  )}

                  {/* Chevron */}
                  <span className={`text-slate-300 text-sm transition-transform duration-300 ${isActive ? 'rotate-90' : ''}`}>▶</span>
                </div>

                {/* Expanded detail */}
                {isActive && (
                  <div className={`px-5 pb-4 border-t ${c.border} bg-white/60 rounded-b-2xl`}>
                    <div className="pt-3 text-sm text-slate-600 leading-relaxed">
                      {step.id === 1 && (
                        <ul className="space-y-1.5">
                          <li className="flex items-center gap-2"><span className="text-violet-400">●</span> Foto form KYC nasabah perorangan</li>
                          <li className="flex items-center gap-2"><span className="text-violet-400">●</span> Format: JPG, PNG, atau PDF scan</li>
                          <li className="flex items-center gap-2"><span className="text-violet-400">●</span> OCR akan membaca: NIK, Nama, No. Telepon, Nama Ibu Kandung</li>
                        </ul>
                      )}
                      {step.id === 2 && (
                        <ul className="space-y-1.5">
                          <li className="flex items-center gap-2"><span className="text-emerald-400">●</span> AI membaca dokumen & mengekstrak data otomatis</li>
                          <li className="flex items-center gap-2"><span className="text-emerald-400">●</span> Data dikirim ke Google Sheets via MCP</li>
                          <li className="flex items-center gap-2"><span className="text-emerald-400">●</span> Confidence score ditampilkan untuk tiap field</li>
                        </ul>
                      )}
                      {step.id === 3 && (
                        <ul className="space-y-1.5">
                          <li className="flex items-center gap-2"><span className="text-blue-400">●</span> Spreadsheet interaktif muncul di chat</li>
                          <li className="flex items-center gap-2"><span className="text-blue-400">●</span> Klik sel mana saja untuk mengedit langsung</li>
                          <li className="flex items-center gap-2"><span className="text-blue-400">●</span> AI kirim JSON koreksi ke Sheets via MCP otomatis</li>
                        </ul>
                      )}
                      {step.id === 4 && (
                        <ul className="space-y-1.5">
                          <li className="flex items-center gap-2"><span className="text-rose-400">●</span> Klik tombol Gmail untuk kirim email</li>
                          <li className="flex items-center gap-2"><span className="text-rose-400">●</span> Penerima: CTO di cto@bankmandiri.co.id</li>
                          <li className="flex items-center gap-2"><span className="text-rose-400">●</span> Attachment: PDF batch nasabah terverifikasi</li>
                        </ul>
                      )}
                    </div>
                  </div>
                )}
              </button>

              {/* Connector line */}
              {idx < STEPS.length - 1 && (
                <div className="flex justify-center">
                  <div className={`w-0.5 h-3 ${isDone ? 'bg-emerald-300' : 'bg-slate-200'} transition-colors duration-500`} />
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Quick actions */}
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        {[
          { label: '🆕 Input Nasabah Baru', msg: 'Saya ingin input data nasabah baru dari form fisik.' },
          { label: '🗑️ Hapus Data Nasabah', msg: 'Saya ingin menghapus data nasabah.' },
          { label: '📋 Cek Status Batch', msg: 'Tolong cek status batch input terakhir.' },
        ].map(a => (
          <button key={a.label} onClick={() => onQuickAction(a.msg)}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white border border-slate-200 shadow-sm
              text-sm font-medium text-slate-700 hover:bg-primary-50 hover:border-primary-300 hover:text-primary-700
              hover:shadow-md active:scale-[0.97] transition-all duration-200 cursor-pointer">
            {a.label}
          </button>
        ))}
      </div>
    </div>
  )
}

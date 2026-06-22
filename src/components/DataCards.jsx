import { useState, useRef, useEffect } from 'react'
import { CheckCircle2, AlertTriangle, Download, Send, FileText, Save, Pencil, X, Check } from 'lucide-react'
import { NASABAH_COLUMNS, PRIMARY_COLUMNS, toMCPPayload } from '../data/schema'
import sheetsIcon from '../assets/sheet.svg'
import mailIcon from '../assets/mail.svg'

/* ── Per-image extracted data card ── */
export function ExtractedDataCard({ data }) {
  const isLow = data.confidence < 80
  const displayFields = [
    ['Nama', data.nama],
    ['No KTP', data.no_ktp],
    ['Kelamin', data.kelamin === 'M' ? 'Laki-laki' : 'Perempuan'],
    ['Tgl Lahir', data.tgl_lhr],
    ['Kota Lahir', data.kota_lhr],
    ['Ibu Kandung', data.ibu_kandung],
    ['Handphone', data.handphone],
    ['Alamat', data.alamat1],
  ]

  return (
    <div className={`rounded-2xl border p-4 transition-all duration-200 hover:shadow-md
      ${isLow ? 'bg-amber-50/60 border-amber-200' : 'bg-[#F2F4F7] border-[#344054]/20'}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <FileText size={15} className="text-primary-500" />
          <span className="text-xs font-bold text-[#344054] uppercase tracking-wide">Data Nasabah</span>
        </div>
        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold
          ${isLow
            ? 'bg-amber-100 text-amber-700'
            : 'bg-emerald-100 text-emerald-700'
          }`}>
          {isLow ? <AlertTriangle size={11} /> : <CheckCircle2 size={11} />}
          {data.confidence}%
        </span>
      </div>
      <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
        {displayFields.map(([label, val]) => (
          <div key={label} className="contents">
            <span className="text-[#344054]/70 font-medium text-xs">{label}</span>
            <span className={`font-semibold ${isLow && String(val).length > 16 ? 'text-amber-600 bg-amber-100 px-1.5 rounded' : 'text-[#344054]'}`}>
              {val || '—'}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Inline editable cell ── */
function EditableCell({ value, onChange, isEditing, onStartEdit, onCommit, onCancel }) {
  const inputRef = useRef(null)

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') onCommit()
    if (e.key === 'Escape') onCancel()
  }

  if (isEditing) {
    return (
      <div className="flex items-center gap-1">
        <input
          ref={inputRef}
          value={value}
          onChange={e => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full px-2 py-1 text-xs rounded-lg border-2 border-primary-400 bg-primary-50 text-slate-800
            focus:outline-none focus:ring-2 focus:ring-primary-300 font-medium"
        />
        <button onClick={onCommit}
          className="p-1 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-600 transition-colors shrink-0 cursor-pointer">
          <Check size={12} />
        </button>
        <button onClick={onCancel}
          className="p-1 rounded-lg bg-red-100 hover:bg-red-200 text-red-500 transition-colors shrink-0 cursor-pointer">
          <X size={12} />
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={onStartEdit}
      title="Klik untuk edit"
      className="w-full text-left group/cell flex items-center gap-1.5 px-1 py-0.5 rounded hover:bg-primary-50 transition-colors cursor-pointer"
    >
      <span className="text-xs text-slate-700 truncate">{String(value) || '—'}</span>
      <Pencil size={10} className="text-slate-300 opacity-0 group-hover/cell:opacity-100 transition-opacity shrink-0" />
    </button>
  )
}

/* ── Compiled spreadsheet table (AI output) ── */
export function SpreadsheetTable({ data, onExportPdf, onSendCto, onSaveToSheet }) {
  const [rows, setRows] = useState(() => data.map(d => ({ ...d })))
  const [editCell, setEditCell] = useState(null)
  const [draft, setDraft] = useState('')
  const [savedRows, setSavedRows] = useState([])
  const [hasChanges, setHasChanges] = useState(false)
  const [showEmailInput, setShowEmailInput] = useState(false)
  const [emailInput, setEmailInput] = useState('neutracksudo@gmail.com')
  const [emailHistory, setEmailHistory] = useState([])

  // Load email history on mount
  useEffect(() => {
    try {
      const history = JSON.parse(localStorage.getItem('emailHistory')) || ['neutracksudo@gmail.com']
      setEmailHistory(history)
      if (history.length > 0) setEmailInput(history[0])
    } catch(e) {}
  }, [])

  // Update rows if new data streams in (length changes)
  useEffect(() => {
    if (data.length !== rows.length) {
      setRows(data.map(d => ({ ...d })))
    }
  }, [data.length])

  const startEdit = (rowIdx, col, currentVal) => {
    setEditCell({ rowIdx, col })
    setDraft(String(currentVal ?? ''))
  }

  const commitEdit = () => {
    if (!editCell) return
    const { rowIdx, col } = editCell
    const prev = String(rows[rowIdx][col] ?? '')
    if (draft !== prev) {
      setRows(r => r.map((row, i) => i === rowIdx ? { ...row, [col]: draft } : row))
      setHasChanges(true)
    }
    setEditCell(null)
  }

  const cancelEdit = () => {
    setEditCell(null)
    setDraft('')
  }

  const handleSave = () => {
    const payload = toMCPPayload(rows)
    setSavedRows(rows.map(r => r.id))
    setHasChanges(false)
    onSaveToSheet && onSaveToSheet(rows, payload)
  }

  const handleSendCto = () => {
    if (!emailInput || !emailInput.includes('@')) return
    
    // Save to history (keep max 5 unique)
    const newHistory = [emailInput, ...emailHistory.filter(e => e !== emailInput)].slice(0, 5)
    setEmailHistory(newHistory)
    localStorage.setItem('emailHistory', JSON.stringify(newHistory))
    
    setShowEmailInput(false)
    onSendCto && onSendCto(rows, emailInput)
  }

  return (
    <div className="rounded-2xl border border-[#344054]/20 bg-[#F2F4F7] overflow-hidden shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-3.5 bg-gradient-to-r from-primary-50 to-blue-50 border-b border-[#344054]/10">
        <img src={sheetsIcon} alt="Sheets" className="w-6 h-6 object-contain" />
        <span className="text-sm font-bold text-primary-800">Spreadsheet Batch — {rows.length} Nasabah</span>
        <span className="text-[11px] text-slate-400 ml-2">({NASABAH_COLUMNS.length} kolom)</span>
        {hasChanges && (
          <span className="ml-auto flex items-center gap-1 text-[11px] font-semibold text-amber-600 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full animate-pulse">
            ✏️ Ada perubahan belum disimpan
          </span>
        )}
      </div>

      {/* Hint */}
      <div className="px-5 py-2 bg-slate-50/60 border-b border-slate-100 flex items-center gap-2">
        <Pencil size={11} className="text-slate-400" />
        <span className="text-[11px] text-slate-400">Klik sel mana saja untuk mengedit data langsung. Scroll horizontal untuk kolom lainnya →</span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto chat-scroll">
        <table className="w-max text-sm">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-100">
              <th className="text-left px-3 py-2.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider min-w-[40px] sticky left-0 bg-slate-50/95 z-10">
                No
              </th>
              {NASABAH_COLUMNS.map(col => {
                const isPrimary = PRIMARY_COLUMNS.includes(col.key)
                return (
                  <th key={col.key}
                    className={`text-left px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wider ${col.width}
                      ${isPrimary ? 'text-primary-600 bg-primary-50/40' : 'text-slate-400'}`}>
                    {col.label}
                    {col.source === 'ocr' && <span className="ml-1 text-[8px] text-blue-400 normal-case">(OCR)</span>}
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row, i) => {
              const isSaved = savedRows.includes(row.id)
              const isLowConf = row.confidence < 80
              return (
                <tr key={row.id}
                  className={`transition-colors ${isSaved ? 'bg-emerald-50/40' :
                    isLowConf ? 'bg-amber-50/30' :
                      'hover:bg-primary-50/30'
                    }`}>
                  <td className="px-3 py-2 text-slate-400 font-medium text-xs sticky left-0 bg-white/95 z-10 border-r border-slate-100">
                    <div className="flex items-center gap-1.5">
                      <span>{i + 1}</span>
                      {isLowConf && <AlertTriangle size={11} className="text-amber-400" />}
                    </div>
                  </td>
                  {NASABAH_COLUMNS.map(col => {
                    const isEditing = editCell?.rowIdx === i && editCell?.col === col.key
                    const isPrimary = PRIMARY_COLUMNS.includes(col.key)
                    return (
                      <td key={col.key}
                        className={`px-2 py-1.5 ${col.width} ${isPrimary ? 'bg-primary-50/20' : ''}`}>
                        <EditableCell
                          value={isEditing ? draft : (row[col.key] ?? '')}
                          onChange={setDraft}
                          isEditing={isEditing}
                          onStartEdit={() => startEdit(i, col.key, row[col.key])}
                          onCommit={commitEdit}
                          onCancel={cancelEdit}
                        />
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center gap-3 px-5 py-4 border-t border-slate-100 bg-slate-50/50">
        <button onClick={handleSave}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold cursor-pointer transition-all duration-200
            ${hasChanges
              ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md shadow-emerald-500/20 hover:shadow-lg hover:scale-[1.02] active:scale-[0.97]'
              : 'bg-white border border-slate-200 text-slate-400 cursor-default'
            }`}
          disabled={!hasChanges}
        >
          <img src={sheetsIcon} alt="Sheets" className="w-4 h-4 object-contain" />
          <Save size={14} />
          Simpan ke Sheets
        </button>

        <button onClick={onExportPdf}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold cursor-pointer
            bg-white border border-slate-200 text-slate-700 shadow-sm
            hover:bg-primary-50 hover:border-primary-300 hover:text-primary-700
            active:scale-[0.97] transition-all duration-200">
          <Download size={16} />
          Export PDF
        </button>

        {showEmailInput ? (
          <div className="flex items-center gap-2 bg-white rounded-xl shadow-sm border border-amber-200 p-1 pl-3 animate-in slide-in-from-right-2">
            <input 
              type="email" 
              list="email-history"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              placeholder="Masukkan email..."
              className="outline-none text-sm w-48 text-slate-700 bg-transparent font-medium"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleSendCto()}
            />
            <datalist id="email-history">
              {emailHistory.map(email => <option key={email} value={email} />)}
            </datalist>
            <button onClick={handleSendCto} title="Kirim Email"
              className="p-1.5 bg-gradient-to-r from-amber-400 to-yellow-400 text-white rounded-lg hover:shadow-md cursor-pointer transition-all">
              <Send size={16} />
            </button>
            <button onClick={() => setShowEmailInput(false)} title="Batal"
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors">
              <X size={16} />
            </button>
          </div>
        ) : (
          <button onClick={() => setShowEmailInput(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold cursor-pointer
              bg-gradient-to-r from-amber-400 to-yellow-400 text-white shadow-md shadow-amber-400/25
              hover:shadow-lg hover:scale-[1.02] active:scale-[0.97] transition-all duration-200">
            <img src={mailIcon} alt="Gmail" className="w-4 h-4 object-contain" />
            Kirim Laporan
          </button>
        )}
      </div>
    </div>
  )
}

import { CheckCircle2, AlertTriangle, Download, Send, FileText } from 'lucide-react'

/* ── Per-image extracted data card ── */
export function ExtractedDataCard({ data }) {
  const isLow = data.confidence < 80
  return (
    <div className={`rounded-2xl border p-4 transition-all duration-200 hover:shadow-md
      ${isLow ? 'bg-amber-50/60 border-amber-200' : 'bg-white/80 border-slate-200/70'}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <FileText size={15} className="text-primary-500" />
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Data Nasabah</span>
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
        {[
          ['NIK', data.nik],
          ['Nama', data.nama],
          ['Telepon', data.telepon],
          ['Ibu Kandung', data.ibuKandung],
        ].map(([label, val]) => (
          <div key={label} className="contents">
            <span className="text-slate-400 font-medium text-xs">{label}</span>
            <span className={`font-semibold ${isLow && val.includes('?') ? 'text-amber-600 bg-amber-100 px-1.5 rounded' : 'text-slate-800'}`}>
              {val}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Compiled spreadsheet table (AI output) ── */
export function SpreadsheetTable({ data, onExportPdf, onSendCto }) {
  return (
    <div className="rounded-2xl border border-slate-200/70 bg-white/90 backdrop-blur-sm overflow-hidden shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-2 px-5 py-3.5 bg-gradient-to-r from-primary-50 to-blue-50 border-b border-slate-100">
        <span className="text-base">📊</span>
        <span className="text-sm font-bold text-primary-800">Spreadsheet Batch — {data.length} Nasabah</span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-100">
              {['No', 'NIK', 'Nama Lengkap', 'No. Telepon', 'Nama Ibu Kandung'].map(h => (
                <th key={h} className="text-left px-4 py-2.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.map((row, i) => (
              <tr key={row.id} className="hover:bg-primary-50/30 transition-colors">
                <td className="px-4 py-2.5 text-slate-400 font-medium text-xs">{i + 1}</td>
                <td className="px-4 py-2.5 font-mono text-xs text-slate-600">{row.nik}</td>
                <td className="px-4 py-2.5 font-semibold text-slate-800 text-xs">{row.nama}</td>
                <td className="px-4 py-2.5 text-slate-600 text-xs">{row.telepon}</td>
                <td className="px-4 py-2.5 text-slate-600 text-xs">{row.ibuKandung}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center gap-3 px-5 py-4 border-t border-slate-100 bg-slate-50/50">
        <button onClick={onExportPdf}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold cursor-pointer
            bg-white border border-slate-200 text-slate-700 shadow-sm
            hover:bg-primary-50 hover:border-primary-300 hover:text-primary-700
            active:scale-[0.97] transition-all duration-200">
          <Download size={16} />
          Export as PDF
        </button>
        <button onClick={onSendCto}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold cursor-pointer
            bg-gradient-to-r from-primary-600 to-blue-500 text-white shadow-md shadow-primary-500/20
            hover:shadow-lg hover:scale-[1.02] active:scale-[0.97] transition-all duration-200">
          <Send size={16} />
          Kirim ke CTO
        </button>
      </div>
    </div>
  )
}

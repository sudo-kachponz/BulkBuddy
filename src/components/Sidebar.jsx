import { MessageSquarePlus, Clock, ChevronLeft, ChevronRight, MoreVertical } from 'lucide-react'
import logoIcon from '../assets/logo.svg'
import sheetIcon from '../assets/sheet.svg'

export default function Sidebar({ collapsed, onToggle, onNewChat, historyData = [], onSelectChat }) {
  return (
    <aside className={`relative flex flex-col bg-white/90 backdrop-blur-md border-r border-slate-200/70 transition-all duration-300 ease-in-out ${collapsed ? 'w-16' : 'w-72'}`}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-5 pb-4">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-sm shrink-0">
          <img src={logoIcon} alt="Logo" className="w-8 h-8" />
        </div>
        {!collapsed && <span className="text-lg font-bold text-primary-800 tracking-tight truncate">BulkBuddy</span>}
      </div>

      {/* New Chat */}
      <div className="px-3 mb-4">
        <button onClick={onNewChat}
          className={`w-full flex items-center gap-2.5 py-2.5 rounded-2xl font-semibold text-sm cursor-pointer
            bg-gradient-to-r from-primary-600 to-primary-500 text-white shadow-md shadow-primary-500/20
            hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-200
            ${collapsed ? 'justify-center px-0' : 'px-4'}`}>
          <MessageSquarePlus size={18} />
          {!collapsed && <span>✨ New Sheet</span>}
        </button>
      </div>

    {/* History (Drive Style Cards) */}
      {!collapsed && (
        <div className="flex-1 overflow-y-auto px-3 chat-scroll">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest px-2 mb-3">Spreadsheets</p>
          <div className="space-y-3">
            {historyData.map(chat => (
              <button key={chat.id} onClick={() => onSelectChat && onSelectChat(chat)}
                className="w-full text-left bg-slate-100 border border-slate-200 rounded-xl overflow-hidden hover:ring-2 hover:ring-primary-500 transition-all duration-200 group cursor-pointer flex flex-col shadow-sm">
                
                {/* Header */}
                <div className="flex items-center gap-2.5 px-3 py-2.5">
                  <img src={sheetIcon} alt="Sheets" className="w-4 h-4 opacity-90" />
                  <p className="text-sm font-semibold text-slate-800 truncate flex-1">{chat.title || "Spreadsheet"}</p>
                  <MoreVertical size={16} className="text-slate-400 group-hover:text-slate-600 shrink-0" />
                </div>
                
                {/* Preview Image (Live CSS Mockup with Real Data) */}
                <div className="mx-3 bg-white h-24 rounded border border-slate-200 flex flex-col gap-[2px] p-2 overflow-hidden opacity-95 group-hover:opacity-100 transition-opacity">
                  {/* Mock Table Header */}
                  <div className="flex gap-1 h-3 bg-yellow-200/80 rounded-sm w-full mb-1 items-center px-1">
                    <span className="text-[5px] font-bold text-slate-700 w-1/4 truncate">NAMA</span>
                    <span className="text-[5px] font-bold text-slate-700 w-1/5 truncate">L/P</span>
                    <span className="text-[5px] font-bold text-slate-700 w-2/5 truncate">NO KTP</span>
                    <span className="text-[5px] font-bold text-slate-700 w-1/4 truncate">TGL LHR</span>
                  </div>
                  {/* Mock Rows */}
                  {chat.working_data && chat.working_data.length > 0 ? (
                    chat.working_data.slice(0, 5).map((row, i) => (
                      <div key={i} className="flex gap-1 items-center px-1 border-b border-slate-100 pb-[1px]">
                        <span className="text-[5px] text-slate-500 w-1/4 truncate">{row.nama || '—'}</span>
                        <span className="text-[5px] text-slate-500 w-1/5 truncate">{row.kelamin || '—'}</span>
                        <span className="text-[5px] text-slate-500 w-2/5 truncate">{row.no_ktp || '—'}</span>
                        <span className="text-[5px] text-slate-500 w-1/4 truncate">{row.tgl_lhr || '—'}</span>
                      </div>
                    ))
                  ) : (
                    [...Array(5)].map((_, i) => (
                      <div key={i} className="flex gap-1 mt-0.5 px-1">
                        <div className="h-1 bg-slate-200 rounded-sm w-1/4"></div>
                        <div className="h-1 bg-slate-200 rounded-sm w-1/5"></div>
                        <div className="h-1 bg-slate-200 rounded-sm w-2/5"></div>
                        <div className="h-1 bg-slate-200 rounded-sm w-1/4"></div>
                      </div>
                    ))
                  )}
                </div>
                
                {/* Footer */}
                <div className="flex items-center gap-2 px-3 py-2.5 mt-1">
                  <div className="w-5 h-5 rounded-full bg-primary-100 border border-primary-200 flex items-center justify-center text-[9px] text-primary-700 font-bold shrink-0">
                    You
                  </div>
                  <p className="text-[11px] text-slate-500 truncate">You opened • {chat.time}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Collapse toggle */}
      <button onClick={onToggle}
        className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white border border-slate-200 shadow-sm
          flex items-center justify-center hover:bg-primary-50 hover:border-primary-300 transition-colors cursor-pointer z-10">
        {collapsed ? <ChevronRight size={13} className="text-slate-500" /> : <ChevronLeft size={13} className="text-slate-500" />}
      </button>
    </aside>
  )
}

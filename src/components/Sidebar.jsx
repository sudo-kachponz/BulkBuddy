import { MessageSquarePlus, Clock, Rocket, ChevronLeft, ChevronRight } from 'lucide-react'
import { MOCK_HISTORY } from '../data/mockData'

export default function Sidebar({ collapsed, onToggle, onNewChat }) {
  return (
    <aside className={`relative flex flex-col bg-white/90 backdrop-blur-md border-r border-slate-200/70 transition-all duration-300 ease-in-out ${collapsed ? 'w-16' : 'w-72'}`}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-5 pb-4">
        <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-primary-600 to-primary-400 flex items-center justify-center shadow-lg shadow-primary-500/20 shrink-0">
          <Rocket size={18} className="text-white" />
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
          {!collapsed && <span>Chat Baru</span>}
        </button>
      </div>

      {/* History */}
      {!collapsed && (
        <div className="flex-1 overflow-y-auto px-3 chat-scroll">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest px-2 mb-2">Riwayat</p>
          <div className="space-y-1">
            {MOCK_HISTORY.map(chat => (
              <button key={chat.id}
                className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-primary-50 transition-colors duration-150 group cursor-pointer">
                <p className="text-sm font-medium text-slate-700 truncate group-hover:text-primary-700">{chat.title}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Clock size={10} className="text-slate-300" />
                  <p className="text-[11px] text-slate-400 truncate">{chat.time} — {chat.preview}</p>
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

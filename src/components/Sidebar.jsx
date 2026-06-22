import { MessageSquarePlus, Clock, ChevronLeft, ChevronRight, Edit2, X, Check } from 'lucide-react'
import logoIcon from '../assets/logo.svg'
import { useState } from 'react'

export default function Sidebar({ collapsed, onToggle, onNewChat, historyData = [], onSelectChat, onUpdateTitle }) {
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingChat, setEditingChat] = useState(null)
  const [newTitle, setNewTitle] = useState('')

  const handleEditClick = (e, chat) => {
    e.stopPropagation()
    setEditingChat(chat)
    setNewTitle(chat.title || '')
    setEditModalOpen(true)
  }

  const handleSaveTitle = () => {
    if (editingChat && newTitle.trim()) {
      onUpdateTitle && onUpdateTitle(editingChat.id, newTitle.trim())
    }
    setEditModalOpen(false)
  }
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
          {!collapsed && <span>Chat Baru</span>}
        </button>
      </div>

    {/* History */}
      {!collapsed && (
        <div className="flex-1 overflow-y-auto px-3 chat-scroll">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest px-2 mb-2">Riwayat</p>
          <div className="space-y-1">
            {historyData.map(chat => (
              <div key={chat.id} className="relative group/item">
                <button onClick={() => onSelectChat && onSelectChat(chat)}
                  className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-primary-50 transition-colors duration-150 group cursor-pointer pr-8">
                  <p className="text-sm font-medium text-slate-700 truncate group-hover:text-primary-700">{chat.title}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Clock size={10} className="text-slate-300" />
                    <p className="text-[11px] text-slate-400 truncate">{chat.time} — {chat.preview}</p>
                  </div>
                </button>
                <button 
                  onClick={(e) => handleEditClick(e, chat)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-300 hover:text-primary-600 hover:bg-white rounded-lg opacity-0 group-hover/item:opacity-100 transition-all cursor-pointer shadow-sm"
                  title="Edit Nama Sesi"
                >
                  <Edit2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Edit Modal Popup */}
      {editModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 shadow-xl w-full max-w-sm animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-slate-800">Edit Nama Sesi</h3>
              <button onClick={() => setEditModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer"><X size={18}/></button>
            </div>
            <input 
              type="text" 
              value={newTitle} 
              onChange={e => setNewTitle(e.target.value)}
              className="w-full px-4 py-2 border border-slate-200 rounded-xl mb-4 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm font-medium text-slate-700"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setEditModalOpen(false)} className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-xl transition-colors text-sm cursor-pointer">Batal</button>
              <button onClick={handleSaveTitle} className="px-4 py-2 bg-primary-600 text-white font-medium hover:bg-primary-700 rounded-xl transition-colors text-sm shadow-md cursor-pointer flex items-center gap-1.5"><Check size={16}/> Simpan</button>
            </div>
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

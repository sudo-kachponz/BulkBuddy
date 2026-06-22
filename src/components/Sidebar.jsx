import { useState, useRef, useEffect } from 'react'
import { MessageSquarePlus, ChevronLeft, ChevronRight, MoreVertical, FolderOpen, Trash2, X, Edit2, Check } from 'lucide-react'
import logoIcon from '../assets/logo.svg'
import sheetIcon from '../assets/sheet.svg'

/* ── Confirm Dialog ── */
function ConfirmDialog({ title, message, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
      {/* Dialog */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 z-10 msg-enter">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
            <Trash2 size={18} className="text-red-500" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-base">{title}</h3>
            <p className="text-sm text-slate-500 mt-1">{message}</p>
          </div>
          <button onClick={onCancel} className="ml-auto text-slate-400 hover:text-slate-600 shrink-0 cursor-pointer">
            <X size={18} />
          </button>
        </div>
        <div className="flex gap-2 justify-end">
          <button onClick={onCancel}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer">
            Batal
          </button>
          <button onClick={onConfirm}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-red-500 hover:bg-red-600 transition-colors cursor-pointer">
            Hapus
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Dropdown Menu per Card ── */
function CardMenu({ chat, onSelect, onDelete, onRename }) {
  const [open, setOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const menuRef = useRef(null)

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const handleDelete = (e) => {
    e.stopPropagation()
    setOpen(false)
    setConfirmDelete(true)
  }

  const handleOpen = (e) => {
    e.stopPropagation()
    setOpen(false)
    onSelect(chat)
  }

  return (
    <>
      {confirmDelete && (
        <ConfirmDialog
          title="Hapus Sesi?"
          message={`Sesi "${chat.title || 'Spreadsheet'}" akan dihapus permanen dan tidak bisa dikembalikan.`}
          onConfirm={() => { setConfirmDelete(false); onDelete(chat.id) }}
          onCancel={() => setConfirmDelete(false)}
        />
      )}

      <div className="relative shrink-0" ref={menuRef}>
        <button
          onClick={(e) => { e.stopPropagation(); setOpen(o => !o) }}
          className="p-1 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
        >
          <MoreVertical size={15} className="text-slate-400 group-hover:text-slate-600" />
        </button>

        {open && (
          <div className="absolute right-0 top-7 z-[100] bg-white border border-slate-200 rounded-xl shadow-xl w-36 overflow-hidden py-1 msg-enter">
            <button
              onClick={handleOpen}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <FolderOpen size={14} className="text-primary-500" />
              Buka
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setOpen(false); onRename(chat) }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <Edit2 size={14} className="text-primary-500" />
              Ubah Nama
            </button>
            <div className="border-t border-slate-100 mx-2 my-1" />
            <button
              onClick={handleDelete}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
            >
              <Trash2 size={14} />
              Hapus
            </button>
          </div>
        )}
      </div>
    </>
  )
}

export default function Sidebar({ collapsed, onToggle, onNewChat, historyData = [], onSelectChat, onDeleteChat, onUpdateTitle }) {
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingChat, setEditingChat] = useState(null)
  const [newTitle, setNewTitle] = useState('')

  const handleRenameClick = (chat) => {
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
    <aside className={`relative flex flex-col bg-white/90 backdrop-blur-md border-r border-slate-200/70 transition-all duration-300 ease-in-out z-[60] ${collapsed ? 'w-16' : 'w-72'}`}>
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
              <div key={chat.id}
                className="w-full text-left bg-slate-100 border border-slate-200 rounded-xl overflow-hidden hover:ring-2 hover:ring-primary-500 transition-all duration-200 group flex flex-col shadow-sm">

                {/* Header */}
                <div className="flex items-center gap-2.5 px-3 py-2.5">
                  <img src={sheetIcon} alt="Sheets" className="w-4 h-4 opacity-90 shrink-0" />
                  <p
                    className="text-sm font-semibold text-slate-800 truncate flex-1 cursor-pointer"
                    onClick={() => onSelectChat && onSelectChat(chat)}
                  >{chat.title || "Spreadsheet"}</p>
                  <CardMenu
                    chat={chat}
                    onSelect={(c) => onSelectChat && onSelectChat(c)}
                    onDelete={(id) => onDeleteChat && onDeleteChat(id)}
                    onRename={handleRenameClick}
                  />
                </div>

                {/* Preview (Live CSS Mockup with Real Data) */}
                <div
                  className="mx-3 bg-white h-24 rounded border border-slate-200 flex flex-col gap-[2px] p-2 overflow-hidden opacity-95 group-hover:opacity-100 transition-opacity cursor-pointer"
                  onClick={() => onSelectChat && onSelectChat(chat)}
                >
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
                <div
                  className="flex items-center gap-2 px-3 py-2.5 mt-1 cursor-pointer"
                  onClick={() => onSelectChat && onSelectChat(chat)}
                >
                  <div className="w-5 h-5 rounded-full bg-primary-100 border border-primary-200 flex items-center justify-center text-[9px] text-primary-700 font-bold shrink-0">
                    You
                  </div>
                  <p className="text-[11px] text-slate-500 truncate">You opened • {chat.time}</p>
                </div>
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
              <h3 className="font-bold text-slate-800">Ubah Nama Sesi</h3>
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

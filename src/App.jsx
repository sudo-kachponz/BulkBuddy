import { useState, useCallback } from 'react'
import Sidebar from './components/Sidebar'
import ChatArea from './components/ChatArea'
import InputBar from './components/InputBar'
import InteractiveTutorial from './components/InteractiveTutorial'
import { MOCK_NASABAH, QUICK_ACTIONS } from './data/mockData'
import mandiriLogo from './assets/bankmandiri_light.png'

/* ── Helper: simulate AI delay ── */
const delay = (ms) => new Promise(r => setTimeout(r, ms))

/* ── Toast Component ── */
function Toast({ toast, onClose }) {
  if (!toast) return null
  const colors = {
    success: 'from-emerald-500 to-teal-500',
    info: 'from-primary-500 to-blue-500',
    warning: 'from-amber-500 to-orange-500',
  }
  return (
    <div className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl text-sm font-semibold text-white bg-gradient-to-r ${colors[toast.type] || colors.info} msg-enter`}>
      {toast.msg}
      <button onClick={onClose} className="ml-2 hover:opacity-70 cursor-pointer text-white/80">✕</button>
    </div>
  )
}

/* ══════════════════════════════════════════
   ═  MAIN APP
   ══════════════════════════════════════════ */
export default function App() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [messages, setMessages] = useState([])
  const [isTyping, setIsTyping] = useState(false)
  const [toast, setToast] = useState(null)

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 4000)
  }

  /* ── Simulate the full AI flow ── */
  const simulateAIResponse = useCallback(async (userMsg) => {
    setIsTyping(true)

    const hasFiles = userMsg.files && userMsg.files.length > 0
    const isInputRequest = userMsg.text.toLowerCase().includes('input') || hasFiles

    if (isInputRequest && hasFiles) {
      await delay(1200)
      setMessages(prev => [...prev, {
        role: 'ai',
        text: `📄 Menerima ${userMsg.files.length} dokumen. Memproses OCR & ekstraksi data...`,
      }])

      await delay(2000)
      const usedData = MOCK_NASABAH.slice(0, Math.min(userMsg.files.length, MOCK_NASABAH.length))
      setMessages(prev => [...prev, {
        role: 'ai',
        text: `✅ Berhasil mengekstrak data dari ${usedData.length} dokumen:`,
        dataCards: usedData,
      }])

      await delay(1500)
      setMessages(prev => [...prev, {
        role: 'ai',
        text: '📊 Spreadsheet sudah siap. Klik sel mana saja untuk mengedit langsung, lalu klik "Simpan ke Sheet" atau kirim ke CTO.',
        spreadsheet: usedData,
      }])
    } else if (isInputRequest && !hasFiles) {
      await delay(1000)
      setMessages(prev => [...prev, {
        role: 'ai',
        text: '📎 Silakan lampirkan foto form fisik nasabah terlebih dahulu. Saya akan otomatis mengekstrak data NIK, Nama, No. Telepon, dan Nama Ibu Kandung dari dokumen.',
      }])
    } else if (userMsg.text.toLowerCase().includes('hapus')) {
      await delay(1000)
      setMessages(prev => [...prev, {
        role: 'ai',
        text: '🗑️ Untuk menghapus data nasabah, silakan berikan NIK atau Nama Lengkap yang ingin dihapus. Saya akan mencari di database via MCP.',
      }])
    } else if (userMsg.text.toLowerCase().includes('status') || userMsg.text.toLowerCase().includes('cek')) {
      await delay(1000)
      setMessages(prev => [...prev, {
        role: 'ai',
        text: '📋 Batch terakhir: 5 nasabah berhasil diinput pada 10 Juni 2026 pukul 14:30 WIB. Status: ✅ Semua data sudah dikirim ke CTO.',
      }])
    } else {
      await delay(800)
      setMessages(prev => [...prev, {
        role: 'ai',
        text: '👋 Saya BulkBuddy AI Agent — siap membantu input data nasabah dari form fisik. Lampirkan foto dokumen atau pilih aksi yang tersedia!',
      }])
    }

    setIsTyping(false)
  }, [])

  /* ── Handle user sending message ── */
  const handleSend = useCallback(async ({ text, files, previews }) => {
    const userMsg = { role: 'user', text, files, previews }
    setMessages(prev => [...prev, userMsg])
    await simulateAIResponse(userMsg)
  }, [simulateAIResponse])

  /* ── Quick action = auto-send ── */
  const handleQuickAction = useCallback((message) => {
    handleSend({ text: message, files: [], previews: [] })
  }, [handleSend])

  /* ── New chat ── */
  const handleNewChat = () => {
    setMessages([])
    setIsTyping(false)
  }

  /* ── Export PDF (mock) ── */
  const handleExportPdf = () => {
    showToast('📥 PDF berhasil di-download!', 'success')
  }

  /* ── Send to CTO via MCP Gmail (mock) ── */
  const handleSendCto = async () => {
    setIsTyping(true)
    await delay(1500)
    setMessages(prev => [...prev, {
      role: 'ai',
      text: '📧 PDF berhasil dikirim ke CTO via MCP Gmail!\n\n📬 To: cto@bankmandiri.co.id\n📝 Subject: [BulkBuddy] Batch Data Nasabah — 11 Juni 2026\n✅ Status: Terkirim',
    }])
    setIsTyping(false)
    showToast('📧 Email berhasil dikirim ke CTO!', 'info')
  }

  /* ── Save to Sheet via MCP ── */
  const handleSaveToSheet = async (updatedData, mcpPayload) => {
    setIsTyping(true)
    await delay(1000)
    // mcpPayload is the MCP-ready JSON (CSV-header-keyed rows + metadata)
    const preview = JSON.stringify(mcpPayload || updatedData, null, 2)
    setMessages(prev => [...prev, {
      role: 'ai',
      text: `✅ AI mengirim ${updatedData.length} baris ke Google Sheets via MCP Spreadsheet:\n\n\`\`\`json\n${preview.slice(0, 600)}${preview.length > 600 ? '\n...' : ''}\n\`\`\``,
    }])
    setIsTyping(false)
    showToast('📊 Data berhasil disimpan ke Google Sheets!', 'success')
  }

  const isEmpty = messages.length === 0

  return (
    <div className="h-screen flex font-poppins bg-[#f0f4f8]">
      <Toast toast={toast} onClose={() => setToast(null)} />

      {/* Mandiri Logo — pojok kanan atas */}
      <div className="fixed top-3 right-5 z-50">
        <img src={mandiriLogo} alt="Bank Mandiri" className="h-8 object-contain" />
      </div>

      {/* Sidebar */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(c => !c)}
        onNewChat={handleNewChat}
      />

      {/* Main Chat Panel */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-slate-200/70 bg-white/80 backdrop-blur-md">
          <div>
            <h1 className="text-sm font-bold text-slate-800">AUTOMASI APLIKASI PEMBUKAAN REKENING PRODUK DANA PERORANGAN</h1>
            <p className="text-[11px] text-slate-400">PERSONAL ACCOUNT OPENING APPLICATION FORM AUTOMATION</p>
          </div>
          <div className="flex items-center gap-4 mr-32">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] font-semibold text-emerald-600">Online</span>
            </div>
          </div>
        </div>

        {/* Chat area or empty state (tutorial) */}
        {isEmpty ? (
          <InteractiveTutorial onQuickAction={handleQuickAction} />
        ) : (
          <ChatArea
            messages={messages}
            isTyping={isTyping}
            onExportPdf={handleExportPdf}
            onSendCto={handleSendCto}
            onSaveToSheet={handleSaveToSheet}
          />
        )}

        {/* Input bar */}
        <InputBar onSend={handleSend} disabled={isTyping} />
      </div>
    </div>
  )
}

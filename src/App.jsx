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

  /* ── Stream Agent Invoke ── */
  const streamAgentInvoke = async (promptText, actionType = 'chat') => {
    setIsTyping(true)
    let aiMessageIndex = -1

    try {
      const response = await fetch("http://localhost:8000/agent-invoke/fff649af-1f16-4027-9371-76a4d587096b/invoke-stream", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          input: {
            messages: promptText,
            context: "",
            image_path: null
          },
          config: {
            configurable: {
              thread_id: "1"
            }
          },
          metadata: {
            model_name: "anthropic/claude-sonnet-4.6",
            reset_memory: false,
            load_from_json: true,
            agent_style: ""
          }
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder("utf-8")
      let buffer = ""
      let aiText = ""
      let currentEvent = ""

      setMessages(prev => {
        const newMessages = [...prev, { role: 'ai', text: 'Menghubungkan ke Agent...' }]
        aiMessageIndex = newMessages.length - 1
        return newMessages
      })

      while (true) {
        const { value, done } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split("\n")
        buffer = lines.pop() || ""

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim()
          if (!line) continue

          if (line.startsWith("event:")) {
            currentEvent = line.replace("event:", "").trim()
          } else if (line.startsWith("data:")) {
            const rawData = line.replace("data:", "").trim()
            try {
              const data = JSON.parse(rawData)
              if (currentEvent === "token") {
                aiText += data.token
                setMessages(prev => {
                  const updated = [...prev]
                  if (aiMessageIndex !== -1 && updated[aiMessageIndex]) {
                    updated[aiMessageIndex].text = aiText
                  }
                  return updated
                })
              } else if (currentEvent === "status") {
                if (data.status && data.status !== "Agent Execution End") {
                  setMessages(prev => {
                    const updated = [...prev]
                    if (aiMessageIndex !== -1 && updated[aiMessageIndex]) {
                      updated[aiMessageIndex].text = `⏱️ Status: ${data.status}...\n\n${aiText}`
                    }
                    return updated
                  })
                }
              } else if (currentEvent === "tool_status") {
                const statusSymbol = data.is_start ? "🛠️" : "✅"
                setMessages(prev => {
                  const updated = [...prev]
                  if (aiMessageIndex !== -1 && updated[aiMessageIndex]) {
                    updated[aiMessageIndex].text = `⏱️ ${statusSymbol} Tool [${data.tool_name}]: ${data.status}\n\n${aiText}`
                  }
                  return updated
                })
              }
            } catch (e) {
              console.error("Failed to parse SSE data JSON:", rawData, e)
            }
          }
        }
      }

      // Post-stream actions
      if (actionType === 'Kirim ke CTO') {
        showToast('📧 Email berhasil dikirim ke CTO!', 'info')
      } else if (actionType === 'Simpan ke Sheets') {
        showToast('📊 Data berhasil disimpan ke Google Sheets!', 'success')
      } else {
        showToast('AI selesai memproses permintaan', 'success')
      }

    } catch (error) {
      console.error("Error invoking agent:", error)
      showToast("Gagal berkomunikasi dengan Agent", "warning")
      setMessages(prev => {
        const updated = [...prev]
        if (aiMessageIndex !== -1 && updated[aiMessageIndex]) {
          updated[aiMessageIndex].text = `❌ Terjadi kesalahan: ${error.message}`
        }
        return updated
      })
    } finally {
      setIsTyping(false)
    }
  }

  /* ── Handle user sending message ── */
  const handleSend = useCallback(async ({ text, files, previews }) => {
    const userMsg = { role: 'user', text, files, previews }
    setMessages(prev => [...prev, userMsg])
    
    const hasFiles = files && files.length > 0
    if (hasFiles) {
      await simulateAIResponse(userMsg)
    } else {
      await streamAgentInvoke(text)
    }
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

  /* ── Send to CTO via MCP Gmail ── */
  const handleSendCto = async (rows) => {
    const dataString = JSON.stringify(rows, null, 2)
    const prompt = `Kirim email berisi data nasabah berikut ke email neutracksudo@gmail.com. Subjek email: '[BulkBuddy] Batch Data Nasabah — 11 Juni 2026'. Tulis format email yang sangat profesional dengan format khas Bank Mandiri (gunakan HTML table agar rapi di body email). Data nasabah: \n${dataString}`
    
    // Add user intent message to the chat first
    setMessages(prev => [...prev, {
      role: 'user',
      text: 'Kirim laporan data nasabah ini ke CTO via Gmail'
    }])

    await streamAgentInvoke(prompt, 'Kirim ke CTO')
  }

  /* ── Save to Sheet via MCP ── */
  const handleSaveToSheet = async (updatedData) => {
    const dataString = JSON.stringify(updatedData, null, 2)
    const prompt = `Simpan data nasabah berikut ke Google Sheets. Jika spreadsheet belum ada, buat spreadsheet baru dengan nama 'Data Nasabah Mandiri BulkBuddy'. Tuliskan baris-baris data nasabah ini ke sheet tersebut. Data nasabah: \n${dataString}`

    // Add user intent message to the chat first
    setMessages(prev => [...prev, {
      role: 'user',
      text: 'Simpan data nasabah ini ke Google Sheets'
    }])

    await streamAgentInvoke(prompt, 'Simpan ke Sheets')
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

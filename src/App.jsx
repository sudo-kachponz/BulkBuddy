import { useState, useCallback, useEffect, useRef } from 'react'
import Sidebar from './components/Sidebar'
import ChatArea from './components/ChatArea'
import InputBar from './components/InputBar'
import InteractiveTutorial from './components/InteractiveTutorial'
import { MOCK_NASABAH, QUICK_ACTIONS } from './data/mockData'
import mandiriLogo from './assets/bankmandiri_light.png'
import mailIcon from './assets/mail.svg'
import sheetIcon from './assets/sheet.svg'
import { toSheetRow, createEmptyNasabah } from './data/schema'
import { useChatHistory } from './hooks/useChatHistory'

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
    <div className={`fixed top-16 md:top-20 right-4 md:right-5 z-[60] flex items-center justify-between gap-3 px-5 py-3 rounded-2xl shadow-2xl text-sm font-semibold text-white bg-gradient-to-r ${colors[toast.type] || colors.info} msg-enter max-w-[calc(100vw-32px)] md:max-w-md break-words whitespace-normal leading-snug`}>
      <span className="flex-1">{toast.msg}</span>
      <button onClick={onClose} className="ml-2 hover:opacity-70 cursor-pointer text-white/80 shrink-0">✕</button>
    </div>
  )
}

/* ══════════════════════════════════════════
   ═  MAIN APP
   ══════════════════════════════════════════ */
export default function App() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true)

  useEffect(() => {
    if (window.innerWidth >= 768) {
      setSidebarCollapsed(false)
    }
  }, [])

  const [messages, setMessages] = useState([])
  const [isTyping, setIsTyping] = useState(false)
  const [toast, setToast] = useState(null)

  // Global table state
  const [workingData, setWorkingData] = useState([])
  const [activeSheetName, setActiveSheetName] = useState(null)

  // Chat History via custom hook
  const { sessions, loadSessions, getSession, createSession, updateSession } = useChatHistory()
  const [activeSession, setActiveSession] = useState(null)

  // Refs to prevent duplicate creations and track sync state
  const activeSessionRef = useRef(null)
  const creatingSessionRef = useRef(false)
  const chatThreadIdRef = useRef(crypto.randomUUID())

  // Sync ref
  useEffect(() => {
    activeSessionRef.current = activeSession
  }, [activeSession])

  // Load sidebar sessions on mount
  useEffect(() => {
    loadSessions()
  }, [loadSessions])

  // Helper to persist current UI state to backend
  const saveCurrentStateToBackend = async (newMessages, newWorkingData) => {
    if (activeSessionRef.current) {
      await updateSession(activeSessionRef.current.id, {
        messages: newMessages,
        workingData: newWorkingData
      })
    } else {
      if (creatingSessionRef.current) return;
      creatingSessionRef.current = true;
      try {
        const sess = await createSession({
          messages: newMessages,
          workingData: newWorkingData,
          thread_id: chatThreadIdRef.current
        })
        if (sess) {
          setActiveSession(sess)
          activeSessionRef.current = sess
        }
      } finally {
        creatingSessionRef.current = false;
      }
    }
  }

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 4000)
  }

  /* ── Stream Agent Invoke ── */
  const streamAgentInvoke = async (promptText, images = [], actionType = 'chat', isSilent = false) => {
    if (!isSilent) setIsTyping(true)
    let aiMessageIndex = -1

    const thread_id = chatThreadIdRef.current

    try {
      const response = await fetch("http://localhost:8000/agent-invoke/fff649af-1f16-4027-9371-76a4d587096b/invoke-stream", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          input: {
            messages: promptText,
            context: "ATURAN WAJIB MUTLAK: Jika Anda membaca, memanipulasi, atau mengeluarkan data nasabah, Anda WAJIB mengeluarkannya DALAM FORMAT JSON ARRAY SEPERTI INI: ```json\n[{ \"id\": \"1\", \"nama\": \"...\", \"kelamin\": \"...\", \"tgl_lhr\": \"...\", \"no_ktp\": \"...\", \"ibu_kandung\": \"...\", \"handphone\": \"...\", \"alamat1\": \"...\", \"kodepos\": \"...\", \"currency\": \"IDR\", \"produk\": \"TABMANDIRI\", \"kode_cabang\": 12000, \"consent\": \"YYYY\" }]\n``` SANGAT DILARANG MENGGUNAKAN TABEL MARKDOWN (| Field | Value |) UNTUK MERINGKAS ATAU MENAMPILKAN DATA NASABAH! JIKA KAMU MENGGUNAKAN TABEL MARKDOWN, SISTEM FRONTEND AKAN ERROR PARAH! Tulis kata pengantar biasa, lalu langsung berikan blok JSON utuh.",
            image_path: null,
            image_urls: images.length > 0 ? images : null
          },
          config: {
            configurable: {
              thread_id: thread_id
            }
          },
          metadata: {
            model_name: "custom-vlm",
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

      let aiMessageIndex = -1;
      
      if (!isSilent) {
        setMessages(prev => {
          const newMessages = [...prev, { role: 'ai', text: 'Menghubungkan ke Agent...', isOcr: actionType === 'Input Form Fisik' }]
          aiMessageIndex = newMessages.length - 1
          return newMessages
        })
      }

      let finalSpreadsheetData = null
      let finalOptionsData = null

      while (true) {
        const { value, done } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split("\n")
        buffer = lines.pop() || ""

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim()
          if (!line) continue

          const getDisplayHtml = (text) => {
            let processed = text;
            const jsonStart = processed.indexOf('```json');
            if (jsonStart !== -1) {
              const jsonEnd = processed.indexOf('```', jsonStart + 7);
              if (jsonEnd !== -1) {
                processed = processed.substring(0, jsonStart) + processed.substring(jsonEnd + 3);
              } else {
                processed = processed.substring(0, jsonStart);
              }
            }

            // SUPER AGGRESSIVE MARKDOWN TABLE REMOVER:
            processed = processed.replace(/^\|.*\|$/gm, '');
            processed = processed.replace(/^[-|:\s]+$/gm, '');
            processed = processed.replace(/Data yang tersimpan:/g, '');

            return processed.trim();
          };

          if (line.startsWith("event:")) {
            currentEvent = line.replace("event:", "").trim()
          } else if (line.startsWith("data:")) {
            const rawData = line.replace("data:", "").trim()
            try {
              const data = JSON.parse(rawData)
              if (currentEvent === "token") {
                aiText += data.token

                // Live parse JSON array
                const jsonStart = aiText.indexOf('```json');
                let spreadsheetData = null;
                let optionsData = null;
                if (jsonStart !== -1) {
                  const jsonEnd = aiText.indexOf('```', jsonStart + 7);
                  let jsonStr = '';
                  if (jsonEnd !== -1) {
                    jsonStr = aiText.substring(jsonStart + 7, jsonEnd);
                  } else {
                    jsonStr = aiText.substring(jsonStart + 7);
                  }

                  const objectMatches = jsonStr.match(/\{[^{}]+\}/g);
                  if (objectMatches) {
                    spreadsheetData = [];
                    optionsData = [];
                    for (const obj of objectMatches) {
                      try {
                        const parsed = JSON.parse(obj);
                        if (parsed.type === 'sheet_option' || parsed.url) {
                          optionsData.push(parsed);
                        } else {
                          spreadsheetData.push(parsed);
                        }
                      } catch (e) { }
                    }
                    if (spreadsheetData.length > 0) {
                      finalSpreadsheetData = spreadsheetData;
                    } else {
                      spreadsheetData = null;
                    }
                    if (optionsData.length > 0) {
                      finalOptionsData = optionsData;
                    } else {
                      optionsData = null;
                    }
                  }
                }
                
                if (!isSilent) {
                  setMessages(prev => {
                    const updated = [...prev]
                  if (aiMessageIndex !== -1 && updated[aiMessageIndex]) {
                    updated[aiMessageIndex].text = getDisplayHtml(aiText).trim()
                    if (spreadsheetData && spreadsheetData.length > 0) {
                      const mergedMap = new Map();
                      workingData.forEach(r => mergedMap.set(String(r.id), r));
                      spreadsheetData.forEach(r => {
                        const rid = String(r.id);
                        if (mergedMap.has(rid)) {
                          mergedMap.set(rid, { ...mergedMap.get(rid), ...r });
                        } else {
                          const newRow = createEmptyNasabah(rid);
                          for (const k in r) {
                            if (r[k] !== undefined && r[k] !== null && r[k] !== '') {
                              newRow[k] = r[k];
                            }
                          }
                          mergedMap.set(rid, newRow);
                        }
                      });
                      updated[aiMessageIndex].spreadsheet = Array.from(mergedMap.values());
                      updated[aiMessageIndex].dataCards = spreadsheetData;
                    }
                    if (optionsData && optionsData.length > 0) {
                      updated[aiMessageIndex].sheetOptions = optionsData;
                    }
                  }
                  return updated
                })
                }
              } else if (currentEvent === "status") {
                if (data.status && data.status !== "Agent Execution End") {
                  setMessages(prev => {
                    const updated = [...prev]
                    if (aiMessageIndex !== -1 && updated[aiMessageIndex]) {
                      updated[aiMessageIndex].text = `⏱️ Status: ${data.status}...\n\n${getDisplayHtml(aiText).trim()}`
                    }
                    return updated
                  })
                } else if (data.status === "Agent Execution End") {
                  setMessages(prev => {
                    const updated = [...prev]
                    if (aiMessageIndex !== -1 && updated[aiMessageIndex]) {
                      updated[aiMessageIndex].text = getDisplayHtml(aiText).trim()
                    }
                    return updated
                  })
                }
              } else if (currentEvent === "error") {
                setMessages(prev => {
                  const updated = [...prev]
                  if (aiMessageIndex !== -1 && updated[aiMessageIndex]) {
                    updated[aiMessageIndex].text = `❌ Error: ${data.error || "Unknown error"}`
                    updated[aiMessageIndex].isError = true
                  }
                  return updated
                })
                if (!isSilent) setIsTyping(false)
              } else if (currentEvent === "tool_status") {
                const statusSymbol = data.is_start ? "🛠️" : "✅"
                setMessages(prev => {
                  const updated = [...prev]
                  if (aiMessageIndex !== -1 && updated[aiMessageIndex]) {
                    updated[aiMessageIndex].text = `⏱️ ${statusSymbol} Tool [${data.tool_name}]: ${data.status}\n\n${getDisplayHtml(aiText).trim()}`
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
      setMessages(prev => {
        let finalWorkingData = workingData
        if (finalSpreadsheetData) {
          const mergedMap = new Map();
          workingData.forEach(r => mergedMap.set(String(r.id), r));
          finalSpreadsheetData.forEach(r => {
            const rid = String(r.id);
            if (mergedMap.has(rid)) {
              mergedMap.set(rid, { ...mergedMap.get(rid), ...r });
            } else {
              const newRow = createEmptyNasabah(rid);
              for (const k in r) {
                if (r[k] !== undefined && r[k] !== null && r[k] !== '') {
                  newRow[k] = r[k];
                }
              }
              mergedMap.set(rid, newRow);
            }
          });
          finalWorkingData = Array.from(mergedMap.values());
          setWorkingData(finalWorkingData)
        }

        // Save state to backend asynchronously outside the render phase
        setTimeout(() => {
          saveCurrentStateToBackend(prev, finalWorkingData)
          if (finalSpreadsheetData && finalSpreadsheetData.length > 0 && actionType === 'Input Form Fisik') {
            handleSaveToSheet(finalWorkingData)
          }
        }, 0)
        return prev
      })

      if (!isSilent) {
        if (actionType === 'Kirim ke CTO') {
          showToast('📧 Email berhasil dikirim ke CTO!', 'info')
        } else if (actionType === 'Simpan ke Sheets') {
          showToast('📊 Data berhasil disimpan ke Google Sheets!', 'success')
        } else {
          showToast('AI selesai memproses permintaan', 'success')
        }
      }

    } catch (error) {
      console.error("Error invoking agent:", error)
      if (!isSilent) {
        showToast("Gagal berkomunikasi dengan Agent", "warning")
        setMessages(prev => {
          const updated = [...prev]
          if (aiMessageIndex !== -1 && updated[aiMessageIndex]) {
            updated[aiMessageIndex].text = `❌ Terjadi kesalahan: ${error.message}`
          }
          saveCurrentStateToBackend(updated, workingData)
          return updated
        })
      }
    } finally {
      if (!isSilent) setIsTyping(false)
    }
  }

  /* ── Handle user sending message ── */
  const handleSend = useCallback(async ({ text, displayText, files, previews }) => {
    // displayText = kalimat pendek yang tampil di chat; text = prompt lengkap ke agent
    const userMsg = { role: 'user', text: displayText || text, files, previews }
    setMessages(prev => [...prev, userMsg])

    const hasFiles = files && files.length > 0
    let promptToSend = text;

    if (hasFiles) {
      if (!promptToSend || promptToSend.trim() === '') {
        promptToSend = `Tolong ekstrasi data nasabah dari HINGGA 3 FOTO sekaligus (Formulir, KTP, dan KK) secara menyilang.
SANGAT PENTING:
1. Baca nama dengan ekstra teliti! Hati-hati dengan huruf N dan M, baca pelan-pelan. NAMA NASABAH WAJIB KAPITAL (CAPSLOCK) SEMUA.
2. Ekstrak KOTA LAHIR dari bagian Tempat/Tgl Lahir dan masukkan ke "kota_lhr".
3. Ekstrak KOTA KTP dari alamat di KTP dan masukkan ke "kota_ktp".
4. Set kolom EXP KTP/PASSPORT ("exp_ktp") SELALU menjadi teks "000000".
5. Cari Nama IBU KANDUNG dengan memprioritaskan kecocokan pada dokumen Kartu Keluarga (KK).
6. Ekstrak STATUS KAWIN. Jika Menikah/Kawin, isi "M", jika Belum Kawin/Belum Menikah, isi "B". Masukkan ke "sts_kawin".
7. Pecah alamat menjadi 2: "alamat1" untuk nama jalan, dan "alamat2" HANYA berisi RT, RW, dan nama KOTA UTAMA (buang detail Kelurahan/Kecamatan/Jakarta Utara/Barat, cukup tulis "JAKARTA" atau kotanya saja). Contoh Wajib: "RT 009 RW 005 JAKARTA" atau "RT 011 RW 004 SURABAYA". Jika tidak ada RT/RW, boleh dikosongkan.
8. Ekstrak KODEPOS dan masukkan ke "kodepos".
9. Format pekerjaan ("pekerjaan") harus diisi dengan "PSW".
10. Tentukan KODE JABATAN ("jabatan"). Jika berkaitan dengan Ahli Madya, gunakan "03". Jika berkaitan dengan Ahli, gunakan "25". Jika tidak spesifik, gunakan "09" atau kode lain yang relevan.
11. Kembalikan HANYA format JSON Array yang valid, sesuai urutan baris data.
Format kunci (keys) harus sama persis dengan struktur ini:
[
  { "id": "${workingData.length + 1}", "nama": "NAMA_NASABAH", "kelamin": "F/M", "kota_lhr": "KOTA_LAHIR", "tgl_lhr": "DDMMYYYY", "no_ktp": "16_DIGIT", "kota_ktp": "KOTA", "exp_ktp": "000000", "ibu_kandung": "NAMA_IBU", "sts_kawin": "M/B", "alamat1": "NAMA_JALAN", "alamat2": "RT_RW", "kodepos": "12345", "handphone": "08XX", "pekerjaan": "PSW", "jabatan": "09", "currency": "IDR", "produk": "TABMANDIRI", "kode_cabang": 12000, "consent": "YYYY" }
]
Dilarang memberikan kata-kata pengantar atau penutup. Berikan array JSON saja di dalam \`\`\`json blok.`
      }
      await streamAgentInvoke(promptToSend, previews, 'Input Form Fisik')
    } else {
      if (text.toLowerCase().includes('tolong kirim email batch ke cto')) {
        promptToSend = `Kirim email ke neutracksudo@gmail.com. SANGAT PENTING: Gunakan format HTML murni untuk body email. Gunakan tag <b> untuk bold, <br> untuk baris baru, dan <table> untuk tabel. Jangan gunakan Markdown (* atau |).

Subjek Email: [Permohonan Pembukaan Rekening BULK Tabungan Reguler - PLN SUTET]

Isi Email (Kirimkan persis string HTML di bawah ini sebagai body):

Kepada Yth. CTO Bank Mandiri,<br><br>

Berikut adalah laporan permohonan pembukaan rekening BULK Tabungan Reguler.<br><br>

---<br><br>

<b>Cash & Trade Operations Group</b><br>
<b>Bulk Payment & Account Opening Department</b><br>
Sentra Mandiri Gedung B Lt. 4<br>
JL. RP Soeroso No. 2-4<br>
Jakarta 10330<br><br>

---<br><br>

<b>Perihal:</b> : <b>[Permohonan Pembukaan Rekening BULK Tabungan Reguler]</b><br><br>

Sehubungan dengan diadakannya kerjasama pembukaan Tabungan Reguler antara [PT Suter...] dengan Bank Mandiri Tanjung Priok Enggano (12000), dengan ini kami sampaikan permintaan pembukaan rekening secara bulk untuk dapat diproses sesuai informasi sebagai berikut:<br><br>

<ul>
<li><b>Jumlah Rekening:</b> : <b>[17 Rekening (rincian terlampir)]</b></li>
<li><b>Jenis:</b> : ACTIVE</li>
<li><b>Kode Tabungan:</b> : TABMANDIRI</li>
</ul><br>

Data dimaksud telah kami periksa dan diyakini kebenarannya telah sesuai e-KTP, yaitu :<br><br>

<table border="1" cellpadding="5" cellspacing="0" style="border-collapse: collapse;">
  <tr>
    <th>Field</th>
    <th>Keterangan</th>
  </tr>
  <tr>
    <td>NIK</td>
    <td>Wajib 16 Digit (sesuai e-KTP)</td>
  </tr>
  <tr>
    <td>Nama</td>
    <td>Ejaan/ spasi (sama persis dengan e-KTP)</td>
  </tr>
  <tr>
    <td>Tanggal Lahir</td>
    <td>Tanggal Bulan dan Tahun (sama persis dengan e-KTP)</td>
  </tr>
</table><br>

Apabila terdapat kesalahan data (tidak sesuai e-KTP), segala risiko dan akibat yang timbul setelahnya akan menjadi tanggung jawab kami.<br><br>

Demikian disampaikan, atas perhatian dan kerjasama yang baik diucapkan terima kasih.`;
      } else if (text.toLowerCase().includes('saya ingin input data nasabah baru dari form fisik')) {
        promptToSend = `Tolong ambil dan baca data nasabah terbaru dari Google Sheets menggunakan tool MCP yang tersedia.

SANGAT PENTING: Kamu WAJIB mengeluarkan output data yang berhasil dibaca dalam blok kode JSON yang MURNI.
Gunakan format list of objects persis seperti ini:
\`\`\`json
[
  { "id": "1", "nama": "...", "kelamin": "...", "tgl_lhr": "...", "no_ktp": "...", "ibu_kandung": "...", "handphone": "...", "alamat1": "...", "kodepos": "...", "currency": "IDR", "produk": "TABMANDIRI", "kode_cabang": 12000, "consent": "YYYY" }
]
\`\`\`

Setelah kamu mengeluarkan blok JSON tersebut, tuliskan kalimat ringkas biasa di bawahnya, dan pada baris paling akhir, kamu HARUS menanyakan persis kalimat ini: 'Apa anda yakin mau mengirimkan file excel ke gmail?'`;
      }
      await streamAgentInvoke(promptToSend, [])
    }
  }, [messages, workingData, activeSession])

  /* ── Quick action = auto-send ── */
  const handleQuickAction = useCallback((message) => {
    handleSend({ text: message, files: [], previews: [] })
  }, [handleSend])

  /* ── Branching Actions ── */
  const handleNewSheet = useCallback(() => {
    handleSend({
      text: "Tolong simpan ke Spreadsheet Baru.",
      displayText: "✨ Buat Spreadsheet Baru",
      files: [], previews: []
    })
  }, [handleSend])

  const handleExistingSheet = useCallback(() => {
    handleSend({
      text: `Tolong cari file spreadsheet di Google Drive yang bernama atau mengandung kata 'PLN SUTET'. 
Tampilkan maksimal 3 spreadsheet terbaru yang cocok.

SANGAT PENTING: 
1. Keluarkan output HANYA berupa JSON Array di dalam blok \`\`\`json (tanpa teks pengantar atau penutup apapun).
2. Setiap objek di dalam JSON Array WAJIB memiliki format persis seperti ini:
[
  {
    "type": "sheet_option",
    "title": "NAMA_FILE",
    "url": "URL_FILE",
    "date": "TANGGAL_DIBUAT"
  }
]
3. JANGAN LAKUKAN TINDAKAN MODIFIKASI APAPUN PADA SHEET.`,
      displayText: "🔍 Cari Spreadsheet yang Sudah Ada",
      files: [], previews: []
    })
  }, [handleSend])

  const handleSelectExistingSheet = useCallback(async (sheetOption) => {
    // sheetOption sekarang adalah object { title: "...", url: "..." }
    const sheetName = sheetOption.title ? sheetOption.title.replace(/\*/g, '').trim() : "Spreadsheet";
    const sheetUrl = sheetOption.url || sheetName;
    
    setActiveSheetName(sheetUrl) // Simpan URL-nya, bukan namanya
    
    // UI Feedback
    const userMsg = { role: 'user', text: `📄 Pakai spreadsheet: ${sheetName}`, files: [], previews: [] }
    setMessages(prev => [...prev, userMsg])
    setIsTyping(true)
    
    try {
      // Kirim URL ke backend, jangan lupa di encode
      const response = await fetch(`http://localhost:8000/api/get-sheet?sheet_name=${encodeURIComponent(sheetUrl)}`);
      if (!response.ok) throw new Error("Gagal mengambil data dari Google Sheets");
      
      const result = await response.json();
      const sheetData = result.data || [];
      
      setWorkingData(sheetData);
      
      const aiMsg = { 
        role: 'model', 
        text: `✅ **Berhasil terhubung ke Spreadsheet!**\n\nSpreadsheet **${sheetName}** telah aktif dan isinya berhasil dimuat. Anda bisa melanjutkan upload form fisik nasabah, dan data akan otomatis ditambahkan ke file ini.`
      };
      
      setMessages(prev => {
        const updated = [...prev, aiMsg]
        setTimeout(() => saveCurrentStateToBackend(updated, sheetData), 0)
        return updated
      })
      
      showToast(`Berhasil memuat ${sheetData.length} baris data dari ${sheetName}`, 'success')
      
    } catch (e) {
      console.error(e)
      const aiMsg = { 
        role: 'model', 
        text: `❌ **Gagal memuat Spreadsheet**\n\nPesan Error: \`${e.message}\`\nPastikan file sudah di-share ke email Service Account.`
      };
      setMessages(prev => {
        const updated = [...prev, aiMsg]
        setTimeout(() => saveCurrentStateToBackend(updated, []), 0)
        return updated
      })
      showToast(e.message, 'error')
    } finally {
      setIsTyping(false)
    }
  }, [messages, workingData, activeSession])

  /* ── New chat (Auto-creates Sheet) ── */
  const handleNewChat = () => {
    setMessages([])
    setWorkingData([])
    setActiveSession(null)
    setActiveSheetName(null)
    setIsTyping(false)
    chatThreadIdRef.current = crypto.randomUUID()

    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    const time = new Date().toLocaleTimeString('id-ID', { hour12: false }).replace(/:/g, '');
    const sheetName = `SUTET-${dd}/${mm}/${yyyy}-${time}`;
    setActiveSheetName(sheetName);
    const dateStr = `${dd}/${mm}/${yyyy}`;
    const prompt = `Tolong cari spreadsheet template di Google Drive bernama "TEMPLATE_SUTET", lalu duplikat/copy file tersebut.
WAJIB: Letakkan file hasil duplikat tersebut DI DALAM FOLDER YANG SAMA dengan lokasi template aslinya.
Ganti nama file hasil copy-nya menjadi persis "${sheetName}". 
SANGAT PENTING: 
1. Keluarkan output HANYA berupa JSON Array di dalam blok \`\`\`json (tanpa teks pengantar atau penutup apapun).
2. Setiap objek di dalam JSON Array WAJIB memiliki format persis seperti ini:
[
  {
    "type": "sheet_option",
    "title": "${sheetName}",
    "url": "ISI_DENGAN_URL_SPREADSHEET_BARU",
    "date": "${dateStr}"
  }
]`;
    
    // Auto trigger
    setTimeout(() => {
      handleSend({ text: prompt, displayText: `✨ Membuat Spreadsheet Baru — ${sheetName}`, files: [], previews: [] });
    }, 100);
  }

  /* ── Load chat from history ── */
  const handleSelectChat = async (chatItem) => {
    // We already have some metadata in sidebar, but we need full session for messages
    const fullSession = await getSession(chatItem.id)
    if (fullSession) {
      setActiveSession(fullSession)
      chatThreadIdRef.current = fullSession.thread_id
      setMessages(fullSession.messages || [])
      setWorkingData(fullSession.working_data || [])
      setActiveSheetName(fullSession.title || chatItem.title)
    }
  }

  /* ── Export PDF (mock) ── */
  const handleExportPdf = () => {
    showToast('📥 PDF berhasil di-download!', 'success')
  }

  /* ── Confirm Send Flow (Live Data -> CTO) ── */
  const handleConfirmSend = async (rows) => {
    showToast('⏳ Memproses dokumen & mengirim email ke CTO...', 'info')

    const userMsg = { role: 'user', text: 'Tolong buatkan dokumen Excel lalu kirimkan email ke CTO beserta lampirannya secara langsung.', files: [], previews: [] }
    setMessages(prev => [...prev, userMsg])

    try {
      const sheetRows = (rows || []).map(r => toSheetRow(r))
      const response = await fetch('http://localhost:8000/api/generate-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: sheetRows, send_email: true, to_email: "neutracksudo@gmail.com" })
      })
      const result = await response.json()
      if (result.error) throw new Error(result.error)

      showToast('📧 Email beserta lampiran berhasil dikirim ke CTO!', 'success')

      // Tambahkan response AI instan
      const aiMsg = {
        role: 'model',
        text: `✅ **Selesai!**\n\nDokumen Excel telah dibuat di server lokal dan langsung dilampirkan (*attached*) pada email fisik. Email laporan telah berhasil dikirim ke CTO (*neutracksudo@gmail.com*).`
      }
      setMessages(prev => {
        const newMsgs = [...prev, aiMsg]
        setTimeout(() => saveCurrentStateToBackend(newMsgs, workingData), 0)
        return newMsgs
      })

    } catch (e) {
      console.error(e)
      showToast('❌ Gagal mengirim email. Pastikan SMTP dikonfigurasi.', 'error')

      const aiMsg = {
        role: 'model',
        text: `❌ **Pengiriman Email Gagal**\n\nPesan Error: \`${e.message}\`\n\nPastikan kamu sudah menambahkan \`SMTP_USERNAME\` dan \`SMTP_PASSWORD\` yang valid (App Password) di dalam file \`.env\` server backend.`
      }
      setMessages(prev => {
        const newMsgs = [...prev, aiMsg]
        setTimeout(() => saveCurrentStateToBackend(newMsgs, workingData), 0)
        return newMsgs
      })
    }
  }

  /* ── Send to CTO via MCP Gmail ── */
  // We no longer use MCP Gmail directly because we need PDF and Excel attachments.
  // Instead, onSendCto is mapped to handleConfirmSend which hits the Python backend.

  /* ── Save to Sheet via Pure API (Auto-save, super cepat) ── */
  const handleSaveToSheet = async (updatedData) => {
    if (!activeSheetName) {
      console.warn("Spreadsheet belum aktif/dibuat. Lewati auto-save.");
      return;
    }

    try {
      // Panggil endpoint murni di FastAPI (tanpa AI)
      const response = await fetch('http://localhost:8000/api/update-sheet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sheet_name: activeSheetName,
          data: updatedData
        })
      });

      if (!response.ok) {
        throw new Error('Gagal melakukan auto-save ke Google Sheets');
      }
      
      // Auto-save berjalan di background secara silent.
      console.log(`Auto-save ke ${activeSheetName} berhasil.`);
      
    } catch (error) {
      console.error("Auto-save error:", error);
    }
  }

  const isEmpty = messages.length === 0

  return (
    <div className="h-screen flex font-poppins bg-[#f0f4f8]">
      <Toast toast={toast} onClose={() => setToast(null)} />



      {/* Sidebar */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(c => !c)}
        onNewChat={handleNewChat}
        historyData={sessions}
        onSelectChat={handleSelectChat}
      />

      {/* Main Chat Panel */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0 h-full">
        {/* Top bar */}
        <div className="relative flex flex-col md:flex-row md:items-center justify-between px-4 md:px-6 py-3 border-b-4 border-[#1AC1DD] bg-white/80 backdrop-blur-md gap-2 md:gap-0">
          
          {/* Mandiri Logo — absolute inside Top bar so it moves with the panel */}
          <div className={`absolute top-2.5 right-4 md:right-5 z-50 pointer-events-none transition-opacity duration-200 ${!sidebarCollapsed ? 'opacity-0 md:opacity-100' : 'opacity-100'}`}>
            <img src={mandiriLogo} alt="Bank Mandiri" className="h-6 md:h-8 object-contain" />
          </div>
          <div className={`pr-20 md:pr-0 max-w-[85%] md:max-w-none transition-opacity duration-200 ${!sidebarCollapsed ? 'opacity-0 md:opacity-100' : 'opacity-100'}`}>
            <h1 className="text-[12px] md:text-sm font-bold text-[#344054] leading-snug md:leading-normal">
              <span className="md:hidden">Asisten AI Pembuka Rekening</span>
              <span className="hidden md:inline">AUTOMASI APLIKASI PEMBUKAAN REKENING PRODUK DANA PERORANGAN</span>
            </h1>
            <p className="hidden md:block text-[11px] text-slate-400 mt-0.5">
              PERSONAL ACCOUNT OPENING APPLICATION FORM AUTOMATION
            </p>
          </div>
          <div className={`flex items-center md:mr-32 self-start md:self-auto transition-opacity duration-200 ${!sidebarCollapsed ? 'opacity-0 md:opacity-100' : 'opacity-100'}`}>
            <div className="flex items-center gap-1.5 px-3 py-1 md:py-1.5 rounded-full bg-emerald-50 border border-emerald-200">
              <span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] md:text-[11px] font-semibold text-emerald-600">Online</span>
            </div>
          </div>
        </div>

        {/* Chat Area */}
        {isEmpty ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 bg-gradient-to-b from-white/40 to-transparent overflow-y-auto">
            <InteractiveTutorial onQuickAction={handleQuickAction} />

            {/* Homepage buttons removed per 1 Session = 1 Spreadsheet flow */}
          </div>
        ) : (
          <ChatArea
            messages={messages}
            isTyping={isTyping}
            onExportPdf={handleExportPdf}
            onSendCto={handleConfirmSend}
            onSaveToSheet={handleSaveToSheet}
            onConfirmSend={handleConfirmSend}
            onNewSheet={handleNewSheet}
            onExistingSheet={handleExistingSheet}
            onSelectExistingSheet={handleSelectExistingSheet}
            onUpdateWorkingData={(newData) => {
              setWorkingData(newData);
              
              // Update juga data spreadsheet di chat bubble terakhir agar sinkron
              setMessages(prev => {
                const updatedMsgs = [...prev];
                const lastAiIndex = updatedMsgs.findLastIndex(msg => msg.role === 'model' || msg.role === 'ai');
                if (lastAiIndex !== -1 && updatedMsgs[lastAiIndex].spreadsheet) {
                  updatedMsgs[lastAiIndex].spreadsheet = newData;
                }
                saveCurrentStateToBackend(updatedMsgs, newData);
                return updatedMsgs;
              });
            }}
          />
        )}

        {/* Chat Recommendations dihapus (1 Session = 1 Spreadsheet) */}

        {/* Input bar */}
        <InputBar onSend={handleSend} disabled={isTyping} />
      </div>
    </div>
  )
}

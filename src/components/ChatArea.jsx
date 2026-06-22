import { useRef, useEffect } from 'react'
import { Bot, User } from 'lucide-react'
import { ExtractedDataCard, SpreadsheetTable } from './DataCards'
import sheetsIcon from '../assets/sheet.svg'

/* ── Text Renderer Helper ── */
function renderMarkdownHTML(text) {
  let html = text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
  // ### text -> heading
  html = html.replace(/###\s*(.+)/g, '<h3 class="text-lg font-bold text-slate-800 mt-2 mb-1">$1</h3>');
  // **text** -> bold same size
  html = html.replace(/\*\*([^*]+)\*\*/g, '<span class="font-bold text-slate-800">$1</span>');
  // *text* -> bold
  html = html.replace(/\*([^*]+)\*/g, '<span class="font-bold text-slate-800">$1</span>');
  return { __html: html };
}

/* ── Typing Indicator ── */
function TypingIndicator() {
  return (
    <div className="flex items-start gap-3 msg-enter">
      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-500 to-primary-400 flex items-center justify-center shrink-0 shadow-sm">
        <Bot size={16} className="text-white" />
      </div>
      <div className="bg-white rounded-2xl rounded-tl-md px-4 py-3 shadow-sm border border-slate-100">
        <div className="flex gap-1.5">
          <span className="typing-dot" />
          <span className="typing-dot" />
          <span className="typing-dot" />
        </div>
      </div>
    </div>
  )
}

/* ── User Message Bubble ── */
function UserBubble({ message }) {
  return (
    <div className="flex items-start gap-3 justify-end msg-enter">
      <div className="max-w-[75%] space-y-2">
        {/* Image thumbnails */}
        {message.previews && message.previews.length > 0 && (
          <div className="flex flex-wrap gap-2 justify-end">
            {message.previews.map((src, i) => (
              src ? (
                <img key={i} src={src} alt={`upload-${i}`}
                  className="w-20 h-20 rounded-xl object-cover border-2 border-primary-200 shadow-sm" />
              ) : (
                <div key={i} className="w-20 h-20 rounded-xl bg-slate-100 border-2 border-slate-200 flex items-center justify-center">
                  <span className="text-xs text-slate-400">PDF</span>
                </div>
              )
            ))}
          </div>
        )}
        {message.text && (
          <div className="bg-gradient-to-br from-primary-500 to-primary-600 text-white px-4 py-2.5 rounded-2xl rounded-tr-md text-sm shadow-sm leading-relaxed whitespace-pre-line break-words max-w-full">
            {message.text}
          </div>
        )}
      </div>
      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center shrink-0">
        <User size={16} className="text-slate-600" />
      </div>
    </div>
  )
}

/* ── AI Message Bubble ── */
function AIBubble({ message, onExportPdf, onSendCto, onSaveToSheet, onConfirmSend, onNewSheet, onExistingSheet, onSelectExistingSheet, onUpdateWorkingData }) {
  return (
    <div className="flex items-start gap-3 msg-enter w-full">
      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-500 to-primary-400 flex items-center justify-center shrink-0 shadow-sm">
        <Bot size={16} className="text-white" />
      </div>
      <div className="flex-1 min-w-0 max-w-full lg:max-w-[85%] space-y-3">
        {/* Text content */}
        {message.text && (
          <div 
            className="bg-white rounded-2xl rounded-tl-md px-4 py-2.5 text-sm text-slate-700 shadow-sm border border-slate-100 leading-relaxed whitespace-pre-line break-words overflow-x-auto max-w-full"
            dangerouslySetInnerHTML={renderMarkdownHTML(message.text)}
          />
        )}

        {/* Confirmation Button */}
        {message.text && message.text.toLowerCase().includes('apa anda yakin mau mengirimkan file excel ke gmail?') && (
          <div className="mt-3">
            <button
              onClick={() => onConfirmSend(message.spreadsheet)}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-xl text-sm shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
            >
              <span>✅ Ya, Download & Kirim ke CTO</span>
            </button>
          </div>
        )}

        {/* Spreadsheet Selection Buttons */}
        {message.sheetOptions && message.sheetOptions.length > 0 && (
          <div className="mt-4">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide px-1">Pilih Spreadsheet:</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
              {message.sheetOptions
                .filter((opt, index, self) => index === self.findIndex((t) => t.title === opt.title))
                .map((opt, idx) => (
                <div key={idx} className="flex flex-col bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:border-primary-300 transition-all group animate-in slide-in-from-bottom-2 fade-in">
                  <button
                    onClick={() => onSelectExistingSheet && onSelectExistingSheet(opt)}
                    className="p-3 pb-0 text-left cursor-pointer flex-1"
                  >
                    <div className="w-full h-24 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl border border-emerald-200/50 flex items-center justify-center mb-3">
                      <div className="w-12 h-12 rounded-lg bg-white shadow-sm flex items-center justify-center">
                        <img src={sheetsIcon} alt="Google Sheets" className="w-7 h-7 object-contain" />
                      </div>
                    </div>
                    <h4 className="text-sm font-bold text-slate-700 truncate px-1" title={opt.title}>{opt.title}</h4>
                    <p className="text-[11px] text-slate-400 mt-1 px-1">Google Sheets • {opt.date || 'Terbaru'}</p>
                  </button>
                  <div className="p-3 pt-3 mt-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
                    <button onClick={() => onSelectExistingSheet && onSelectExistingSheet(opt)} className="text-xs font-bold text-primary-600 hover:text-primary-700 cursor-pointer bg-primary-50 px-3 py-1.5 rounded-lg transition-colors">
                      Pilih & Pakai Ini
                    </button>
                    {opt.url && (
                      <a href={opt.url} target="_blank" rel="noreferrer" title="Buka di Google Drive"
                        className="w-7 h-7 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-primary-500 hover:border-primary-300 hover:shadow-sm transition-all">
                        ↗
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Data cards (only show if JSON array is present) */}
        {message.dataCards && message.dataCards.length > 0 && (
          <div className="space-y-2">
            {message.dataCards.map((card, i) => (
              <ExtractedDataCard key={i} data={card} />
            ))}
          </div>
        )}

        {/* Spreadsheet table */}
        {message.spreadsheet && (
          <SpreadsheetTable
            data={message.spreadsheet}
            onExportPdf={onExportPdf}
            onSendCto={onSendCto}
            onSaveToSheet={onSaveToSheet}
            onUpdateWorkingData={onUpdateWorkingData}
          />
        )}
      </div>
    </div>
  )
}

/* ── Main Chat Area ── */
export default function ChatArea({ messages, isTyping, onExportPdf, onSendCto, onSaveToSheet, onConfirmSend, onNewSheet, onExistingSheet, onSelectExistingSheet, onUpdateWorkingData }) {
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  return (
    <div className="flex-1 overflow-y-auto overflow-x-hidden px-6 py-8 chat-scroll">
      <div className="max-w-4xl mx-auto space-y-6 w-full">
        {messages.map((msg, i) => (
          msg.role === 'user'
            ? <UserBubble key={i} message={msg} />
            : <AIBubble key={i} message={msg} onExportPdf={onExportPdf} onSendCto={onSendCto} onSaveToSheet={onSaveToSheet} onConfirmSend={onConfirmSend} onNewSheet={onNewSheet} onExistingSheet={onExistingSheet} onSelectExistingSheet={onSelectExistingSheet} onUpdateWorkingData={onUpdateWorkingData} />
        ))}
        {isTyping && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}

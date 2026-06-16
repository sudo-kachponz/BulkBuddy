import { useRef, useEffect } from 'react'
import { Bot, User } from 'lucide-react'
import { ExtractedDataCard, SpreadsheetTable } from './DataCards'

/* ── Text Renderer Helper ── */
function renderMarkdownHTML(text) {
  let html = text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
  // **text** -> heading (larger)
  html = html.replace(/\*\*([^*]+)\*\*/g, '<span class="text-[1.05rem] font-bold text-slate-800">$1</span>');
  // *text* -> bold
  html = html.replace(/\*([^*]+)\*/g, '<span class="font-bold">$1</span>');
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
          <div className="bg-gradient-to-br from-primary-600 to-primary-500 text-white rounded-2xl rounded-tr-md px-4 py-2.5 text-sm shadow-md shadow-primary-500/15 ml-auto w-fit">
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
function AIBubble({ message, onExportPdf, onSendCto, onSaveToSheet, onConfirmSend, onNewSheet, onExistingSheet, onSelectExistingSheet }) {
  const spreadsheetOptions = [];
  if (message.text && message.text.toLowerCase().includes('pilih spreadsheet mana yang ingin digunakan')) {
    const lines = message.text.split('\n');
    for (const line of lines) {
      const match = line.match(/^\d+\.\s+(.+)$/);
      if (match) {
        spreadsheetOptions.push(match[1].trim());
      }
    }
  }

  return (
    <div className="flex items-start gap-3 msg-enter w-full">
      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-500 to-primary-400 flex items-center justify-center shrink-0 shadow-sm">
        <Bot size={16} className="text-white" />
      </div>
      <div className="flex-1 min-w-0 max-w-full lg:max-w-[85%] space-y-3">
        {/* Text content */}
        {message.text && (
          <div 
            className="bg-white rounded-2xl rounded-tl-md px-4 py-2.5 text-sm text-slate-700 shadow-sm border border-slate-100 leading-relaxed whitespace-pre-line"
            dangerouslySetInnerHTML={renderMarkdownHTML(message.text)}
          />
        )}

        {/* Confirmation Button */}
        {message.text && message.text.toLowerCase().includes('apa anda yakin mau mengirimkan pdf dan .excel ke gmail?') && (
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
        {spreadsheetOptions.length > 0 && (
          <div className="flex flex-col gap-2 mt-3">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide px-1">Pilih Spreadsheet:</span>
            {spreadsheetOptions.map((opt, idx) => (
              <button
                key={idx}
                onClick={() => onSelectExistingSheet && onSelectExistingSheet(opt)}
                className="text-left px-4 py-2.5 bg-white border border-slate-200 text-slate-700 font-medium rounded-xl text-sm shadow-sm hover:bg-primary-50 hover:border-primary-300 hover:text-primary-700 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
              >
                📄 {opt}
              </button>
            ))}
          </div>
        )}

        {/* Data cards */}
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
          />
        )}
      </div>
    </div>
  )
}

/* ── Main Chat Area ── */
export default function ChatArea({ messages, isTyping, onExportPdf, onSendCto, onSaveToSheet, onConfirmSend, onNewSheet, onExistingSheet, onSelectExistingSheet }) {
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
            : <AIBubble key={i} message={msg} onExportPdf={onExportPdf} onSendCto={onSendCto} onSaveToSheet={onSaveToSheet} onConfirmSend={onConfirmSend} onNewSheet={onNewSheet} onExistingSheet={onExistingSheet} onSelectExistingSheet={onSelectExistingSheet} />
        ))}
        {isTyping && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}

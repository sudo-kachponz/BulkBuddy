import { useRef, useState, useCallback } from 'react'
import { Paperclip, Send, X, Image as ImageIcon } from 'lucide-react'

export default function InputBar({ onSend, disabled }) {
  const [text, setText] = useState('')
  const [files, setFiles] = useState([])       // { file, preview }[]
  const fileRef = useRef(null)

  const addFiles = useCallback((fileList) => {
    Array.from(fileList)
      .filter(f => f.type.startsWith('image/') || f.type === 'application/pdf')
      .forEach(f => {
        if (f.type.startsWith('image/')) {
          const reader = new FileReader()
          reader.onload = (e) => {
            setFiles(prev => [...prev, {
              file: f,
              preview: e.target.result, // base64 string
              name: f.name,
            }])
          }
          reader.readAsDataURL(f)
        } else {
          setFiles(prev => [...prev, {
            file: f,
            preview: null,
            name: f.name,
          }])
        }
      })
  }, [])

  const removeFile = (idx) => {
    setFiles(prev => {
      const copy = [...prev]
      copy.splice(idx, 1)
      return copy
    })
  }

  const handleSend = () => {
    if (!text.trim() && files.length === 0) return
    onSend({ text: text.trim(), files: files.map(f => f.file), previews: files.map(f => f.preview) })
    setText('')
    setFiles([])
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files)
  }

  const hasContent = text.trim() || files.length > 0

  return (
    <div className="shrink-0 border-t border-slate-200/70 bg-white/80 backdrop-blur-md px-4 py-3"
      onDragOver={e => e.preventDefault()} onDrop={handleDrop}>
      {/* Image previews strip */}
      {files.length > 0 && (
        <div className="flex gap-2 mb-2.5 overflow-x-auto pb-1 chat-scroll">
          {files.map((f, i) => (
            <div key={i} className="relative shrink-0 group">
              {f.preview ? (
                <img src={f.preview} alt={f.name}
                  className="w-16 h-16 rounded-xl object-cover border-2 border-primary-200 shadow-sm" />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-slate-100 border-2 border-slate-200 flex flex-col items-center justify-center">
                  <ImageIcon size={16} className="text-slate-400" />
                  <span className="text-[8px] text-slate-400 mt-0.5">PDF</span>
                </div>
              )}
              <button onClick={() => removeFile(i)}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white
                  flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-sm">
                <X size={10} />
              </button>
              {/* Checkmark badge */}
              <div className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-primary-500 flex items-center justify-center shadow-sm">
                <svg width="8" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Input row */}
      <div className="flex items-end gap-2">
        <button onClick={() => fileRef.current?.click()}
          className="shrink-0 w-10 h-10 rounded-xl bg-slate-100 hover:bg-primary-50 border border-slate-200 hover:border-primary-300
            flex items-center justify-center transition-colors cursor-pointer" title="Lampirkan file">
          <Paperclip size={18} className="text-slate-500" />
        </button>
        <input ref={fileRef} type="file" multiple accept="image/*,.pdf" className="hidden"
          onChange={e => { addFiles(e.target.files); e.target.value = '' }} />

        <div className="flex-1 relative">
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ketik pesan..."
            rows={1}
            disabled={disabled}
            className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-2.5 pr-12 text-sm text-slate-800
              placeholder:text-slate-400 focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100
              disabled:opacity-50 transition-all duration-200"
            style={{ minHeight: '42px', maxHeight: '120px' }}
            onInput={e => { e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px' }}
          />
        </div>

        <button onClick={handleSend} disabled={!hasContent || disabled}
          className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 cursor-pointer
            ${hasContent
              ? 'bg-gradient-to-br from-primary-600 to-primary-500 text-white shadow-md shadow-primary-500/25 hover:scale-105 active:scale-95'
              : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}>
          <Send size={18} />
        </button>
      </div>
    </div>
  )
}

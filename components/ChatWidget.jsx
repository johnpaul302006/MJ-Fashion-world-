'use client'

import { useState, useRef, useEffect } from 'react'

const SUGGESTIONS = [
  'How long is delivery?',
  'How do I pay with UPI?',
  'What is your return policy?',
  'Show me best sellers',
]

export default function ChatWidget({ storeName }) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const bodyRef = useRef(null)

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight
  }, [messages, typing, open])

  async function send(text) {
    const content = (text || input).trim()
    if (!content || typing) return
    setInput('')
    const history = [...messages, { role: 'user', content }]
    setMessages(history)
    setTyping(true)
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history }),
      })
      const data = await res.json()
      setMessages((m) => [...m, { role: 'assistant', content: data.reply || 'Sorry, I could not answer right now. Please contact the store directly.' }])
    } catch {
      setMessages((m) => [...m, { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' }])
    } finally {
      setTyping(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-5 right-5 z-50 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-3.5 shadow-xl flex items-center gap-2 text-sm font-semibold"
        aria-label="Chat with us"
      >
        {open ? '✕' : <span className="flex items-center gap-2"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg> Chat</span>}
      </button>
      {open ? (
        <div className="fixed bottom-20 right-5 z-50 w-[min(380px,calc(100vw-2rem))] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden h-[480px] max-h-[70vh]">
          <div className="bg-blue-600 text-white px-4 py-3 flex items-center gap-2">
            <div className="relative">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/><circle cx="17" cy="7" r="1.5" fill="white" stroke="none"/><circle cx="7" cy="7" r="1.5" fill="white" stroke="none"/></svg>
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-400 rounded-full border border-white" />
            </div>
            <div>
              <p className="font-semibold text-sm leading-tight">{storeName} Assistant</p>
              <p className="text-[11px] text-blue-100">Online — ask me anything!</p>
            </div>
          </div>
          <div ref={bodyRef} className="flex-1 overflow-y-auto p-3 space-y-2 bg-slate-50">
            <div className="bg-white border border-slate-200 rounded-xl rounded-tl-sm px-3 py-2 text-sm text-slate-700 max-w-[85%]">
              Hi! I can help with products, sizes, delivery, and payments. What do you need?
            </div>
            {messages.map((m, i) => (
              <div
                key={i}
                className={`max-w-[85%] px-3 py-2 text-sm rounded-xl whitespace-pre-wrap ${
                  m.role === 'user'
                    ? 'ml-auto bg-blue-600 text-white rounded-br-sm'
                    : 'bg-white border border-slate-200 text-slate-700 rounded-tl-sm'
                }`}
              >
                {m.content}
              </div>
            ))}
            {typing ? (
              <div className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-400 w-fit">
                Typing<span className="animate-pulse">...</span>
              </div>
            ) : null}
          </div>
          {messages.length === 0 ? (
            <div className="px-3 pt-2 flex flex-wrap gap-1.5 bg-slate-50">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="text-xs bg-white border border-slate-200 hover:border-blue-400 hover:text-blue-600 rounded-full px-2.5 py-1.5 text-slate-600"
                >
                  {s}
                </button>
              ))}
            </div>
          ) : null}
          <form
            onSubmit={(e) => {
              e.preventDefault()
              send()
            }}
            className="flex gap-2 p-2.5 border-t border-slate-200 bg-white"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your question..."
              className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-500"
            />
            <button
              type="submit"
              disabled={typing}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-xl px-4 text-sm font-semibold"
            >
              Send
            </button>
          </form>
        </div>
      ) : null}
    </>
  )
}
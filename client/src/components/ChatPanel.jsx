import { useEffect, useRef, useState } from 'react';
import { sendEvent, WS_EVENTS } from '../services/websocket';

const inputClass = 'flex-1 border border-white bg-black text-white px-3 py-2 text-sm focus:outline-none focus:bg-neutral-900 placeholder:text-neutral-500';
const btnClass = 'border border-white px-3 py-2 text-xs uppercase tracking-wider hover:bg-white hover:text-black transition-colors';

export function ChatPanel({ socket, roomId, messages, onMessage }) {
  const [text, setText] = useState('');
  const [typingUser, setTypingUser] = useState('');
  const typingTimeout = useRef(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!text.trim() || !roomId) return;
    sendEvent(socket, WS_EVENTS.CHAT_SEND, { roomId, content: text.trim() });
    setText('');
    sendEvent(socket, WS_EVENTS.CHAT_TYPING, { roomId, isTyping: false });
  };

  const handleChange = (value) => {
    setText(value);
    if (roomId) {
      sendEvent(socket, WS_EVENTS.CHAT_TYPING, { roomId, isTyping: true });
      clearTimeout(typingTimeout.current);
      typingTimeout.current = setTimeout(() => {
        sendEvent(socket, WS_EVENTS.CHAT_TYPING, { roomId, isTyping: false });
      }, 1500);
    }
  };

  useEffect(() => {
    return onMessage?.((msg) => {
      if (msg.type === WS_EVENTS.CHAT_TYPING && msg.payload.isTyping) {
        setTypingUser(msg.payload.username || 'Someone');
        clearTimeout(typingTimeout.current);
        typingTimeout.current = setTimeout(() => setTypingUser(''), 2000);
      }
    });
  }, [onMessage]);

  return (
    <div className="border border-white p-4">
      <h3 className="text-xs uppercase tracking-widest text-neutral-400 mb-3">Chat</h3>
      <div className="max-h-48 overflow-y-auto mb-2 space-y-2">
        {messages.map((m, i) => (
          <div key={i} className="text-sm">
            <strong className="mr-2">{m.username}</strong>
            <span className="text-neutral-300">{m.content}</span>
            <time className="block text-xs text-neutral-500 mt-0.5">{new Date(m.timestamp).toLocaleTimeString()}</time>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      {typingUser && <p className="text-xs text-neutral-500 italic mb-2">{typingUser} is typing...</p>}
      <form onSubmit={handleSend} className="flex gap-2">
        <input value={text} onChange={(e) => handleChange(e.target.value)} placeholder="Type a message..." className={inputClass} />
        <button type="submit" className={btnClass}>Send</button>
      </form>
    </div>
  );
}

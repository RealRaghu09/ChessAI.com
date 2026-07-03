import { useEffect, useRef, useState } from 'react';
import { sendEvent, WS_EVENTS } from '../services/websocket';

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
    <div className="chat-panel">
      <h3>Chat</h3>
      <div className="chat-messages">
        {messages.map((m, i) => (
          <div key={i} className="chat-message">
            <strong>{m.username}</strong>
            <span>{m.content}</span>
            <time>{new Date(m.timestamp).toLocaleTimeString()}</time>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      {typingUser && <p className="typing">{typingUser} is typing...</p>}
      <form onSubmit={handleSend}>
        <input value={text} onChange={(e) => handleChange(e.target.value)} placeholder="Type a message..." />
        <button type="submit">Send</button>
      </form>
    </div>
  );
}

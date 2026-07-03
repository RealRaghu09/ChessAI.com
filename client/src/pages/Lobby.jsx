import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../hooks/useSocket';
import { WS_EVENTS, sendEvent } from '../services/websocket';

export default function Lobby() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { socket, connected, addListener } = useSocket();
  const [roomCode, setRoomCode] = useState('');
  const [createdCode, setCreatedCode] = useState('');
  const [joinCode, setJoinCode] = useState('');

  useEffect(() => {
    return addListener((message) => {
      if (message.type === WS_EVENTS.ROOM_CREATED) {
        setCreatedCode(message.payload.roomCode);
        toast.success(`Room created: ${message.payload.roomCode}`);
      }
      if (message.type === WS_EVENTS.ROOM_JOINED || message.type === WS_EVENTS.GAME_START) {
        const id = message.payload.roomId;
        if (id) navigate(`/game/${id}`);
      }
    });
  }, [addListener, navigate]);

  const createRoom = () => {
    sendEvent(socket, WS_EVENTS.ROOM_CREATE, { timeControl: { initial_ms: 600000, increment_ms: 0 } });
  };

  const joinRoom = (e) => {
    e.preventDefault();
    if (!joinCode.trim()) return;
    sendEvent(socket, WS_EVENTS.ROOM_JOIN, { roomCode: joinCode.trim().toUpperCase() });
  };

  return (
    <div className="lobby-page">
      <header className="lobby-header">
        <div>
          <h1>ChessAI Lobby</h1>
          <p>Welcome, {user?.username} · ELO {user?.elo}</p>
        </div>
        <nav>
          <Link to="/profile">Profile</Link>
          <Link to="/leaderboard">Leaderboard</Link>
          <button type="button" onClick={logout}>Logout</button>
        </nav>
      </header>

      <div className="lobby-grid">
        <section className="lobby-card">
          <h2>Create Room</h2>
          <p>Start a private game and share the room code.</p>
          <button type="button" onClick={createRoom} disabled={!connected}>Create Room</button>
          {createdCode && (
            <div className="room-code-display">
              <p>Your room code:</p>
              <strong>{createdCode}</strong>
              <p className="hint">Waiting for opponent to join...</p>
            </div>
          )}
        </section>

        <section className="lobby-card">
          <h2>Join Room</h2>
          <form onSubmit={joinRoom}>
            <input
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="Enter room code"
              maxLength={6}
            />
            <button type="submit" disabled={!connected}>Join</button>
          </form>
        </section>
      </div>

      {!connected && <p className="connection-hint">Connecting to server...</p>}
    </div>
  );
}

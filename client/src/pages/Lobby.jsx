import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../hooks/useSocket';
import { WS_EVENTS, sendEvent } from '../services/websocket';

const btnClass = 'border border-white px-4 py-2 text-sm uppercase tracking-wider hover:bg-white hover:text-black transition-colors disabled:opacity-40';
const inputClass = 'w-full border border-white bg-black text-white px-4 py-3 text-sm focus:outline-none focus:bg-neutral-900 placeholder:text-neutral-500';

export default function Lobby() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { socket, connected, addListener } = useSocket();
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
    <div className="min-h-screen p-4 md:p-8">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 border-b border-white pb-4">
        <div>
          <h1 className="text-2xl font-bold uppercase tracking-widest">Lobby</h1>
          <p className="text-sm text-neutral-400 mt-1">Welcome, {user?.username} · ELO {user?.elo}</p>
        </div>
        <nav className="flex gap-3 items-center text-sm uppercase tracking-wider">
          <Link to="/profile" className="no-underline hover:opacity-70">Profile</Link>
          <Link to="/leaderboard" className="no-underline hover:opacity-70">Leaderboard</Link>
          <button type="button" onClick={logout} className={btnClass}>Logout</button>
        </nav>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
        <section className="border border-white p-6 flex flex-col gap-4">
          <h2 className="text-lg font-semibold uppercase tracking-widest">Create Room</h2>
          <p className="text-sm text-neutral-400">Start a private game and share the room code.</p>
          <button type="button" onClick={createRoom} disabled={!connected} className={btnClass}>Create Room</button>
          {createdCode && (
            <div className="border border-white p-4 text-center">
              <p className="text-xs uppercase tracking-widest text-neutral-400 mb-2">Your room code</p>
              <strong className="text-3xl tracking-[0.3em]">{createdCode}</strong>
              <p className="text-xs text-neutral-500 mt-2">Waiting for opponent...</p>
            </div>
          )}
        </section>

        <section className="border border-white p-6 flex flex-col gap-4">
          <h2 className="text-lg font-semibold uppercase tracking-widest">Join Room</h2>
          <form onSubmit={joinRoom} className="flex flex-col gap-4">
            <input
              className={inputClass}
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="Enter room code"
              maxLength={6}
            />
            <button type="submit" disabled={!connected} className={btnClass}>Join</button>
          </form>
        </section>
      </div>

      {!connected && <p className="text-center text-neutral-400 mt-8 text-sm uppercase tracking-widest">Connecting to server...</p>}
    </div>
  );
}

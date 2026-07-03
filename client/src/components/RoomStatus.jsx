export function RoomStatus({ roomCode, status, host, guest }) {
  return (
    <div className="border border-white p-4">
      <h3 className="text-xs uppercase tracking-widest text-neutral-400 mb-2">Room {roomCode}</h3>
      <p className="text-sm">Status: <strong>{status}</strong></p>
      <p className="text-sm text-neutral-400">Host: {host?.username || '—'}</p>
      <p className="text-sm text-neutral-400">Guest: {guest?.username || 'Waiting...'}</p>
    </div>
  );
}

export function RoomStatus({ roomCode, status, host, guest }) {
  return (
    <div className="room-status">
      <h3>Room {roomCode}</h3>
      <p>Status: <strong>{status}</strong></p>
      <p>Host: {host?.username || '—'}</p>
      <p>Guest: {guest?.username || 'Waiting...'}</p>
    </div>
  );
}

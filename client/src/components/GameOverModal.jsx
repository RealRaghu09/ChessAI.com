export function GameOverModal({ result, reason, onClose }) {
  if (!result) return null;
  const label = result === 'draw' ? 'Draw' : result === 'white_wins' ? 'White wins' : 'Black wins';
  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <h2>Game Over</h2>
        <p className="result">{label}</p>
        {reason && <p className="reason">{reason.replace(/_/g, ' ')}</p>}
        <button onClick={onClose}>Back to Lobby</button>
      </div>
    </div>
  );
}

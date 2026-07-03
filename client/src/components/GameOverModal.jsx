export function GameOverModal({ result, reason, onClose }) {
  if (!result) return null;
  const label = result === 'draw' ? 'Draw' : result === 'white_wins' ? 'White wins' : 'Black wins';
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="border-2 border-white bg-black p-8 text-center min-w-[300px]">
        <h2 className="text-xl font-bold uppercase tracking-widest mb-4">Game Over</h2>
        <p className="text-2xl mb-2">{label}</p>
        {reason && <p className="text-sm text-neutral-400 mb-6 capitalize">{reason.replace(/_/g, ' ')}</p>}
        <button
          onClick={onClose}
          className="border-2 border-white px-6 py-2 text-sm uppercase tracking-widest hover:bg-white hover:text-black transition-colors"
        >
          Back to Lobby
        </button>
      </div>
    </div>
  );
}

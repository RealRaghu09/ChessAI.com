export function GameTimer({ clocks, turn, playerColor }) {
  const format = (ms) => {
    const total = Math.max(0, Math.floor(ms / 1000));
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="border border-white p-4 flex flex-col gap-2">
      <div className={`flex justify-between items-center px-2 py-1 ${turn === 'black' ? 'bg-white text-black' : ''}`}>
        <span className="text-xs uppercase tracking-widest">Black</span>
        <strong className="text-lg font-mono">{format(clocks.black_ms)}</strong>
      </div>
      <div className={`flex justify-between items-center px-2 py-1 ${turn === 'white' ? 'bg-white text-black' : ''}`}>
        <span className="text-xs uppercase tracking-widest">White</span>
        <strong className="text-lg font-mono">{format(clocks.white_ms)}</strong>
      </div>
      {playerColor && (
        <p className="text-xs text-neutral-400 mt-1">
          You are playing as <strong className="text-white">{playerColor}</strong>
        </p>
      )}
    </div>
  );
}

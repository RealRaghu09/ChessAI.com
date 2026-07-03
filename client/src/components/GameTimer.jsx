export function GameTimer({ clocks, turn, playerColor }) {
  const format = (ms) => {
    const total = Math.max(0, Math.floor(ms / 1000));
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="game-timers">
      <div className={`timer ${turn === 'black' ? 'active' : ''}`}>
        <span>Black</span>
        <strong>{format(clocks.black_ms)}</strong>
      </div>
      <div className={`timer ${turn === 'white' ? 'active' : ''}`}>
        <span>White</span>
        <strong>{format(clocks.white_ms)}</strong>
      </div>
      {playerColor && <p className="your-color">You are playing as <strong>{playerColor}</strong></p>}
    </div>
  );
}

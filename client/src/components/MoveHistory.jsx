export function MoveHistory({ moveHistory }) {
  const rows = [];
  for (let i = 0; i < moveHistory.length; i += 2) {
    rows.push({
      num: Math.floor(i / 2) + 1,
      white: moveHistory[i]?.move || '',
      black: moveHistory[i + 1]?.move || '',
    });
  }

  return (
    <div className="border border-white p-4">
      <h3 className="text-xs uppercase tracking-widest text-neutral-400 mb-3">Move History</h3>
      {moveHistory.length === 0 ? (
        <p className="text-sm text-neutral-500">No moves yet</p>
      ) : (
        <div className="max-h-48 overflow-y-auto">
          <div className="grid grid-cols-[2rem_1fr_1fr] gap-x-2 text-sm">
            <span className="text-neutral-500 text-xs">#</span>
            <span className="text-neutral-500 text-xs">White</span>
            <span className="text-neutral-500 text-xs">Black</span>
            {rows.map((row) => (
              <span key={`${row.num}-n`} className="contents">
                <span className="text-neutral-400">{row.num}</span>
                <span>{row.white}</span>
                <span className="text-neutral-300">{row.black}</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

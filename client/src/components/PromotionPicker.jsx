const PIECES = [
  { piece: 'q', label: '♕', name: 'Queen' },
  { piece: 'r', label: '♖', name: 'Rook' },
  { piece: 'b', label: '♗', name: 'Bishop' },
  { piece: 'n', label: '♘', name: 'Knight' },
];

export function PromotionPicker({ color, onSelect, onCancel }) {
  const pieceColor = color === 'white' ? 'text-white drop-shadow-[0_0_1px_#000]' : 'text-black';

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="border-2 border-white bg-black p-6 text-center">
        <h3 className="text-lg font-semibold tracking-widest uppercase mb-4">Promote to</h3>
        <div className="flex gap-2">
          {PIECES.map(({ piece, label, name }) => (
            <button
              key={piece}
              type="button"
              onClick={() => onSelect(piece)}
              className="border border-white bg-white w-16 h-16 flex flex-col items-center justify-center hover:bg-neutral-200 transition-colors"
              title={name}
            >
              <span className={`text-3xl ${pieceColor}`}>{label}</span>
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="mt-4 text-sm text-neutral-400 hover:text-white underline underline-offset-2"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

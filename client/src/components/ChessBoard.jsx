const pieceSymbols = {
  wK: '♔', wQ: '♕', wR: '♖', wB: '♗', wN: '♘', wP: '♙',
  bK: '♚', bQ: '♛', bR: '♜', bB: '♝', bN: '♞', bP: '♟',
};

export function ChessBoard({ board, onSquareClick, selectedSquare, possibleMoves = [], flipped = false }) {
  const getPieceSymbol = (piece) => {
    if (!piece) return '';
    return pieceSymbols[`${piece.color}${piece.type.toUpperCase()}`] || '';
  };

  const getSquareName = (row, col) => {
    const file = String.fromCharCode(97 + col);
    const rank = 8 - row;
    return `${file}${rank}`;
  };

  const displayBoard = flipped ? [...board].reverse().map((row) => [...row].reverse()) : board;

  return (
    <div className="flex justify-center items-center">
      <div className="border-2 border-white p-2">
        <div className="grid grid-cols-8 grid-rows-8 w-[min(80vw,480px)] h-[min(80vw,480px)] border border-white">
          {displayBoard.map((row, rowIndex) =>
            row.map((piece, colIndex) => {
              const actualRow = flipped ? 7 - rowIndex : rowIndex;
              const actualCol = flipped ? 7 - colIndex : colIndex;
              const square = getSquareName(actualRow, actualCol);
              const isLight = (actualRow + actualCol) % 2 === 0;
              const isSelected = selectedSquare === square;
              const isPossible = possibleMoves.includes(square);
              const isCapture = isPossible && piece;

              return (
                <div
                  key={square}
                  className={[
                    'relative flex items-center justify-center cursor-pointer select-none',
                    isLight ? 'bg-white' : 'bg-black',
                    isSelected && 'ring-2 ring-inset ring-neutral-400',
                    isPossible && !piece && 'after:content-[""] after:absolute after:w-3 after:h-3 after:bg-neutral-500 after:opacity-60',
                    isCapture && 'ring-2 ring-inset ring-neutral-500',
                  ].filter(Boolean).join(' ')}
                  onClick={() => onSquareClick?.(square)}
                >
                  {piece && (
                    <span
                      className={[
                        'text-[clamp(1.75rem,8vw,3.5rem)] leading-none pointer-events-none',
                        piece.color === 'w'
                          ? 'text-white [text-shadow:0_0_2px_#000,0_0_2px_#000,1px_1px_0_#000,-1px_-1px_0_#000,1px_-1px_0_#000,-1px_1px_0_#000]'
                          : 'text-black [text-shadow:0_0_2px_#fff,0_0_2px_#fff,1px_1px_0_#fff,-1px_-1px_0_#fff,1px_-1px_0_#fff,-1px_1px_0_#fff]',
                      ].join(' ')}
                    >
                      {getPieceSymbol(piece)}
                    </span>
                  )}
                </div>
              );
            }),
          )}
        </div>
      </div>
    </div>
  );
}

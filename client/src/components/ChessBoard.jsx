import "./ChessBoard.css"

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
    <div className="chess-board-container">
      <div className="chess-board">
        <div className="board-squares">
          {displayBoard.map((row, rowIndex) =>
            row.map((piece, colIndex) => {
              const actualRow = flipped ? 7 - rowIndex : rowIndex;
              const actualCol = flipped ? 7 - colIndex : colIndex;
              const square = getSquareName(actualRow, actualCol);
              const isLight = (actualRow + actualCol) % 2 === 0;
              const isSelected = selectedSquare === square;
              const isPossible = possibleMoves.includes(square);
              return (
                <div
                  key={square}
                  className={`chess-square ${isLight ? 'light' : 'dark'} ${isSelected ? 'selected' : ''} ${isPossible ? 'possible-move' : ''}`}
                  onClick={() => onSquareClick?.(square)}
                >
                  {piece && (
                    <span className={`chess-piece ${piece.color === 'w' ? 'white-piece' : 'black-piece'}`}>
                      {getPieceSymbol(piece)}
                    </span>
                  )}
                  {isPossible && !piece && <div className="possible-move-indicator" />}
                </div>
              );
            }),
          )}
        </div>
      </div>
    </div>
  );
}

import "./MoveHistory.css"

export function MoveHistory({ moveHistory }) {
  return (
    <div className="move-history-panel">
      <h3>Move History</h3>
      {moveHistory.length === 0 ? (
        <p className="empty">No moves yet</p>
      ) : (
        <div className="move-grid">
          <span>#</span><span>White</span><span>Black</span>
          {Array.from({ length: Math.ceil(moveHistory.length / 2) }, (_, i) => {
            const whiteMove = moveHistory[i * 2];
            const blackMove = moveHistory[i * 2 + 1];
            return (
              <div key={i} className="move-row">
                <span>{i + 1}</span>
                <span className="white-move">{whiteMove?.move || ''}</span>
                <span className="black-move">{blackMove?.move || ''}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

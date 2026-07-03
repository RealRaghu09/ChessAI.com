import { sendEvent, WS_EVENTS } from '../services/websocket';

const REACTIONS = ['👍', '👏', '🔥', '😮'];

export function ReactionBar({ socket, roomId, reactions }) {
  return (
    <div className="reaction-bar">
      {REACTIONS.map((emoji) => (
        <button
          key={emoji}
          type="button"
          onClick={() => sendEvent(socket, WS_EVENTS.REACTION_ADD, { roomId, emoji })}
        >
          {emoji}
        </button>
      ))}
      <div className="reaction-feed">
        {reactions.slice(-8).map((r, i) => (
          <span key={i} className="reaction-item">{r.username}: {r.emoji}</span>
        ))}
      </div>
    </div>
  );
}

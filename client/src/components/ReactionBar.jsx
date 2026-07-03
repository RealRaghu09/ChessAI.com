import { sendEvent, WS_EVENTS } from '../services/websocket';

const REACTIONS = ['👍', '👏', '🔥', '😮'];

export function ReactionBar({ socket, roomId, reactions }) {
  return (
    <div className="border border-white p-4">
      <div className="flex flex-wrap gap-2 items-center mb-2">
        {REACTIONS.map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => sendEvent(socket, WS_EVENTS.REACTION_ADD, { roomId, emoji })}
            className="border border-white w-10 h-10 text-lg hover:bg-white transition-colors"
          >
            {emoji}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-1 text-xs text-neutral-400">
        {reactions.slice(-8).map((r, i) => (
          <span key={i}>{r.username}: {r.emoji}</span>
        ))}
      </div>
    </div>
  );
}

export const WS_EVENTS = {
  AUTH_CONNECTED: 'auth:connected',
  ROOM_CREATE: 'room:create',
  ROOM_CREATED: 'room:created',
  ROOM_JOIN: 'room:join',
  ROOM_JOINED: 'room:joined',
  ROOM_LEAVE: 'room:leave',
  ROOM_RECONNECT: 'room:reconnect',
  GAME_START: 'game:start',
  GAME_MOVE: 'game:move',
  GAME_MOVE_REJECTED: 'game:move_rejected',
  GAME_RESIGN: 'game:resign',
  GAME_DRAW_OFFER: 'game:draw_offer',
  GAME_DRAW_RESPONSE: 'game:draw_response',
  GAME_END: 'game:end',
  CHAT_SEND: 'chat:send',
  CHAT_RECEIVE: 'chat:receive',
  CHAT_TYPING: 'chat:typing',
  REACTION_ADD: 'reaction:add',
  REACTION_UPDATE: 'reaction:update',
  ERROR: 'error',
};

export function parseMessage(raw) {
  const message = JSON.parse(raw);
  return {
    type: message.type,
    payload: message.payload || message.pay_load || {},
  };
}

export function sendEvent(socket, type, payload = {}) {
  if (socket?.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({ type, payload }));
  }
}

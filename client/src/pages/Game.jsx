import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Chess } from 'chess.js';
import { toast } from 'react-toastify';
import { ChatPanel } from '../components/ChatPanel';
import { ChessBoard } from '../components/ChessBoard';
import { GameOverModal } from '../components/GameOverModal';
import { GameTimer } from '../components/GameTimer';
import { MoveHistory } from '../components/MoveHistory';
import { ReactionBar } from '../components/ReactionBar';
import { RoomStatus } from '../components/RoomStatus';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../hooks/useSocket';
import { WS_EVENTS, sendEvent } from '../services/websocket';
import Connecting from './Connecting';

function buildHistoryFromPgn(pgn) {
  if (!pgn) return [];
  try {
    const chess = new Chess();
    chess.loadPgn(pgn);
    const history = [];
    const verbose = chess.history({ verbose: true });
    verbose.forEach((m, idx) => {
      history.push({
        moveNumber: Math.floor(idx / 2) + 1,
        move: m.san,
        color: m.color === 'w' ? 'white' : 'black',
      });
    });
    return history;
  } catch {
    return [];
  }
}

export default function Game() {
  const { roomId: routeRoomId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { socket, connected, addListener } = useSocket();

  const [chess, setChess] = useState(() => new Chess());
  const [board, setBoard] = useState(() => new Chess().board());
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [playerColor, setPlayerColor] = useState(null);
  const [moveHistory, setMoveHistory] = useState([]);
  const [roomId, setRoomId] = useState(routeRoomId || null);
  const [roomCode, setRoomCode] = useState('');
  const [status, setStatus] = useState('waiting');
  const [host, setHost] = useState(null);
  const [guest, setGuest] = useState(null);
  const [clocks, setClocks] = useState({ white_ms: 600000, black_ms: 600000 });
  const [turn, setTurn] = useState('white');
  const [gameOver, setGameOver] = useState(null);
  const [drawOffered, setDrawOffered] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [reactions, setReactions] = useState([]);

  const applyFen = useCallback((fen, pgn) => {
    const instance = new Chess(fen);
    setChess(instance);
    setBoard(instance.board());
    setTurn(instance.turn() === 'w' ? 'white' : 'black');
    if (pgn) setMoveHistory(buildHistoryFromPgn(pgn));
  }, []);

  useEffect(() => {
    if (!socket || !routeRoomId) return;
    sendEvent(socket, WS_EVENTS.ROOM_RECONNECT, { roomId: routeRoomId });
  }, [socket, routeRoomId]);

  useEffect(() => {
    return addListener((message) => {
      const p = message.payload;
      switch (message.type) {
        case WS_EVENTS.ROOM_JOINED:
          setRoomId(p.roomId);
          setRoomCode(p.roomCode || '');
          setStatus(p.status);
          setHost(p.host);
          setGuest(p.guest);
          break;
        case WS_EVENTS.GAME_START: {
          setRoomId(p.roomId);
          setRoomCode(p.roomCode || roomCode);
          setStatus('in_progress');
          setHost(p.host || host);
          setGuest(p.guest || guest);
          setClocks(p.clocks || clocks);
          if (p.fen) applyFen(p.fen, p.pgn);
          if (user?.id === p.whiteUserId) setPlayerColor('white');
          else if (user?.id === p.blackUserId) setPlayerColor('black');
          else if (p.color) setPlayerColor(p.color);
          break;
        }
        case WS_EVENTS.GAME_MOVE:
          applyFen(p.fen, p.pgn);
          setClocks(p.clocks || clocks);
          setSelectedSquare(null);
          break;
        case WS_EVENTS.GAME_MOVE_REJECTED:
          toast.error(`Move rejected: ${p.reason}`);
          if (p.fen) applyFen(p.fen);
          break;
        case WS_EVENTS.GAME_DRAW_OFFER:
          setDrawOffered(true);
          toast.info('Opponent offered a draw');
          break;
        case WS_EVENTS.GAME_END:
          setGameOver({ result: p.result, reason: p.reason });
          setStatus('completed');
          break;
        case WS_EVENTS.CHAT_RECEIVE:
          setChatMessages((prev) => [...prev, {
            username: p.username,
            content: p.content,
            timestamp: p.timestamp,
          }]);
          break;
        case WS_EVENTS.REACTION_UPDATE:
          setReactions((prev) => [...prev, { username: p.username, emoji: p.emoji }]);
          break;
        default:
          break;
      }
    });
  }, [addListener, applyFen, user, clocks, host, guest, roomCode]);

  if (!connected || !socket) return <Connecting />;

  const getPieceAtSquare = (square) => {
    const file = square.charCodeAt(0) - 97;
    const rank = 8 - parseInt(square[1], 10);
    return board[rank]?.[file] || null;
  };

  const getPossibleMoves = () => {
    if (!selectedSquare || !playerColor) return [];
    const temp = new Chess(chess.fen());
    return temp.moves({ square: selectedSquare, verbose: true }).map((m) => m.to);
  };

  const handleSquareClick = (square) => {
    if (!playerColor || gameOver || status !== 'in_progress') return;

    if (!selectedSquare) {
      const piece = getPieceAtSquare(square);
      if (!piece) return;
      const isMine = (playerColor === 'white' && piece.color === 'w')
        || (playerColor === 'black' && piece.color === 'b');
      if (isMine) setSelectedSquare(square);
      return;
    }

    if (selectedSquare === square) {
      setSelectedSquare(null);
      return;
    }

    const move = { from: selectedSquare, to: square };
    const temp = new Chess(chess.fen());
    const moveStr = `${move.from}${move.to}`;
    try {
      const result = temp.move(moveStr);
      if (!result) {
        toast.error('Invalid move');
        setSelectedSquare(null);
        return;
      }
      sendEvent(socket, WS_EVENTS.GAME_MOVE, { roomId, move });
      setSelectedSquare(null);
    } catch {
      const piece = getPieceAtSquare(square);
      if (piece) {
        const isMine = (playerColor === 'white' && piece.color === 'w')
          || (playerColor === 'black' && piece.color === 'b');
        setSelectedSquare(isMine ? square : null);
      } else {
        setSelectedSquare(null);
      }
    }
  };

  const resign = () => sendEvent(socket, WS_EVENTS.GAME_RESIGN, { roomId });
  const offerDraw = () => sendEvent(socket, WS_EVENTS.GAME_DRAW_OFFER, { roomId });
  const acceptDraw = () => sendEvent(socket, WS_EVENTS.GAME_DRAW_RESPONSE, { roomId, accept: true });
  const declineDraw = () => {
    sendEvent(socket, WS_EVENTS.GAME_DRAW_RESPONSE, { roomId, accept: false });
    setDrawOffered(false);
  };

  const opponent = user?.id === host?.id ? guest : host;

  return (
    <div className="game-page">
      <header className="game-header">
        <button type="button" onClick={() => navigate('/lobby')}>← Lobby</button>
        <span>vs {opponent?.username || '...'}</span>
      </header>

      <div className="game-layout">
        <aside className="game-sidebar left">
          <RoomStatus roomCode={roomCode} status={status} host={host} guest={guest} />
          <GameTimer clocks={clocks} turn={turn} playerColor={playerColor} />
          <div className="game-actions">
            <button type="button" onClick={resign}>Resign</button>
            <button type="button" onClick={offerDraw}>Offer Draw</button>
            {drawOffered && (
              <>
                <button type="button" onClick={acceptDraw}>Accept Draw</button>
                <button type="button" onClick={declineDraw}>Decline</button>
              </>
            )}
          </div>
        </aside>

        <main>
          <ChessBoard
            board={board}
            onSquareClick={handleSquareClick}
            selectedSquare={selectedSquare}
            possibleMoves={getPossibleMoves()}
            flipped={playerColor === 'black'}
          />
        </main>

        <aside className="game-sidebar right">
          <MoveHistory moveHistory={moveHistory} />
          <ReactionBar socket={socket} roomId={roomId} reactions={reactions} />
          <ChatPanel
            socket={socket}
            roomId={roomId}
            messages={chatMessages}
            onMessage={addListener}
          />
        </aside>
      </div>

      <GameOverModal
        result={gameOver?.result}
        reason={gameOver?.reason}
        onClose={() => navigate('/lobby')}
      />
    </div>
  );
}

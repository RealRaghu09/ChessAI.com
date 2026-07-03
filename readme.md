# ChessAI.com — Technical Module Documentation

[Watch the demo](https://youtu.be/usFw20-xZH4)

**Platform Type:** Real-Time Multiplayer Chess with User Accounts, ELO Rankings, and AI-Assisted Move Analysis  
**Validation Layer:** Dual-layer (Client-side + Server-side)  
**Communication Protocol:** WebSocket (bidirectional, persistent connection) + REST API  
**Backend Framework:** FastAPI  
**AI Integration:** Fine-tuned Small Language Model (SLM) served via a separate REST API (`ai-chess/`)

---

## Application Overview

ChessAI.com is a full-stack online chess platform. Players register accounts, create or join private game rooms via shareable codes, and play rated matches in real time. Game state is validated server-side, matches are stored as PGN, and ELO ratings are updated automatically after each game.

### Routes

| Route            | Access    | Description                                      |
|------------------|-----------|--------------------------------------------------|
| `/`              | Public    | Landing page with login/register entry points    |
| `/login`         | Public    | Email and password login                         |
| `/register`      | Public    | New account registration                       |
| `/lobby`         | Protected | Create or join a room, view ELO                  |
| `/game/:roomId`  | Protected | Live game session                                |
| `/profile`       | Protected | Player stats and match history                   |
| `/leaderboard`   | Protected | Top players ranked by ELO                        |

---

## User Authentication

**Mechanism:** JWT bearer tokens  
**Storage:** Token persisted in `localStorage`; validated on REST requests and WebSocket connection

**Flow:**

1. Player registers or logs in via `POST /api/v1/auth/register` or `POST /api/v1/auth/login`
2. Server returns an access token and public user profile (username, ELO, stats)
3. Protected frontend routes require a valid token via `ProtectedRoute`
4. WebSocket connection is established at `/ws?token=<jwt>` — unauthenticated connections are rejected
5. On connect, the server marks the user online and broadcasts presence to other clients

**Rate Limits:** Registration 10/minute, login 20/minute

---

## Lobby and Room System

Players enter the lobby after authentication. All room operations happen over WebSocket.

**Create Room:**

1. Host clicks Create Room with a configurable time control (default 10 minutes, no increment)
2. Server generates a 6-character room code and returns `room:created`
3. Host waits in the lobby until a guest joins

**Join Room:**

1. Guest enters the room code and sends `room:join`
2. Server validates the code, assigns guest to the room, and broadcasts `room:joined` to both players
3. Both clients navigate to `/game/:roomId` and receive `game:start` with FEN, clocks, and assigned colors

**Reconnection:**

- On page load, the client sends `room:reconnect` with the room ID
- Server restores the active game state (board, clocks, move history) for returning players

---

## Chess Library Integration

The platform enforces move legality and game state integrity through two separate chess libraries — one operating on the server, one on the client. These libraries are not interchangeable; each serves a distinct responsibility in the validation pipeline.

### Backend Validation — python-chess

**Library:** `python-chess`  
**Source:** https://github.com/niklasf/python-chess/  
**Language:** Python  
**Role:** Authoritative game state manager and move validator

The backend is the single source of truth for all game state. No move is committed to the game unless it passes validation on the server. The python-chess library is used to:

- Parse and validate moves in UCI format (from, to, optional promotion)
- Maintain the board state using FEN after every move
- Generate and persist PGN after each move
- Detect and enforce special move rules: castling, en passant, pawn promotion
- Evaluate terminal game states: checkmate, stalemate, draw by insufficient material, and timeout
- Reject any move that is illegal, malformed, or out of turn

Since the game state lives exclusively on the backend, the frontend has no ability to self-report or manipulate game outcomes. Every move submitted by a client is independently re-validated against the server's current board state before being applied.

### Frontend Validation — chess.js

**Library:** `chess.js`  
**Source:** https://www.npmjs.com/package/chess.js  
**Language:** JavaScript  
**Role:** Client-side pre-validation and legal move computation for UI feedback

The frontend maintains a local mirror of the board state using `chess.js`. This layer is used to:

- Compute the set of legal moves for a selected piece before the player interacts
- Highlight valid destination squares on the board UI without waiting for a server round-trip
- Block the user from attempting to submit an obviously illegal move (reduces unnecessary WebSocket traffic)
- Keep the local board in sync with server-confirmed state after each acknowledged move
- Rebuild move history from PGN received from the server

---

## Real-Time Multiplayer

Two authenticated players connect to a shared game session over a persistent WebSocket connection. The connection is established at login and maintained across lobby and game pages.

**Connection Behavior:**

- No polling is used
- Move submission, chat, reactions, and room events are WebSocket messages
- JWT token is passed as a query parameter on connect
- Disconnection handling preserves game state on the server pending reconnection

**Move Flow (per turn):**

1. Player selects a piece — chess.js computes and highlights legal destination squares
2. Player selects a destination — if pawn promotion is required, a promotion picker is shown (queen, rook, bishop, knight)
3. chess.js performs pre-validation; if it passes, the move is transmitted via `game:move`
4. Server validates the move against the python-chess board state and applies clock deductions
5. If valid: server applies the move, generates new FEN and PGN, and broadcasts to both clients
6. If invalid: server sends `game:move_rejected`; the client reverts its local state

**Game Controls:**

- Resign — immediate loss for the resigning player
- Offer Draw — opponent can accept or decline via `game:draw_response`
- Game Over modal displayed on checkmate, stalemate, resignation, draw agreement, or timeout

---

## Backend — Move Validation and Game Logic

**Runtime:** Python  
**Core Library:** python-chess  
**State Format:** FEN (Forsyth-Edwards Notation) + PGN (Portable Game Notation)

The backend maintains the following game state data at all times:

| State Field         | Description                                              |
|---------------------|----------------------------------------------------------|
| Board position      | FEN string encoding piece placement                      |
| Active color        | Which side (White/Black) is to move                      |
| Castling rights     | Availability of kingside/queenside castling per side     |
| En passant target   | Target square for en passant capture, if applicable      |
| Halfmove clock      | Moves since last capture or pawn advance (50-move rule)  |
| Fullmove number     | Incremented after Black's move                           |
| White/Black clocks  | Remaining time in milliseconds                           |
| Increment           | Added to the moving player's clock after each move       |
| PGN                 | Full move list stored incrementally                      |
| Game status         | waiting, in_progress, completed                          |

**Validation Logic:**

Every incoming move is evaluated against:

- Piece movement rules for the piece type on the source square
- Turn order (correct player is moving)
- Pin detection (move does not leave own king in check)
- Special move legality (castling through check is illegal, etc.)
- Board boundary and occupancy rules
- Clock enforcement (timeout ends the game)

Illegal moves are rejected with an error reason before any state mutation occurs.

**Storage:**

- Default: JSON file store under `backend/data/` (users, rooms, matches, chat, reactions, ELO history)
- Optional: PostgreSQL via `DATABASE_URL` environment variable

---

## ELO Rating System

After each completed rated match between two registered players, ELO ratings are recalculated and persisted.

**Configuration:**

- Default starting ELO: 1200
- K-factor: 32

**On Game End:**

1. `RankingService` records the match with PGN, result, duration, and pre/post ELO for both players
2. Standard ELO formula applied per player based on result (win / loss / draw)
3. User stats updated: total matches, wins, losses, draws, win percentage, current streak
4. ELO history entry appended per player for the match

**Leaderboard:** `GET /api/v1/leaderboard` returns top players sorted by ELO with W/L/D and win percentage.

**Profile:** `GET /api/v1/users/:id/matches` returns match history with result, duration, and post-game ELO.

---

## In-Game Social Features

**Chat:**

- Players send messages via `chat:send` WebSocket event
- Messages broadcast to the room via `chat:receive`
- Message content capped at 500 characters
- Chat history stored server-side per room

**Reactions:**

- Players send emoji reactions via `reaction:add`
- Supported reactions: thumbs up, clap, fire, surprised
- Reactions broadcast via `reaction:update` and displayed in the reaction bar

---

## AI Move Suggestion System

### Model Architecture

The AI subsystem is a Small Language Model (SLM) fine-tuned on historical chess game data. It is not a classical chess engine. Instead, it uses pattern-based inference derived from training data to suggest plausible, high-quality moves given a board position.

**Training Approach:**

- Base model fine-tuned on a labeled dataset of chess moves (input: move sequence, output: analysis and recommended move in SAN)
- Model weights loaded at inference time
- Inference served through a REST endpoint (`POST /make_move`)

### Inference Performance

| Metric                  | Value              |
|-------------------------|--------------------|
| Tokens per second       | 10 – 20 tokens/sec |
| Time to first token     | 150 – 250 ms       |
| Total response latency  | ~400 ms            |

These benchmarks reflect single-request local inference with GPU acceleration.

**Integration Status:** The AI service runs independently. The main game UI does not currently invoke it during live play. It can be called directly against the `ai-chess` API for move analysis given a move history and player color.

**Design Constraint:** AI suggestions are advisory only. The player retains full control of move selection. The AI layer does not automatically execute moves or influence the game state.

---

## Frontend — Interactive Chessboard

**Technologies:** React 19, Vite, Tailwind CSS, react-router-dom, react-toastify  
**Chess Logic:** chess.js  
**Communication:** WebSocket (game events, chat, reactions) + REST API (auth, profile, leaderboard)

**UI Capabilities:**

- Minimal black-and-white design across all pages
- Render the board with correct piece placement from FEN received from the server
- Board flips automatically for the Black player
- Highlight legal move targets on piece selection (computed via chess.js)
- Pawn promotion picker (queen, rook, bishop, knight)
- Live game clocks with turn indicator
- Move history panel rebuilt from server PGN
- In-game chat panel and emoji reaction bar
- Room status display (code, host, guest, status)
- Game over modal with result and reason
- Toast notifications for errors, draw offers, and connection events

**Board Coordinate Reference:**

The board uses standard algebraic notation. Files are labeled A through H (left to right from White's perspective), and ranks are labeled 1 through 8 (bottom to top from White's perspective).

|       | A  | B  | C  | D  | E  | F  | G  | H  |
|-------|----|----|----|----|----|----|----|----|
| **8** | A8 | B8 | C8 | D8 | E8 | F8 | G8 | H8 |
| **7** | A7 | B7 | C7 | D7 | E7 | F7 | G7 | H7 |
| **6** | A6 | B6 | C6 | D6 | E6 | F6 | G6 | H6 |
| **5** | A5 | B5 | C5 | D5 | E5 | F5 | G5 | H5 |
| **4** | A4 | B4 | C4 | D4 | E4 | F4 | G4 | H4 |
| **3** | A3 | B3 | C3 | D3 | E3 | F3 | G3 | H3 |
| **2** | A2 | B2 | C2 | D2 | E2 | F2 | G2 | H2 |
| **1** | A1 | B1 | C1 | D1 | E1 | F1 | G1 | H1 |

---

## API Endpoints

| Method | Path                        | Description                    |
|--------|-----------------------------|--------------------------------|
| GET    | `/api/v1/health`            | Health check and storage backend |
| POST   | `/api/v1/auth/register`     | Create account                 |
| POST   | `/api/v1/auth/login`        | Login                          |
| POST   | `/api/v1/auth/logout`       | Logout                         |
| GET    | `/api/v1/auth/me`           | Current user profile           |
| GET    | `/api/v1/users/:id`         | Public user profile            |
| PATCH  | `/api/v1/users/me`          | Update own profile             |
| GET    | `/api/v1/users/:id/matches` | Match history for a user       |
| GET    | `/api/v1/leaderboard`       | Top players by ELO             |
| WS     | `/ws?token=<jwt>`           | Real-time game and lobby events |

OpenAPI docs available at `/api/v1/docs`.

---

## Fair Play and Anti-Cheat Design

All game integrity mechanisms are enforced server-side.

**Enforcement Points:**

- Moves cannot be applied without server acknowledgment
- The game state is never stored or modified on the client in a way that propagates back to the server
- Move timestamps and clocks are managed exclusively on the server
- The server can detect and reject moves that arrive out of sequence or with invalid session context
- ELO changes are computed server-side only after a validated game result

**What the Frontend Cannot Do:**

- Submit a move on behalf of the opponent
- Skip validation by sending a raw FEN update
- Claim checkmate or draw without server confirmation
- Modify game history or ELO ratings

---

## Getting Started

**Backend:**

```bash
cd backend
cp .env.example .env   # set JWT_SECRET, CORS_ORIGINS, optional DATABASE_URL
pip install -r requirements.txt
python main.py         # runs on http://127.0.0.1:8000
```

**Frontend:**

```bash
cd client
cp .env.example .env   # set VITE_API_URL and VITE_WS_URL
npm install
npm run dev            # runs on http://localhost:5173
```

**AI Service (optional):**

```bash
cd ai-chess
python app.py          # runs on http://localhost:11432
```

---

## Planned Improvements

| Feature                  | Technical Notes                                                              |
|--------------------------|------------------------------------------------------------------------------|
| AI in live game UI       | Wire ai-chess suggestions into the game board as highlighted move overlays   |
| Spectator mode           | Read-only WebSocket subscription to an active game session                   |
| Tournament bracket       | Matchmaking queue with bracket progression logic server-side                 |
| Game replay viewer       | Step through stored PGN move-by-move on the profile or a dedicated replay page |

---

## References

- python-chess library: https://github.com/niklasf/python-chess/
- chess.js library: https://www.npmjs.com/package/chess.js
- FEN notation specification: https://www.chessprogramming.org/Forsyth-Edwards_Notation
- FastAPI documentation: https://fastapi.tiangolo.com/

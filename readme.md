# ChessAI.com — Technical Module Documentation

**Platform Type:** Real-Time Multiplayer Chess with AI-Assisted Move Suggestion  
**Validation Layer:** Dual-layer (Client-side + Server-side)  
**Communication Protocol:** WebSocket (bidirectional, persistent connection)  
**AI Integration:** Fine-tuned Small Language Model (SLM) served via RESTful API

---

## Chess Library Integration

The platform enforces move legality and game state integrity through two separate chess libraries — one operating on the server, one on the client. These libraries are not interchangeable; each serves a distinct responsibility in the validation pipeline.

### Backend Validation — python-chess

**Library:** `python-chess`  
**Source:** https://github.com/niklasf/python-chess/  
**Language:** Python  
**Role:** Authoritative game state manager and move validator

The backend is the single source of truth for all game state. No move is committed to the game unless it passes validation on the server. The python-chess library is used to:

- Parse and validate moves in Standard Algebraic Notation (SAN) and Universal Chess Interface (UCI) format
- Maintain the board state using FEN (Forsyth-Edwards Notation) after every move
- Detect and enforce special move rules: castling, en passant, pawn promotion
- Evaluate terminal game states: checkmate, stalemate, draw by insufficient material, fifty-move rule, and threefold repetition
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



---

## Real-Time Multiplayer

Two players connect to a shared game session over a persistent WebSocket connection. The connection is established at session creation and maintained for the duration of the game.

**Connection Behavior:**

- No polling is used
- Move submission is a client-to-server event
- Disconnection handling preserves game state on the server pending reconnection

**Move Flow (per turn):**

1. Player selects a piece — chess.js computes and highlights legal destination squares
2. Player selects a destination — chess.js performs pre-validation
3. If pre-validation passes, the move is transmitted to the server via WebSocket
4. Server receives the move and validates it against the python-chess board state
5. If valid: python-chess applies the move, generates the new FEN, and the server broadcasts the updated board to both clients
6. If invalid: the server sends a rejection event; the client reverts its local state

---

## Backend — Move Validation and Game Logic

**Runtime:** Python  
**Core Library:** python-chess  
**State Format:** FEN (Forsyth-Edwards Notation)

The backend maintains the following game state data at all times:

| State Field         | Description                                              |
|---------------------|----------------------------------------------------------|
| Board position      | FEN string encoding piece placement                      |
| Active color        | Which side (White/Black) is to move                      |
| Castling rights     | Availability of kingside/queenside castling per side     |
| En passant target   | Target square for en passant capture, if applicable      |
| Halfmove clock      | Moves since last capture or pawn advance (50-move rule)  |
| Fullmove number     | Incremented after Black's move                           |
| Game status         | Active, Check, Checkmate, Stalemate, Draw                |

**Validation Logic:**

Every incoming move is evaluated against:

- Piece movement rules for the piece type on the source square
- Turn order (correct player is moving)
- Pin detection (move does not leave own king in check)
- Special move legality (castling through check is illegal, etc.)
- Board boundary and occupancy rules

Illegal moves are rejected with an error code before any state mutation occurs.

---

## AI Move Suggestion System

### Model Architecture

The AI subsystem is a Small Language Model (SLM) fine-tuned on historical chess game data. It is not a classical chess engine. Instead, it uses pattern-based inference derived from training data to suggest plausible, high-quality moves given a board position.

**Training Approach:**

- Base model fine-tuned on a labeled dataset of chess moves (input: FEN or move sequence, output: next move in UCI format)
- Model weights are saved post-fine-tuning and loaded at inference time
- The model runs locally on the server host (no external API dependency)
- Inference is served through a RESTful HTTP API endpoint

### Inference Performance

| Metric                  | Value              |
|-------------------------|--------------------|
| Tokens per second       | 10 – 20 tokens/sec |
| Time to first token     | 150 – 250 ms       |
| Total response latency  | ~400 ms            |

These benchmarks reflect single-request local inference with GPU acceleration. The latency is acceptable .
### Integration with Game Session

The AI suggestion feature is opt-in per player per turn. When invoked:

1. The frontend sends a suggestion request event (REST call) containing the current FEN
2. The server forwards the FEN to the AI inference API
3. The model returns one or more candidate moves in UCI format
4. The server validates the suggested moves against python-chess to confirm they are legal
5. Legal suggestions are returned to the requesting client and rendered as highlighted squares on the board

**Design Constraint:** AI suggestions are advisory only. The player retains full control of move selection. The AI layer does not automatically execute moves or influence the game state.

---

## Frontend — Interactive Chessboard

**Technologies:** Vite , Tailwind CSS , emotion/react 
**Chess Logic:** chess.js  
**Communication:** WebSockets , RESTFUL API
**UI Capabilities:**

- Render the board with correct piece placement from FEN received from the server
- Highlight legal move targets on piece selection (computed via chess.js)
- Highlight the AI-suggested move overlay as a distinct visual layer

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

## Fair Play and Anti-Cheat Design

All game integrity mechanisms are enforced server-side.

**Enforcement Points:**

- Moves cannot be applied without server acknowledgment
- The game state is never stored or modified on the client in a way that propagates back to the server
- Move timestamps can be recorded for time-control enforcement
- The server can detect and reject moves that arrive out of sequence or with invalid session context

**What the Frontend Cannot Do:**

- Submit a move on behalf of the opponent
- Skip validation by sending a raw FEN update
- Claim checkmate or draw without server confirmation
- Modify game history

---

## Planned Improvements

| Feature                  | Technical Notes                                                              |
|--------------------------|------------------------------------------------------------------------------|
| ELO rating system        | standard ELO calculation persisted per player account            |
| Game history and replay  | Move list stored as PGN   |
| Spectator mode           | Read-only WebSocket subscription to an active game session                   |
| Tournament bracket       | Matchmaking queue with bracket progression logic server-side                 |

---

## References

- python-chess library: https://github.com/niklasf/python-chess/
- chess.js library: https://www.npmjs.com/package/chess.js
- FEN notation specification: https://www.chessprogramming.org/Forsyth-Edwards_Notation

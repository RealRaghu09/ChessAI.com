##using chess library to validate and move in the chess 
    for Backend - https://github.com/niklasf/python-chess/
    for Frontend - https://www.npmjs.com/package/chess.js?activeTab=readme
    This is the Core for validating the Each step. and validating with server and client script 
# ♟️ ChessAI.com

ChessAI.com is a real-time online chess platform that connects two players using **WebSockets**, validates gameplay using the **python-chess** library, and enhances the playing experience with an **AI-powered move suggestion system**. The platform is designed with a clean, modern UI and focuses on correctness, performance, and usability.
## Demo Video

[[Watch the demo]](https://youtu.be/usFw20-xZH4)

---

##  Features

###  Real-Time Multiplayer
- Two players are connected instantly using **WebSockets**
- Low-latency, bidirectional communication
- Live board updates for both players

### Backend – Move Validation & Game Logic
- Built using **Python**
- Uses **python-chess** to:
  - Validate legal moves
  - Maintain game state (FEN, turn, check, checkmate, draw, etc.)
  - Prevent illegal or malformed moves
- Secure and authoritative backend (frontend cannot cheat)

###  AI Assistance (Optional)
- AI feature can be toggled by the player
- When clicked, the AI:
  - Predicts **best possible moves**
  - Suggests moves based on current board position
- AI is **fine-tuned on chess movement data** to provide practical and helpful suggestions
- Designed to assist players, not replace decision-making

### Frontend – Interactive Chessboard
- Responsive and visually clean chessboard UI
- Highlights:
  - Legal moves
  - Selected piece
  - AI-recommended moves
- Smooth user experience 

---

##  AI Model Overview

- Trained / fine-tuned on historical chess move data
- Evaluates board positions and suggests optimal or near-optimal moves
- Integrated seamlessly with the frontend via API/WebSocket events
- Focused on:
  - Move quality
  - Fast inference
  - Real-time usability

---

##  Tech Stack

### Backend
- Python
- python-chess
- WebSockets (real-time communication)
- REST / WebSocket APIs for AI predictions

### Frontend
- HTML, CSS, JavaScript
- Interactive chessboard UI
- WebSocket client for live updates
- AI move suggestion overlay

---


---

##  Fair Play & Validation

- All moves are validated **server-side**
- Game state is maintained only on the backend
- Prevents illegal moves, invalid states, and manipulation

---

##  Future Improvements

- Player ratings (ELO)
- Game history & replay
- AI difficulty levels
- Spectator mode
- Timed matches & tournaments

---

##Chess Board Coordinates

|   | A8 | B8 | C8 | D8 | E8 | F8 | G8 | H8 |
|---|----|----|----|----|----|----|----|----|
| 7 | A7 | B7 | C7 | D7 | E7 | F7 | G7 | H7 |
| 6 | A6 | B6 | C6 | D6 | E6 | F6 | G6 | H6 |
| 5 | A5 | B5 | C5 | D5 | E5 | F5 | G5 | H5 |
| 4 | A4 | B4 | C4 | D4 | E4 | F4 | G4 | H4 |
| 3 | A3 | B3 | C3 | D3 | E3 | F3 | G3 | H3 |
| 2 | A2 | B2 | C2 | D2 | E2 | F2 | G2 | H2 |
| 1 | A1 | B1 | C1 | D1 | E1 | F1 | G1 | H1 |
|---|----|----|----|----|----|----|----|----|

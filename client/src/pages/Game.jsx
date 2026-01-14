import { useEffect, useState } from "react"
import { useSocket } from "../hooks/useSocket"
import { ChessBoard } from "./ChessBoard"
import { MoveHistory } from "./MoveHistory"
import { toast } from "react-toastify"
import {Chess} from 'chess.js'
import Connecting  from "./Connecting"
export const INIT_GAME = "init_game"
export const MOVE = "move"
// export const API_END_POINT = 'APIENDPOINT'
export const GAME_OVER = "game_over"
export const Game = ()=> {
    const socket = useSocket()
    const [chess ,setChess]= useState(() => new Chess());
    const [board , setBoard] = useState(() => {
        const initialChess = new Chess()
        return initialChess.board()
    })
    const [selectedSquare, setSelectedSquare] = useState(null)
    const [playerColor, setPlayerColor] = useState(null)
    const [moveHistory, setMoveHistory] = useState([])
    // const movesArray = [];
    // //Button for AI
    // const aiResponse = async ()=>{
    //     const data = {
    //         "moves": movesArray
    //     }
    //     try{
    //         const res = await fetch(API_END_POINT,{
    //             method: 'POST',
    //             headers: {
    //             'Content-Type': 'application/json'
    //             },
    //             body: JSON.stringify(data),
    //         });
    //         const responseData = await res.json();
    //         const responseContent = responseData['response']
    //         console.log(responseContent)
    //     }catch(error){
    //         console.log("Error" , error)
    //     }
    // }
    useEffect(()=>{
        if(!socket) return ;
        
        const handleMessage = (event) => {
            try {
                const message = JSON.parse(event.data)
                console.log(message)
                switch (message.type){
                    case INIT_GAME:
                        const newChess = new Chess()
                        setChess(newChess)
                        setBoard(newChess.board())
                        setSelectedSquare(null)
                        setMoveHistory([]) // Reset move history for new game
                        // Set player color from payload
                        if (message.payload && message.payload.color) {
                            setPlayerColor(message.payload.color)
                        } else if (message.pay_load && message.pay_load.color) {
                            // Fallback for snake_case (backward compatibility)
                            setPlayerColor(message.pay_load.color)
                        }
                        console.log("Initialize the game ", message.payload || message.pay_load)
                        break
                    case MOVE:
                        setChess(currentChess => {
                            const newChessInstance = new Chess(currentChess.fen())
                            const move = message.payload || message.pay_load // Support both payload and pay_load
                            // Convert move object to UCI format if needed
                            let moveStr = move
                            if (typeof move === 'object' && move.from && move.to) {
                                moveStr = `${move.from}${move.to}`
                                if (move.promotion) {
                                    moveStr += move.promotion
                                }
                                // movesArray.append(moveStr)
                            }

                            try {
                                const moveResult = newChessInstance.move(moveStr)
                                if (moveResult) {
                                    setBoard(newChessInstance.board())
                                    console.log("Move done successfully")
                                    // Add move to history
                                    setMoveHistory(prevHistory => [...prevHistory, {
                                        moveNumber: Math.floor(prevHistory.length / 2) + 1,
                                        move: moveResult.san,
                                        color: moveResult.color === 'w' ? 'white' : 'black'
                                    }])
                                } else {
                                    console.error("Invalid move received:", moveStr)
                                    toast.error(`Invalid move received: in else block ${moveStr}`)
                                }
                            } catch (error) {
                                console.error("Error applying move:", error, "Move:", moveStr)
                                toast.error(`Invalid move received: in catch block${moveStr}`)
                            }
                            return newChessInstance
                        })
                        break
                    case GAME_OVER:
                        console.log("Game Over")
                        break
                }
            } catch (error) {
                console.error("Error parsing message:", error)
            }
        }
        
        socket.onmessage = handleMessage
        
        return () => {
            socket.onmessage = null
        }
    },[socket])
    if (!socket){
        return <div>
            <Connecting/>
        </div>
    }
    if (!board) {
        return <div>Loading board...</div>
    }
    
    const handleSquareClick = (square) => {
        try {
            console.log("Square clicked:", square, "Selected:", selectedSquare, "Player color:", playerColor)

            // If no square is selected, select this square (if it has a piece)
            if (!selectedSquare) {
                const piece = getPieceAtSquare(square)
                console.log("No selection, piece at square:", piece)
                if (piece) {
                    // Check if it's the player's piece (or allow if playerColor not set yet)
                    const isPlayerPiece = playerColor === null ||
                                         (playerColor === 'white' && piece.color === 'w') ||
                                         (playerColor === 'black' && piece.color === 'b')
                    console.log("Is player piece:", isPlayerPiece)
                    if (isPlayerPiece) {
                        setSelectedSquare(square)
                        console.log("Square selected:", square)
                    }
                }
                return
            }

            // If same square is clicked, deselect
            if (selectedSquare === square) {
                setSelectedSquare(null)
                console.log("Deselected square")
                return
            }

            // Try to make a move
            const move = {
                from: selectedSquare,
                to: square
            }

            console.log("Attempting move:", move)

            // Check if move is valid locally first
            try {
                const tempChess = new Chess(chess.fen())
                const moveStr = `${move.from}${move.to}`
                console.log("Move string:", moveStr)

                // If playerColor is null (testing mode), temporarily set turn to the piece's color
                const originalTurn = tempChess.turn()
                if (playerColor === null) {
                    const piece = getPieceAtSquare(selectedSquare)
                    if (piece) {
                        // Set turn to match the piece being moved
                        const pieceColor = piece.color === 'w' ? 'white' : 'black'
                        if (pieceColor === 'black' && tempChess.turn() === 'w') {
                            // Force black's turn for testing
                            tempChess.load(tempChess.fen().replace(' w ', ' b '))
                        }
                    }
                }

                try {
                    const moveResult = tempChess.move(moveStr)
                    console.log("Move result:", moveResult)

                    if (moveResult) {
                        // Send move to server if socket is available
                        if (socket && socket.readyState === WebSocket.OPEN) {
                            socket.send(JSON.stringify({
                                type: MOVE,
                                move: move
                            }))
                            console.log("Move sent to server")
                        } else {
                            console.log("Socket not available, making local move only")
                        }

                        // Optimistic update
                        setChess(tempChess)
                        setBoard(tempChess.board())
                        setSelectedSquare(null)
                        // Add move to history
                        setMoveHistory(prevHistory => [...prevHistory, {
                            moveNumber: Math.floor(prevHistory.length / 2) + 1,
                            move: moveResult.san,
                            color: moveResult.color === 'w' ? 'white' : 'black'
                        }])
                        console.log("Move applied successfully")
                    } else {
                        console.log("Invalid move, trying to select new square")
                        toast.error(`Invalid move: ${move.from} to ${move.to}`)
                        // Invalid move, try selecting the new square if it has a piece
                        const piece = getPieceAtSquare(square)
                        if (piece) {
                            const isPlayerPiece = playerColor === null ||
                                                 (playerColor === 'white' && piece.color === 'w') ||
                                                 (playerColor === 'black' && piece.color === 'b')
                            if (isPlayerPiece) {
                                setSelectedSquare(square)
                            } else {
                                setSelectedSquare(null)
                            }
                        } else {
                            setSelectedSquare(null)
                        }
                    }
                } catch (moveError) {
                    console.log("Move validation error:", moveError)
                    toast.error(`Invalid move:${moveError} ${move.from} to ${move.to}`)
                    // Invalid move, try selecting the new square if it has a piece
                    const piece = getPieceAtSquare(square)
                    if (piece) {
                        const isPlayerPiece = playerColor === null ||
                                             (playerColor === 'white' && piece.color === 'w') ||
                                             (playerColor === 'black' && piece.color === 'b')
                        if (isPlayerPiece) {
                            setSelectedSquare(square)
                        } else {
                            setSelectedSquare(null)
                        }
                    } else {
                        setSelectedSquare(null)
                    }
                }
            } catch (error) {
                console.error("Error making move:", error)
                // Try selecting the new square if it has a piece
                try {
                    const piece = getPieceAtSquare(square)
                    if (piece) {
                        const isPlayerPiece = playerColor === null ||
                                             (playerColor === 'white' && piece.color === 'w') ||
                                             (playerColor === 'black' && piece.color === 'b')
                        if (isPlayerPiece) {
                            setSelectedSquare(square)
                        } else {
                            setSelectedSquare(null)
                        }
                    } else {
                        setSelectedSquare(null)
                    }
                } catch (fallbackError) {
                    console.error("Error in fallback selection:", fallbackError)
                    setSelectedSquare(null)
                }
            }
        } catch (error) {
            console.error("Critical error in handleSquareClick:", error)
            setSelectedSquare(null)
        }
    }
    
    const getPieceAtSquare = (square) => {
        try {
            if (!square || square.length !== 2) return null
            const file = square[0].charCodeAt(0) - 97 // a=0, h=7
            const rank = 8 - parseInt(square[1]) // 1=7, 8=0
            console.log(`Getting piece at ${square}: file=${file}, rank=${rank}`)
            if (rank >= 0 && rank < 8 && file >= 0 && file < 8 && board && board[rank]) {
                const piece = board[rank][file] || null
                console.log(`Piece found:`, piece)
                return piece
            }
            console.log(`No piece found at ${square}`)
            return null
        } catch (error) {
            console.error(`Error getting piece at square ${square}:`, error)
            return null
        }
    }
    
    const getPossibleMoves = () => {
        if (!selectedSquare) return []
        const tempChess = new Chess(chess.fen())
        const moves = tempChess.moves({ square: selectedSquare, verbose: true })
        return moves.map(m => m.to)
    }
    
    return (
        <div style={{ padding: '2rem', minHeight: '100vh', background: 'linear-gradient(to bottom right, #000000, #0f172a, #172554)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem' }}>
                <div style={{ color: 'white', fontSize: '1.2rem', fontWeight: '600', textAlign: 'center' }}>
                    {playerColor ? (
                        <>You are playing as: <span style={{ textTransform: 'capitalize' }}>{playerColor}</span></>
                    ) : (
                        <>Click "Start Game" to begin. You can still move pieces to test.</>
                    )}
                    {selectedSquare && (
                        <div style={{ marginTop: '0.5rem', fontSize: '1rem', color: '#60a5fa' }}>
                            Selected: {selectedSquare}
                        </div>
                    )}
                </div>
                <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
                    <ChessBoard
                        board={board}
                        onSquareClick={handleSquareClick}
                        selectedSquare={selectedSquare}
                        possibleMoves={getPossibleMoves()}
                    />
                    <MoveHistory moveHistory={moveHistory} />
                </div>
                {/* <div>
                    <button onClick={aiResponse}>
                        AI
                    </button>
                </div> */}
                <button 
                    onClick={()=>{
                        if (socket && socket.readyState === WebSocket.OPEN) {
                            socket.send(JSON.stringify({
                                "type": INIT_GAME
                            }))
                        }
                    }}
                    style={{
                        padding: '12px 24px',
                        fontSize: '1.1rem',
                        backgroundColor: '#2563eb',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: '600'
                    }}
                >
                    Start Game
                </button>
            </div>
        </div>
    )
}
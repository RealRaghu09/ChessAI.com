import { useState } from "react"
import "./ChessBoard.css"

// Unicode chess piece symbols
const pieceSymbols = {
    'wK': '♔', 'wQ': '♕', 'wR': '♖', 'wB': '♗', 'wN': '♘', 'wP': '♙',
    'bK': '♚', 'bQ': '♛', 'bR': '♜', 'bB': '♝', 'bN': '♞', 'bP': '♟'
}

export const ChessBoard = ({ board, onSquareClick, selectedSquare, possibleMoves = [] }) => {
    const getPieceSymbol = (piece) => {
        if (!piece) return ''
        const key = `${piece.color}${piece.type.toUpperCase()}`
        return pieceSymbols[key] || ''
    }

    const isLightSquare = (row, col) => {
        return (row + col) % 2 === 0
    }

    const getSquareName = (row, col) => {
        const file = String.fromCharCode(97 + col) // a-h
        const rank = 8 - row // 1-8
        return `${file}${rank}`
    }

    const handleSquareClick = (square) => {
        if (onSquareClick) {
            onSquareClick(square)
        }
    }

    const isPossibleMove = (square) => {
        return possibleMoves.includes(square)
    }

    return (
        <div className="chess-board-container">
            <div className="chess-board">
                {/* File labels (a-h) */}
                <div className="file-labels-top">
                    {['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].map(file => (
                        <div key={file} className="file-label">{file}</div>
                    ))}
                </div>

                <div className="board-content">
                    {/* Rank labels (8-1) */}
                    <div className="rank-labels">
                        {[8, 7, 6, 5, 4, 3, 2, 1].map(rank => (
                            <div key={rank} className="rank-label">{rank}</div>
                        ))}
                    </div>

                    {/* Chess board squares */}
                    <div className="board-squares">
                        {board.map((row, rowIndex) =>
                            row.map((piece, colIndex) => {
                                const square = getSquareName(rowIndex, colIndex)
                                const isLight = isLightSquare(rowIndex, colIndex)
                                const isSelected = selectedSquare === square
                                const pieceSymbol = getPieceSymbol(piece)

                                const isPossible = isPossibleMove(square)
                                
                                return (
                                    <div
                                        key={square}
                                        className={`chess-square ${isLight ? 'light' : 'dark'} ${isSelected ? 'selected' : ''} ${isPossible ? 'possible-move' : ''}`}
                                        onClick={() => handleSquareClick(square)}
                                    >
                                        {pieceSymbol && (
                                            <span className={`chess-piece ${piece?.color === 'w' ? 'white-piece' : 'black-piece'}`}>
                                                {pieceSymbol}
                                            </span>
                                        )}
                                        {isSelected && <div className="selection-indicator"></div>}
                                        {isPossible && !pieceSymbol && <div className="possible-move-indicator"></div>}
                                    </div>
                                )
                            })
                        )}
                    </div>

                    {/* Rank labels (8-1) */}
                    <div className="rank-labels">
                        {[8, 7, 6, 5, 4, 3, 2, 1].map(rank => (
                            <div key={rank} className="rank-label">{rank}</div>
                        ))}
                    </div>
                </div>

                {/* File labels (a-h) */}
                <div className="file-labels-bottom">
                    {['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].map(file => (
                        <div key={file} className="file-label">{file}</div>
                    ))}
                </div>
            </div>
        </div>
    )
}
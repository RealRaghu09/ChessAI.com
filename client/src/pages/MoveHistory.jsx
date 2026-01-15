import React,{useState} from 'react'
import "./MoveHistory.css"
export const MoveHistory = ({ moveHistory }) => {
    const [response, setResponse] = useState("");
    const [loading, setLoading] = useState(false);
    const getfromAI =async ()=>{
        if (!prompt.trim()) return;

    setLoading(true);
    const API = "http://localhost:8080/make_move"
    try {
      const res = await fetch(API, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          move: moveHistory , 
          color : color
        }),
      });

      const data = await res.json();
      setResponse(data.content || JSON.stringify(data));
    }
    catch (err) {
        setResponse("Error calling API");
      } finally {
        setLoading(false);
      }
    }
    
    return (
        <div>
        <div style={{
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            borderRadius: '8px',
            padding: '1rem',
            minWidth: '300px',
            maxWidth: '400px',
            maxHeight: '400px',
            overflowY: 'auto',
            border: '1px solid #374151'
        }}>
            <h3 style={{
                color: 'white',
                margin: '0 0 1rem 0',
                fontSize: '1.2rem',
                fontWeight: '600',
                textAlign: 'center'
            }}>
                Move History
            </h3>

            {moveHistory.length === 0 ? (
                <div style={{
                    color: '#9ca3af',
                    textAlign: 'center',
                    fontStyle: 'italic'
                }}>
                    No moves yet
                </div>
            ) : (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'auto 1fr 1fr',
                    gap: '0.5rem',
                    alignItems: 'center'
                }}>
                    {/* Header */}
                    <div style={{ color: '#9ca3af', fontSize: '0.8rem', fontWeight: '600' }}>#</div>
                    <div style={{ color: '#9ca3af', fontSize: '0.8rem', fontWeight: '600' }}>White</div>
                    <div style={{ color: '#9ca3af', fontSize: '0.8rem', fontWeight: '600' }}>Black</div>

                    {/* Moves */}
                    {Array.from({ length: Math.ceil(moveHistory.length / 2) }, (_, i) => {
                        const whiteMove = moveHistory[i * 2]
                        const blackMove = moveHistory[i * 2 + 1]

                        return (
                            <React.Fragment key={i + 1}>
                                <div style={{
                                    color: 'white',
                                    fontSize: '0.9rem',
                                    fontWeight: '500',
                                    textAlign: 'center'
                                }}>
                                    {i + 1}
                                </div>
                                <div style={{
                                    color: 'white',
                                    fontSize: '0.9rem',
                                    backgroundColor: 'rgba(59, 130, 246, 0.2)',
                                    padding: '0.25rem 0.5rem',
                                    borderRadius: '4px',
                                    textAlign: 'center',
                                    cursor: 'pointer',
                                    transition: 'background-color 0.2s'
                                }}
                                onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(59, 130, 246, 0.4)'}
                                onMouseLeave={(e) => e.target.style.backgroundColor = 'rgba(59, 130, 246, 0.2)'}
                                >
                                    {whiteMove ? whiteMove.move : ''}
                                </div>
                                <div style={{
                                    color: 'white',
                                    fontSize: '0.9rem',
                                    backgroundColor: blackMove ? 'rgba(107, 114, 128, 0.2)' : 'transparent',
                                    padding: '0.25rem 0.5rem',
                                    borderRadius: '4px',
                                    textAlign: 'center',
                                    cursor: blackMove ? 'pointer' : 'default',
                                    transition: 'background-color 0.2s'
                                }}
                                onMouseEnter={(e) => {
                                    if (blackMove) e.target.style.backgroundColor = 'rgba(107, 114, 128, 0.4)'
                                }}
                                onMouseLeave={(e) => {
                                    if (blackMove) e.target.style.backgroundColor = 'rgba(107, 114, 128, 0.2)'
                                }}
                                >
                                    {blackMove ? blackMove.move : ''}
                                </div>
                            </React.Fragment>
                        )
                    })}
            
                </div>
            )}
        </div >
            <div className="aiResponse">
            <button onClick={getfromAI} disabled={loading}>
                {loading ? "Generating..." : "Get Moves from AI"}
            </button>
            <div className="divresponse">
                <pre className="response">{response}</pre>
            </div>
        </div>
    </div>
    )
}

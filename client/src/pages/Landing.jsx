import { useNavigate, Link } from "react-router"
import { useAuth } from "../context/AuthContext"

const btnClass = "border-2 border-white px-10 py-4 text-sm font-semibold uppercase tracking-[0.25em] hover:bg-white hover:text-black transition-colors";

export default function Landing() {
    const navigate = useNavigate()
    const { isAuthenticated } = useAuth()

    return (
        <div className="min-h-screen bg-black text-white flex flex-col">
            {/* Decorative chess grid */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-[0.04]">
                <div className="grid grid-cols-[repeat(16,minmax(0,1fr))] h-full w-full">
                    {Array.from({ length: 256 }).map((_, i) => (
                        <div key={i} className={(Math.floor(i / 16) + (i % 16)) % 2 === 0 ? 'bg-white' : 'bg-black'} />
                    ))}
                </div>
            </div>

            <nav className="relative z-10 flex justify-between items-center px-8 py-6 border-b border-white/20">
                <span className="text-xs uppercase tracking-[0.3em] text-neutral-400">ChessAI</span>
                {isAuthenticated && (
                    <Link to="/lobby" className="text-xs uppercase tracking-[0.2em] no-underline hover:opacity-70">
                        Lobby
                    </Link>
                )}
            </nav>

            <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 pb-16">
                {/* Mini board accent */}
                <div className="mb-12 border border-white/30">
                    <div className="grid grid-cols-4">
                        {['♜', '♞', '♝', '♛', '♟', '♟', '♟', '♟', ' ', ' ', ' ', ' ', '♙', '♙', '♙', '♙'].map((p, i) => (
                            <div
                                key={i}
                                className={`w-10 h-10 flex items-center justify-center text-lg ${
                                    (Math.floor(i / 4) + (i % 4)) % 2 === 0 ? 'bg-white text-black' : 'bg-black text-white border border-white/10'
                                }`}
                            >
                                {p}
                            </div>
                        ))}
                    </div>
                </div>

                <h1 className="text-6xl md:text-8xl font-bold tracking-tight text-center leading-none">
                    CHESS<span className="text-neutral-500">AI</span>
                </h1>

                <div className="mt-6 w-16 h-px bg-white" />

                <p className="mt-6 text-neutral-400 text-sm md:text-base uppercase tracking-[0.2em] text-center max-w-md">
                    Play chess online with players from around the world
                </p>

                <div className="mt-12 flex flex-col sm:flex-row gap-4 items-center">
                    {isAuthenticated ? (
                        <button className={btnClass} onClick={() => navigate("/lobby")}>
                            Play Online
                        </button>
                    ) : (
                        <>
                            <button className={btnClass} onClick={() => navigate("/login")}>
                                Login
                            </button>
                            <Link
                                to="/register"
                                className="text-xs uppercase tracking-[0.2em] text-neutral-400 no-underline hover:text-white transition-colors"
                            >
                                Create Account →
                            </Link>
                        </>
                    )}
                </div>
            </main>

            <footer className="relative z-10 border-t border-white/20 px-8 py-4 flex justify-between text-xs text-neutral-500 uppercase tracking-widest">
                <span>Minimal</span>
                <span>Black & White</span>
            </footer>
        </div>
    )
}

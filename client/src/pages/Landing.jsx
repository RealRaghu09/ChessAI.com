import { useNavigate, Link } from "react-router"
import { useAuth } from "../context/AuthContext"
import "./Landing.css"

export default function Landing() {
    const navigate = useNavigate()
    const { isAuthenticated } = useAuth()
    
    return (
        <div className="landing-container">
            <div className="landing-content">
                <div className="logo-section">
                    <div className="logo-wrapper">
                        <div className="logo-glow"></div>
                        <div className="chess-image" style={{ fontSize: '6rem' }}>♔</div>
                    </div>
                </div>

                <div className="title-section">
                    <h1 className="landing-title">
                        <span className="title-gradient">Chess</span>
                        <span className="title-white">AI</span>
                    </h1>
                    <p className="landing-subtitle">
                        Play chess online with players from around the world
                    </p>
                </div>

                <div className="landing-actions">
                    {isAuthenticated ? (
                        <button className="button-game" onClick={() => navigate("/lobby")}>
                            Play Online
                        </button>
                    ) : (
                        <>
                            <button className="button-game" onClick={() => navigate("/login")}>
                                Login
                            </button>
                            <Link to="/register" className="register-link">Create Account</Link>
                        </>
                    )}
                </div>

                <div className="decorative-blob blob-1"></div>
                <div className="decorative-blob blob-2"></div>
                <div className="decorative-blob blob-3"></div>
            </div>
        </div>
    )
}
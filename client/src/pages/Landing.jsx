import { useNavigate } from "react-router"
import "./Landing.css"

export const Landing = () => {
    const navigate = useNavigate()
    
    return (
        <div className="landing-container">
            <div className="landing-content">
                {/* Logo/Image Section */}
                <div className="logo-section">
                    <div className="logo-wrapper">
                        <div className="logo-glow"></div>
                        <img 
                            src="/chess.png" 
                            alt="Chess Board" 
                            className="chess-image"
                        />
                    </div>
                </div>

                {/* Title Section */}
                <div className="title-section">
                    <h1 className="landing-title">
                        <span className="title-gradient">
                            Chess
                        </span>
                        <span className="title-white">.com</span>
                    </h1>
                    <p className="landing-subtitle">
                        Play chess online with players from around the world
                    </p>
                </div>

                    <div onClick={() => navigate("/game")} >
                    <button className="button-game"
                        >
                        Play Online
                    </button>
                    </div>
                {/* Decorative Elements */}
                <div className="decorative-blob blob-1"></div>
                <div className="decorative-blob blob-2"></div>
                <div className="decorative-blob blob-3"></div>
            </div>
        </div>
    )
}
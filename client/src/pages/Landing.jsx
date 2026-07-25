import { useNavigate, Link } from "react-router";
import { useAuth } from "../context/AuthContext";

const btnClass =
  "border-2 border-white px-10 py-4 text-sm font-semibold uppercase tracking-[0.25em] hover:bg-white hover:text-black transition-colors";

export default function Landing() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Decorative chess grid */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-[0.04]">
        <div className="grid grid-cols-[repeat(16,minmax(0,1fr))] h-full w-full">
          {Array.from({ length: 256 }).map((_, i) => (
            <div
              key={i}
              className={
                (Math.floor(i / 16) + (i % 16)) % 2 === 0
                  ? "bg-white"
                  : "bg-black"
              }
            />
          ))}
        </div>
      </div>

      <nav className="relative z-10 flex justify-between items-center px-8 py-6 border-b border-white/20">
        <span className="text-xs uppercase tracking-[0.3em] text-neutral-400">
          ChessAI
        </span>
        {isAuthenticated && (
          <Link
            to="/lobby"
            className="text-xs uppercase tracking-[0.2em] no-underline hover:opacity-70"
          >
            Lobby
          </Link>
        )}
      </nav>

      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 pb-16">
        {/* Mini board accent */}
        <div className="mb-12 border border-white/30">
          <div className="grid grid-cols-4">
            {[
              "♜",
              "♞",
              "♝",
              "♛",
              "♟",
              "♟",
              "♟",
              "♟",
              " ",
              " ",
              " ",
              " ",
              "♙",
              "♙",
              "♙",
              "♙",
            ].map((p, i) => (
              <div
                key={i}
                className={`w-10 h-10 flex items-center justify-center text-lg ${
                  (Math.floor(i / 4) + (i % 4)) % 2 === 0
                    ? "bg-white text-black"
                    : "bg-black text-white border border-white/10"
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
        <section className="w-full max-w-5xl mt-24 border-t border-white/20 pt-12">
          <div className="flex items-center gap-4 mb-10">
            <h2 className="text-sm uppercase tracking-[0.3em] font-semibold">
              Features
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 border-l border-t border-white/20">
            {[
              {
                icon: "H",
                title: "Play With Friends",
                description:
                  "Challenge your friends and play chess together in real time.",
              },
              {
                icon: "E",
                title: "Live Chat",
                description:
                  "Chat with your opponent while the game is in progress.",
              },
              {
                icon: "Q",
                title: "Game Reactions",
                description:
                  "React instantly to interesting moves and moments.",
              },
              {
                icon: "W",
                title: "Leaderboard",
                description:
                  "See the highest-rated players and compete for the top.",
              },
              {
                icon: "R",
                title: "Player Ranking",
                description:
                  "Track your rating and see where you rank among other players.",
              },
              {
                icon: "R",
                title: "Rating System",
                description:
                  "Win matches, increase your rating, and climb the rankings.",
              },
              {
                icon: "H",
                title: "Game History",
                description:
                  "Every completed game is stored so you can revisit past matches.",
              },
              {
                icon: "V",
                title: "Move Validation",
                description:
                  "Every move is validated to ensure completely legal chess gameplay.",
              },
              {
                icon: "AI",
                title: "AI Move Suggestions",
                description:
                  "Get AI-powered move recommendations to improve your winning chances.",
              },
            ].map((feature, index) => (
              <div
                key={feature.title}
                className="
                    group
                    relative
                    min-h-[190px]
                    p-7
                    border-r border-b border-white/20
                    hover:bg-white
                    hover:text-black
                    transition-colors
                    duration-300
                "
              >
                <span
                  className="
                    absolute top-5 right-5
                    text-[10px]
                    tracking-widest
                    text-neutral-600
                    group-hover:text-neutral-500
                "
                >
                  {String(index + 1).padStart(2, "0")}
                </span>

                <div
                  className="
                    text-2xl
                    mb-8
                    text-neutral-400
                    group-hover:text-black
                    transition-colors
                "
                >
                  {feature.icon}
                </div>

                <h3
                  className="
                    text-xs
                    font-semibold
                    uppercase
                    tracking-[0.2em]
                    mb-3
                "
                >
                  {feature.title}
                </h3>

                <p
                  className="
                    text-xs
                    leading-5
                    text-neutral-500
                    group-hover:text-neutral-700
                    transition-colors
                "
                >
                  {feature.description}
                </p>

                <div
                  className="
                    absolute
                    bottom-0 left-0
                    h-[2px]
                    w-0
                    bg-black
                    group-hover:w-full
                    transition-all
                    duration-500
                "
                />
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-white/20 px-8 py-4 flex justify-between text-xs text-neutral-500 tracking-widest">
        <span>Made By Raghunandan</span>
        <span>:&#41;</span>
      </footer>
    </div>
  );
}

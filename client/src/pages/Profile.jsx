import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Profile() {
  const { user } = useAuth();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    api.getMatches(user.id)
      .then(setMatches)
      .catch(() => setMatches([]))
      .finally(() => setLoading(false));
  }, [user?.id]);

  if (!user) return null;

  return (
    <div className="profile-page">
      <header>
        <Link to="/lobby">← Back to Lobby</Link>
        <h1>{user.username}</h1>
      </header>
      <div className="stats-grid">
        <div className="stat"><span>ELO</span><strong>{user.elo}</strong></div>
        <div className="stat"><span>Games</span><strong>{user.total_matches}</strong></div>
        <div className="stat"><span>Wins</span><strong>{user.wins}</strong></div>
        <div className="stat"><span>Losses</span><strong>{user.losses}</strong></div>
        <div className="stat"><span>Draws</span><strong>{user.draws}</strong></div>
        <div className="stat"><span>Win %</span><strong>{user.win_percentage}%</strong></div>
        <div className="stat"><span>Streak</span><strong>{user.current_streak}</strong></div>
      </div>
      <section>
        <h2>Match History</h2>
        {loading ? <p>Loading...</p> : matches.length === 0 ? (
          <p>No matches yet.</p>
        ) : (
          <ul className="match-list">
            {matches.map((m) => (
              <li key={m.id}>
                <span>{m.result}</span>
                <span>{m.duration_seconds}s</span>
                <span>ELO: {m.white_elo_after} / {m.black_elo_after}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

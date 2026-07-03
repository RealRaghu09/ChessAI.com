import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';

export default function Leaderboard() {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.leaderboard()
      .then(setPlayers)
      .catch(() => setPlayers([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="leaderboard-page">
      <header>
        <Link to="/lobby">← Back to Lobby</Link>
        <h1>Global Leaderboard</h1>
      </header>
      {loading ? <p>Loading...</p> : (
        <table>
          <thead>
            <tr><th>#</th><th>Player</th><th>ELO</th><th>W/L/D</th><th>Win %</th></tr>
          </thead>
          <tbody>
            {players.map((p, i) => (
              <tr key={p.id}>
                <td>{i + 1}</td>
                <td>{p.username}</td>
                <td>{p.elo}</td>
                <td>{p.wins}/{p.losses}/{p.draws}</td>
                <td>{p.win_percentage}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

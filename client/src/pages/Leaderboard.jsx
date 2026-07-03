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
    <div className="min-h-screen p-4 md:p-8">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 border-b border-white pb-4">
        <Link to="/lobby" className="text-sm uppercase tracking-widest no-underline hover:opacity-70">← Back to Lobby</Link>
        <h1 className="text-2xl font-bold uppercase tracking-widest">Leaderboard</h1>
      </header>

      {loading ? <p className="text-neutral-400">Loading...</p> : (
        <div className="border border-white overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white text-left uppercase tracking-widest text-xs text-neutral-400">
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Player</th>
                <th className="px-4 py-3">ELO</th>
                <th className="px-4 py-3">W/L/D</th>
                <th className="px-4 py-3">Win %</th>
              </tr>
            </thead>
            <tbody>
              {players.map((p, i) => (
                <tr key={p.id} className="border-b border-white/20">
                  <td className="px-4 py-3 text-neutral-400">{i + 1}</td>
                  <td className="px-4 py-3">{p.username}</td>
                  <td className="px-4 py-3">{p.elo}</td>
                  <td className="px-4 py-3 text-neutral-400">{p.wins}/{p.losses}/{p.draws}</td>
                  <td className="px-4 py-3">{p.win_percentage}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

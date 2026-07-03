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
    <div className="min-h-screen p-4 md:p-8">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 border-b border-white pb-4">
        <Link to="/lobby" className="text-sm uppercase tracking-widest no-underline hover:opacity-70">← Back to Lobby</Link>
        <h1 className="text-2xl font-bold uppercase tracking-widest">{user.username}</h1>
      </header>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 mb-8">
        {[
          ['ELO', user.elo],
          ['Games', user.total_matches],
          ['Wins', user.wins],
          ['Losses', user.losses],
          ['Draws', user.draws],
          ['Win %', `${user.win_percentage}%`],
          ['Streak', user.current_streak],
        ].map(([label, value]) => (
          <div key={label} className="border border-white p-4 text-center">
            <span className="block text-xs uppercase tracking-widest text-neutral-400 mb-1">{label}</span>
            <strong className="text-xl">{value}</strong>
          </div>
        ))}
      </div>

      <section>
        <h2 className="text-lg font-semibold uppercase tracking-widest mb-4">Match History</h2>
        {loading ? <p className="text-neutral-400">Loading...</p> : matches.length === 0 ? (
          <p className="text-neutral-400">No matches yet.</p>
        ) : (
          <ul className="border border-white divide-y divide-white">
            {matches.map((m) => (
              <li key={m.id} className="flex gap-6 px-4 py-3 text-sm">
                <span className="uppercase tracking-wider">{m.result}</span>
                <span className="text-neutral-400">{m.duration_seconds}s</span>
                <span className="text-neutral-400">ELO: {m.white_elo_after} / {m.black_elo_after}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

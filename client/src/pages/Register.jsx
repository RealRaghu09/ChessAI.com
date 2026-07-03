import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';

const inputClass = 'w-full border border-white bg-black text-white px-4 py-3 text-sm focus:outline-none focus:bg-neutral-900 placeholder:text-neutral-500';
const btnClass = 'w-full border-2 border-white py-3 text-sm font-semibold uppercase tracking-widest hover:bg-white hover:text-black transition-colors disabled:opacity-40';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await register(username, email, password);
      toast.success('Account created!');
      navigate('/lobby');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <form className="w-full max-w-md border border-white p-8 flex flex-col gap-4" onSubmit={handleSubmit}>
        <h1 className="text-2xl font-bold uppercase tracking-widest text-center mb-2">Register</h1>
        <input type="text" className={inputClass} placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} required />
        <input type="email" className={inputClass} placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input type="password" className={inputClass} placeholder="Password (min 6)" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
        <button type="submit" className={btnClass} disabled={submitting}>{submitting ? 'Creating...' : 'Create Account'}</button>
        <p className="text-center text-sm text-neutral-400">Have an account? <Link to="/login" className="text-white">Login</Link></p>
      </form>
    </div>
  );
}

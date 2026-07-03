import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute';
import Game from './pages/Game';
import Landing from './pages/Landing';
import Leaderboard from './pages/Leaderboard';
import Lobby from './pages/Lobby';
import Login from './pages/Login';
import Profile from './pages/Profile';
import Register from './pages/Register';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/lobby" element={<ProtectedRoute><Lobby /></ProtectedRoute>} />
          <Route path="/game/:roomId" element={<ProtectedRoute><Game /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/leaderboard" element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />
        </Routes>
        <ToastContainer
          position="top-right"
          autoClose={3000}
          theme="dark"
          toastClassName="!bg-black !border !border-white !text-white"
        />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

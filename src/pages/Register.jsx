import { useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom'; // ADDED Navigate
import { useAuth } from '../hooks/useAuth';


export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // ADDED currentUser to the destructured object
  const { register, currentUser } = useAuth(); 
  const navigate = useNavigate();

  // FIX: Redirect immediately if they are already logged in
  if (currentUser) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setLoading(true);
      await register(name, email, password);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Failed to create an account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[75vh]">
      <div className="w-full max-w-md bg-[#111827] border border-gray-800 rounded-xl p-8 shadow-lg">
        
        <div className="text-center mb-8">
          <h2 className="text-2xl font-extrabold text-[#F9FAFB]">Create Account</h2>
          <p className="text-sm text-[#9CA3AF] mt-2">Join the LobbyLink ecosystem</p>
        </div>

        {error && (
          <div className="bg-[#EF4444]/10 border border-[#EF4444]/30 text-[#EF4444] p-3 rounded-lg mb-6 text-sm text-center">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-[#9CA3AF] mb-1.5">Full Name</label>
            <input 
              type="text" 
              required 
              value={name} 
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 bg-[#0B0F1A] border border-gray-700 rounded-lg text-[#F9FAFB] focus:ring-2 focus:ring-[#6366F1] focus:border-transparent outline-none transition-all shadow-inner" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#9CA3AF] mb-1.5">Email Address</label>
            <input 
              type="email" 
              required 
              value={email} 
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 bg-[#0B0F1A] border border-gray-700 rounded-lg text-[#F9FAFB] focus:ring-2 focus:ring-[#6366F1] focus:border-transparent outline-none transition-all shadow-inner" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#9CA3AF] mb-1.5">Password</label>
            <input 
              type="password" 
              required 
              value={password} 
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              placeholder="Min. 6 characters"
              className="w-full px-4 py-2.5 bg-[#0B0F1A] border border-gray-700 rounded-lg text-[#F9FAFB] focus:ring-2 focus:ring-[#6366F1] focus:border-transparent outline-none transition-all shadow-inner" 
            />
          </div>
          <button 
            disabled={loading} 
            type="submit"
            className="w-full bg-[#6366F1] text-white font-bold py-3 rounded-lg hover:bg-indigo-500 transition-colors shadow-md disabled:opacity-50 mt-2"
          >
            {loading ? 'Creating...' : 'Create Account'}
          </button>
        </form>
        
        <p className="mt-8 text-center text-sm text-[#9CA3AF]">
          Already have an account? <Link to="/login" className="text-[#6366F1] hover:text-indigo-400 font-semibold transition-colors">Login</Link>
        </p>
      </div>
    </div>
  );
}
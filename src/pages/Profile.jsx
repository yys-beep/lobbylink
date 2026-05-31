import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useGroups } from '../hooks/useGroups';
import { useNavigate } from 'react-router-dom';

export default function Profile() {
  const { currentUser, updateProfileName, updateUserPassword, logout } = useAuth(); 
  const { groups } = useGroups();
  const navigate = useNavigate();

  // Local States for Name Editing
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  // Local States for Password Editing
  const [newPassword, setNewPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState({ text: '', type: '' });

  // Sync initial name when user loads
  useEffect(() => {
    if (currentUser?.displayName) {
      setDisplayName(currentUser.displayName);
    }
  }, [currentUser]);

  // Filter groups where the user is the host
  const myHostedLobbies = groups.filter(g => g.createdBy === currentUser?.uid);

  const handleSaveName = async () => {
    if (!displayName.trim()) {
      setError("Name cannot be empty");
      return;
    }
    setIsSaving(true);
    setError('');
    try {
      await updateProfileName(displayName.trim());
      setIsEditing(false);
    } catch (err) {
      console.error(err);
      setError('Database Error: Failed to update profile name.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSavePassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setPasswordMessage({ text: 'Password must be at least 6 characters.', type: 'error' });
      return;
    }

    setIsUpdatingPassword(true);
    setPasswordMessage({ text: '', type: '' });

    try {
      await updateUserPassword(newPassword);
      setPasswordMessage({ text: 'Password updated successfully!', type: 'success' });
      setNewPassword(''); // Clear input on success
    } catch (err) {
      // Firebase security constraint: requires recent login to change passwords
      if (err.code === 'auth/requires-recent-login') {
        setPasswordMessage({ text: 'Security check: Please log out and log back in to change your password.', type: 'error' });
      } else {
        setPasswordMessage({ text: err.message, type: 'error' });
      }
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const forceRelogin = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="w-full px-4 sm:px-8 lg:px-16 mx-auto space-y-8 mt-6">
      
      {/* Profile Card Headers */}
      <div className="bg-[#111827] border border-gray-800 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center gap-6 shadow-sm">
        <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-[#6366F1] to-[#c084fc] flex items-center justify-center text-white text-3xl font-extrabold shadow-md select-none">
          {currentUser?.displayName ? currentUser.displayName.charAt(0).toUpperCase() : 'U'}
        </div>
        
        <div className="text-center md:text-left space-y-1 flex-1 w-full">
          {isEditing ? (
            <div className="max-w-xs mx-auto md:mx-0 space-y-2">
              <input
                type="text"
                value={displayName}
                disabled={isSaving}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-3 py-1.5 border border-gray-700 rounded-lg bg-[#0B0F1A] text-[#F9FAFB] focus:ring-2 focus:ring-[#6366F1] outline-none text-lg font-semibold disabled:opacity-50"
                placeholder="Enter name..."
                autoFocus
              />
              {error && <p className="text-xs text-[#EF4444] font-medium">{error}</p>}
            </div>
          ) : (
            <h2 className="text-2xl md:text-3xl font-extrabold text-[#F9FAFB] tracking-tight">
              {currentUser?.displayName || 'Lobby Member'}
            </h2>
          )}
          
          <p className="text-sm text-[#9CA3AF] font-mono">{currentUser?.email || 'no-email@connected.com'}</p>
          <div className="pt-2 flex flex-wrap justify-center md:justify-start gap-2">
            <span className="px-3 py-1 bg-[#6366F1]/10 border border-[#6366F1]/30 text-[#c084fc] text-xs font-semibold rounded-full">
              ⚡ Verified Account
            </span>
            <span className="px-3 py-1 bg-gray-800 text-[#9CA3AF] text-xs font-semibold rounded-full">
              Host of {myHostedLobbies.length} Lobbies
            </span>
          </div>
        </div>
      </div>

      {/* Grid splits into Activity Lists */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Box 1: Hosted Lobbies */}
        <div className="bg-[#111827] border border-gray-800 rounded-2xl p-6 space-y-4">
          <h3 className="text-lg font-bold text-[#F9FAFB]">Your Hosted Lobbies</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
            {myHostedLobbies.length === 0 ? (
              <p className="text-sm text-[#9CA3AF] py-4">You haven't created any groups yet.</p>
            ) : (
              myHostedLobbies.map(g => (
                <div key={g.id} onClick={() => navigate(`/group/${g.id}`)} className="flex justify-between items-center p-3 bg-[#0B0F1A] border border-gray-800 rounded-xl cursor-pointer hover:border-gray-600 transition-colors">
                  <span className="text-sm font-semibold text-[#F9FAFB] truncate max-w-[70%]">{g.title}</span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded ${g.status === 'OPEN' ? 'bg-[#22C55E]/10 text-[#22C55E]' : 'bg-[#EF4444]/10 text-[#EF4444]'}`}>
                    {g.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Box 2: Account Preferences Display */}
        <div className="bg-[#111827] border border-gray-800 rounded-2xl p-6 space-y-4">
          <h3 className="text-lg font-bold text-[#F9FAFB]">Account Settings</h3>
          <div className="space-y-3 text-sm text-[#9CA3AF]">
            <div className="flex justify-between pb-2 border-b border-gray-800/50">
              <span>User ID Token</span>
              <span className="font-mono text-xs text-gray-500 truncate max-w-[150px]">{currentUser?.uid}</span>
            </div>
            <div className="flex justify-between pb-4 border-b border-gray-800/50">
              <span>Interface Theme</span>
              <span className="text-[#F9FAFB]">System Dark</span>
            </div>

            {/* Toggle Save / Edit controls dynamically */}
            {isEditing ? (
              <div className="flex gap-2 pt-2">
                <button 
                  onClick={() => { setIsEditing(false); setDisplayName(currentUser?.displayName || ''); setError(''); }}
                  disabled={isSaving}
                  className="flex-1 py-2 bg-transparent border border-gray-700 hover:bg-gray-800 text-[#9CA3AF] font-medium text-xs rounded-xl transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSaveName}
                  disabled={isSaving}
                  className="flex-1 py-2 bg-[#6366F1] hover:bg-indigo-500 text-white font-medium text-xs rounded-xl transition-colors shadow-sm disabled:bg-gray-700"
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setIsEditing(true)}
                className="w-full mt-2 py-2 bg-gray-800 hover:bg-gray-700 text-[#F9FAFB] font-medium text-xs rounded-xl transition-colors"
              >
                Edit Display Profile
              </button>
            )}

            {/* Password Update Section */}
            <form onSubmit={handleSavePassword} className="pt-6 mt-6 border-t border-gray-800">
              <label className="block text-xs font-bold text-[#9CA3AF] uppercase mb-2">Update Password</label>
              
              {passwordMessage.text && (
                <div className={`p-3 rounded-lg mb-4 text-xs font-bold ${passwordMessage.type === 'success' ? 'bg-[#22C55E]/10 text-[#22C55E]' : 'bg-[#EF4444]/10 text-[#EF4444]'}`}>
                  {passwordMessage.text}
                  {passwordMessage.type === 'error' && passwordMessage.text.includes('Security check') && (
                    <button onClick={forceRelogin} type="button" className="underline ml-2 text-white">Log out now</button>
                  )}
                </div>
              )}

              <div className="flex gap-2">
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="New password (min 6 chars)"
                  className="w-full px-3 py-2 border border-gray-700 rounded-lg bg-[#0B0F1A] text-[#F9FAFB] focus:ring-2 focus:ring-[#6366F1] outline-none text-sm"
                />
                <button 
                  type="submit"
                  disabled={isUpdatingPassword || !newPassword.trim()}
                  className="px-4 py-2 bg-[#6366F1] hover:bg-indigo-500 text-white font-medium text-xs rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUpdatingPassword ? '...' : 'Update'}
                </button>
              </div>
            </form>

          </div>
        </div>
      </div>
    </div>
  );
}
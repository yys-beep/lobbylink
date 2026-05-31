import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useNotifications } from '../../context/NotificationContext';

export default function Navbar() {
  const { currentUser, logout } = useAuth();
  const { notifications, dismissNotification } = useNotifications();
  const navigate = useNavigate();
  
  const [showNotifs, setShowNotifs] = useState(false);
  const dropdownRef = useRef(null);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  const handleNotificationClick = (groupId, notifId) => {
    dismissNotification(notifId);
    setShowNotifs(false);
    navigate(`/group/${groupId}`);
  };

  // Close dropdown if user clicks outside of it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowNotifs(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <nav className="bg-[#111827] border-b border-gray-800 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          <Link to={currentUser ? "/" : "/login"} className="flex-shrink-0 flex items-center gap-3">
            <div className="w-9 h-9 bg-[#6366F1] rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.4)]">
              <span className="text-white font-extrabold text-lg">L</span>
            </div>
            <span className="text-[#F9FAFB] font-bold text-xl tracking-tight">LobbyLink</span>
          </Link>

          {currentUser && (
            <div className="flex items-center gap-4 sm:gap-6">
              
              {/* NOTIFICATION BELL */}
              <div className="relative" ref={dropdownRef}>
                <button 
                  onClick={() => setShowNotifs(!showNotifs)}
                  className="relative p-2 text-[#9CA3AF] hover:text-white transition-colors rounded-full hover:bg-gray-800"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {/* Notification Badge */}
                  {notifications.length > 0 && (
                    <span className="absolute top-1.5 right-1.5 flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#EF4444] opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-[#EF4444] border-2 border-[#111827]"></span>
                    </span>
                  )}
                </button>

                {/* DROPDOWN PANEL */}
                {showNotifs && (
                  <div className="absolute right-0 mt-2 w-80 bg-[#111827] border border-gray-800 rounded-xl shadow-2xl py-2 z-50 overflow-hidden">
                    <div className="px-4 py-2 border-b border-gray-800 flex justify-between items-center">
                      <h3 className="text-sm font-bold text-[#F9FAFB]">Notifications</h3>
                      <span className="text-xs text-[#9CA3AF] bg-gray-800 px-2 py-0.5 rounded-full">{notifications.length}</span>
                    </div>
                    
                    <div className="max-h-80 overflow-y-auto no-scrollbar">
                      {notifications.length === 0 ? (
                        <div className="px-4 py-6 text-center text-sm text-[#9CA3AF]">
                          You're all caught up!
                        </div>
                      ) : (
                        notifications.map((notif) => (
                          <div 
                            key={notif.id} 
                            onClick={() => handleNotificationClick(notif.groupId, notif.id)}
                            className="px-4 py-3 border-b border-gray-800/50 hover:bg-[#0B0F1A] cursor-pointer transition-colors"
                          >
                            <p className="text-sm text-[#F9FAFB] leading-snug">{notif.message}</p>
                            <p className="text-xs text-[#6366F1] mt-1 font-semibold">Click to view lobby</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              <Link to="/profile" className="text-sm font-medium text-[#9CA3AF] hover:text-white transition-colors hidden sm:block border-l border-gray-800 pl-6">
                Hi, <span className="text-[#F9FAFB]">{currentUser.displayName || 'User'}</span>
              </Link>
              
              <div className="flex items-center gap-3">
                <Link to="/create" className="text-sm font-medium text-white bg-[#6366F1] px-4 py-2 rounded-lg hover:bg-indigo-500 transition-colors shadow-sm hidden sm:block">
                  Create Group
                </Link>
                <button onClick={handleLogout} className="text-sm font-medium text-[#9CA3AF] hover:text-[#EF4444] transition-colors px-2 py-1.5 rounded-lg">
                  Logout
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </nav>
  );
}
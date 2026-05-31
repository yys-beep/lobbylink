import { createContext, useContext, useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser) {
      setNotifications([]);
      return;
    }

    const q = query(
      collection(db, 'users', currentUser.uid, 'notifications'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setNotifications(notifs);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const dismissNotification = async (id) => {
    await deleteDoc(doc(db, 'users', currentUser.uid, 'notifications', id));
  };

  const handleNotificationClick = (groupId, notifId) => {
    dismissNotification(notifId);
    navigate(`/group/${groupId}`);
  };

  return (
    <NotificationContext.Provider value={{ notifications, dismissNotification }}>
      {children}
      
      {/* Global Toast Container */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
        {notifications.map((notif) => {
          // Dynamic Styling based on notification type
          const isKicked = notif.type === 'KICKED';
          const borderColor = isKicked ? 'border-[#EF4444]' : 'border-[#22C55E]';
          const textColor = isKicked ? 'text-[#EF4444]' : 'text-[#22C55E]';
          const titleText = isKicked ? 'Removed from Lobby' : 'Application Accepted!';

          return (
            <div key={notif.id} className={`bg-[#111827] border-l-4 ${borderColor} text-[#F9FAFB] p-4 rounded-xl shadow-2xl flex items-start gap-4 max-w-sm animate-fade-in-up`}>
              <div 
                className="flex-1 cursor-pointer" 
                onClick={() => handleNotificationClick(notif.groupId, notif.id)}
              >
                <h4 className={`font-bold text-sm ${textColor} mb-1`}>{titleText}</h4>
                <p className="text-sm text-[#9CA3AF]">{notif.message}</p>
              </div>
              <button 
                onClick={() => dismissNotification(notif.id)} 
                className="text-[#9CA3AF] hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          );
        })}
      </div>
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => useContext(NotificationContext);
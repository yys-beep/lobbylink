import { useState, useEffect, useRef } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { sendMessage, setTypingStatus, setPinnedMessage } from '../../services/groupService';

export default function GroupChat({ groupId, currentUser, group, isOwner }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  
  const chatContainerRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const isTypingRef = useRef(false);

  // Fetch Messages
  useEffect(() => {
    const q = query(collection(db, 'groups', groupId, 'messages'), orderBy('createdAt', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [groupId]);

  // Fetch Typing Status
  useEffect(() => {
    const q = query(collection(db, 'groups', groupId, 'typing'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setTypingUsers(snapshot.docs.map(doc => doc.data().displayName).filter(name => name !== currentUser.displayName));
    });
    return () => unsubscribe();
  }, [groupId, currentUser]);

  // Auto-scroll to bottom smoothly
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Handle Typing (Optimized to save DB reads)
  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    
    if (!isTypingRef.current) {
      isTypingRef.current = true;
      setTypingStatus(groupId, currentUser.uid, currentUser.displayName, true);
    }
    
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    
    typingTimeoutRef.current = setTimeout(() => {
      setTypingStatus(groupId, currentUser.uid, currentUser.displayName, false);
      isTypingRef.current = false;
    }, 1500);
  };

  // Handle Send Message
  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || isSending) return;
    setIsSending(true);
    try {
      await sendMessage(groupId, currentUser.uid, currentUser.displayName || 'User', newMessage);
      setNewMessage('');
      
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      await setTypingStatus(groupId, currentUser.uid, currentUser.displayName, false);
      isTypingRef.current = false;
      
    } catch (error) { console.error(error); } finally { setIsSending(false); }
  };

  // Handle Pin Message
  const handlePin = (msg) => {
    if (window.confirm('Pin this message for everyone?')) {
      setPinnedMessage(groupId, msg.text, msg.displayName);
    }
  };

  return (
    <div className="bg-[#111827] border border-gray-800 rounded-xl flex flex-col h-[550px] shadow-sm overflow-hidden">
      
      {/* Pinned Announcement Banner */}
      {group.pinnedMessage && (
        <div className="bg-[#F59E0B]/10 border-b border-[#F59E0B]/30 p-3 flex justify-between items-center">
          <div className="flex items-center gap-2 overflow-hidden">
            <span className="text-xl">📌</span>
            <div className="truncate">
              <p className="text-xs font-bold text-[#F59E0B] uppercase tracking-wider">Pinned by {group.pinnedMessage.author}</p>
              <p className="text-sm text-[#F9FAFB] truncate">{group.pinnedMessage.text}</p>
            </div>
          </div>
          {isOwner && (
            <button onClick={() => setPinnedMessage(groupId, null, null)} className="text-gray-500 hover:text-white px-2">✕</button>
          )}
        </div>
      )}

      {/* Chat Header */}
      <div className="p-4 border-b border-gray-800 bg-[#0B0F1A] flex justify-between items-center">
        <h3 className="font-bold text-[#F9FAFB] flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse"></span>Live Lobby Chat</h3>
        <span className="text-xs text-[#9CA3AF]">{messages.length} messages</span>
      </div>

      {/* Messages Container */}
      <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar scroll-smooth">
        {messages.map((msg) => {
          const isMe = msg.uid === currentUser.uid;
          return (
            <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} group`}>
              <div className="flex items-center gap-2 mb-1 px-1">
                {isOwner && !isMe && <button onClick={() => handlePin(msg)} className="text-[10px] text-gray-600 hover:text-[#F59E0B] opacity-0 group-hover:opacity-100 transition-opacity">PIN</button>}
                <span className="text-[10px] text-[#9CA3AF]">{isMe ? 'You' : msg.displayName}</span>
              </div>
              <div className={`px-4 py-2 rounded-2xl max-w-[80%] text-sm ${isMe ? 'bg-[#6366F1] text-white rounded-tr-none' : 'bg-gray-800 text-[#F9FAFB] rounded-tl-none'}`}>
                {msg.text}
              </div>
            </div>
          );
        })}
      </div>

      {/* Typing Indicators */}
      <div className="px-4 py-1 h-6">
        {typingUsers.length > 0 && <span className="text-xs text-[#6366F1] italic font-medium animate-pulse">{typingUsers.join(', ')} typing...</span>}
      </div>

      {/* Input Form */}
      <div className="p-4 border-t border-gray-800 bg-[#0B0F1A]">
        <form onSubmit={handleSend} className="flex gap-2">
          <input type="text" value={newMessage} onChange={handleTyping} placeholder="Type a message..." className="flex-1 bg-[#111827] border border-gray-700 rounded-lg px-4 py-2 text-[#F9FAFB] text-sm outline-none focus:border-[#6366F1]" />
          <button type="submit" disabled={!newMessage.trim() || isSending} className="px-4 py-2 bg-[#6366F1] text-white rounded-lg font-bold hover:bg-indigo-500 disabled:opacity-50">Send</button>
        </form>
      </div>
    </div>
  );
}
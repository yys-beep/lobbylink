import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { requestToJoinGroup, leaveGroup, deleteGroup } from '../../services/groupService';

export default function GroupCard({ group, currentUser, onTagClick }) {
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [showPrompt, setShowPrompt] = useState(false);
  const [requestMessage, setRequestMessage] = useState('');
  
  const { id, title, description, type, location, tags, maxMembers, members = [], requests = [], status, createdBy } = group;

  const currentUserId = currentUser?.uid;
  const currentMembersCount = members.length;
  
  const isOwner = currentUserId === createdBy;
  const isJoined = members.includes(currentUserId);
  const hasRequested = requests.includes(currentUserId);
  const isFull = currentMembersCount >= maxMembers || status === 'FULL' || status === 'CLOSED';

  const handleCardClick = () => {
    if (!showPrompt) navigate(`/group/${id}`);
  };

  const handleActionClick = async (e) => {
    e.stopPropagation(); 
    if (!currentUserId) return navigate('/login');

    if (isOwner) {
      if (window.confirm("Are you sure you want to delete this lobby? Everyone will be kicked.")) {
        setIsProcessing(true);
        await deleteGroup(id);
      }
    } else if (isJoined) {
      setIsProcessing(true);
      await leaveGroup(id, currentUserId, currentUser.displayName);
      setIsProcessing(false);
    } else if (!isFull && !hasRequested) {
      setShowPrompt(true);
    }
  };

  const submitJoinRequest = async (e) => {
    e.stopPropagation();
    setIsProcessing(true);
    try {
      await requestToJoinGroup(id, currentUserId, currentUser.displayName, requestMessage.trim());
      setShowPrompt(false);
    } catch (error) {
      alert(error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const statusColors = (isFull || status === 'CLOSED')
    ? 'text-[#EF4444] bg-[#EF4444]/10 border-[#EF4444]/20'
    : 'text-[#22C55E] bg-[#22C55E]/10 border-[#22C55E]/20';

  return (
    <div 
      onClick={handleCardClick}
      className={`bg-[#111827] border border-gray-800 rounded-xl p-5 shadow-sm transition-all duration-200 flex flex-col h-full group ${!showPrompt ? 'hover:border-[#6366F1]/50 hover:-translate-y-1 cursor-pointer' : ''}`}
    >
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-lg font-semibold text-[#F9FAFB] line-clamp-1 group-hover:text-[#6366F1] transition-colors">
          {title}
        </h3>
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${statusColors}`}>
          {status === 'CLOSED' ? 'CLOSED' : isFull ? 'FULL' : 'OPEN'}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-3">
        <span className="text-[10px] font-bold text-[#F9FAFB] bg-[#6366F1] px-2 py-0.5 rounded uppercase">{type}</span>
        {location && (
          <span className="text-[11px] text-[#9CA3AF] flex items-center gap-1 bg-[#0B0F1A] border border-gray-800 px-2 py-0.5 rounded">
            📍 {location}
          </span>
        )}
      </div>

      <p className="text-sm text-[#9CA3AF] line-clamp-2 mb-3 flex-grow">
        {description}
      </p>

      {/* Tags Display */}
      {tags?.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-4">
          {tags.map(tag => (
            <span 
              key={tag} 
              onClick={(e) => { 
                e.stopPropagation(); 
                if (onTagClick) onTagClick(tag); 
              }} 
              className="text-xs text-[#6366F1] hover:underline cursor-pointer bg-[#6366F1]/10 px-1.5 py-0.5 rounded"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {showPrompt ? (
        <div className="mt-auto border-t border-gray-800 pt-4" onClick={(e) => e.stopPropagation()}>
          <label className="block text-xs font-bold text-[#9CA3AF] uppercase mb-2">Message to Owner (Optional)</label>
          <input 
            type="text" 
            placeholder="e.g., I'm free at 8 PM!"
            value={requestMessage}
            onChange={(e) => setRequestMessage(e.target.value)}
            className="w-full px-3 py-2 border border-gray-700 rounded-lg bg-[#0B0F1A] text-[#F9FAFB] focus:ring-1 focus:ring-[#6366F1] outline-none text-sm mb-3"
          />
          <div className="flex gap-2">
            <button onClick={() => setShowPrompt(false)} className="flex-1 py-1.5 bg-transparent border border-gray-700 text-[#9CA3AF] text-xs font-bold rounded-lg hover:bg-gray-800">
              Cancel
            </button>
            <button onClick={submitJoinRequest} disabled={isProcessing} className="flex-1 py-1.5 bg-[#6366F1] text-white text-xs font-bold rounded-lg hover:bg-indigo-500 disabled:opacity-50">
              {isProcessing ? 'Sending...' : 'Send Request'}
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-auto flex items-center justify-between border-t border-gray-800 pt-4">
          <div className="text-sm font-medium text-[#F9FAFB]">
            {currentMembersCount} <span className="text-[#9CA3AF]">/ {maxMembers}</span>
          </div>

          <button
            onClick={handleActionClick}
            disabled={isProcessing || (isFull && !isJoined && !isOwner)}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
              isOwner
                ? 'bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/20 hover:bg-[#EF4444] hover:text-white' 
                : isJoined
                ? 'bg-gray-800 text-[#9CA3AF] border border-gray-700 hover:bg-gray-700 hover:text-white' 
                : hasRequested
                ? 'bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/20 cursor-default' 
                : isFull 
                ? 'bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700'
                : 'bg-[#6366F1]/10 text-[#6366F1] hover:bg-[#6366F1] hover:text-white border border-[#6366F1]/20'
            }`}
          >
            {isProcessing ? 'Wait...' : isOwner ? 'Delete' : isJoined ? 'Leave' : hasRequested ? 'Pending Approval' : isFull ? 'Lobby Full' : 'Request to Join'}
          </button>
        </div>
      )}
    </div>
  );
}
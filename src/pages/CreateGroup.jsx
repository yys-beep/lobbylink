import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { createGroup } from '../services/groupService';

export default function CreateGroup() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('study');
  const [maxMembers, setMaxMembers] = useState(5);
  const [location, setLocation] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!title.trim() || !description.trim() || !location.trim()) {
      return setError('Please fill out all required fields.');
    }

    setLoading(true);
    // Convert comma-separated tags into a clean array
    const tagsArray = tagsInput.split(',').map(tag => tag.trim().toLowerCase().replace('#', '')).filter(t => t);

    try {
      const groupData = {
        title: title.trim(),
        description: description.trim(),
        type,
        location: location.trim(),
        tags: tagsArray,
        maxMembers: Number(maxMembers),
        members: [currentUser.uid], 
        memberDetails: [{ uid: currentUser.uid, displayName: currentUser.displayName || 'User' }],
        status: 'OPEN',
        createdBy: currentUser.uid,
        hasChat: false,
        billAmount: 0,
        resources: [],
        onlineUsers: []
      };

      const newGroupId = await createGroup(groupData);
      navigate(`/group/${newGroupId}`);
    } catch (err) {
      setError(err.message || 'Failed to create group.');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-extrabold text-[#F9FAFB] mb-6">Create a Lobby</h1>
      <div className="bg-[#111827] border border-gray-800 rounded-xl shadow-lg overflow-hidden">
        {error && <div className="bg-[#EF4444]/10 text-[#EF4444] p-4 text-sm">{error}</div>}
        
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-[#9CA3AF] mb-1">Title *</label>
            <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-4 py-2 bg-[#0B0F1A] border border-gray-700 rounded-lg text-[#F9FAFB] outline-none focus:border-[#6366F1]" />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#9CA3AF] mb-1">Description *</label>
            <textarea required rows="2" value={description} onChange={(e) => setDescription(e.target.value)} className="w-full px-4 py-2 bg-[#0B0F1A] border border-gray-700 rounded-lg text-[#F9FAFB] outline-none focus:border-[#6366F1] resize-none" />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#9CA3AF] mb-1">Type *</label>
              <select value={type} onChange={(e) => setType(e.target.value)} className="w-full px-4 py-2 bg-[#0B0F1A] border border-gray-700 rounded-lg text-[#F9FAFB] outline-none focus:border-[#6366F1]">
                <option value="study">Study</option>
                <option value="food">Food</option>
                <option value="carpool">Carpool</option>
                <option value="collaboration">Collaboration</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#9CA3AF] mb-1">Max Capacity *</label>
              <input type="number" required min="2" max="20" value={maxMembers} onChange={(e) => setMaxMembers(e.target.value)} className="w-full px-4 py-2 bg-[#0B0F1A] border border-gray-700 rounded-lg text-[#F9FAFB] outline-none focus:border-[#6366F1]" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#9CA3AF] mb-1">Meetup Location / Delivery Spot *</label>
            <input type="text" required value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g., FCSIT Library Level 2" className="w-full px-4 py-2 bg-[#0B0F1A] border border-gray-700 rounded-lg text-[#F9FAFB] outline-none focus:border-[#6366F1]" />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#9CA3AF] mb-1">Tags (Comma separated)</label>
            <input type="text" value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} placeholder="e.g., WIA1006, Hackathon, Lunch" className="w-full px-4 py-2 bg-[#0B0F1A] border border-gray-700 rounded-lg text-[#F9FAFB] outline-none focus:border-[#6366F1]" />
          </div>

          <button type="submit" disabled={loading} className="w-full py-3 bg-[#6366F1] text-white font-bold rounded-lg hover:bg-indigo-500 mt-2">
            {loading ? 'Creating...' : 'Create Group'}
          </button>
        </form>
      </div>
    </div>
  );
}
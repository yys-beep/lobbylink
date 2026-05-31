import { useState } from 'react';
import GroupGrid from '../components/groups/GroupGrid';
import { useGroups } from '../hooks/useGroups';
import { useAuth } from '../hooks/useAuth';

const FILTERS = ['All', 'Study', 'Food', 'Carpool', 'Collaboration', 'Other'];

export default function Home() {
  const { groups, loading } = useGroups();
  const { currentUser } = useAuth();
  
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('active'); 
  const [sortBy, setSortBy] = useState('newest'); // 'newest', 'spots', 'popular'

  const handleTagClick = (tag) => {
    setSearchQuery(tag); // Instantly search by tag when clicked
  };

  let filteredGroups = groups.filter(group => {
    let matchesView = false;
    if (viewMode === 'active') matchesView = group.status === 'OPEN';
    if (viewMode === 'closed') matchesView = group.status === 'FULL' || group.status === 'CLOSED';
    if (viewMode === 'my_groups') matchesView = group.createdBy === currentUser?.uid;
    if (viewMode === 'chats') matchesView = group.members?.includes(currentUser?.uid) && group.hasChat;
    if (viewMode === 'joined') matchesView = group.members?.includes(currentUser?.uid) && group.createdBy !== currentUser?.uid;

    const matchesFilter = activeFilter === 'All' || group.type?.toLowerCase() === activeFilter.toLowerCase();
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = 
      group.title?.toLowerCase().includes(searchLower) || 
      group.description?.toLowerCase().includes(searchLower) ||
      group.tags?.some(tag => tag.toLowerCase().includes(searchLower)) ||
      group.location?.toLowerCase().includes(searchLower);
                          
    return matchesView && matchesFilter && matchesSearch;
  });

  // Sorting Logic
  filteredGroups.sort((a, b) => {
    if (sortBy === 'newest') return b.createdAt?.toMillis() - a.createdAt?.toMillis();
    if (sortBy === 'popular') return (b.members?.length || 0) - (a.members?.length || 0);
    if (sortBy === 'spots') {
      const spotsA = a.maxMembers - (a.members?.length || 0);
      const spotsB = b.maxMembers - (b.members?.length || 0);
      return spotsA - spotsB;
    }
    return 0;
  });

  return (
    <div className="w-full px-4 sm:px-8 lg:px-16 mx-auto space-y-8 mt-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-end space-y-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-[#F9FAFB] tracking-tight">Discover Groups</h1>
          <p className="text-lg text-[#9CA3AF] mt-2">Join real-time study, food, and collaboration lobbies</p>
        </div>
        
        {/* NEW: Sorting Dropdown */}
        <select 
          value={sortBy} 
          onChange={(e) => setSortBy(e.target.value)}
          className="px-4 py-2 bg-[#111827] border border-gray-700 rounded-lg text-[#F9FAFB] outline-none text-sm font-semibold"
        >
          <option value="newest">Sort: Newest First</option>
          <option value="popular">Sort: Most Popular</option>
          <option value="spots">Sort: Fewest Spots Left</option>
        </select>
      </div>

      <div className="flex gap-4 border-b border-gray-800 pb-px overflow-x-auto no-scrollbar">
        <button onClick={() => setViewMode('active')} className={`whitespace-nowrap pb-2 text-sm font-bold border-b-2 transition-colors ${viewMode === 'active' ? 'border-[#6366F1] text-[#F9FAFB]' : 'border-transparent text-[#9CA3AF] hover:text-[#F9FAFB]'}`}>Active Lobbies</button>
        <button onClick={() => setViewMode('closed')} className={`whitespace-nowrap pb-2 text-sm font-bold border-b-2 transition-colors ${viewMode === 'closed' ? 'border-[#EF4444] text-[#F9FAFB]' : 'border-transparent text-[#9CA3AF] hover:text-[#F9FAFB]'}`}>Closed / Full</button>
        {currentUser && (
          <>
            <button onClick={() => setViewMode('my_groups')} className={`whitespace-nowrap pb-2 text-sm font-bold border-b-2 transition-colors ${viewMode === 'my_groups' ? 'border-[#22C55E] text-[#F9FAFB]' : 'border-transparent text-[#9CA3AF] hover:text-[#F9FAFB]'}`}>My Lobbies</button>
            
            {/* NEW: Joined Lobbies Tab */}
            <button onClick={() => setViewMode('joined')} className={`whitespace-nowrap pb-2 text-sm font-bold border-b-2 transition-colors ${viewMode === 'joined' ? 'border-[#A855F7] text-[#F9FAFB]' : 'border-transparent text-[#9CA3AF] hover:text-[#F9FAFB]'}`}>Joined Lobbies</button>
            
            <button onClick={() => setViewMode('chats')} className={`whitespace-nowrap pb-2 text-sm font-bold border-b-2 transition-colors flex items-center gap-1.5 ${viewMode === 'chats' ? 'border-[#F59E0B] text-[#F9FAFB]' : 'border-transparent text-[#9CA3AF] hover:text-[#F9FAFB]'}`}>My Chats</button>
          </>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-[#111827] p-4 rounded-xl border border-gray-800 shadow-sm">
        <input
          type="text"
          className="block w-full md:w-96 px-4 py-2.5 border border-gray-700 rounded-lg bg-[#0B0F1A] text-[#F9FAFB] placeholder-[#9CA3AF] outline-none"
          placeholder="Search tags, names, or locations..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 no-scrollbar">
          {FILTERS.map((filter) => (
            <button key={filter} onClick={() => setActiveFilter(filter)} className={`whitespace-nowrap px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeFilter === filter ? 'bg-[#6366F1] text-white' : 'bg-[#0B0F1A] text-[#9CA3AF] border border-gray-800'}`}>{filter}</button>
          ))}
        </div>
      </div>

      <div className="pb-10">
        {loading ? <div className="text-center py-10 text-[#9CA3AF]">Loading...</div> : <GroupGrid groups={filteredGroups} currentUser={currentUser} onTagClick={handleTagClick} />}
      </div>
    </div>
  );
}
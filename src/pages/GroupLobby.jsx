import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import { 
  requestToJoinGroup, leaveGroup, updateGroupStatus, approveRequest, declineRequest, deleteGroup, updateGroupDetails, enableGroupChat, kickMember, setPresence, updateBillAmount, addResource, addPollOption, votePoll, deletePollOption,
  updateGroupCart, getUserStats, deleteResource, updateResource
} from '../services/groupService';
import { useAuth } from '../hooks/useAuth';
import GroupChat from '../components/groups/GroupChat';

export default function GroupLobby() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);

  // States
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editMaxMembers, setEditMaxMembers] = useState(5);
  const [editType, setEditType] = useState('study');
  const [editTags, setEditTags] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [editLocation, setEditLocation] = useState('');
  const [showRequestPrompt, setShowRequestPrompt] = useState(false);
  const [requestMessage, setRequestMessage] = useState('');
  
  // Widget States
  const [billInput, setBillInput] = useState('');
  const [resourceTitle, setResourceTitle] = useState('');
  const [resourceUrl, setResourceUrl] = useState('');
  const [editingResourceId, setEditingResourceId] = useState(null);
  const [editResTitle, setEditResTitle] = useState('');
  const [editResUrl, setEditResUrl] = useState('');

  const startEditingResource = (res) => {
    setEditingResourceId(res.id);
    setEditResTitle(res.title);
    setEditResUrl(res.url);
  };
  
  const [pollInput, setPollInput] = useState('');
  
  // Cart States (Food)
  const [cartItemName, setCartItemName] = useState('');
  const [cartItemPrice, setCartItemPrice] = useState('');

  // Trust Profile Modal State
  const [selectedUser, setSelectedUser] = useState(null);
  const [userStats, setUserStats] = useState(null);

  useEffect(() => {
    if (!currentUser || !id) return;
    setPresence(id, currentUser.uid, true); 
    const handleUnload = () => setPresence(id, currentUser.uid, false);
    window.addEventListener('beforeunload', handleUnload);
    return () => { setPresence(id, currentUser.uid, false); window.removeEventListener('beforeunload', handleUnload); };
  }, [currentUser, id]);

  useEffect(() => {
    const docRef = doc(db, 'groups', id);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setGroup({ id: docSnap.id, ...data });
        setEditTitle(data.title || ''); setEditDescription(data.description || ''); setEditMaxMembers(data.maxMembers || 5); setEditLocation(data.location || ''); setEditType(data.type || 'study'); setEditTags(data.tags ? data.tags.join(', ') : '');
      } else { navigate('/'); }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [id, navigate]);

  if (loading || !group) return <div className="text-white text-center mt-20">Loading...</div>;

  const currentUserId = currentUser?.uid;
  const isOwner = currentUserId === group.createdBy;
  const isJoined = group.members?.includes(currentUserId);
  const hasRequested = group.requests?.includes(currentUserId);
  const currentMembersCount = group.members?.length || 0;
  const isFull = currentMembersCount >= group.maxMembers || group.status === 'FULL' || group.status === 'CLOSED';
  const splitAmount = group.billAmount > 0 ? (group.billAmount / currentMembersCount).toFixed(2) : 0;

  // --- ACTIONS ---
  const handleToggleStatus = () => updateGroupStatus(group.id, group.status === 'OPEN' ? 'CLOSED' : 'OPEN');
  const handleSaveDetails = async () => {
    if (!editTitle.trim()) return;
    if (parseInt(editMaxMembers) < currentMembersCount) return alert("Capacity cannot be less than current members.");
    
    // Convert comma-separated string back to a clean array
    const tagsArray = editTags.split(',').map(tag => tag.trim().toLowerCase().replace('#', '')).filter(t => t);

    setIsSaving(true);
    try {
      await updateGroupDetails(group.id, { 
        title: editTitle.trim(), 
        description: editDescription.trim(), 
        maxMembers: parseInt(editMaxMembers), 
        location: editLocation.trim(),
        type: editType,
        tags: tagsArray
      });
      setIsEditing(false);
    } catch (err) { console.error(err); } finally { setIsSaving(false); }
  };

  // Upgraded Decline Function
  const handleDecline = (uid, name) => {
    const reason = window.prompt(`Decline ${name}'s request? \n\nYou can provide an optional reason below:`);
    if (reason !== null) { // If they didn't click Cancel
      declineRequest(group.id, uid, group.title, reason);
    }
  };
  const handleDeleteLobby = async () => { if (window.confirm("Terminate this lobby permanently?")) { await deleteGroup(group.id); navigate('/'); } };
  const handleJoinOrLeaveClick = async () => {
    if (!currentUserId) return navigate('/login');
    if (isJoined) await leaveGroup(group.id, currentUserId, currentUser.displayName);
    else setShowRequestPrompt(true);
  };
  const submitJoinRequest = async () => {
    await requestToJoinGroup(group.id, currentUserId, currentUser.displayName, requestMessage.trim());
    setShowRequestPrompt(false); setRequestMessage('');
  };
  const handleInitializeChat = async () => enableGroupChat(group.id);
  const handleApprove = (uid, name) => approveRequest(group.id, uid, name, group.maxMembers, group.title);

  // Cart Actions
  const handleAddToCart = () => {
    if (!cartItemName || !cartItemPrice) return;
    const newItem = { id: Date.now().toString(), name: cartItemName, price: Number(cartItemPrice), addedByUid: currentUserId, addedByName: currentUser.displayName };
    updateGroupCart(group.id, [...(group.cart || []), newItem]);
    setCartItemName(''); setCartItemPrice('');
  };
  const handleRemoveFromCart = (itemId) => {
    updateGroupCart(group.id, (group.cart || []).filter(item => item.id !== itemId));
  };
  const cartTotal = (group.cart || []).reduce((sum, item) => sum + item.price, 0).toFixed(2);

  // Trust Profile Handler
  const openUserProfile = async (member) => {
    setSelectedUser(member);
    setUserStats(null); // loading state
    const stats = await getUserStats(member.uid);
    setUserStats(stats);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 relative">
      <Link to="/" className="text-[#9CA3AF] hover:text-white text-sm font-medium">← Back to Feed</Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Header & Map Card */}
          <div className="bg-[#111827] border border-gray-800 rounded-xl overflow-hidden shadow-sm">
            {group.location && (
              <div className="w-full h-48 bg-gray-900 border-b border-gray-800 relative">
                {/* Embedded Google Maps via simple iframe */}
                <iframe 
                  width="100%" height="100%" style={{ border: 0 }} loading="lazy" allowFullScreen
                  src={`https://maps.google.com/maps?q=${encodeURIComponent(group.location)}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                ></iframe>
                <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-lg border border-white/10 shadow-lg pointer-events-none">
                  📍 {group.location}
                </div>
              </div>
            )}
            
            <div className="p-8">
              <div className="flex gap-2 mb-4">
                <span className="text-[10px] font-bold text-[#F9FAFB] bg-[#6366F1] px-3 py-1.5 rounded uppercase">{group.type}</span>
              </div>
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-[#9CA3AF] uppercase mb-1">Group Type</label>
                    <select value={editType} onChange={(e) => setEditType(e.target.value)} className="w-full px-3 py-2 border border-gray-700 rounded-lg bg-[#0B0F1A] text-[#F9FAFB] outline-none focus:ring-1 focus:ring-[#6366F1]">
                      <option value="study">Study</option>
                      <option value="food">Food</option>
                      <option value="carpool">Carpool</option>
                      <option value="collaboration">Collaboration</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#9CA3AF] uppercase mb-1">Lobby Title</label>
                    <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="w-full px-3 py-2 border border-gray-700 rounded-lg bg-[#0B0F1A] text-[#F9FAFB] outline-none focus:ring-1 focus:ring-[#6366F1]" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#9CA3AF] uppercase mb-1">Location</label>
                    <input type="text" value={editLocation} onChange={(e) => setEditLocation(e.target.value)} className="w-full px-3 py-2 border border-gray-700 rounded-lg bg-[#0B0F1A] text-[#F9FAFB] outline-none focus:ring-1 focus:ring-[#6366F1]" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#9CA3AF] uppercase mb-1">Tags (Comma separated)</label>
                    <input type="text" value={editTags} onChange={(e) => setEditTags(e.target.value)} placeholder="e.g., algorithms, finals, study" className="w-full px-3 py-2 border border-gray-700 rounded-lg bg-[#0B0F1A] text-[#F9FAFB] outline-none focus:ring-1 focus:ring-[#6366F1]" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#9CA3AF] uppercase mb-1">Description</label>
                    <textarea rows={3} value={editDescription} onChange={(e) => setEditDescription(e.target.value)} className="w-full px-3 py-2 border border-gray-700 rounded-lg bg-[#0B0F1A] text-[#F9FAFB] outline-none focus:ring-1 focus:ring-[#6366F1]" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#9CA3AF] uppercase mb-1">Max Capacity</label>
                    <input type="number" min={currentMembersCount} max="20" value={editMaxMembers} onChange={(e) => setEditMaxMembers(e.target.value)} className="w-full px-3 py-2 border border-gray-700 rounded-lg bg-[#0B0F1A] text-[#F9FAFB] outline-none focus:ring-1 focus:ring-[#6366F1]" />
                  </div>
                </div>
              ) : (
                <>
                  <h1 className="text-3xl font-extrabold text-[#F9FAFB] mb-4">{group.title}</h1>
                  <p className="text-lg text-[#9CA3AF] leading-relaxed mb-4">{group.description}</p>
                  {group.tags?.length > 0 && (
                    <div className="flex gap-2 mt-4">
                      {group.tags.map(tag => <span key={tag} className="text-sm font-medium text-[#6366F1]">#{tag}</span>)}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* DYNAMIC UTILITIES */}

          {/* Itemized Cart (For Food Lobbies) */}
          {isJoined && group.type === 'food' && (
            <div className="bg-[#111827] border border-[#22C55E]/30 rounded-xl p-6 shadow-sm">
              <div className="flex justify-between items-end mb-4">
                <h3 className="text-lg font-bold text-[#F9FAFB]">🛒 Group Order Cart</h3>
                <p className="text-sm text-[#9CA3AF]">Total: <span className="font-bold text-[#22C55E] text-xl">RM {cartTotal}</span></p>
              </div>
              
              <div className="space-y-2 mb-4 max-h-48 overflow-y-auto no-scrollbar">
                {group.cart?.length > 0 ? group.cart.map(item => (
                  <div key={item.id} className="flex justify-between items-center bg-[#0B0F1A] p-3 rounded-lg border border-gray-800">
                    <div>
                      <p className="text-sm font-bold text-white">{item.name}</p>
                      <p className="text-[10px] text-gray-500">Added by {item.addedByName}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-[#22C55E]">RM {item.price.toFixed(2)}</span>
                      {(isOwner || item.addedByUid === currentUserId) && (
                        <button onClick={() => handleRemoveFromCart(item.id)} className="text-gray-500 hover:text-[#EF4444] transition-colors" title="Remove Item">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                )) : <p className="text-sm text-gray-500 italic">Cart is empty.</p>}
              </div>

              <div className="flex gap-2">
                <input type="text" placeholder="Item Name (e.g., Nasi Lemak)" value={cartItemName} onChange={e => setCartItemName(e.target.value)} className="flex-1 px-3 py-2 bg-gray-800 text-white rounded-lg outline-none text-sm" />
                <input type="number" placeholder="Price RM" value={cartItemPrice} onChange={e => setCartItemPrice(e.target.value)} className="w-24 px-3 py-2 bg-gray-800 text-white rounded-lg outline-none text-sm" />
                <button onClick={handleAddToCart} disabled={!cartItemName || !cartItemPrice} className="px-4 py-2 bg-[#22C55E] text-white rounded-lg text-sm font-bold disabled:opacity-50">Add</button>
              </div>
            </div>
          )}

          {/* Regular Split Bill (Carpool) */}
          {isJoined && group.type === 'carpool' && (
            <div className="bg-gradient-to-r from-[#111827] to-[#0B0F1A] border border-[#22C55E]/30 rounded-xl p-6 flex justify-between items-center shadow-sm">
              <div>
                <h3 className="text-lg font-bold text-[#F9FAFB]">💵 Split Petrol/Toll</h3>
                <p className="text-sm text-[#9CA3AF]">Everyone owes: <span className="font-bold text-[#22C55E] text-xl">RM {splitAmount}</span></p>
              </div>
              {isOwner && (
                <div className="flex gap-2">
                  <input type="number" placeholder="Total RM" value={billInput} onChange={e => setBillInput(e.target.value)} className="w-24 px-3 py-2 bg-gray-800 text-white rounded-lg outline-none text-sm" />
                  <button onClick={() => updateBillAmount(group.id, billInput)} className="px-4 py-2 bg-[#22C55E] text-white rounded-lg text-sm font-bold hover:bg-green-600">Set</button>
                </div>
              )}
            </div>
          )}

          {/* Resources */}
          {isJoined && (group.type === 'study' || group.type === 'collaboration') && (
            <div className="bg-[#111827] border border-[#6366F1]/30 rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-bold text-[#F9FAFB] mb-4">🔗 Shared Resources</h3>
              <div className="space-y-2 mb-4 max-h-40 overflow-y-auto custom-scrollbar">
                {group.resources?.length > 0 ? group.resources.map(res => {
                  const canEdit = isOwner || res.addedBy === currentUser.displayName;

                  return (
                    <div key={res.id} className="bg-[#0B0F1A] p-3 rounded-lg border border-gray-800 group/res">
                      {editingResourceId === res.id ? (
                        /* INLINE EDIT MODE */
                        <div className="flex flex-col sm:flex-row gap-2">
                          <input type="text" value={editResTitle} onChange={e => setEditResTitle(e.target.value)} className="flex-1 px-2 py-1.5 bg-gray-800 text-white rounded text-sm outline-none focus:ring-1 focus:ring-[#6366F1]" />
                          <input type="url" value={editResUrl} onChange={e => setEditResUrl(e.target.value)} className="flex-1 px-2 py-1.5 bg-gray-800 text-white rounded text-sm outline-none focus:ring-1 focus:ring-[#6366F1]" />
                          <div className="flex gap-1">
                            <button onClick={async () => { await updateResource(group.id, res.id, editResTitle, editResUrl); setEditingResourceId(null); }} className="px-3 py-1 bg-[#22C55E] hover:bg-green-600 text-white rounded text-xs font-bold transition-colors">Save</button>
                            <button onClick={() => setEditingResourceId(null)} className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded text-xs font-bold transition-colors">Cancel</button>
                          </div>
                        </div>
                      ) : (
                        /* DEFAULT VIEW MODE */
                        <div className="flex justify-between items-center">
                          <a href={res.url} target="_blank" rel="noreferrer" className="text-sm text-blue-400 font-medium hover:underline truncate mr-2">
                            {res.title} <span className="text-[10px] text-gray-500 ml-2">by {res.addedBy}</span>
                          </a>
                          
                          {canEdit && (
                            <div className="flex items-center gap-2 opacity-0 group-hover/res:opacity-100 transition-opacity">
                              <button onClick={() => startEditingResource(res)} className="text-gray-500 hover:text-white transition-colors" title="Edit">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                              </button>
                              <button onClick={() => { if(window.confirm('Delete this resource?')) deleteResource(group.id, res.id); }} className="text-gray-500 hover:text-[#EF4444] transition-colors" title="Delete">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                }) : <p className="text-sm text-gray-500 italic">No resources shared yet.</p>}
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <input type="text" placeholder="Title" value={resourceTitle} onChange={e => setResourceTitle(e.target.value)} className="flex-1 px-3 py-2 bg-gray-800 text-white rounded-lg outline-none text-sm" />
                <input type="url" placeholder="URL Link" value={resourceUrl} onChange={e => setResourceUrl(e.target.value)} className="flex-1 px-3 py-2 bg-gray-800 text-white rounded-lg outline-none text-sm" />
                <button onClick={() => { addResource(group.id, resourceTitle, resourceUrl, currentUser.displayName); setResourceTitle(''); setResourceUrl(''); }} disabled={!resourceTitle || !resourceUrl} className="px-4 py-2 bg-[#6366F1] text-white rounded-lg text-sm font-bold disabled:opacity-50">Add</button>
              </div>
            </div>
          )}

          {/* Polling */}
          {isJoined && (
            <div className="bg-[#111827] border border-purple-500/30 rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-bold text-[#F9FAFB] mb-4">⏱️ Availability Poll</h3>
              <div className="space-y-2 mb-4">
                {group.polls?.length > 0 ? group.polls.map(poll => {
                  const hasVoted = poll.votes.includes(currentUser.uid);
                  return (
                    <div key={poll.id} className={`p-3 rounded-lg border flex justify-between items-center transition-colors ${hasVoted ? 'bg-purple-500/20 border-purple-500 text-white' : 'bg-[#0B0F1A] border-gray-800 text-[#9CA3AF] hover:bg-gray-800'}`}>
                      <div className="flex-1 cursor-pointer" onClick={() => votePoll(group.id, poll.id, currentUser.uid)}>
                        <span className="text-sm font-medium">{poll.option}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold px-2 py-1 bg-gray-900 rounded-full">{poll.votes.length} Votes</span>
                        {isOwner && (
                          <button onClick={(e) => { e.stopPropagation(); if(window.confirm('Delete option?')) deletePollOption(group.id, poll.id); }} className="text-gray-500 hover:text-[#EF4444] transition-colors p-1 rounded" title="Delete Option">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                }) : <p className="text-sm text-gray-500 italic">No time polls created yet.</p>}
              </div>
              {isOwner && (
                <div className="flex gap-2">
                  <input type="text" placeholder="e.g., Monday 8:00 PM" value={pollInput} onChange={e => setPollInput(e.target.value)} className="flex-1 px-3 py-2 bg-gray-800 text-white rounded-lg outline-none text-sm" />
                  <button onClick={() => { addPollOption(group.id, pollInput); setPollInput(''); }} disabled={!pollInput} className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-bold disabled:opacity-50">Add</button>
                </div>
              )}
            </div>
          )}

          {/* Group Chat */}
          {isJoined && (
            <div className="mt-6">
              {!group.hasChat ? (
                <div className="bg-[#111827] border border-gray-800 rounded-xl p-8 shadow-sm flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-bold text-[#F9FAFB]">Lobby Chat</h2>
                    <p className="text-sm text-[#9CA3AF] mt-1">Discuss and coordinate with members.</p>
                  </div>
                  {isOwner ? (
                    <button onClick={handleInitializeChat} className="px-6 py-2 bg-[#22C55E] text-white rounded-lg font-bold hover:bg-green-500 shadow-md">Enable Chat</button>
                  ) : <span className="text-xs font-bold text-gray-500 bg-gray-800 px-3 py-1.5 rounded-lg">Chat Not Enabled</span>}
                </div>
              ) : <GroupChat groupId={group.id} currentUser={currentUser} group={group} isOwner={isOwner} />}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-6">
          <div className="bg-[#111827] border border-gray-800 rounded-xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-[#F9FAFB]">Status</h3>
              <span className={`text-xs font-bold px-3 py-1 rounded-full border ${group.status === 'OPEN' ? 'text-[#22C55E] border-[#22C55E]' : 'text-[#EF4444] border-[#EF4444]'}`}>{group.status}</span>
            </div>
            <p className="text-[#F9FAFB] mb-6">{currentMembersCount} / {group.maxMembers} Members</p>

            {/* General Actions */}
            {!isOwner && (
              <div className="mt-4">
                {showRequestPrompt ? (
                  <div className="bg-[#0B0F1A] border border-gray-800 rounded-lg p-4 mb-4">
                    <label className="block text-xs font-bold text-[#9CA3AF] uppercase mb-2">Message (Optional)</label>
                    <input type="text" value={requestMessage} onChange={(e) => setRequestMessage(e.target.value)} className="w-full px-3 py-2 border border-gray-700 rounded-lg bg-[#111827] text-[#F9FAFB] outline-none text-sm mb-4" />
                    <div className="flex gap-2">
                      <button onClick={() => setShowRequestPrompt(false)} className="flex-1 py-2 bg-transparent border border-gray-700 text-[#9CA3AF] text-xs font-bold rounded-lg hover:bg-gray-800">Cancel</button>
                      <button onClick={submitJoinRequest} className="flex-1 py-2 bg-[#6366F1] text-white text-xs font-bold rounded-lg hover:bg-indigo-500">Send</button>
                    </div>
                  </div>
                ) : (
                  <button onClick={handleJoinOrLeaveClick} className={`w-full py-3 rounded-lg font-bold text-white ${isJoined ? 'bg-red-500/20 text-red-500 hover:bg-red-500 hover:text-white' : hasRequested ? 'bg-yellow-500/20 text-yellow-500' : isFull ? 'bg-gray-700' : 'bg-[#6366F1] hover:bg-indigo-500'}`}>
                    {isJoined ? 'Leave Lobby' : hasRequested ? 'Request Pending...' : isFull ? 'Lobby Full' : 'Request to Join'}
                  </button>
                )}
              </div>
            )}

            {/* Owner Controls */}
            {isOwner && (
              <div className="border-t border-gray-800 pt-4 mt-4 space-y-2.5">
                <h4 className="text-xs font-bold text-[#9CA3AF] tracking-wider uppercase mb-2">Owner Controls</h4>
                {isEditing ? (
                  <div className="flex gap-2">
                    <button onClick={() => { setIsEditing(false); setEditTitle(group.title); setEditDescription(group.description); setEditMaxMembers(group.maxMembers); setEditLocation(group.location || ''); }} className="flex-1 py-2 bg-transparent border border-gray-700 text-[#9CA3AF] text-sm font-semibold rounded-lg hover:bg-gray-800">Cancel</button>
                    <button onClick={handleSaveDetails} className="flex-1 py-2 bg-[#6366F1] text-white text-sm font-semibold rounded-lg hover:bg-indigo-500">Save</button>
                  </div>
                ) : (
                  <button onClick={() => setIsEditing(true)} className="w-full py-2 rounded-lg font-semibold bg-gray-850 border border-gray-700 text-white hover:bg-gray-800 text-sm">Edit Details & Capacity</button>
                )}
                <button onClick={handleToggleStatus} className="w-full py-2 rounded-lg font-semibold bg-gray-800 text-white hover:bg-gray-700 text-sm">{group.status === 'OPEN' ? 'Close Lobby manually' : 'Re-open Lobby'}</button>
                <button onClick={handleDeleteLobby} className="w-full py-2 rounded-lg font-bold bg-[#EF4444]/10 text-[#EF4444] text-sm mt-2 hover:bg-[#EF4444]/20 border border-transparent hover:border-[#EF4444]/50">Terminate Lobby</button>
              </div>
            )}
          </div>

          <div className="bg-[#111827] border border-gray-800 rounded-xl p-6 shadow-sm">
            <h2 className="text-xl font-bold text-[#F9FAFB] mb-4">Active Members</h2>
            <div className="space-y-3">
              {group.memberDetails?.map((member) => {
                const isOnline = group.onlineUsers?.includes(member.uid);
                return (
                  <div key={member.uid} className="flex items-center gap-3 p-3 rounded-lg bg-[#0B0F1A] border border-gray-800 group relative">
                    <div className="relative">
                      {/* Avatar is clickable to view Trust Profile */}
                      <button onClick={() => openUserProfile(member)} className="w-10 h-10 rounded-full bg-gray-700 flex justify-center items-center font-bold text-white hover:ring-2 ring-[#6366F1] transition-all">
                        {member.displayName?.charAt(0).toUpperCase()}
                      </button>
                      <span className={`absolute bottom-0 right-0 w-3 h-3 border-2 border-[#0B0F1A] rounded-full ${isOnline ? 'bg-[#22C55E]' : 'bg-gray-500'}`}></span>
                    </div>
                    <div className="flex-1 flex justify-between items-center">
                      <div>
                        <p className="text-sm font-medium text-[#F9FAFB]">{member.uid === currentUserId ? 'You' : member.displayName}</p>
                        {member.uid === group.createdBy && <p className="text-[10px] text-[#6366F1] font-bold">LOBBY OWNER</p>}
                      </div>
                      {isOwner && member.uid !== currentUserId && (
                        <button onClick={() => { if (window.confirm(`Kick ${member.displayName}?`)) kickMember(group.id, member.uid, member.displayName, group.title); }} className="text-xs font-bold px-3 py-1.5 bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/30 rounded hover:bg-[#EF4444] hover:text-white transition-colors opacity-0 group-hover:opacity-100">Kick</button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pending Requests */}
          {isOwner && group.requestDetails?.length > 0 && (
            <div className="bg-[#111827] border border-[#F59E0B]/30 rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-bold text-[#F59E0B] mb-4">Pending Requests ({group.requestDetails.length})</h3>
              <div className="space-y-4">
                {group.requestDetails.map(req => (
                  <div key={req.uid} className="bg-[#0B0F1A] p-4 rounded-lg border border-gray-800">
                    <div className="flex items-center gap-2 mb-2">
                      <button onClick={() => openUserProfile(req)} className="w-6 h-6 rounded-full bg-gray-700 text-xs font-bold text-white flex items-center justify-center hover:ring-2 ring-[#6366F1]">{req.displayName.charAt(0)}</button>
                      <p className="text-sm text-[#F9FAFB] font-bold">{req.displayName}</p>
                    </div>
                    {req.message ? <p className="text-xs text-[#9CA3AF] mb-4 italic bg-[#111827] p-2 rounded">"{req.message}"</p> : <p className="text-xs text-gray-600 mb-4 italic">No message.</p>}
                    <div className="flex gap-2">
                      <button onClick={() => handleApprove(req.uid, req.displayName)} className="flex-1 py-1.5 bg-[#22C55E]/20 text-[#22C55E] text-xs font-bold rounded hover:bg-[#22C55E] hover:text-white">Admit</button>
                      <button onClick={() => handleDecline(req.uid, req.displayName)} className="flex-1 py-1.5 bg-[#EF4444]/20 text-[#EF4444] text-xs font-bold rounded hover:bg-[#EF4444] hover:text-white">Decline</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* TRUST PROFILE MODAL OVERLAY */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedUser(null)}>
          <div className="bg-[#111827] border border-gray-800 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-fade-in-up" onClick={e => e.stopPropagation()}>
            <div className="p-6 text-center relative">
              <button onClick={() => setSelectedUser(null)} className="absolute top-4 right-4 text-gray-500 hover:text-white">✕</button>
              <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-tr from-[#6366F1] to-[#c084fc] flex items-center justify-center text-white text-3xl font-extrabold mb-4 shadow-lg">
                {selectedUser.displayName?.charAt(0).toUpperCase()}
              </div>
              <h2 className="text-xl font-bold text-white">{selectedUser.displayName}</h2>
              <p className="text-xs text-[#9CA3AF] font-mono mt-1">ID: {selectedUser.uid.substring(0, 8)}...</p>
              
              <div className="mt-6 border-t border-gray-800 pt-4 text-left space-y-3">
                <h3 className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wider">LobbyLink Stats</h3>
                {userStats ? (
                  <div className="flex justify-between items-center bg-[#0B0F1A] p-3 rounded-lg border border-gray-800">
                    <span className="text-sm font-medium text-white">Groups Hosted</span>
                    <span className="text-sm font-bold text-[#6366F1]">{userStats.hostedCount}</span>
                  </div>
                ) : (
                  <div className="animate-pulse flex space-x-4">
                    <div className="flex-1 space-y-3 py-1">
                      <div className="h-4 bg-gray-700 rounded w-3/4"></div>
                    </div>
                  </div>
                )}
                <div className="flex justify-between items-center bg-[#0B0F1A] p-3 rounded-lg border border-gray-800">
                  <span className="text-sm font-medium text-white">Status</span>
                  <span className="text-xs font-bold px-2 py-1 bg-[#6366F1]/10 text-[#6366F1] rounded">Verified User</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
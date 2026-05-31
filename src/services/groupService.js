import { db } from '../config/firebase';
import { 
  collection, 
  addDoc, 
  doc, 
  updateDoc, 
  deleteDoc, 
  arrayUnion, 
  arrayRemove, 
  serverTimestamp, 
  getDoc,
  setDoc 
} from 'firebase/firestore';

const groupsRef = collection(db, 'groups');

// Create a new lobby group
export const createGroup = async (groupData) => {
  try {
    const docRef = await addDoc(groupsRef, {
      ...groupData,
      createdAt: serverTimestamp()
    });
    return docRef.id; // Returns the ID for the router redirect
  } catch (error) {
    console.error("Error creating group: ", error);
    throw new Error("Could not create the lobby. Please try again.");
  }
};

// Add user to the lobby's pending request queue
// Ensure getDoc and serverTimestamp are imported at the top!
export const requestToJoinGroup = async (groupId, userId, displayName, message = "") => {
  const groupRef = doc(db, 'groups', groupId);
  const groupSnap = await getDoc(groupRef); // Fetch the group to find the Owner

  if (groupSnap.exists()) {
    const groupData = groupSnap.data();
    const ownerId = groupData.createdBy;

    // 1. Add the request to the group
    await updateDoc(groupRef, {
      requests: arrayUnion(userId),
      requestDetails: arrayUnion({ uid: userId, displayName, message })
    });

    // 2. Send a notification specifically to the Owner
    const notifRef = collection(db, 'users', ownerId, 'notifications');
    await addDoc(notifRef, {
      type: 'REQUEST',
      message: `${displayName} requested to join "${groupData.title}"`,
      groupId: groupId,
      createdAt: serverTimestamp()
    });
  }
};

// Approve a user's join request and manage full-capacity states
export const approveRequest = async (groupId, targetUid, targetDisplayName, maxMembers, groupTitle) => {
  const groupRef = doc(db, 'groups', groupId);
  const groupSnap = await getDoc(groupRef);
  
  if (groupSnap.exists()) {
    const data = groupSnap.data();
    const currentMembersCount = data.members?.length || 0;
    
    if (currentMembersCount >= maxMembers) throw new Error("Lobby is already full.");

    const newStatus = (currentMembersCount + 1) >= maxMembers ? 'FULL' : data.status;
    const updatedRequests = (data.requests || []).filter(id => id !== targetUid);
    const updatedRequestDetails = (data.requestDetails || []).filter(req => req.uid !== targetUid);

    await updateDoc(groupRef, {
      members: arrayUnion(targetUid),
      memberDetails: arrayUnion({ uid: targetUid, displayName: targetDisplayName }),
      requests: updatedRequests,
      requestDetails: updatedRequestDetails,
      status: newStatus
    });

    // NEW: Send a notification to the accepted user
    const notifRef = collection(db, 'users', targetUid, 'notifications');
    await addDoc(notifRef, {
      message: `You were accepted into "${groupTitle}"!`,
      groupId: groupId,
      createdAt: serverTimestamp()
    });
  }
};

// --- UPDATE KICK MEMBER FUNCTION ---
export const kickMember = async (groupId, targetUid, targetDisplayName, groupTitle) => {
  const groupRef = doc(db, 'groups', groupId);
  
  // 1. Remove the user from the lobby
  await updateDoc(groupRef, {
    members: arrayRemove(targetUid),
    memberDetails: arrayRemove({ uid: targetUid, displayName: targetDisplayName }),
    status: 'OPEN' // Always reopen the lobby if someone is kicked
  });

  // 2. Send a notification to the kicked user
  const notifRef = collection(db, 'users', targetUid, 'notifications');
  await addDoc(notifRef, {
    type: 'KICKED',
    message: `You were removed from the lobby "${groupTitle}".`,
    groupId: groupId,
    createdAt: serverTimestamp()
  });
};

// Upgrade this function to accept a reason and send a notification
export const declineRequest = async (groupId, targetUid, groupTitle, reason = "") => {
  const groupRef = doc(db, 'groups', groupId);
  const groupSnap = await getDoc(groupRef);
  
  if (groupSnap.exists()) {
    const data = groupSnap.data();
    
    // Safely filter out the rejected user from both arrays
    const updatedRequests = (data.requests || []).filter(uid => uid !== targetUid);
    const updatedRequestDetails = (data.requestDetails || []).filter(req => req.uid !== targetUid);

    await updateDoc(groupRef, {
      requests: updatedRequests,
      requestDetails: updatedRequestDetails
    });

    // Send the rejection notification
    const notifRef = collection(db, 'users', targetUid, 'notifications');
    const msg = reason.trim() 
      ? `Your request to join "${groupTitle}" was declined. Reason: ${reason}` 
      : `Your request to join "${groupTitle}" was declined.`;
      
    await addDoc(notifRef, {
      type: 'DECLINED',
      message: msg,
      groupId: groupId,
      createdAt: serverTimestamp()
    });
  }
};

// Remove a user from active membership lists and automatically reopen the status
export const leaveGroup = async (groupId, userId, displayName) => {
  const groupRef = doc(db, 'groups', groupId);
  await updateDoc(groupRef, {
    members: arrayRemove(userId),
    memberDetails: arrayRemove({ uid: userId, displayName }),
    status: 'OPEN' // Always reopen if someone leaves
  });
};

// Simple status toggle (e.g., OPEN, CLOSED)
export const updateGroupStatus = async (groupId, newStatus) => {
  const groupRef = doc(db, 'groups', groupId);
  await updateDoc(groupRef, { status: newStatus });
};

// Permanently delete a lobby document from the collection
export const deleteGroup = async (groupId) => {
  const groupRef = doc(db, 'groups', groupId);
  await deleteDoc(groupRef);
};

// ... existing imports and functions

export const updateGroupDetails = async (groupId, details) => {
  const groupRef = doc(db, 'groups', groupId);
  
  // If maxMembers is increased, we might need to reopen the lobby if it was FULL
  const groupSnap = await getDoc(groupRef);
  if (groupSnap.exists()) {
    const data = groupSnap.data();
    const currentMembersCount = data.members?.length || 0;
    
    let newStatus = data.status;
    if (details.maxMembers > currentMembersCount && data.status === 'FULL') {
      newStatus = 'OPEN';
    } else if (details.maxMembers === currentMembersCount) {
      newStatus = 'FULL';
    }

    await updateDoc(groupRef, {
      ...details,
      status: newStatus
    });
  }
};

export const enableGroupChat = async (groupId) => {
  const groupRef = doc(db, 'groups', groupId);
  await updateDoc(groupRef, { hasChat: true });
};

// Add this new function to handle sending messages
export const sendMessage = async (groupId, userId, displayName, text) => {
  const messagesRef = collection(db, 'groups', groupId, 'messages');
  await addDoc(messagesRef, {
    uid: userId,
    displayName: displayName,
    text: text.trim(),
    createdAt: serverTimestamp()
  });
};

export const setPresence = async (groupId, uid, isOnline) => {
  const groupRef = doc(db, 'groups', groupId);
  if (isOnline) await updateDoc(groupRef, { onlineUsers: arrayUnion(uid) });
  else await updateDoc(groupRef, { onlineUsers: arrayRemove(uid) });
};

export const setTypingStatus = async (groupId, uid, displayName, isTyping) => {
  const typingRef = doc(db, 'groups', groupId, 'typing', uid);
  if (isTyping) await setDoc(typingRef, { displayName, updatedAt: serverTimestamp() });
  else await deleteDoc(typingRef);
};

export const updateBillAmount = async (groupId, amount) => {
  const groupRef = doc(db, 'groups', groupId);
  await updateDoc(groupRef, { billAmount: Number(amount) });
};

export const addResource = async (groupId, title, url, addedBy) => {
  const groupRef = doc(db, 'groups', groupId);
  await updateDoc(groupRef, { resources: arrayUnion({ title, url, addedBy, id: Date.now().toString() }) });
};

export const addPollOption = async (groupId, option) => {
  const groupRef = doc(db, 'groups', groupId);
  await updateDoc(groupRef, { polls: arrayUnion({ id: Date.now().toString(), option, votes: [] }) });
};

export const votePoll = async (groupId, pollId, uid) => {
  const groupRef = doc(db, 'groups', groupId);
  const groupSnap = await getDoc(groupRef);
  if (groupSnap.exists()) {
    const polls = groupSnap.data().polls || [];
    const updatedPolls = polls.map(p => {
      if (p.id === pollId) {
        // Toggle vote on/off
        const hasVoted = p.votes.includes(uid);
        return { ...p, votes: hasVoted ? p.votes.filter(id => id !== uid) : [...p.votes, uid] };
      }
      return p;
    });
    await updateDoc(groupRef, { polls: updatedPolls });
  }
};

export const deletePollOption = async (groupId, pollId) => {
  const groupRef = doc(db, 'groups', groupId);
  const groupSnap = await getDoc(groupRef);
  
  if (groupSnap.exists()) {
    const polls = groupSnap.data().polls || [];
    // Filter out the poll with the matching ID
    const updatedPolls = polls.filter(p => p.id !== pollId);
    
    await updateDoc(groupRef, { polls: updatedPolls });
  }
};

// 1. Update the Itemized Cart (For Food Lobbies)
export const updateGroupCart = async (groupId, cartItems) => {
  const groupRef = doc(db, 'groups', groupId);
  await updateDoc(groupRef, { cart: cartItems });
};

// 2. Pin a message to the top of the chat
export const setPinnedMessage = async (groupId, messageText, authorName) => {
  const groupRef = doc(db, 'groups', groupId);
  if (messageText) {
    await updateDoc(groupRef, { pinnedMessage: { text: messageText, author: authorName, pinnedAt: serverTimestamp() } });
  } else {
    // Unpin if null
    await updateDoc(groupRef, { pinnedMessage: null });
  }
};

// 3. Fetch simple stats for a user's "Trust Profile"
export const getUserStats = async (uid) => {
  // To keep it fast, we just query how many groups this user has created
  const { query, collection, getDocs, where } = await import('firebase/firestore');
  const q = query(collection(db, 'groups'), where('createdBy', '==', uid));
  const snap = await getDocs(q);
  return { hostedCount: snap.size };
};

// --- RESOURCE MANAGEMENT FUNCTIONS ---

export const deleteResource = async (groupId, resourceId) => {
  const groupRef = doc(db, 'groups', groupId);
  const groupSnap = await getDoc(groupRef);
  
  if (groupSnap.exists()) {
    const resources = groupSnap.data().resources || [];
    // Filter out the one we want to delete
    await updateDoc(groupRef, { resources: resources.filter(r => r.id !== resourceId) });
  }
};

export const updateResource = async (groupId, resourceId, newTitle, newUrl) => {
  const groupRef = doc(db, 'groups', groupId);
  const groupSnap = await getDoc(groupRef);
  
  if (groupSnap.exists()) {
    const resources = groupSnap.data().resources || [];
    // Map through and update the specific resource
    const updatedResources = resources.map(r => 
      r.id === resourceId ? { ...r, title: newTitle, url: newUrl } : r
    );
    await updateDoc(groupRef, { resources: updatedResources });
  }
};
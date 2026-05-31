import { Routes, Route } from 'react-router-dom';
import Home from '../pages/Home';
import CreateGroup from '../pages/CreateGroup';
import GroupLobby from '../pages/GroupLobby';
import Login from '../pages/Login';
import Register from '../pages/Register';
import Profile from '../pages/Profile'; // ADDED THIS IMPORT
import ProtectedRoute from '../components/auth/ProtectedRoute';

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
      <Route path="/" element={
        <ProtectedRoute>
          <Home />
        </ProtectedRoute>
      } />
      <Route path="/create" element={
        <ProtectedRoute>
          <CreateGroup />
        </ProtectedRoute>
      } />
      <Route path="/group/:id" element={
        <ProtectedRoute>
          <GroupLobby />
        </ProtectedRoute>
      } />
      {/* ADDED PROFILE ROUTE */}
      <Route path="/profile" element={
        <ProtectedRoute>
          <Profile />
        </ProtectedRoute>
      } />
    </Routes>
  );
}
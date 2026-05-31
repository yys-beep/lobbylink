import { BrowserRouter } from 'react-router-dom';
import Layout from './components/layout/Layout';
import AppRouter from './app/AppRouter';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext'; // ADD THIS

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        {/* WRAP LAYOUT WITH NOTIFICATION PROVIDER */}
        <NotificationProvider>
          <Layout>
            <AppRouter />
          </Layout>
        </NotificationProvider>
      </BrowserRouter>
    </AuthProvider>
  );
}
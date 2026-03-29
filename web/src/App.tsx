import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/auth.store';
import { useSocketStore } from './store/socket.store';
import { usersApi } from './api/users.api';

// Layout
import { AppShell } from './components/layout/AppShell';

// Auth pages
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { OAuthCallbackPage } from './pages/auth/OAuthCallbackPage';

// App pages
import { FeedPage } from './pages/feed/FeedPage';
import { EventsPage } from './pages/events/EventsPage';
import { EventDetailPage } from './pages/events/EventDetailPage';
import { CreateEventPage } from './pages/events/CreateEventPage';
import { ProfilePage } from './pages/profile/ProfilePage';
import { EditProfilePage } from './pages/profile/EditProfilePage';
import { MessagesPage } from './pages/messages/MessagesPage';
import { EbayPage } from './pages/ebay/EbayPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  const { isAuthenticated, setUser } = useAuthStore();
  const { connect } = useSocketStore();

  // Rehydrate user on page load if authenticated
  useEffect(() => {
    if (isAuthenticated) {
      usersApi.getMe().then((res) => setUser(res.data.data)).catch(() => {});
      connect();
    }
  }, [isAuthenticated]);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public auth routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/auth/callback" element={<OAuthCallbackPage />} />

        {/* Protected app routes */}
        <Route
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<Navigate to="/feed" replace />} />
          <Route path="/feed" element={<FeedPage />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/events/create" element={<CreateEventPage />} />
          <Route path="/events/:eventId" element={<EventDetailPage />} />
          <Route path="/profile/:userId" element={<ProfilePage />} />
          <Route path="/profile/edit" element={<EditProfilePage />} />
          <Route path="/messages" element={<MessagesPage />} />
          <Route path="/ebay" element={<EbayPage />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

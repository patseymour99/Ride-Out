import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../../store/auth.store';
import { usersApi } from '../../api/users.api';
import { useSocketStore } from '../../store/socket.store';
import { PageSpinner } from '../../components/ui/Spinner';

export function OAuthCallbackPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { setAuth } = useAuthStore();
  const { connect } = useSocketStore();

  useEffect(() => {
    const accessToken = params.get('accessToken');
    const refreshToken = params.get('refreshToken');

    if (!accessToken || !refreshToken) {
      navigate('/login?error=oauth_failed');
      return;
    }

    // Temporarily set tokens so the API call can work
    useAuthStore.setState({ accessToken, refreshToken, isAuthenticated: true });

    usersApi.getMe().then((res) => {
      setAuth(res.data.data, accessToken, refreshToken);
      connect();
      navigate('/feed');
    }).catch(() => {
      navigate('/login?error=oauth_failed');
    });
  }, []);

  return <PageSpinner />;
}

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../../api/auth.api';
import { usersApi } from '../../api/users.api';
import { useAuthStore } from '../../store/auth.store';
import { useSocketStore } from '../../store/socket.store';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

export function LoginPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const { connect } = useSocketStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await authApi.login(email, password);
      const { user, tokens } = res.data.data;
      setAuth(user as any, tokens.accessToken, tokens.refreshToken);
      const profileRes = await usersApi.getMe();
      setAuth(profileRes.data.data, tokens.accessToken, tokens.refreshToken);
      connect();
      navigate('/feed');
    } catch (err: any) {
      setError(err.response?.data?.error?.message ?? 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-brand-orange flex items-center justify-center">
              <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z" />
              </svg>
            </div>
            <span className="font-display font-bold text-3xl text-brand-text tracking-wider">RIDE-OUT</span>
          </div>
          <p className="text-brand-muted">The community for motorcycle riders</p>
        </div>

        <div className="card p-8">
          <h2 className="font-display text-2xl font-bold text-brand-text mb-6">Sign in</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <Button type="submit" className="w-full" loading={loading}>
              Sign in
            </Button>
          </form>

          <p className="text-center text-sm text-brand-muted mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-brand-orange hover:text-brand-orange-light transition-colors font-medium">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

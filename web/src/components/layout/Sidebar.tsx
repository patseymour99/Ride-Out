import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/auth.store';
import { Avatar } from '../ui/Avatar';

const navItems = [
  { to: '/feed', label: 'Feed', icon: HomeIcon },
  { to: '/events', label: 'Events', icon: CalendarIcon },
  { to: '/messages', label: 'Messages', icon: ChatIcon },
  { to: '/ebay', label: 'eBay', icon: EbayIcon },
];

export function Sidebar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="flex flex-col h-full bg-brand-surface border-r border-brand-border px-4 py-6">
      {/* Logo */}
      <div className="flex items-center gap-2 px-2 mb-8">
        <div className="w-8 h-8 rounded-lg bg-brand-orange flex items-center justify-center">
          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z" />
          </svg>
        </div>
        <span className="font-display font-bold text-xl text-brand-text tracking-wide">RIDE-OUT</span>
      </div>

      {/* Nav links */}
      <div className="flex flex-col gap-1 flex-1">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors duration-150 text-sm
              ${isActive
                ? 'bg-brand-orange/15 text-brand-orange'
                : 'text-brand-muted hover:text-brand-text hover:bg-brand-card'
              }`
            }
          >
            <Icon className="w-5 h-5 flex-shrink-0" />
            {label}
          </NavLink>
        ))}
      </div>

      {/* Profile link */}
      {user && (
        <div className="mt-4 pt-4 border-t border-brand-border">
          <NavLink
            to={`/profile/${user.id}`}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-brand-card transition-colors"
          >
            <Avatar
              src={user.profile?.avatarUrl}
              name={user.profile?.displayName}
              size="sm"
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-brand-text truncate">
                {user.profile?.displayName ?? 'Rider'}
              </p>
            </div>
          </NavLink>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-brand-muted hover:text-red-400 hover:bg-red-400/10 transition-colors text-sm mt-1"
          >
            <LogoutIcon className="w-5 h-5" />
            Sign out
          </button>
        </div>
      )}
    </nav>
  );
}

function HomeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  );
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}

function ChatIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  );
}

function EbayIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
    </svg>
  );
}

function LogoutIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  );
}

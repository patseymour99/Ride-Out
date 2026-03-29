import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useNotificationsStore } from '../../store/notifications.store';
import { useAuthStore } from '../../store/auth.store';
import { Avatar } from '../ui/Avatar';

export function TopBar() {
  const { unreadCount } = useNotificationsStore();
  const { user } = useAuthStore();

  return (
    <header className="flex items-center justify-between px-4 py-3 border-b border-brand-border bg-brand-surface lg:bg-brand-bg">
      {/* Mobile logo */}
      <Link to="/feed" className="flex items-center gap-2 lg:hidden">
        <div className="w-7 h-7 rounded-lg bg-brand-orange flex items-center justify-center">
          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z" />
          </svg>
        </div>
        <span className="font-display font-bold text-lg text-brand-text">RIDE-OUT</span>
      </Link>

      <div className="flex-1 lg:flex-none" />

      {/* Right actions */}
      <div className="flex items-center gap-3">
        {/* Notifications */}
        <Link
          to="/notifications"
          className="relative text-brand-muted hover:text-brand-text transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-brand-orange text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Link>

        {/* Profile */}
        {user && (
          <Link to={`/profile/${user.id}`}>
            <Avatar
              src={user.profile?.avatarUrl}
              name={user.profile?.displayName}
              size="sm"
            />
          </Link>
        )}
      </div>
    </header>
  );
}

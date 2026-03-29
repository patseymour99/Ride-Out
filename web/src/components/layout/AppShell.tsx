import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

export function AppShell() {
  return (
    <div className="flex h-screen bg-brand-bg overflow-hidden">
      {/* Sidebar — hidden on mobile */}
      <aside className="hidden lg:flex lg:flex-col w-64 flex-shrink-0">
        <Sidebar />
      </aside>

      {/* Main content */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-4 py-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

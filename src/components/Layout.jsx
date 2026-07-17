import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import BottomNav from './BottomNav';

export default function Layout({ darkMode, setDarkMode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-ink-50 dark:bg-ink-950">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Topbar darkMode={darkMode} setDarkMode={setDarkMode} />
        <main className="scroll-area flex-1 overflow-y-auto px-4 py-6 pb-24 lg:px-8 lg:py-8 lg:pb-8">
          <div className="mx-auto max-w-[1600px]">
            <Outlet />
          </div>
        </main>
      </div>
      <BottomNav darkMode={darkMode} setDarkMode={setDarkMode} />
    </div>
  );
}

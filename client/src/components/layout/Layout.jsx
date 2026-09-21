import React, { useState } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';

const Layout = ({ children, isConnected }) => {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg-deep)' }}>
      {/* Sidebar with Desktop & Mobile Drawer Support */}
      <Sidebar
        mobileOpen={mobileNavOpen}
        onCloseMobile={() => setMobileNavOpen(false)}
      />

      {/* Main App Canvas */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header
          isConnected={isConnected}
          onToggleMobileNav={() => setMobileNavOpen(prev => !prev)}
        />
        <main
          className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-5 md:p-6 page-enter"
          style={{ background: 'var(--bg-deep)' }}
        >
          <div className="max-w-7xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;

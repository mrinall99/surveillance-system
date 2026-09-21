import React from 'react';
import Header from './Header';
import Sidebar from './Sidebar';

const Layout = ({ children, isConnected }) => {
  return (
    <div className="flex h-screen overflow-hidden theme-transition" style={{ background: 'var(--bg-deep)' }}>
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header isConnected={isConnected} />
        <main className="flex-1 overflow-y-auto p-6 page-enter" style={{ background: 'var(--bg-deep)' }}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;

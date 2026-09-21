import React from 'react';
import Header from './Header';
import Sidebar from './Sidebar';

const Layout = ({ children, isConnected }) => {
  return (
    <div className="min-h-screen bg-[#080c14] flex text-slate-100 font-['Outfit',sans-serif]">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header isConnected={isConnected} />
        <main className="flex-1 p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;

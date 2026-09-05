import React from 'react';
import Sidebar from './Sidebar';
import '../../styles/grid-background.css';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="flex min-h-screen bg-white grid-bg">
      {/* Sidebar Navigation */}
      <Sidebar />
      
      {/* Main Panel */}
      <main className="flex-1 min-h-screen overflow-y-auto py-8 px-6 sm:px-10">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}

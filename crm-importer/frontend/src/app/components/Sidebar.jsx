'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  Settings, 
  Database, 
  PhoneCall, 
  LogOut,
  Sun,
  Moon,
  ChevronRight,
  Zap,
  MessageSquare,
  Target,
  MessageCircle,
  Phone,
  Sliders,
  Terminal,
  Building
} from 'lucide-react';
import { useTheme } from './ThemeContext';

export default function Sidebar({ active = 'dashboard' }) {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [user, setUser] = useState({ name: 'VK Test', role: 'OWNER' });

  useEffect(() => {
    const savedUser = localStorage.getItem('groweasy-user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (err) {
        // Fallback to default
      }
    }
  }, []);

  const handleSignOut = () => {
    localStorage.removeItem('groweasy-user');
    router.push('/login');
  };

  return (
    <aside className="w-68 bg-bg-sidebar border-r border-border-color flex flex-col flex-shrink-0 transition-colors duration-250 font-sans">
      
      {/* Sidebar Header Brand */}
      <div className="p-6 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center space-x-3">
          {/* Custom stair-like GrowEasy logo matching the reference image */}
          <div className="w-7 h-7 rounded-lg bg-black dark:bg-white flex items-center justify-center shadow-xs">
            <svg className="w-4 h-4 text-white dark:text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 20h18M3 20v-4h4v4M7 16v-4h4v4M11 12v-4h4v4M15 8V4h4v4" />
            </svg>
          </div>
          <span className="text-xl font-bold tracking-tight text-text-primary">GrowEasy</span>
        </div>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="text-text-secondary hover:text-text-primary p-1 rounded-lg hover:bg-bg-card-hover transition cursor-pointer"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>

      {/* User Card / Organization Selector */}
      <div className="mx-4 my-2 p-3 bg-bg-panel hover:bg-bg-card-hover border border-border-color rounded-2xl flex items-center justify-between cursor-pointer transition-colors duration-200 flex-shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center font-bold text-xs uppercase overflow-hidden">
             <div className="w-full h-full bg-gradient-to-tr from-teal-400 via-indigo-600 to-[#FA9B83]" />
          </div>
          <div>
            <p className="text-sm font-extrabold text-text-primary">{user.name || 'Test Corp'}</p>
            <p className="text-[10px] text-text-secondary font-bold uppercase tracking-wider">{user.role || 'OWNER'}</p>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-text-secondary" />
      </div>

      {/* Nav Links */}
      <nav className="flex-1 overflow-y-auto px-4 py-2 space-y-6">
        {/* MAIN SECTION */}
        <div>
          <p className="px-3 text-[11px] font-bold text-text-secondary/70 tracking-wider uppercase mb-2">Main</p>
          <ul className="space-y-1">
            <li>
              <button className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-text-secondary hover:bg-bg-card-hover hover:text-text-primary transition text-left cursor-pointer">
                <LayoutDashboard className="w-4.5 h-4.5" />
                <span>Dashboard</span>
              </button>
            </li>
            <li>
              <button className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-text-secondary hover:bg-bg-card-hover hover:text-text-primary transition text-left cursor-pointer">
                <Zap className="w-4.5 h-4.5" />
                <span>Generate Leads</span>
              </button>
            </li>
            <li>
              <button
                onClick={() => router.push('/')}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-bold transition text-left cursor-pointer
                  ${active === 'dashboard' 
                    ? 'bg-teal-500/10 text-teal-700 dark:text-teal-400 border border-teal-500/15 dark:border-teal-500/25' 
                    : 'text-text-secondary hover:bg-bg-card-hover hover:text-text-primary'
                  }`}
              >
                <Database className="w-4.5 h-4.5" />
                <span>Manage Leads</span>
              </button>
            </li>
            <li>
              <button className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-text-secondary hover:bg-bg-card-hover hover:text-text-primary transition text-left cursor-pointer">
                <MessageSquare className="w-4.5 h-4.5" />
                <span>Engage Leads</span>
              </button>
            </li>
          </ul>
        </div>

        {/* CONTROL CENTER SECTION */}
        <div>
          <p className="px-3 text-[11px] font-bold text-text-secondary/70 tracking-wider uppercase mb-2">Control Center</p>
          <ul className="space-y-1">
            <li>
              <button className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-text-secondary hover:bg-bg-card-hover hover:text-text-primary transition text-left cursor-pointer">
                <Users className="w-4.5 h-4.5" />
                <span>Team Members</span>
              </button>
            </li>
            <li>
              <button className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-text-secondary hover:bg-bg-card-hover hover:text-text-primary transition text-left cursor-pointer">
                <Database className="w-4.5 h-4.5" />
                <span>Lead Sources</span>
              </button>
            </li>
            <li>
              <button className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-text-secondary hover:bg-bg-card-hover hover:text-text-primary transition text-left cursor-pointer">
                <Target className="w-4.5 h-4.5" />
                <span>Ad Accounts</span>
              </button>
            </li>
            <li>
              <button className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-text-secondary hover:bg-bg-card-hover hover:text-text-primary transition text-left cursor-pointer">
                <MessageCircle className="w-4.5 h-4.5" />
                <span>WhatsApp Account</span>
              </button>
            </li>
            <li>
              <button className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-text-secondary hover:bg-bg-card-hover hover:text-text-primary transition text-left cursor-pointer">
                <Phone className="w-4.5 h-4.5" />
                <span>Tele Calling</span>
              </button>
            </li>
            <li>
              <button className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-text-secondary hover:bg-bg-card-hover hover:text-text-primary transition text-left cursor-pointer">
                <Sliders className="w-4.5 h-4.5" />
                <span>CRM Fields</span>
              </button>
            </li>
            <li>
              <button className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-text-secondary hover:bg-bg-card-hover hover:text-text-primary transition text-left cursor-pointer">
                <Terminal className="w-4.5 h-4.5" />
                <span>API Center</span>
              </button>
            </li>
            <li>
              <button
                onClick={() => router.push('/settings')}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-bold transition text-left cursor-pointer
                  ${active === 'settings' 
                    ? 'bg-teal-500/10 text-teal-700 dark:text-teal-400 border border-teal-500/15 dark:border-teal-500/25' 
                    : 'text-text-secondary hover:bg-bg-card-hover hover:text-text-primary'
                  }`}
              >
                <Settings className="w-4.5 h-4.5" />
                <span>CRM Settings</span>
              </button>
            </li>
          </ul>
        </div>
      </nav>

      {/* Business Center Bottom Action */}
      <div className="px-4 py-2 border-t border-border-color bg-bg-panel/10 flex-shrink-0">
        <button className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-text-secondary hover:bg-bg-card-hover hover:text-text-primary transition text-left cursor-pointer">
          <Building className="w-4.5 h-4.5" />
          <span>Business Center</span>
        </button>
      </div>

      {/* Sign Out Button at bottom */}
      <div className="p-4 border-t border-border-color bg-bg-panel/10 flex-shrink-0">
        <button
          onClick={handleSignOut}
          className="w-full flex items-center justify-center space-x-2 px-3 py-2 rounded-xl text-sm font-semibold text-rose-500 hover:bg-rose-550/10 hover:text-rose-400 border border-transparent hover:border-rose-900/30 transition cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}

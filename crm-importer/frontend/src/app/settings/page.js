'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Settings, 
  User, 
  Trash2, 
  CheckCircle, 
  Sun, 
  Moon,
  Info,
  Database
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { useTheme } from '../components/ThemeContext';

export default function SettingsPage() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [name, setName] = useState('VK Test');
  const [role, setRole] = useState('OWNER');
  
  const [cacheCount, setCacheCount] = useState(0);
  const [leadsCount, setLeadsCount] = useState(0);
  const [successMsg, setSuccessMsg] = useState('');
  
  // Guard route
  useEffect(() => {
    const userStr = localStorage.getItem('groweasy-user');
    if (!userStr) {
      router.push('/login');
    } else {
      setIsAuthenticated(true);
      try {
        const user = JSON.parse(userStr);
        setName(user.name || 'VK Test');
        setRole(user.role || 'OWNER');
      } catch (err) {
        // use defaults
      }
    }

    // Read cache counts
    countSavedSchemas();
    countImportedLeads();
  }, [router]);

  const countSavedSchemas = () => {
    let count = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('mapping-schema-')) {
        count++;
      }
    }
    setCacheCount(count);
  };

  const countImportedLeads = () => {
    const savedLeads = localStorage.getItem('groweasy-leads');
    if (savedLeads) {
      try {
        const parsed = JSON.parse(savedLeads);
        setLeadsCount(parsed.length || 0);
        return;
      } catch (e) {}
    }
    setLeadsCount(0);
  };

  const handleClearLeads = () => {
    localStorage.removeItem('groweasy-leads');
    localStorage.removeItem('groweasy-skipped-leads');
    localStorage.removeItem('groweasy-import-stats');
    setLeadsCount(0);
    setSuccessMsg('All imported leads cleared successfully!');
    setTimeout(() => {
      setSuccessMsg('');
      window.location.reload();
    }, 1500);
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    setSuccessMsg('');

    const savedUser = localStorage.getItem('groweasy-user');
    if (savedUser) {
      try {
        const userObj = JSON.parse(savedUser);
        userObj.name = name;
        userObj.role = role;
        localStorage.setItem('groweasy-user', JSON.stringify(userObj));
        
        // Dispatch storage event to trigger sidebar refresh if needed, 
        // or simple reload for immediate synchronization
        setSuccessMsg('Profile settings updated successfully!');
        setTimeout(() => {
          setSuccessMsg('');
          window.location.reload();
        }, 1500);
      } catch (err) {
        // handle error
      }
    }
  };

  const handleClearCache = () => {
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('mapping-schema-')) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach(key => localStorage.removeItem(key));
    setCacheCount(0);
    setSuccessMsg('Saved mapping templates cache cleared successfully!');
    setTimeout(() => setSuccessMsg(''), 2000);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-bg-app flex items-center justify-center text-text-secondary text-sm">
        Authenticating...
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-bg-app overflow-hidden text-text-primary transition-colors duration-250">
      
      {/* Sidebar navigation */}
      <Sidebar active="settings" />

      {/* Settings Panel */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        
        <header className="border-b border-border-color px-8 py-5 flex-shrink-0 bg-bg-sidebar/40">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-text-primary">CRM Settings</h1>
              <p className="text-xs text-text-secondary mt-1">Configure your user profile, Delimiter preferences, and clear schema templates cache.</p>
            </div>
          </div>
        </header>

        <div className="flex-1 p-8 max-w-4xl space-y-6">
          
          {successMsg && (
            <div className="flex items-center space-x-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl text-xs font-semibold animate-slideDown">
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Form Section: User Profile */}
            <div className="bg-bg-panel border border-border-color rounded-2xl p-6 shadow-sm transition-colors duration-250">
              <h3 className="text-sm font-bold text-text-primary mb-4 flex items-center">
                <User className="w-4 h-4 mr-2 text-indigo-400" />
                User Profile Settings
              </h3>
              
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-secondary">Display Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-input-bg border border-input-border text-text-primary rounded-xl text-xs focus:ring-1 focus:ring-[#FA9B83] focus:border-[#FA9B83] focus:outline-none transition"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-secondary">Organization Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full p-2.5 bg-input-bg border border-input-border text-text-primary rounded-xl text-xs focus:ring-1 focus:ring-[#FA9B83] focus:border-[#FA9B83] focus:outline-none transition"
                  >
                    <option value="OWNER">Owner / Admin</option>
                    <option value="SALES_REPRESENTATIVE">Sales Rep</option>
                    <option value="MARKETING_MANAGER">Marketing Manager</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#FA9B83] hover:bg-[#FA9B83]/90 text-slate-950 font-bold py-2.5 rounded-xl text-xs transition duration-200 cursor-pointer"
                >
                  Save Changes
                </button>
              </form>
            </div>

            {/* Config Section: Mappings & System */}
            <div className="space-y-6">
              
              {/* Mapping cache card */}
              <div className="bg-bg-panel border border-border-color rounded-2xl p-6 shadow-sm transition-colors duration-250">
                <h3 className="text-sm font-bold text-text-primary mb-2 flex items-center">
                  <Database className="w-4 h-4 mr-2 text-indigo-400" />
                  Saved Mappings Cache
                </h3>
                <p className="text-xs text-text-secondary leading-relaxed">
                  GrowEasy automatically saves mapped layouts to skip AI mapping next time a CSV with identical columns is imported.
                </p>

                <div className="my-5 p-3.5 bg-bg-app border border-border-color rounded-xl flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-text-primary">{cacheCount} Layouts</p>
                    <p className="text-xs text-text-secondary">Currently cached schemas</p>
                  </div>
                  
                  <button
                    onClick={handleClearCache}
                    disabled={cacheCount === 0}
                    className="flex items-center space-x-1.5 px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 disabled:opacity-40 text-rose-500 rounded-xl text-xs font-semibold transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear Cache</span>
                  </button>
                </div>
              </div>

              {/* Leads Database Control */}
              <div className="bg-bg-panel border border-border-color rounded-2xl p-6 shadow-sm transition-colors duration-250">
                <h3 className="text-sm font-bold text-text-primary mb-2 flex items-center">
                  <Database className="w-4 h-4 mr-2 text-indigo-400" />
                  Clear Leads Database
                </h3>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Permanently delete all imported and skipped leads from your local CRM browser database.
                </p>

                <div className="my-5 p-3.5 bg-bg-app border border-border-color rounded-xl flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-text-primary">{leadsCount} Leads</p>
                    <p className="text-xs text-text-secondary">Stored locally</p>
                  </div>
                  
                  <button
                    onClick={handleClearLeads}
                    disabled={leadsCount === 0}
                    className="flex items-center space-x-1.5 px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 disabled:opacity-40 text-rose-500 rounded-xl text-xs font-semibold transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear Leads</span>
                  </button>
                </div>
              </div>

              {/* Theme Settings Card */}
              <div className="bg-bg-panel border border-border-color rounded-2xl p-6 shadow-sm transition-colors duration-250">
                <h3 className="text-sm font-bold text-text-primary mb-2 flex items-center">
                  {theme === 'dark' ? <Moon className="w-4 h-4 mr-2 text-indigo-400" /> : <Sun className="w-4 h-4 mr-2 text-indigo-400" />}
                  Theme Configuration
                </h3>
                <p className="text-xs text-text-secondary leading-relaxed mb-4">
                  Select your workspace display appearance.
                </p>

                <button
                  onClick={toggleTheme}
                  className="w-full flex items-center justify-center space-x-2 py-2.5 border border-border-color hover:bg-bg-card-hover rounded-xl text-xs font-semibold text-text-primary transition cursor-pointer"
                >
                  {theme === 'dark' ? (
                    <>
                      <Sun className="w-4 h-4 text-[#FA9B83]" />
                      <span>Switch to Light Mode</span>
                    </>
                  ) : (
                    <>
                      <Moon className="w-4 h-4 text-[#FA9B83]" />
                      <span>Switch to Dark Mode</span>
                    </>
                  )}
                </button>
              </div>

            </div>

          </div>

          {/* Info disclaimer */}
          <div className="flex items-start space-x-3 bg-indigo-500/5 border border-indigo-500/10 p-4.5 rounded-2xl text-text-secondary text-xs leading-relaxed max-w-2xl">
            <Info className="w-4.5 h-4.5 mt-0.5 text-indigo-400 flex-shrink-0" />
            <div>
              <p className="font-bold text-text-primary">System Architecture Information</p>
              <p className="mt-1">
                The GrowEasy CRM Importer runs client-side settings dynamically. The authentication, themes, and CSV mapping layouts are maintained inside browser storage, ensuring instant loading states and local configurations persistence.
              </p>
            </div>
          </div>

        </div>
      </main>

    </div>
  );
}

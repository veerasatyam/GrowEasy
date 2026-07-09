'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  Settings, 
  Database, 
  Search, 
  RefreshCw, 
  Upload, 
  FileDown, 
  FileSpreadsheet,
  PhoneCall, 
  CheckCircle, 
  AlertTriangle,
  Building,
  Info,
  X,
  Trash2
} from 'lucide-react';
import Modal from './components/Modal';
import Sidebar from './components/Sidebar';
import Drawer from './components/Drawer';

// Helper to extract count of extra contacts from lead crm_note and description
const getExtraCount = (lead, type) => {
  if (!lead) return 0;
  const crmNoteVal = lead.crm_note || "";
  const descVal = lead.description || "";
  const combinedText = `${crmNoteVal} ${descVal}`;

  if (type === 'Emails') {
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const foundEmails = combinedText.match(emailRegex) || [];
    const primaryEmail = (lead.email || "").toLowerCase().trim();
    const uniqueExtras = [...new Set(
      foundEmails
        .map(e => e.toLowerCase().trim())
        .filter(e => e !== primaryEmail)
    )];
    return uniqueExtras.length;
  } else if (type === 'Phone Numbers') {
    const phoneRegex = /(?:\+?\d{1,3}[\s-]?)?\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{4}|\+?\d{10,15}/g;
    const foundPhones = combinedText.match(phoneRegex) || [];
    const cleanPhone = (p) => p.replace(/[^\d]/g, '');
    const primaryPhone = cleanPhone(lead.mobile_without_country_code || "");
    const uniqueExtras = [...new Set(
      foundPhones
        .map(p => cleanPhone(p))
        .filter(p => p.length >= 10 && p.length <= 15 && p !== primaryPhone)
    )];
    return uniqueExtras.length;
  }
  return 0;
};

// Sample leads matching the prompt's CRM records to avoid empty states
const INITIAL_LEADS = [];

export default function Dashboard() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const user = localStorage.getItem('groweasy-user');
    if (!user) {
      router.push('/login');
    } else {
      setIsAuthenticated(true);
    }
  }, [router]);

  const [leads, setLeads] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('groweasy-leads');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {}
      }
    }
    return INITIAL_LEADS;
  });

  const [skippedLeads, setSkippedLeads] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('groweasy-skipped-leads');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {}
      }
    }
    return [];
  });

  const [importStats, setImportStats] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('groweasy-import-stats');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {}
      }
    }
    return null;
  });

  useEffect(() => {
    localStorage.setItem('groweasy-leads', JSON.stringify(leads));
  }, [leads]);

  useEffect(() => {
    localStorage.setItem('groweasy-skipped-leads', JSON.stringify(skippedLeads));
  }, [skippedLeads]);

  useEffect(() => {
    if (importStats) {
      localStorage.setItem('groweasy-import-stats', JSON.stringify(importStats));
    } else {
      localStorage.removeItem('groweasy-import-stats');
    }
  }, [importStats]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('success'); // 'success' or 'skipped'
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setSearchQuery('');
    setTimeout(() => {
      setIsRefreshing(false);
    }, 750);
  };

  const handleClearAll = () => {
    if (window.confirm("Are you sure you want to clear all imported leads from this dashboard?")) {
      setLeads([]);
      setSkippedLeads([]);
      setImportStats(null);
    }
  };

  const [selectedLead, setSelectedLead] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Compute overall dashboard statistics
  const computedStats = useMemo(() => {
    const total = leads.length;
    const closed = leads.filter(l => l.crm_status === 'SALE_DONE').length;
    const convertedPercent = total > 0 ? Math.round((closed / total) * 100) : 0;
    
    // Data completeness health score (has BOTH email and phone)
    const completeLeads = leads.filter(l => l.email && l.mobile_without_country_code).length;
    const healthScore = total > 0 ? Math.round((completeLeads / total) * 100) : 0;

    // Standard column counts mapped
    const columnCount = leads.length > 0 ? 15 : 0;
    
    return {
      total,
      convertedPercent,
      healthScore,
      columnCount
    };
  }, [leads]);

  const handleImportComplete = (result) => {
    // Append newly parsed leads to current dashboard list
    if (result.imported && result.imported.length > 0) {
      setLeads(prev => [...result.imported, ...prev]);
    }
    
    if (result.skipped) {
      setSkippedLeads(result.skipped);
    }
    
    setImportStats({
      totalImported: result.totalImported || 0,
      totalSkipped: result.totalSkipped || 0
    });
    
    setActiveTab(result.totalImported > 0 ? 'success' : 'skipped');
  };

  const handleResetStats = () => {
    setImportStats(null);
    setSkippedLeads([]);
  };

  // Export transformed dataset to JSON
  const handleExportJSON = () => {
    const dataStr = JSON.stringify(leads, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', 'groweasy_crm_leads.json');
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Export transformed dataset to CSV
  const handleExportCSV = () => {
    if (leads.length === 0) return;
    
    const headers = Object.keys(leads[0]).join(',');
    const rows = leads.map(lead => {
      return Object.values(lead).map(val => {
        // Escape quotes and wrap commas in quotes
        const escaped = String(val).replace(/"/g, '""');
        return `"${escaped}"`;
      }).join(',');
    }).join('\n');

    const csvContent = `${headers}\n${rows}`;
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', 'groweasy_crm_leads.csv');
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Filter leads based on search query
  const filteredLeads = leads.filter(lead => {
    const name = lead.name ? lead.name.toLowerCase() : '';
    const email = lead.email ? lead.email.toLowerCase() : '';
    const contact = (lead.country_code + lead.mobile_without_country_code).toLowerCase();
    const query = searchQuery.toLowerCase();
    
    return name.includes(query) || email.includes(query) || contact.includes(query);
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'GOOD_LEAD_FOLLOW_UP':
        return (
          <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/25 rounded-full font-bold text-xs">
            Good Lead
          </span>
        );
      case 'DID_NOT_CONNECT':
        return (
          <span className="px-2.5 py-1 bg-slate-500/10 text-slate-700 dark:text-slate-400 border border-slate-200 dark:border-slate-800 rounded-full font-bold text-xs">
            Not Dialed
          </span>
        );
      case 'BAD_LEAD':
        return (
          <span className="px-2.5 py-1 bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/25 rounded-full font-bold text-xs">
            Bad Lead
          </span>
        );
      case 'SALE_DONE':
        return (
          <span className="px-2.5 py-1 bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/25 rounded-full font-bold text-xs">
            Sale Done
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 bg-slate-500/10 text-slate-700 dark:text-slate-400 border border-slate-200 dark:border-border-color rounded-full font-bold text-xs">
            {status}
          </span>
        );
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-bg-app flex items-center justify-center text-text-secondary text-sm">
        Authenticating...
      </div>
    );
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }) + `, ${date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })}`;
  };

  return (
    <div className="flex h-screen bg-bg-app overflow-hidden text-text-primary transition-colors duration-250">
      
      {/* Reusable Sidebar Navigation */}
      <Sidebar active="dashboard" />

      {/* Main Panel */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden bg-slate-50/50 dark:bg-bg-app">
        
        {/* Main Panel Content (Seamless layout matching mockup) */}
        <div className="flex-1 flex flex-col p-8 space-y-4 overflow-hidden">
          
          {/* Header section (title & subtitle in canvas flow) */}
          <div className="flex items-center justify-between flex-shrink-0">
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-text-primary">Manage Your Leads</h1>
              <p className="text-sm text-text-secondary mt-1 font-medium">Monitor lead status, assign tasks, and close deals faster.</p>
            </div>

            <div>
              <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center space-x-2 bg-[#FA9B83] hover:bg-[#FA9B83]/90 text-slate-955 font-bold px-4 py-2.5 rounded-xl text-xs transition duration-200 shadow-md shadow-coral-950/10 cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span>Import leads CSV</span>
              </button>
            </div>
          </div>

          {/* Dashboard Stats Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-slideDown flex-shrink-0">
            {/* Total Leads */}
            <div className="bg-bg-panel border border-border-color p-4 rounded-2xl shadow-xs hover:border-teal-500/30 transition duration-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-text-secondary tracking-wider uppercase">Active Leads</span>
                <div className="p-1.5 bg-indigo-500/10 text-indigo-400 rounded-lg">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-extrabold text-text-primary mt-2">{computedStats.total}</p>
              <p className="text-xs text-text-secondary mt-1 font-medium">Total active rows synced</p>
            </div>

            {/* Sales Conversion */}
            <div className="bg-bg-panel border border-border-color p-4 rounded-2xl shadow-xs hover:border-teal-500/30 transition duration-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-text-secondary tracking-wider uppercase">Conversion</span>
                <div className="p-1.5 bg-emerald-500/10 text-emerald-400 rounded-lg">
                  <CheckCircle className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-extrabold text-text-primary mt-2">{computedStats.convertedPercent}%</p>
              <p className="text-xs text-text-secondary mt-1 font-medium">Leads with status SALE_DONE</p>
            </div>

            {/* Data Health completeness */}
            <div className="bg-bg-panel border border-border-color p-4 rounded-2xl shadow-xs hover:border-teal-500/30 transition duration-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-text-secondary tracking-wider uppercase">Data Health</span>
                <div className="p-1.5 bg-amber-500/10 text-amber-500 rounded-lg">
                  <AlertTriangle className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-extrabold text-text-primary mt-2">{computedStats.healthScore}%</p>
              <p className="text-xs text-text-secondary mt-1 font-medium">Leads with email & phone</p>
            </div>

            {/* Mapped columns */}
            <div className="bg-bg-panel border border-border-color p-4 rounded-2xl shadow-xs hover:border-teal-500/30 transition duration-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-text-secondary tracking-wider uppercase">CRM Fields</span>
                <div className="p-1.5 bg-purple-500/10 text-purple-400 rounded-lg">
                  <Settings className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-extrabold text-text-primary mt-2">{computedStats.columnCount} Mapped</p>
              <p className="text-xs text-text-secondary mt-1 font-medium">Normalized schema headers</p>
            </div>
          </div>

          {/* Import Stats Alert Panel */}
          {importStats && (
            <div className="bg-bg-panel border border-border-color p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 animate-slideDown flex-shrink-0">
              <div className="flex items-start space-x-3.5">
                <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl">
                  <CheckCircle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-text-primary">Import Complete</h4>
                  <p className="text-xs text-text-secondary mt-0.5 font-medium">
                    OpenAI processed the batch successfully. Imported <span className="text-emerald-400 font-bold">{importStats.totalImported} leads</span>, skipped <span className="text-rose-550 font-bold">{importStats.totalSkipped} invalid records</span>.
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                {skippedLeads.length > 0 && (
                  <div className="flex bg-bg-app border border-border-color rounded-xl p-0.5">
                    <button
                      onClick={() => setActiveTab('success')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${activeTab === 'success' ? 'bg-[#FA9B83] text-slate-950 font-bold' : 'text-text-secondary hover:text-text-primary'}`}
                    >
                      Imported ({importStats.totalImported})
                    </button>
                    <button
                      onClick={() => setActiveTab('skipped')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${activeTab === 'skipped' ? 'bg-[#FA9B83] text-slate-950 font-bold' : 'text-text-secondary hover:text-text-primary'}`}
                    >
                      Skipped ({importStats.totalSkipped})
                    </button>
                  </div>
                )}
                
                <button
                  onClick={handleResetStats}
                  className="p-1.5 bg-bg-panel hover:bg-bg-card-hover border border-border-color text-text-secondary hover:text-text-primary rounded-xl transition cursor-pointer"
                  title="Clear import summary banner"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Table Header: Section Title on Left, Custom Search bar on Right */}
          <div className="flex items-center justify-between pt-2 flex-shrink-0">
            <h2 className="text-lg font-bold tracking-tight text-text-primary">Your Leads</h2>
            
            {activeTab === 'success' && (
              <div className="flex items-center space-x-3">
                {/* Search Bar matching GrowEasy mockup */}
                <div className="flex items-center bg-bg-panel border border-border-color rounded-xl overflow-hidden focus-within:ring-1 focus-within:ring-teal-600 focus-within:border-teal-600 shadow-2xs transition-all">
                  <input
                    type="text"
                    placeholder="Enter email or phone number..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-64 px-4 py-2 bg-transparent text-text-primary text-sm focus:outline-none"
                  />
                  <button className="bg-[#115e59] hover:bg-[#134e4a] text-white p-2.5 transition flex items-center justify-center cursor-pointer">
                    <Search className="w-4.5 h-4.5" />
                  </button>
                </div>

                {/* Reset Search / Refresh */}
                <button 
                  onClick={handleRefresh}
                  className="p-2.5 bg-bg-panel hover:bg-bg-card-hover border border-border-color text-text-secondary hover:text-text-primary rounded-xl transition cursor-pointer shadow-2xs group"
                  title="Reset Search"
                >
                  <RefreshCw className={`w-4 h-4 transition-transform duration-500 group-hover:rotate-180 ${isRefreshing ? 'animate-spin' : ''}`} />
                </button>

                {/* Exports */}
                <button
                  onClick={handleExportJSON}
                  disabled={leads.length === 0}
                  className="flex items-center space-x-2 bg-bg-panel hover:bg-bg-card-hover border border-border-color text-text-secondary hover:text-text-primary font-bold text-xs px-3.5 py-2.5 rounded-xl disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer shadow-2xs"
                >
                  <FileDown className="w-4 h-4" />
                  <span>JSON</span>
                </button>
                <button
                  onClick={handleExportCSV}
                  disabled={leads.length === 0}
                  className="flex items-center space-x-2 bg-bg-panel hover:bg-bg-card-hover border border-border-color text-text-secondary hover:text-text-primary font-bold text-xs px-3.5 py-2.5 rounded-xl disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer shadow-2xs"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>CSV</span>
                </button>

                {/* Clear Leads */}
                <button
                  onClick={handleClearAll}
                  disabled={leads.length === 0 && skippedLeads.length === 0}
                  className="flex items-center space-x-1.5 bg-rose-500/10 hover:bg-rose-500/25 border border-rose-500/20 hover:border-rose-500/35 text-rose-500 font-bold text-xs px-3 py-2.5 rounded-xl disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer shadow-2xs"
                  title="Clear All Leads"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear</span>
                </button>
              </div>
            )}
          </div>

          {/* Active Tab: Successfully Imported leads */}
          {activeTab === 'success' && (
            <div className="flex-1 overflow-hidden flex flex-col min-h-0 border border-border-color bg-bg-panel rounded-2xl shadow-xs transition-colors duration-250">
              <div className="flex-1 overflow-auto min-h-0">
                <table className="min-w-full divide-y divide-border-color/60 text-left text-sm">
                  <thead className="bg-bg-table-header text-text-secondary uppercase tracking-wider font-bold text-xs border-b border-border-color sticky top-0 z-20">
                    <tr>
                      <th className="px-4 py-3.5 sticky top-0 bg-bg-table-header z-10">Lead Name</th>
                      <th className="px-4 py-3.5 sticky top-0 bg-bg-table-header z-10">Email</th>
                      <th className="px-4 py-3.5 sticky top-0 bg-bg-table-header z-10">Contact</th>
                      <th className="px-4 py-3.5 sticky top-0 bg-bg-table-header z-10">Date Created</th>
                      <th className="px-4 py-3.5 sticky top-0 bg-bg-table-header z-10">Company</th>
                      <th className="px-4 py-3.5 sticky top-0 bg-bg-table-header z-10">Status</th>
                      <th className="px-4 py-3.5 sticky top-0 bg-bg-table-header z-10 text-center">Quality</th>
                      <th className="px-4 py-3.5 sticky top-0 bg-bg-table-header z-10 text-center">LE/</th>
                      <th className="px-4 py-3.5 sticky top-0 bg-bg-table-header z-10 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-color/60 text-text-primary bg-bg-panel/10">
                    {filteredLeads.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="px-4 py-12 text-center text-text-secondary italic">
                          No matching leads found. Get started by importing a CSV file.
                        </td>
                      </tr>
                    ) : (
                      filteredLeads.map((lead, idx) => (
                        <tr key={idx} className="hover:bg-bg-table-row-hover transition duration-150">
                          <td className="px-4 py-4 font-bold text-text-primary max-w-[150px] truncate text-sm">
                            {lead.name}
                          </td>
                          <td className="px-4 py-4 max-w-[200px] truncate text-text-secondary text-sm">
                            <div className="flex items-center space-x-1.5 min-w-0">
                              <span className="truncate">{lead.email || <span className="text-text-secondary/40 italic text-xs">—</span>}</span>
                              {getExtraCount(lead, 'Emails') > 0 && (
                                <span className="flex-shrink-0 px-1.5 py-0.5 bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 text-[10px] font-bold rounded" title={`${getExtraCount(lead, 'Emails')} extra email(s) found`}>
                                  +{getExtraCount(lead, 'Emails')}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-4 text-text-secondary text-sm">
                            <div className="flex items-center space-x-1.5">
                              {lead.mobile_without_country_code ? (
                                <span>{lead.country_code} {lead.mobile_without_country_code}</span>
                              ) : (
                                <span className="text-text-secondary/40 italic text-xs">—</span>
                              )}
                              {getExtraCount(lead, 'Phone Numbers') > 0 && (
                                <span className="px-1.5 py-0.5 bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 text-[10px] font-bold rounded" title={`${getExtraCount(lead, 'Phone Numbers')} extra phone(s) found`}>
                                  +{getExtraCount(lead, 'Phone Numbers')}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-4 text-text-secondary/70 text-sm">
                            {formatDate(lead.created_at)}
                          </td>
                          <td className="px-4 py-4 max-w-[120px] truncate text-text-secondary text-sm">
                            {lead.company || <span className="text-text-secondary/40">—</span>}
                          </td>
                          <td className="px-4 py-4 text-sm">
                            {getStatusBadge(lead.crm_status)}
                          </td>
                          {/* Quality placeholder column matching reference mockup */}
                          <td className="px-4 py-4 text-center text-text-secondary/50 text-sm">
                            —
                          </td>
                          {/* LE/ (Lead Owner initial tag) matching reference mockup */}
                          <td className="px-4 py-4 text-center text-sm">
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-500/10 text-text-secondary border border-border-color text-xs font-bold">
                              {lead.lead_owner ? lead.lead_owner[0].toUpperCase() : '—'}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-center text-sm">
                            <button 
                              className="text-text-secondary hover:text-text-primary hover:underline px-3 py-1 rounded-lg border border-border-color bg-bg-panel hover:bg-bg-card-hover text-xs font-bold transition cursor-pointer shadow-2xs"
                              onClick={() => {
                                setSelectedLead(lead);
                                setIsDrawerOpen(true);
                              }}
                            >
                              More &gt;
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Load More Centered Action Button matching reference mockup */}
              {filteredLeads.length > 0 && (
                <div className="flex justify-center py-3 border-t border-border-color/40 bg-bg-panel/10 flex-shrink-0">
                  <button className="px-6 py-2 border border-border-color bg-bg-panel hover:bg-bg-card-hover text-[#115e59] dark:text-[#5eead4] font-bold text-xs rounded-full transition cursor-pointer shadow-2xs">
                    Load more
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Active Tab: Skipped Leads Table */}
          {activeTab === 'skipped' && skippedLeads.length > 0 && (
            <div className="flex-1 flex flex-col min-h-0 space-y-3 overflow-hidden animate-slideDown">
              <div className="flex justify-between items-center px-1 flex-shrink-0">
                <span className="text-xs font-semibold text-rose-500 flex items-center">
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Inspection Pane: Skipped Leads (Failed Rule: Contains neither email nor mobile)
                </span>
              </div>
              
              <div className="flex-1 overflow-hidden flex flex-col min-h-0 border border-border-color bg-bg-panel rounded-2xl shadow-xs transition-colors duration-250">
                <div className="flex-1 overflow-auto min-h-0">
                  <table className="min-w-full divide-y divide-border-color/60 text-left text-xs">
                    <thead className="bg-rose-500/5 text-rose-555 uppercase tracking-wider font-semibold border-b border-border-color sticky top-0 z-20">
                      <tr>
                        <th className="px-4 py-3 sticky top-0 bg-bg-panel dark:bg-rose-950/50 z-10">Lead Identifier</th>
                        <th className="px-4 py-3 sticky top-0 bg-bg-panel dark:bg-rose-950/50 z-10">Skip Reason</th>
                        <th className="px-4 py-3 sticky top-0 bg-bg-panel dark:bg-rose-950/50 z-10">Source Row Object</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-color/60 text-text-primary bg-bg-panel/10">
                      {skippedLeads.map((skippedItem, idx) => (
                        <tr key={idx} className="hover:bg-rose-500/5 transition">
                          <td className="px-4 py-2.5 font-bold text-text-primary">
                            {skippedItem.name}
                          </td>
                          <td className="px-4 py-2.5">
                            <span className="px-2 py-0.5 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded font-medium text-xs">
                              {skippedItem.reason}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 max-w-xl truncate text-text-secondary font-mono text-xs">
                            {JSON.stringify(skippedItem.details)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* Lead inspect Drawer */}
      <Drawer 
        lead={selectedLead}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />

      {/* Upload CSV Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onImportComplete={handleImportComplete} 
      />

    </div>
  );
}

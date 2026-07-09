'use client';

import React, { useEffect } from 'react';
import { 
  X, 
  Mail, 
  Phone, 
  MapPin, 
  Building, 
  Calendar, 
  FileText, 
  User, 
  Tag, 
  Clock, 
  ShieldAlert,
  ClipboardCopy,
  Check
} from 'lucide-react';

export default function Drawer({ lead, isOpen, onClose }) {
  const [copiedField, setCopiedField] = React.useState('');

  // Close drawer on ESC key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden'; // Lock body scroll when drawer is open
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !lead) return null;

  // Dynamic regex parsing to extract secondary emails and phone numbers from CRM notes & description
  const crmNoteVal = lead.crm_note || "";
  const descVal = lead.description || "";
  const combinedText = `${crmNoteVal} ${descVal}`;

  // 1. Extract all email addresses
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const foundEmails = combinedText.match(emailRegex) || [];
  const primaryEmail = (lead.email || "").toLowerCase().trim();
  const extraEmails = [...new Set(
    foundEmails
      .map(e => e.toLowerCase().trim())
      .filter(e => e !== primaryEmail)
  )];

  // 2. Extract all phone numbers
  const phoneRegex = /(?:\+?\d{1,3}[\s-]?)?\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{4}|\+?\d{10,15}/g;
  const foundPhones = combinedText.match(phoneRegex) || [];
  const cleanPhone = (p) => p.replace(/[^\d]/g, '');
  const primaryPhone = cleanPhone(lead.mobile_without_country_code || "");
  const extraPhones = [...new Set(
    foundPhones
      .map(p => cleanPhone(p))
      .filter(p => p.length >= 10 && p.length <= 15 && p !== primaryPhone)
  )];

  const handleCopy = (text, fieldName) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(''), 1500);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'GOOD_LEAD_FOLLOW_UP':
        return <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-full font-bold text-xs">Good Lead</span>;
      case 'DID_NOT_CONNECT':
        return <span className="px-2.5 py-1 bg-slate-500/10 text-text-secondary border border-border-color rounded-full font-bold text-xs">Not Dialed</span>;
      case 'BAD_LEAD':
        return <span className="px-2.5 py-1 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-full font-bold text-xs">Bad Lead</span>;
      case 'SALE_DONE':
        return <span className="px-2.5 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full font-bold text-xs">Sale Done</span>;
      default:
        return <span className="px-2.5 py-1 bg-slate-500/10 text-text-secondary border border-border-color rounded-full font-bold text-xs">{status}</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs transition-opacity duration-300"
      />

      {/* Sliding Drawer Body */}
      <div className="relative w-full max-w-md bg-bg-panel border-l border-border-color shadow-2xl h-full flex flex-col z-10 animate-slideLeft transition-colors duration-250">
        
        {/* Drawer Header */}
        <div className="p-6 border-b border-border-color flex items-center justify-between bg-bg-sidebar/30">
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold text-sm border border-indigo-500/20 uppercase">
              {lead.name ? lead.name.split(' ').map(n => n[0]).join('') : 'LD'}
            </div>
            <div>
              <h3 className="text-base font-bold text-text-primary leading-tight">{lead.name}</h3>
              <div className="mt-1 flex items-center space-x-2">
                {getStatusBadge(lead.crm_status)}
                {lead.data_source && (
                  <span className="text-xs font-semibold bg-bg-app border border-border-color text-text-secondary px-2 py-0.5 rounded uppercase">
                    {lead.data_source.replace('_', ' ')}
                  </span>
                )}
              </div>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 hover:bg-bg-card-hover text-text-secondary hover:text-text-primary rounded-xl border border-transparent hover:border-border-color transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Section: Contact details */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-text-secondary tracking-wider uppercase">Contact Information</h4>
            <div className="space-y-3">
              
              {/* Email */}
              <div className="flex items-center justify-between p-3 bg-bg-app border border-border-color rounded-xl hover:bg-bg-card-hover transition">
                <div className="flex items-center space-x-3 min-w-0">
                  <Mail className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-text-secondary font-medium">Email Address</p>
                    <p className="text-xs text-text-primary font-bold truncate mt-0.5">{lead.email || '—'}</p>
                  </div>
                </div>
                {lead.email && (
                  <button 
                    onClick={() => handleCopy(lead.email, 'email')}
                    className="p-1 text-text-secondary hover:text-text-primary rounded-lg transition"
                    title="Copy Email"
                  >
                    {copiedField === 'email' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <ClipboardCopy className="w-3.5 h-3.5" />}
                  </button>
                )}
              </div>

              {/* Extra Emails */}
              {extraEmails.map((email, idx) => (
                <div key={`extra-email-${idx}`} className="flex items-center justify-between p-3 bg-bg-app border border-border-color border-dashed rounded-xl hover:bg-bg-card-hover transition">
                  <div className="flex items-center space-x-3 min-w-0">
                    <Mail className="w-4 h-4 text-emerald-500 dark:text-emerald-400 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs text-text-secondary font-medium">Extra Email {idx + 1}</p>
                      <p className="text-xs text-text-primary font-bold truncate mt-0.5">{email}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleCopy(email, `email-extra-${idx}`)}
                    className="p-1 text-text-secondary hover:text-text-primary rounded-lg transition"
                    title="Copy Secondary Email"
                  >
                    {copiedField === `email-extra-${idx}` ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <ClipboardCopy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              ))}

              {/* Phone */}
              <div className="flex items-center justify-between p-3 bg-bg-app border border-border-color rounded-xl hover:bg-bg-card-hover transition">
                <div className="flex items-center space-x-3 min-w-0">
                  <Phone className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-text-secondary font-medium">Mobile Phone</p>
                    <p className="text-xs text-text-primary font-bold truncate mt-0.5">
                      {lead.mobile_without_country_code ? `${lead.country_code || ''} ${lead.mobile_without_country_code}` : '—'}
                    </p>
                  </div>
                </div>
                {lead.mobile_without_country_code && (
                  <button 
                    onClick={() => handleCopy((lead.country_code || '') + lead.mobile_without_country_code, 'phone')}
                    className="p-1 text-text-secondary hover:text-text-primary rounded-lg transition"
                    title="Copy Phone"
                  >
                    {copiedField === 'phone' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <ClipboardCopy className="w-3.5 h-3.5" />}
                  </button>
                )}
              </div>

              {/* Extra Phone Numbers */}
              {extraPhones.map((phone, idx) => (
                <div key={`extra-phone-${idx}`} className="flex items-center justify-between p-3 bg-bg-app border border-border-color border-dashed rounded-xl hover:bg-bg-card-hover transition">
                  <div className="flex items-center space-x-3 min-w-0">
                    <Phone className="w-4 h-4 text-emerald-500 dark:text-emerald-400 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs text-text-secondary font-medium">Extra Phone {idx + 1}</p>
                      <p className="text-xs text-text-primary font-bold truncate mt-0.5">{phone}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleCopy(phone, `phone-extra-${idx}`)}
                    className="p-1 text-text-secondary hover:text-text-primary rounded-lg transition"
                    title="Copy Secondary Phone"
                  >
                    {copiedField === `phone-extra-${idx}` ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <ClipboardCopy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              ))}

              {/* Location */}
              <div className="flex items-center space-x-3 p-3 bg-bg-app border border-border-color rounded-xl">
                <MapPin className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                <div>
                  <p className="text-xs text-text-secondary font-medium">Location</p>
                  <p className="text-xs text-text-primary font-bold mt-0.5">
                    {[lead.city, lead.state, lead.country].filter(Boolean).join(', ') || '—'}
                  </p>
                </div>
              </div>

            </div>
          </div>

          {/* Section: Organization Info */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-text-secondary tracking-wider uppercase">Employment & Company</h4>
            <div className="grid grid-cols-2 gap-3">
              
              <div className="p-3 bg-bg-app border border-border-color rounded-xl">
                <Building className="w-4 h-4 text-indigo-400 mb-1" />
                <p className="text-xs text-text-secondary font-semibold">Company</p>
                <p className="text-xs text-text-primary font-bold truncate mt-0.5">{lead.company || '—'}</p>
              </div>

              <div className="p-3 bg-bg-app border border-border-color rounded-xl">
                <User className="w-4 h-4 text-indigo-400 mb-1" />
                <p className="text-xs text-text-secondary font-semibold">Lead Owner</p>
                <p className="text-xs text-text-primary font-bold truncate mt-0.5">{lead.lead_owner || '—'}</p>
              </div>

            </div>
          </div>

          {/* Section: Metadata */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-text-secondary tracking-wider uppercase">CRM Metadata</h4>
            <div className="p-4 bg-bg-app border border-border-color rounded-xl space-y-3">
              
              <div className="flex justify-between items-center text-xs">
                <span className="text-text-secondary flex items-center">
                  <Calendar className="w-3.5 h-3.5 mr-2 text-indigo-400" />
                  Lead Date
                </span>
                <span className="text-text-primary font-bold">
                  {lead.created_at ? new Date(lead.created_at).toLocaleDateString() : '—'}
                </span>
              </div>

              {lead.possession_time && (
                <div className="flex justify-between items-center text-xs border-t border-border-color/50 pt-2.5">
                  <span className="text-text-secondary flex items-center">
                    <Clock className="w-3.5 h-3.5 mr-2 text-indigo-400" />
                    Possession details
                  </span>
                  <span className="text-text-primary font-bold">{lead.possession_time}</span>
                </div>
              )}

              {lead.description && (
                <div className="text-xs border-t border-border-color/50 pt-2.5 space-y-1">
                  <span className="text-text-secondary flex items-center">
                    <Tag className="w-3.5 h-3.5 mr-2 text-indigo-400" />
                    Description
                  </span>
                  <p className="text-text-primary font-medium bg-bg-panel/40 border border-border-color p-2 rounded-lg leading-relaxed mt-1 text-xs">
                    {lead.description}
                  </p>
                </div>
              )}

            </div>
          </div>

          {/* Section: Notes */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-text-secondary tracking-wider uppercase">CRM Lead Notes</h4>
            <div className="p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-xl space-y-2.5">
              <div className="flex items-center space-x-2 text-indigo-400">
                <FileText className="w-4 h-4" />
                <span className="text-xs font-bold">Notes history</span>
              </div>
              <p className="text-xs text-text-secondary leading-relaxed bg-bg-panel/40 p-3 rounded-lg border border-border-color max-h-[140px] overflow-y-auto">
                {lead.crm_note || 'No notes appended to this lead.'}
              </p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

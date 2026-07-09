import React, { useState, useRef } from 'react';
import Papa from 'papaparse';
import { Upload, X, FileSpreadsheet, Info, Download, Loader2 } from 'lucide-react';
import Table from './Table';

export default function Modal({ isOpen, onClose, onImportComplete }) {
  const [file, setFile] = useState(null);
  const [headers, setHeaders] = useState([]);
  const [rows, setRows] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  // Handle Drag Over
  const handleDragOver = (e) => {
    e.preventDefault();
  };

  // Handle Drop
  const handleDrop = (e) => {
    e.preventDefault();
    if (isUploading) return;
    setError(null);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.name.endsWith('.csv')) {
      processLocalCSV(droppedFile);
    } else {
      setError("Only CSV files are supported.");
    }
  };

  // Handle File Choose
  const handleFileChange = (e) => {
    setError(null);
    const chosenFile = e.target.files[0];
    if (chosenFile) {
      processLocalCSV(chosenFile);
    }
  };

  // Parse local CSV using PapaParse (No AI yet - Step 2)
  const processLocalCSV = (selectedFile) => {
    setFile(selectedFile);
    Papa.parse(selectedFile, {
      header: true,
      skipEmptyLines: true,
      preview: 50, // Preview up to first 50 rows for performance
      complete: (results) => {
        setHeaders(results.meta.fields || []);
        setRows(results.data || []);
      },
      error: (err) => {
        setError("Error parsing local CSV: " + err.message);
      }
    });
  };

  // Reset file selection
  const handleRemoveFile = () => {
    setFile(null);
    setHeaders([]);
    setRows([]);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Download sample template (Bonus feature)
  const handleDownloadTemplate = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const headers = "created_at,name,email,country_code,mobile_without_country_code,company,city,state,country,lead_owner,crm_status,crm_note,data_source,possession_time,description\n2026-05-13 14:20:48,John Doe,john.doe@example.com,+91,9876543210,GrowEasy,Mumbai,Maharashtra,India,test@gmail.com,GOOD_LEAD_FOLLOW_UP,Client is asking to reschedule demo,leads_on_demand,Immediate,Enterprise Lead\n2026-05-13 14:25:30,Sarah Johnson,sarah.johnson@example.com,+91,9876543211,Tech Solutions,Bangalore,Karnataka,India,test@gmail.com,DID_NOT_CONNECT,Busy,eden_park,Ready,SMB Lead";
    const blob = new Blob([headers], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', 'crm_leads_template.csv');
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  };

  // Submit file to backend (AI Batching - Step 3)
  const handleConfirmImport = async () => {
    if (!file) return;
    
    setIsUploading(true);
    setError(null);
    setUploadProgress(10);

    const formData = new FormData();
    formData.append('file', file);

    // Simulate progress bar increments
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) return prev;
        return prev + 10;
      });
    }, 1500);

    try {
      const response = await fetch('http://localhost:8080/api/import', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || `HTTP error ${response.status}`);
      }

      const result = await response.json();
      setUploadProgress(100);
      setTimeout(() => {
        onImportComplete(result);
        onClose();
        handleRemoveFile();
        setIsUploading(false);
      }, 500);

    } catch (err) {
      console.error("❌ Upload error:", err);
      setError(err.message || "Failed to parse and map leads using OpenAI.");
      setIsUploading(false);
    } finally {
      clearInterval(progressInterval);
    }
  };  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
      <div className="bg-bg-panel border border-border-color rounded-2xl w-full max-w-4xl shadow-2xl relative overflow-hidden animate-slideDown transition-colors duration-250">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border-color px-6 py-4">
          <div>
            <h2 className="text-xl font-bold text-text-primary">Import Leads via CSV</h2>
            <p className="text-xs text-text-secondary mt-0.5">Upload a CSV file to bulk import leads into your system.</p>
          </div>
          <button 
            disabled={isUploading}
            onClick={onClose} 
            className="text-text-secondary hover:text-text-primary p-1 rounded-lg hover:bg-bg-card-hover transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(100vh-220px)] space-y-6">
          
          {error && (
            <div className="flex items-start space-x-3 bg-rose-500/10 border border-rose-500/20 p-4 rounded-xl text-rose-500 text-xs">
              <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold">Import Error</p>
                <p className="mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {/* Upload Drop Zone / State 1 */}
          {!file && (
            <div 
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current.click()}
              className="border border-dashed border-border-color hover:border-[#FA9B83]/60 rounded-2xl bg-bg-app p-12 text-center cursor-pointer group transition duration-200"
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange}
                accept=".csv"
                className="hidden" 
              />
              
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto mb-4 group-hover:scale-105 transition duration-200">
                <Upload className="w-6 h-6" />
              </div>
              
              <h3 className="text-lg font-bold text-text-primary">Drop your CSV file here</h3>
              <p className="text-xs text-text-secondary mt-1">or click to browse files</p>

              <span className="inline-block mt-4 text-xs font-semibold text-text-secondary bg-bg-panel border border-border-color px-3 py-1 rounded-md">
                Supported file: .csv (max 5MB)
              </span>

              <p className="text-xs text-text-secondary/80 max-w-xl mx-auto mt-6 leading-relaxed">
                Required headers: created_at, name, email, country_code, mobile_without_country_code, company, city, state, country, lead_owner, crm_status, crm_note. Template includes default + custom CRM fields to reduce upload errors.
              </p>

              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="mt-6 inline-flex items-center space-x-2 border border-emerald-500/30 hover:border-emerald-500/60 bg-emerald-500/5 text-emerald-500 hover:text-emerald-650 px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Sample CSV Template</span>
              </button>
            </div>
          )}

          {/* Local Preview Table / State 2 (Step 2) */}
          {file && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-bg-app border border-border-color px-4 py-3 rounded-xl">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-bg-panel border border-border-color rounded-lg text-emerald-555">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-text-primary truncate max-w-md">{file.name}</h4>
                    <p className="text-xs text-text-secondary">{(file.size / 1024).toFixed(2)} KB</p>
                  </div>
                </div>
                {!isUploading && (
                  <button 
                    onClick={handleRemoveFile} 
                    className="p-1 text-text-secondary hover:text-rose-500 hover:bg-bg-card-hover rounded-lg transition cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div>
                <div className="flex justify-between items-center mb-2 px-1">
                  <span className="text-xs font-semibold text-text-secondary">Raw Columns Preview (Pre-AI)</span>
                  <span className="text-xs text-text-secondary/70">Showing first {rows.length} rows</span>
                </div>
                <Table headers={headers} rows={rows} maxHeight={240} />
              </div>
            </div>
          )}

          {/* Loading state indicator */}
          {isUploading && (
            <div className="space-y-3 p-4 bg-bg-app rounded-2xl border border-border-color">
              <div className="flex items-center justify-between text-xs font-semibold text-text-secondary">
                <span className="flex items-center">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400 mr-2" />
                  AI Model is parsing and mapping batches...
                </span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-border-color rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-emerald-500 to-teal-500 h-2 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          )}

        </div>

        {/* Footer Buttons */}
        <div className="flex items-center justify-end space-x-3 border-t border-border-color px-6 py-4 bg-bg-sidebar/40">
          <button 
            disabled={isUploading}
            onClick={onClose}
            className="px-5 py-2.5 bg-bg-panel hover:bg-bg-card-hover border border-border-color rounded-xl text-xs font-semibold text-text-secondary hover:text-text-primary transition cursor-pointer"
          >
            Cancel
          </button>
          
          {file && (
            <button 
              disabled={isUploading}
              onClick={handleConfirmImport}
              className="px-5 py-2.5 bg-[#FA9B83] hover:bg-[#FA9B83]/90 text-slate-950 rounded-xl text-xs font-bold transition flex items-center space-x-2 cursor-pointer"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-950" />
                  <span>Processing...</span>
                </>
              ) : (
                <span>Upload File</span>
              )}
            </button>
          )}
        </div>

      </div>
    </div>
  );
}

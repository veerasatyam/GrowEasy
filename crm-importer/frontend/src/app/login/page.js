'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sun, Moon, Lock, Mail, Loader2, ArrowRight } from 'lucide-react';
import { useTheme } from '../components/ThemeContext';

export default function LoginPage() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();

  const [email, setEmail] = useState('test@gmail.com');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // If already authenticated, redirect to dashboard
  useEffect(() => {
    const user = localStorage.getItem('groweasy-user');
    if (user) {
      try {
        const parsed = JSON.parse(user);
        if (parsed.loggedIn) {
          router.push('/');
        }
      } catch (err) {
        localStorage.removeItem('groweasy-user');
      }
    }
  }, [router]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);

    // Simulate mock network latency
    setTimeout(() => {
      if (email === 'test@gmail.com' && password === 'password123') {
        const userObj = {
          email: 'test@gmail.com',
          name: 'VK Test',
          role: 'OWNER',
          loggedIn: true
        };
        localStorage.setItem('groweasy-user', JSON.stringify(userObj));
        router.push('/');
      } else {
        setError('Invalid email or password. Use test@gmail.com and password123.');
        setLoading(false);
      }
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-bg-app text-text-primary flex flex-col justify-center items-center p-6 relative transition-colors duration-250">
      
      {/* Theme Toggle Top Right */}
      <div className="absolute top-6 right-6">
        <button
          onClick={toggleTheme}
          className="p-2.5 bg-bg-panel hover:bg-bg-card-hover border border-border-color rounded-xl text-text-secondary hover:text-text-primary transition"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
      </div>

      <div className="w-full max-w-md bg-bg-panel border border-border-color rounded-2xl shadow-2xl overflow-hidden p-8 space-y-6 transition-colors duration-250">
        
        {/* Logo and Header */}
        <div className="text-center space-y-2.5">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-600 to-[#FA9B83] flex items-center justify-center mx-auto shadow-lg shadow-indigo-900/10">
            <span className="text-white font-extrabold text-lg tracking-wider">GE</span>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-text-primary">Welcome Back</h2>
            <p className="text-xs text-text-secondary mt-1">Sign in to manage your CRM lead pipeline</p>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-xl text-xs text-center font-medium animate-slideDown">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Email input */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-text-secondary">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="w-full pl-10 pr-4 py-2.5 bg-input-bg border border-input-border text-text-primary rounded-xl text-xs focus:ring-1 focus:ring-[#FA9B83] focus:border-[#FA9B83] focus:outline-none transition-colors duration-200"
              />
            </div>
          </div>

          {/* Password input */}
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-text-secondary">Password</label>
              <a href="#" className="text-xs text-text-secondary hover:text-[#FA9B83] transition">Forgot password?</a>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="w-full pl-10 pr-4 py-2.5 bg-input-bg border border-input-border text-text-primary rounded-xl text-xs focus:ring-1 focus:ring-[#FA9B83] focus:border-[#FA9B83] focus:outline-none transition-colors duration-200"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 flex items-center justify-center space-x-2 bg-[#FA9B83] hover:bg-[#FA9B83]/90 disabled:opacity-50 text-slate-950 font-bold py-2.5 rounded-xl text-xs transition duration-200 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Hints */}
        <div className="border-t border-border-color pt-4 text-center">
          <p className="text-xs text-text-secondary">
            Credential Hint: <span className="font-semibold text-[#FA9B83]">test@gmail.com</span> / <span className="font-semibold text-[#FA9B83]">password123</span>
          </p>
        </div>

      </div>
    </div>
  );
}

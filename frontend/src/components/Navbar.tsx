import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, Zap, Gift, Compass, Plus, Package } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import OnlineIndicator from './OnlineIndicator';
import NotificationBell from './NotificationBell';
import ThemeToggle from './ThemeToggle';
import { ReferralWalletModal } from './ReferralWalletModal';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [walletOpen, setWalletOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <>
      <nav className="bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 shadow-sm sticky top-0 z-40 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-6">
              <Link to="/dashboard" className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                  <Zap className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold text-gray-900 dark:text-white text-lg">CampusGig</span>
              </Link>

              <div className="hidden sm:flex items-center gap-1 pl-2 border-l border-slate-200 dark:border-slate-800">
                <Link
                  to="/explore"
                  className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-brand-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5"
                >
                  <Compass className="w-4 h-4 text-brand-600" /> Explore Gigs
                </Link>
                <Link
                  to="/dashboard"
                  className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-brand-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  My Orders
                </Link>
                <Link
                  to="/order/new"
                  className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-brand-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> New Project
                </Link>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              {user?.role === 'student' && (
                <button
                  type="button"
                  onClick={() => setWalletOpen(true)}
                  className="bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-950/70 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60 px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm"
                  title="Open Campus Ambassador Referral Wallet"
                >
                  <Gift className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span className="hidden md:inline">Ambassador Wallet</span>
                </button>
              )}

              <OnlineIndicator isOnline={true} showLabel={false} />
              <ThemeToggle />
              <NotificationBell />

              <div className="flex items-center gap-3 pl-2 sm:pl-3 border-l border-gray-200 dark:border-slate-700">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-semibold text-gray-900 dark:text-slate-100">{user?.full_name}</p>
                  <p className="text-xs text-gray-500 capitalize">{user?.student_type} student</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm text-gray-600 dark:text-slate-300 hover:bg-red-50 hover:text-red-600 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:block">Logout</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <ReferralWalletModal
        isOpen={walletOpen}
        onClose={() => setWalletOpen(false)}
      />
    </>
  );
};

export default Navbar;

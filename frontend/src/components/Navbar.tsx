import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, Zap, Gift } from 'lucide-react';
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
      <nav className="glass-panel backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800/80 bg-white/85 dark:bg-slate-950/85 sticky top-0 z-50 transition-all shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/dashboard" className="flex items-center gap-3 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-600 via-indigo-600 to-purple-600 flex items-center justify-center shadow-md shadow-brand-500/25 group-hover:scale-105 transition-transform">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="font-black tracking-tight text-slate-900 dark:text-white text-lg leading-none flex items-center gap-1.5">
                  CampusGig
                  <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20">PRO</span>
                </span>
                <span className="text-[10px] text-slate-400 dark:text-slate-400 font-medium">Academic Capstone Cloud</span>
              </div>
            </Link>

            <div className="flex items-center gap-2 sm:gap-3">
              {user?.role === 'student' && (
                <button
                  type="button"
                  onClick={() => setWalletOpen(true)}
                  className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/20 px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm hover:scale-[1.02]"
                  title="Open Campus Ambassador Referral Wallet"
                >
                  <Gift className="w-3.5 h-3.5 text-amber-500" />
                  <span className="hidden md:inline">Ambassador Wallet</span>
                </button>
              )}

              <OnlineIndicator isOnline={true} showLabel={false} />
              <ThemeToggle />
              <NotificationBell />

              <div className="flex items-center gap-3 pl-2 sm:pl-3 border-l border-slate-200 dark:border-slate-800">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-tight">{user?.full_name}</p>
                  <p className="text-[11px] font-medium text-slate-400 capitalize">{user?.role === 'admin' ? 'System Administrator' : `${user?.student_type || 'Engineering'} Scholar`}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                  title="Log out of account"
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

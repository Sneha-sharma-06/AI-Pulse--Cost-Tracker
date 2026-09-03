import { useState, useEffect, useRef } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { dashboardAPI } from '../utils/api';
import {
  LayoutDashboard,
  ScrollText,
  BarChart3,
  LogOut,
  Menu,
  X,
  Zap,
  Bell,
  Settings,
  CheckCircle,
  AlertTriangle,
  XCircle,
  DollarSign,
  Folder,
  Key,
  BellRing,
  Moon,
  Sun,
  Globe,
  LogIn
} from 'lucide-react';

const Layout = () => {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const notifRef = useRef(null);

  useEffect(() => {
    fetchNotifications();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifications(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    try {
      const statsRes = await dashboardAPI.getStats();
      const stats = statsRes.data;
      const notifs = [];

      if (parseFloat(stats.monthCost) > 10) {
        notifs.push({
          id: 1,
          type: 'warning',
          title: 'High Monthly Spend',
          message: `You've spent $${stats.monthCost} this month`,
          time: 'Now'
        });
      }

      if (parseFloat(stats.todayCost) > 3) {
        notifs.push({
          id: 2,
          type: 'alert',
          title: 'Budget Alert',
          message: `Today's cost ($${stats.todayCost}) exceeds daily average`,
          time: 'Today'
        });
      }

      const failedCalls = 100 - parseFloat(stats.successRate);
      if (failedCalls > 3) {
        notifs.push({
          id: 3,
          type: 'error',
          title: 'High Error Rate',
          message: `${failedCalls.toFixed(1)}% of API calls failed today`,
          time: 'Today'
        });
      }

      setNotifications(notifs);
    } catch (error) {
      console.error(error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    setShowNotifications(false);
  };

  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/projects', icon: Folder, label: 'Projects' },
    { path: '/logs', icon: ScrollText, label: 'API Logs' },
    { path: '/analytics', icon: BarChart3, label: 'Analytics' },
    { path: '/api-keys', icon: Key, label: 'API Keys' },
    { path: '/alerts', icon: BellRing, label: 'Alerts' },
    { path: '/settings', icon: Settings, label: 'Settings' }
  ];

  const getNotifIcon = (type) => {
    switch (type) {
      case 'success': return <CheckCircle className="w-5 h-5 text-emerald-400" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-amber-400" />;
      case 'error': return <XCircle className="w-5 h-5 text-red-400" />;
      case 'alert': return <DollarSign className="w-5 h-5 text-orange-400" />;
      default: return <Bell className="w-5 h-5 text-primary-400" />;
    }
  };

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-dark-950' : 'bg-slate-100'}`}>
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-full w-72 ${theme === 'dark' ? 'bg-dark-900 border-dark-700' : 'bg-white border-slate-200'} border-r z-50 transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        <div className="flex flex-col h-full">
          <div className={`p-6 border-b ${theme === 'dark' ? 'border-dark-700' : 'border-slate-200'}`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-cyan-400 rounded-xl flex items-center justify-center">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold gradient-text">AI Pulse</h1>
                <p className={`text-xs ${theme === 'dark' ? 'text-dark-400' : 'text-slate-500'}`}>Cost Tracker</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 p-4 space-y-2">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${isActive ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30' : `${theme === 'dark' ? 'text-dark-300 hover:bg-dark-800 hover:text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}`
                }
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </NavLink>
            ))}
          </nav>

          <div className={`p-4 border-t ${theme === 'dark' ? 'border-dark-700' : 'border-slate-200'}`}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-primary-400 rounded-full flex items-center justify-center text-white font-semibold">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium truncate ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{user?.name}</p>
                <p className={`text-xs truncate ${theme === 'dark' ? 'text-dark-400' : 'text-slate-500'}`}>@{user?.username}</p>
              </div>
            </div>
            <button onClick={handleLogout} className={`w-full flex items-center gap-3 px-4 py-2 rounded-xl transition-all duration-200 ${theme === 'dark' ? 'text-dark-300 hover:bg-red-500/10 hover:text-red-400' : 'text-slate-600 hover:bg-red-50 hover:text-red-600'}`}>
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:ml-72 min-h-screen">
        <header className={`sticky top-0 z-30 glass border-b ${theme === 'dark' ? 'border-dark-700' : 'border-slate-200'}`}>
          <div className="flex items-center justify-between px-6 py-4">
            <button onClick={() => setSidebarOpen(true)} className={`lg:hidden p-2 rounded-lg ${theme === 'dark' ? 'hover:bg-dark-800 text-dark-300' : 'hover:bg-slate-100 text-slate-600'}`}>
              <Menu className="w-6 h-6" />
            </button>

            <div className="hidden lg:flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full pulse-live"></div>
              <span className={`text-sm ${theme === 'dark' ? 'text-dark-300' : 'text-slate-600'}`}>Live Tracking</span>
            </div>

            <div className="flex items-center gap-4">
              {/* Theme toggle */}
              <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className={`p-2 rounded-lg transition-colors ${theme === 'dark' ? 'hover:bg-dark-800 text-dark-300' : 'hover:bg-slate-100 text-slate-600'}`}>
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>

              {/* Notifications */}
              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className={`relative p-2 rounded-lg transition-colors ${theme === 'dark' ? 'hover:bg-dark-800 text-dark-300' : 'hover:bg-slate-100 text-slate-600'}`}
                >
                  <Bell className="w-5 h-5" />
                  {notifications.length > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full pulse-live"></span>
                  )}
                </button>

                {showNotifications && (
                  <div className={`absolute right-0 top-full mt-2 w-80 glass rounded-2xl shadow-2xl border overflow-hidden ${theme === 'dark' ? 'border-dark-600' : 'border-slate-200'}`}>
                    <div className={`flex items-center justify-between px-4 py-3 border-b ${theme === 'dark' ? 'border-dark-700' : 'border-slate-200'}`}>
                      <h3 className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Notifications</h3>
                      {notifications.length > 0 && (
                        <button onClick={clearAllNotifications} className={`text-xs ${theme === 'dark' ? 'text-dark-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}>Clear all</button>
                      )}
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className={`p-6 text-center ${theme === 'dark' ? 'text-dark-400' : 'text-slate-500'}`}>
                          <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p>No notifications</p>
                        </div>
                      ) : (
                        notifications.map((notif) => (
                          <div key={notif.id} className={`px-4 py-3 border-b transition-colors ${theme === 'dark' ? 'hover:bg-dark-800/50 border-dark-700/50' : 'hover:bg-slate-50 border-slate-100'}`}>
                            <div className="flex items-start gap-3">
                              <div className="mt-0.5">{getNotifIcon(notif.type)}</div>
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{notif.title}</p>
                                <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-dark-400' : 'text-slate-500'}`}>{notif.message}</p>
                                <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-dark-500' : 'text-slate-400'}`}>{notif.time}</p>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Logout button */}
              <button onClick={handleLogout}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${theme === 'dark' ? 'hover:bg-red-500/10 text-dark-300 hover:text-red-400' : 'hover:bg-red-50 text-slate-600 hover:text-red-600'}`}>
                <LogOut className="w-5 h-5" />
                <span className="hidden sm:inline text-sm font-medium">Logout</span>
              </button>
            </div>
          </div>
        </header>

        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;

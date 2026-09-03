import { useState, useEffect } from 'react';
import { preferencesAPI, auditAPI, exportAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Settings as SettingsIcon, Moon, Sun, Globe, Clock, Bell, Download, Loader2, Shield, CheckCircle } from 'lucide-react';

const Settings = () => {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const [prefs, setPrefs] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState('preferences');
  const [exporting, setExporting] = useState(false);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [prefsRes, auditRes] = await Promise.all([
        preferencesAPI.get().catch(() => ({ data: null })),
        auditAPI.getLogs({ limit: 20 }).catch(() => ({ data: { logs: [] } }))
      ]);
      if (prefsRes.data) {
        setPrefs(prefsRes.data);
        if (prefsRes.data.theme) setTheme(prefsRes.data.theme);
      } else {
        setPrefs({ language: 'en', timezone: 'UTC', email_notifications: 1, default_date_range: '30d' });
      }
      setAuditLogs(auditRes.data.logs || []);
    } catch (error) {
      console.error(error);
      setPrefs({ language: 'en', timezone: 'UTC', email_notifications: 1, default_date_range: '30d' });
    } finally {
      setLoading(false);
    }
  };

  const handleThemeToggle = async () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    setPrefs(prev => ({ ...prev, theme: newTheme }));
    try {
      await preferencesAPI.update({ theme: newTheme });
    } catch (error) {
      console.error(error);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await preferencesAPI.update(prefs);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await exportAPI.downloadCSV({ days: 30 });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `ai-cost-report-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
    } finally {
      setExporting(false);
    }
  };

  const getActionIcon = (action) => {
    switch (action) {
      case 'create': return <span className="text-emerald-400 font-bold">+</span>;
      case 'delete': return <span className="text-red-400 font-bold">-</span>;
      case 'login': return <span className="text-primary-400 font-bold">&gt;</span>;
      default: return <span className="text-amber-400 font-bold">~</span>;
    }
  };

  const getTimezoneName = (tz) => {
    const names = {
      'UTC': 'UTC (GMT+0)',
      'America/New_York': 'Eastern Time',
      'America/Chicago': 'Central Time',
      'America/Denver': 'Mountain Time',
      'America/Los_Angeles': 'Pacific Time',
      'America/Anchorage': 'Alaska Time',
      'Pacific/Honolulu': 'Hawaii Time',
      'America/Toronto': 'Toronto',
      'America/Vancouver': 'Vancouver',
      'America/Sao_Paulo': 'Sao Paulo',
      'America/Argentina/Buenos_Aires': 'Buenos Aires',
      'America/Mexico_City': 'Mexico City',
      'Europe/London': 'London',
      'Europe/Paris': 'Paris',
      'Europe/Berlin': 'Berlin',
      'Europe/Moscow': 'Moscow',
      'Europe/Istanbul': 'Istanbul',
      'Europe/Rome': 'Rome',
      'Europe/Madrid': 'Madrid',
      'Europe/Amsterdam': 'Amsterdam',
      'Europe/Zurich': 'Zurich',
      'Europe/Warsaw': 'Warsaw',
      'Europe/Stockholm': 'Stockholm',
      'Asia/Tokyo': 'Tokyo',
      'Asia/Shanghai': 'Shanghai',
      'Asia/Hong_Kong': 'Hong Kong',
      'Asia/Singapore': 'Singapore',
      'Asia/Kolkata': 'India',
      'Asia/Dubai': 'Dubai',
      'Asia/Seoul': 'Seoul',
      'Asia/Taipei': 'Taipei',
      'Asia/Bangkok': 'Bangkok',
      'Asia/Jakarta': 'Jakarta',
      'Asia/Kuala_Lumpur': 'Kuala Lumpur',
      'Asia/Manila': 'Manila',
      'Asia/Ho_Chi_Minh': 'Ho Chi Minh',
      'Australia/Sydney': 'Sydney',
      'Australia/Melbourne': 'Melbourne',
      'Australia/Brisbane': 'Brisbane',
      'Australia/Perth': 'Perth',
      'Australia/Adelaide': 'Adelaide',
      'Pacific/Auckland': 'Auckland',
      'Pacific/Wellington': 'Wellington',
      'Africa/Cairo': 'Cairo',
      'Africa/Lagos': 'Lagos',
      'Africa/Johannesburg': 'Johannesburg',
      'Africa/Nairobi': 'Nairobi',
      'Africa/Casablanca': 'Casablanca'
    };
    return names[tz] || tz;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Settings</h1>
        <p className="text-dark-400 mt-1">Manage your account and preferences</p>
      </div>

      <div className="flex bg-dark-800/80 rounded-xl p-1 w-fit">
        {['preferences', 'account', 'audit'].map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${activeTab === tab ? 'bg-primary-500 text-white' : 'text-dark-400 hover:text-white'}`}>
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'preferences' && (
        <div className="space-y-4">
          <div className="glass rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {theme === 'dark' ? <Moon className="w-5 h-5 text-primary-400" /> : <Sun className="w-5 h-5 text-amber-400" />}
                <div>
                  <p className="font-medium text-white">Theme</p>
                  <p className="text-sm text-dark-400">{theme === 'dark' ? 'Dark mode active' : 'Light mode active'}</p>
                </div>
              </div>
              <button onClick={handleThemeToggle}
                className={`relative w-14 h-7 rounded-full transition-colors ${theme === 'dark' ? 'bg-primary-500' : 'bg-amber-500'}`}>
                <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform shadow ${theme === 'dark' ? 'left-8' : 'left-1'}`} />
              </button>
            </div>
          </div>

          <div className="glass rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Globe className="w-5 h-5 text-cyan-400" />
                <div>
                  <p className="font-medium text-white">Language</p>
                  <p className="text-sm text-dark-400">{prefs?.language === 'en' ? 'English' : prefs?.language === 'es' ? 'Spanish' : prefs?.language === 'fr' ? 'French' : prefs?.language === 'de' ? 'German' : 'Japanese'}</p>
                </div>
              </div>
              <select value={prefs?.language || 'en'} onChange={(e) => setPrefs({ ...prefs, language: e.target.value })}
                className="px-3 py-2 bg-dark-800 border border-dark-600 rounded-lg text-sm text-white focus:outline-none focus:border-primary-500">
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
                <option value="ja">Japanese</option>
              </select>
            </div>
          </div>

          <div className="glass rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-amber-400" />
                <div>
                  <p className="font-medium text-white">Timezone</p>
                  <p className="text-sm text-dark-400">{getTimezoneName(prefs?.timezone || 'UTC')}</p>
                </div>
              </div>
              <select value={prefs?.timezone || 'UTC'} onChange={(e) => setPrefs({ ...prefs, timezone: e.target.value })}
                className="px-3 py-2 bg-dark-800 border border-dark-600 rounded-lg text-sm text-white focus:outline-none focus:border-primary-500">
                <optgroup label="UTC">
                  <option value="UTC">UTC (GMT+0)</option>
                </optgroup>
                <optgroup label="Americas">
                  <option value="America/New_York">Eastern Time (ET)</option>
                  <option value="America/Chicago">Central Time (CT)</option>
                  <option value="America/Denver">Mountain Time (MT)</option>
                  <option value="America/Los_Angeles">Pacific Time (PT)</option>
                  <option value="America/Anchorage">Alaska Time (AKT)</option>
                  <option value="Pacific/Honolulu">Hawaii Time (HT)</option>
                  <option value="America/Toronto">Toronto</option>
                  <option value="America/Vancouver">Vancouver</option>
                  <option value="America/Sao_Paulo">Sao Paulo</option>
                  <option value="America/Argentina/Buenos_Aires">Buenos Aires</option>
                  <option value="America/Mexico_City">Mexico City</option>
                </optgroup>
                <optgroup label="Europe">
                  <option value="Europe/London">London (GMT)</option>
                  <option value="Europe/Paris">Paris (CET)</option>
                  <option value="Europe/Berlin">Berlin (CET)</option>
                  <option value="Europe/Moscow">Moscow (MSK)</option>
                  <option value="Europe/Istanbul">Istanbul (TRT)</option>
                  <option value="Europe/Rome">Rome (CET)</option>
                  <option value="Europe/Madrid">Madrid (CET)</option>
                  <option value="Europe/Amsterdam">Amsterdam (CET)</option>
                  <option value="Europe/Zurich">Zurich (CET)</option>
                  <option value="Europe/Warsaw">Warsaw (CET)</option>
                  <option value="Europe/Stockholm">Stockholm (CET)</option>
                </optgroup>
                <optgroup label="Asia">
                  <option value="Asia/Tokyo">Tokyo (JST)</option>
                  <option value="Asia/Shanghai">Shanghai (CST)</option>
                  <option value="Asia/Hong_Kong">Hong Kong (HKT)</option>
                  <option value="Asia/Singapore">Singapore (SGT)</option>
                  <option value="Asia/Kolkata">India (IST)</option>
                  <option value="Asia/Dubai">Dubai (GST)</option>
                  <option value="Asia/Seoul">Seoul (KST)</option>
                  <option value="Asia/Taipei">Taipei (CST)</option>
                  <option value="Asia/Bangkok">Bangkok (ICT)</option>
                  <option value="Asia/Jakarta">Jakarta (WIB)</option>
                  <option value="Asia/Kuala_Lumpur">Kuala Lumpur (MYT)</option>
                  <option value="Asia/Manila">Manila (PHT)</option>
                  <option value="Asia/Ho_Chi_Minh">Ho Chi Minh (ICT)</option>
                </optgroup>
                <optgroup label="Australia & New Zealand">
                  <option value="Australia/Sydney">Sydney (AEST)</option>
                  <option value="Australia/Melbourne">Melbourne (AEST)</option>
                  <option value="Australia/Brisbane">Brisbane (AEST)</option>
                  <option value="Australia/Perth">Perth (AWST)</option>
                  <option value="Australia/Adelaide">Adelaide (ACST)</option>
                  <option value="Pacific/Auckland">Auckland (NZST)</option>
                  <option value="Pacific/Wellington">Wellington (NZST)</option>
                </optgroup>
                <optgroup label="Africa">
                  <option value="Africa/Cairo">Cairo (EET)</option>
                  <option value="Africa/Lagos">Lagos (WAT)</option>
                  <option value="Africa/Johannesburg">Johannesburg (SAST)</option>
                  <option value="Africa/Nairobi">Nairobi (EAT)</option>
                  <option value="Africa/Casablanca">Casablanca (WET)</option>
                </optgroup>
              </select>
            </div>
          </div>

          <div className="glass rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-emerald-400" />
                <div>
                  <p className="font-medium text-white">Email Notifications</p>
                  <p className="text-sm text-dark-400">{prefs?.email_notifications ? 'Enabled' : 'Disabled'}</p>
                </div>
              </div>
              <button onClick={() => setPrefs({ ...prefs, email_notifications: prefs?.email_notifications ? 0 : 1 })}
                className={`relative w-14 h-7 rounded-full transition-colors ${prefs?.email_notifications ? 'bg-primary-500' : 'bg-dark-600'}`}>
                <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${prefs?.email_notifications ? 'left-8' : 'left-1'}`} />
              </button>
            </div>
          </div>

          <div className="glass rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <SettingsIcon className="w-5 h-5 text-purple-400" />
                <div>
                  <p className="font-medium text-white">Default Date Range</p>
                  <p className="text-sm text-dark-400">{prefs?.default_date_range || '30d'}</p>
                </div>
              </div>
              <select value={prefs?.default_date_range || '30d'} onChange={(e) => setPrefs({ ...prefs, default_date_range: e.target.value })}
                className="px-3 py-2 bg-dark-800 border border-dark-600 rounded-lg text-sm text-white focus:outline-none focus:border-primary-500">
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="60d">Last 60 days</option>
                <option value="90d">Last 90 days</option>
              </select>
            </div>
          </div>

          <button onClick={handleSave} disabled={saving}
            className={`w-full py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-all ${saved ? 'bg-emerald-500 text-white' : 'bg-primary-500 hover:bg-primary-600 text-white'}`}>
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : saved ? <CheckCircle className="w-5 h-5" /> : null}
            {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Preferences'}
          </button>
        </div>
      )}

      {activeTab === 'account' && (
        <div className="space-y-4">
          <div className="glass rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Account Information</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-dark-800/50 rounded-xl">
                <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-cyan-400 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                  {user?.name?.charAt(0)}
                </div>
                <div>
                  <p className="text-lg font-semibold text-white">{user?.name}</p>
                  <p className="text-dark-400">@{user?.username}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-dark-800/50 rounded-xl">
                  <p className="text-sm text-dark-400">Role</p>
                  <p className="text-white font-medium capitalize">{user?.role}</p>
                </div>
                <div className="p-4 bg-dark-800/50 rounded-xl">
                  <p className="text-sm text-dark-400">Member Since</p>
                  <p className="text-white font-medium">{formatDate(user?.created_at)}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="glass rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-2">Export Data</h3>
            <p className="text-dark-400 mb-4">Download your API usage data as CSV</p>
            <button onClick={handleExport} disabled={exporting}
              className="flex items-center gap-2 px-6 py-3 bg-dark-800 hover:bg-dark-700 text-white rounded-xl font-medium transition-colors">
              {exporting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
              {exporting ? 'Generating...' : 'Download CSV Report'}
            </button>
          </div>
        </div>
      )}

      {activeTab === 'audit' && (
        <div className="glass rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-dark-700">
            <h3 className="text-lg font-semibold text-white">Activity Log</h3>
            <p className="text-sm text-dark-400">Your account activity history</p>
          </div>
          {auditLogs.length === 0 ? (
            <div className="p-8 text-center text-dark-400">
              <Shield className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No activity recorded yet</p>
            </div>
          ) : (
            <div className="divide-y divide-dark-700/50">
              {auditLogs.map((log) => (
                <div key={log.id} className="px-5 py-4 hover:bg-dark-800/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-dark-800 rounded-lg flex items-center justify-center text-sm">
                      {getActionIcon(log.action)}
                    </div>
                    <div className="flex-1">
                      <p className="text-white text-sm">{log.details || log.action}</p>
                      <p className="text-xs text-dark-400 mt-0.5">{new Date(log.created_at).toLocaleString()}</p>
                    </div>
                    <span className="px-2 py-1 bg-dark-800 rounded text-xs text-dark-400 capitalize">{log.action}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Settings;

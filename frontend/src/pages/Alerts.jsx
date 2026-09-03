import { useState, useEffect } from 'react';
import { alertsAPI } from '../utils/api';
import { Bell, Plus, Trash2, Loader2, X, AlertTriangle, CheckCircle, Info, BellRing } from 'lucide-react';

const Alerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState('alerts');
  const [form, setForm] = useState({ threshold_percent: 80, alert_type: 'email' });
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [alertsRes, notifRes] = await Promise.all([alertsAPI.getAlerts(), alertsAPI.getNotifications()]);
      setAlerts(alertsRes.data);
      setNotifications(notifRes.data);
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await alertsAPI.createAlert(form);
      setShowModal(false);
      setForm({ threshold_percent: 80, alert_type: 'email' });
      fetchData();
    } catch (error) { console.error(error); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this alert?')) return;
    try { await alertsAPI.deleteAlert(id); fetchData(); }
    catch (error) { console.error(error); }
  };

  const handleToggle = async (id, current) => {
    try { await alertsAPI.updateAlert(id, { is_active: current ? 0 : 1 }); fetchData(); }
    catch (error) { console.error(error); }
  };

  const markRead = async (id) => {
    try { await alertsAPI.markRead(id); fetchData(); }
    catch (error) { console.error(error); }
  };

  const getNotifIcon = (severity) => {
    switch (severity) {
      case 'critical': return <AlertTriangle className="w-5 h-5 text-red-400" />;
      case 'warning': return <Bell className="w-5 h-5 text-amber-400" />;
      default: return <Info className="w-5 h-5 text-primary-400" />;
    }
  };

  if (loading) return <div className="flex items-center justify-center h-96"><Loader2 className="w-8 h-8 text-primary-500 animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Alerts & Notifications</h1>
          <p className="text-dark-400 mt-1">Set budget alerts and view notifications</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-medium transition-colors">
          <Plus className="w-5 h-5" /> New Alert
        </button>
      </div>

      {/* Tabs */}
      <div className="flex bg-dark-800/80 rounded-xl p-1 w-fit">
        <button onClick={() => setActiveTab('alerts')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'alerts' ? 'bg-primary-500 text-white' : 'text-dark-400 hover:text-white'}`}>
          Alert Rules ({alerts.length})
        </button>
        <button onClick={() => setActiveTab('notifications')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'notifications' ? 'bg-primary-500 text-white' : 'text-dark-400 hover:text-white'}`}>
          Notifications ({notifications.filter(n => !n.is_read).length})
        </button>
      </div>

      {activeTab === 'alerts' ? (
        alerts.length === 0 ? (
          <div className="glass rounded-2xl p-12 text-center">
            <BellRing className="w-16 h-16 text-dark-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No alert rules</h3>
            <p className="text-dark-400 mb-6">Create alerts to get notified when budget is exceeded</p>
            <button onClick={() => setShowModal(true)} className="px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-medium">Create First Alert</button>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div key={alert.id} className="glass rounded-2xl p-5 card-hover">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${alert.is_active ? 'bg-amber-500/20' : 'bg-dark-700'}`}>
                      <Bell className={`w-6 h-6 ${alert.is_active ? 'text-amber-400' : 'text-dark-500'}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-white">Budget Alert</h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${alert.is_active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-dark-700 text-dark-400'}`}>
                          {alert.is_active ? 'Active' : 'Paused'}
                        </span>
                      </div>
                      <p className="text-sm text-dark-400 mt-1">
                        Alert at <span className="text-white font-medium">{alert.threshold_percent}%</span> of budget via {alert.alert_type}
                        {alert.last_triggered && ` • Last triggered ${new Date(alert.last_triggered).toLocaleDateString()}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleToggle(alert.id, alert.is_active)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium ${alert.is_active ? 'bg-dark-700 text-dark-300' : 'bg-emerald-500/20 text-emerald-400'}`}>
                      {alert.is_active ? 'Pause' : 'Resume'}
                    </button>
                    <button onClick={() => handleDelete(alert.id)} className="p-2 text-dark-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        notifications.length === 0 ? (
          <div className="glass rounded-2xl p-12 text-center">
            <CheckCircle className="w-16 h-16 text-dark-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">All caught up</h3>
            <p className="text-dark-400">No notifications yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((notif) => (
              <div key={notif.id} className={`glass rounded-xl p-4 card-hover ${!notif.is_read ? 'border-l-4 border-amber-500' : ''}`}>
                <div className="flex items-start gap-3">
                  {getNotifIcon(notif.severity)}
                  <div className="flex-1">
                    <p className="text-white">{notif.message}</p>
                    <p className="text-xs text-dark-400 mt-1">{new Date(notif.created_at).toLocaleString()}</p>
                  </div>
                  {!notif.is_read && (
                    <button onClick={() => markRead(notif.id)} className="text-xs text-primary-400 hover:text-primary-300">Mark read</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="glass rounded-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">New Alert Rule</h2>
              <button onClick={() => setShowModal(false)} className="p-2 text-dark-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">Alert at % of budget</label>
                <div className="space-y-2">
                  <input type="range" min="50" max="100" value={form.threshold_percent}
                    onChange={(e) => setForm({ ...form, threshold_percent: parseInt(e.target.value) })}
                    className="w-full h-2 bg-dark-700 rounded-lg appearance-none cursor-pointer accent-primary-500" />
                  <div className="flex justify-between text-sm">
                    <span className="text-dark-400">50%</span>
                    <span className="text-white font-bold text-lg">{form.threshold_percent}%</span>
                    <span className="text-dark-400">100%</span>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">Notification Method</label>
                <div className="flex gap-3">
                  {[{ value: 'email', label: 'Email' }, { value: 'dashboard', label: 'Dashboard' }].map((opt) => (
                    <button key={opt.value} type="button" onClick={() => setForm({ ...form, alert_type: opt.value })}
                      className={`flex-1 py-3 rounded-xl font-medium transition-all ${form.alert_type === opt.value ? 'bg-primary-500 text-white' : 'bg-dark-800 text-dark-300 hover:bg-dark-700'}`}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving}
                  className="flex-1 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-medium flex items-center justify-center gap-2">
                  {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Alert'}
                </button>
                <button type="button" onClick={() => setShowModal(false)} className="px-6 py-3 bg-dark-700 hover:bg-dark-600 text-white rounded-xl">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Alerts;

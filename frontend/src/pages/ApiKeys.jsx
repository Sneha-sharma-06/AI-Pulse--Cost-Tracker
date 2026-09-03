import { useState, useEffect } from 'react';
import { apiKeysAPI } from '../utils/api';
import { Key, Plus, Trash2, Eye, EyeOff, Copy, Loader2, X, Shield, CheckCircle } from 'lucide-react';

const ApiKeys = () => {
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newKey, setNewKey] = useState(null);
  const [form, setForm] = useState({ provider: 'openai', name: '', monthly_limit: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchKeys(); }, []);

  const fetchKeys = async () => {
    try { const res = await apiKeysAPI.getKeys(); setKeys(res.data); }
    catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await apiKeysAPI.createKey(form);
      setNewKey(res.data);
      setForm({ provider: 'openai', name: '', monthly_limit: '' });
      fetchKeys();
    } catch (error) { console.error(error); }
    finally { setSaving(false); }
  };

  const handleToggle = async (id) => {
    try { await apiKeysAPI.toggleKey(id); fetchKeys(); }
    catch (error) { console.error(error); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this API key?')) return;
    try { await apiKeysAPI.deleteKey(id); fetchKeys(); }
    catch (error) { console.error(error); }
  };

  const copyKey = (key) => { navigator.clipboard.writeText(key); };

  if (loading) return <div className="flex items-center justify-center h-96"><Loader2 className="w-8 h-8 text-primary-500 animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">API Keys</h1>
          <p className="text-dark-400 mt-1">Manage your LLM provider API keys</p>
        </div>
        <button onClick={() => { setShowModal(true); setNewKey(null); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-medium transition-colors">
          <Plus className="w-5 h-5" /> Add Key
        </button>
      </div>

      {newKey && (
        <div className="glass rounded-2xl p-5 border border-emerald-500/30 bg-emerald-500/10">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-400 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-emerald-400 font-semibold mb-1">API Key Created</h3>
              <p className="text-sm text-dark-300 mb-3">Copy this key now. It won't be shown again.</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 p-3 bg-dark-800 rounded-lg text-sm text-white font-mono break-all">{newKey.key}</code>
                <button onClick={() => copyKey(newKey.key)} className="p-2 bg-dark-700 hover:bg-dark-600 rounded-lg text-dark-300 hover:text-white"><Copy className="w-4 h-4" /></button>
              </div>
            </div>
          </div>
        </div>
      )}

      {keys.length === 0 && !newKey ? (
        <div className="glass rounded-2xl p-12 text-center">
          <Key className="w-16 h-16 text-dark-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No API keys</h3>
          <p className="text-dark-400 mb-6">Add your OpenAI or Anthropic API keys to start tracking</p>
          <button onClick={() => setShowModal(true)} className="px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-medium">Add First Key</button>
        </div>
      ) : (
        <div className="space-y-3">
          {keys.map((key) => (
            <div key={key.id} className="glass rounded-2xl p-5 card-hover">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${key.is_active ? 'bg-primary-500/20' : 'bg-dark-700'}`}>
                    <Shield className={`w-6 h-6 ${key.is_active ? 'text-primary-400' : 'text-dark-500'}`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-white">{key.name}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${key.is_active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-dark-700 text-dark-400'}`}>
                        {key.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-sm text-dark-400">
                      <span className="capitalize">{key.provider}</span>
                      <span>{key.key_prefix}...</span>
                      {key.monthly_limit && <span>Limit: ${key.monthly_limit}/mo</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right mr-4">
                    <p className="text-sm font-medium text-white">${parseFloat(key.current_usage || 0).toFixed(2)}</p>
                    <p className="text-xs text-dark-400">used this month</p>
                  </div>
                  <button onClick={() => handleToggle(key.id)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${key.is_active ? 'bg-dark-700 hover:bg-dark-600 text-dark-300' : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400'}`}>
                    {key.is_active ? 'Disable' : 'Enable'}
                  </button>
                  <button onClick={() => handleDelete(key.id)} className="p-2 text-dark-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="glass rounded-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Add API Key</h2>
              <button onClick={() => setShowModal(false)} className="p-2 text-dark-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">Provider</label>
                <select value={form.provider} onChange={(e) => setForm({ ...form, provider: e.target.value })}
                  className="w-full px-4 py-3 bg-dark-800 border border-dark-600 rounded-xl text-white focus:outline-none focus:border-primary-500">
                  <option value="openai">OpenAI</option>
                  <option value="anthropic">Anthropic</option>
                  <option value="google">Google AI</option>
                  <option value="cohere">Cohere</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">Key Name</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-3 bg-dark-800 border border-dark-600 rounded-xl text-white placeholder-dark-400 focus:outline-none focus:border-primary-500"
                  placeholder="" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">Monthly Limit ($)</label>
                <input type="number" step="0.01" value={form.monthly_limit} onChange={(e) => setForm({ ...form, monthly_limit: e.target.value })}
                  className="w-full px-4 py-3 bg-dark-800 border border-dark-600 rounded-xl text-white placeholder-dark-400 focus:outline-none focus:border-primary-500"
                  placeholder="" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving}
                  className="flex-1 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-medium flex items-center justify-center gap-2">
                  {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Add Key'}
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

export default ApiKeys;

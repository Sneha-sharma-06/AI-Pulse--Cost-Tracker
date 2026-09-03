import { useState, useEffect } from 'react';
import { projectsAPI } from '../utils/api';
import { useTheme } from '../context/ThemeContext';
import { Folder, Plus, Trash2, Edit, Loader2, DollarSign, Activity, X } from 'lucide-react';

const Projects = () => {
  const { theme } = useTheme();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', budget_limit: '', color: '#0ea5e9' });
  const [saving, setSaving] = useState(false);

  const colors = ['#0ea5e9', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1', '#14b8a6', '#e11d48'];

  useEffect(() => { fetchProjects(); }, []);

  const fetchProjects = async () => {
    try {
      const res = await projectsAPI.getProjects();
      setProjects(res.data);
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingProject) {
        await projectsAPI.updateProject(editingProject.id, form);
      } else {
        await projectsAPI.createProject(form);
      }
      setShowModal(false);
      setEditingProject(null);
      setForm({ name: '', description: '', budget_limit: '', color: '#0ea5e9' });
      fetchProjects();
    } catch (error) { console.error(error); }
    finally { setSaving(false); }
  };

  const handleEdit = (project) => {
    setEditingProject(project);
    setForm({ name: project.name, description: project.description || '', budget_limit: project.budget_limit || '', color: project.color });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this project?')) return;
    try { await projectsAPI.deleteProject(id); fetchProjects(); }
    catch (error) { console.error(error); }
  };

  if (loading) return <div className="flex items-center justify-center h-96"><Loader2 className="w-8 h-8 text-primary-500 animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Projects</h1>
          <p className="text-dark-400 mt-1">Track costs by project or feature</p>
        </div>
        <button onClick={() => { setShowModal(true); setEditingProject(null); setForm({ name: '', description: '', budget_limit: '', color: '#0ea5e9' }); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-medium transition-colors">
          <Plus className="w-5 h-5" /> New Project
        </button>
      </div>

      {projects.length === 0 ? (
        <div className={`glass rounded-2xl p-12 text-center ${theme === 'light' ? 'bg-white border border-slate-200' : ''}`}>
          <Folder className={`w-16 h-16 mx-auto mb-4 ${theme === 'light' ? 'text-slate-300' : 'text-dark-600'}`} />
          <h3 className={`text-lg font-semibold mb-2 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>No projects yet</h3>
          <p className={`mb-6 ${theme === 'light' ? 'text-slate-500' : 'text-dark-400'}`}>Create your first project to start tracking costs</p>
          <button onClick={() => setShowModal(true)} className="px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-medium transition-colors">
            Create Project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <div key={project.id} className={`glass rounded-2xl p-5 card-hover ${theme === 'light' ? 'bg-white border border-slate-200' : ''}`}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${project.color}20` }}>
                    <Folder className="w-5 h-5" style={{ color: project.color }} />
                  </div>
                  <div>
                    <h3 className={`font-semibold ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{project.name}</h3>
                    {project.description && <p className={`text-xs mt-0.5 ${theme === 'light' ? 'text-slate-500' : 'text-dark-400'}`}>{project.description}</p>}
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => handleEdit(project)} className={`p-1.5 rounded-lg ${theme === 'light' ? 'text-slate-400 hover:text-slate-900 hover:bg-slate-100' : 'text-dark-400 hover:text-white hover:bg-dark-700'}`}><Edit className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(project.id)} className={`p-1.5 rounded-lg ${theme === 'light' ? 'text-slate-400 hover:text-red-600 hover:bg-red-50' : 'text-dark-400 hover:text-red-400 hover:bg-red-500/10'}`}><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className={`p-3 rounded-xl ${theme === 'light' ? 'bg-slate-50' : 'bg-dark-800/50'}`}>
                  <div className={`flex items-center gap-1 mb-1 ${theme === 'light' ? 'text-slate-500' : 'text-dark-400'}`}><DollarSign className="w-3 h-3" /><span className="text-xs">Monthly Cost</span></div>
                  <p className="text-lg font-bold" style={{ color: project.color }}>${parseFloat(project.monthly_cost || 0).toFixed(2)}</p>
                </div>
                <div className={`p-3 rounded-xl ${theme === 'light' ? 'bg-slate-50' : 'bg-dark-800/50'}`}>
                  <div className={`flex items-center gap-1 mb-1 ${theme === 'light' ? 'text-slate-500' : 'text-dark-400'}`}><Activity className="w-3 h-3" /><span className="text-xs">Total Calls</span></div>
                  <p className="text-lg font-bold text-cyan-500">{project.total_calls || 0}</p>
                </div>
              </div>
              {project.budget_limit && (
                <div className="mt-3">
                  <div className={`flex items-center justify-between text-xs mb-1 ${theme === 'light' ? 'text-slate-500' : 'text-dark-400'}`}>
                    <span>Budget</span>
                    <span>${parseFloat(project.monthly_cost || 0).toFixed(2)} / ${project.budget_limit}</span>
                  </div>
                  <div className={`h-1.5 rounded-full overflow-hidden ${theme === 'light' ? 'bg-slate-200' : 'bg-dark-700'}`}>
                    <div className="h-full rounded-full" style={{ backgroundColor: project.color, width: `${Math.min(100, (project.monthly_cost / project.budget_limit) * 100)}%` }} />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className={`glass rounded-2xl w-full max-w-md p-6 ${theme === 'light' ? 'bg-white border border-slate-200' : ''}`} onClick={(e) => e.stopPropagation()}>
            <div className={`flex items-center justify-between mb-6`}>
              <h2 className={`text-xl font-bold ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{editingProject ? 'Edit Project' : 'New Project'}</h2>
              <button onClick={() => setShowModal(false)} className={`p-2 ${theme === 'light' ? 'text-slate-400 hover:text-slate-900' : 'text-dark-400 hover:text-white'}`}><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${theme === 'light' ? 'text-slate-700' : 'text-dark-300'}`}>Project Name</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className={`w-full px-4 py-3 rounded-xl focus:outline-none focus:border-primary-500 ${theme === 'light' ? 'bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400' : 'bg-dark-800 border border-dark-600 text-white placeholder-dark-400'}`}
                  placeholder="" required />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 ${theme === 'light' ? 'text-slate-700' : 'text-dark-300'}`}>Description</label>
                <input type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className={`w-full px-4 py-3 rounded-xl focus:outline-none focus:border-primary-500 ${theme === 'light' ? 'bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400' : 'bg-dark-800 border border-dark-600 text-white placeholder-dark-400'}`}
                  placeholder="" />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 ${theme === 'light' ? 'text-slate-700' : 'text-dark-300'}`}>Monthly Budget ($)</label>
                <input type="number" step="0.01" value={form.budget_limit} onChange={(e) => setForm({ ...form, budget_limit: e.target.value })}
                  className={`w-full px-4 py-3 rounded-xl focus:outline-none focus:border-primary-500 ${theme === 'light' ? 'bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400' : 'bg-dark-800 border border-dark-600 text-white placeholder-dark-400'}`}
                  placeholder="" />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 ${theme === 'light' ? 'text-slate-700' : 'text-dark-300'}`}>Color</label>
                <div className="grid grid-cols-6 gap-2 mb-3">
                  {colors.map((c) => (
                    <button key={c} type="button" onClick={() => setForm({ ...form, color: c })}
                      className={`w-10 h-10 rounded-xl transition-all flex items-center justify-center ${form.color === c ? 'ring-2 ring-offset-2 scale-110' : 'hover:scale-105'}`}
                      style={{ 
                        backgroundColor: c,
                        ringColor: form.color === c ? c : 'transparent',
                        '--tw-ring-color': form.color === c ? c : 'transparent'
                      }}>
                      {form.color === c && <span className="text-white text-lg font-bold">✓</span>}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <label className={`text-xs ${theme === 'light' ? 'text-slate-500' : 'text-dark-400'}`}>Custom:</label>
                  <input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })}
                    className="w-8 h-8 rounded cursor-pointer border-0" />
                  <span className={`text-sm font-mono ${theme === 'light' ? 'text-slate-700' : 'text-white'}`}>{form.color}</span>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving}
                  className="flex-1 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2">
                  {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : editingProject ? 'Save Changes' : 'Create Project'}
                </button>
                <button type="button" onClick={() => setShowModal(false)} className={`px-6 py-3 rounded-xl transition-colors ${theme === 'light' ? 'bg-slate-100 hover:bg-slate-200 text-slate-700' : 'bg-dark-700 hover:bg-dark-600 text-white'}`}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Projects;

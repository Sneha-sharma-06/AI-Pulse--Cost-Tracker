import { useState, useEffect } from 'react';
import { logsAPI } from '../utils/api';
import {
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  Trash2,
  Loader2
} from 'lucide-react';

const Logs = () => {
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    model: '',
    provider: '',
    start_date: '',
    end_date: ''
  });

  useEffect(() => {
    fetchLogs();
  }, [pagination.page, filters]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const response = await logsAPI.getLogs({
        page: pagination.page,
        limit: 20,
        ...filters
      });
      setLogs(response.data.logs);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this log?')) {
      try {
        await logsAPI.deleteLog(id);
        fetchLogs();
      } catch (error) {
        console.error('Error deleting log:', error);
      }
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const clearFilters = () => {
    setFilters({ model: '', provider: '', start_date: '', end_date: '' });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getModelColor = (model) => {
    if (model.includes('gpt-4')) return 'bg-green-500/20 text-green-400';
    if (model.includes('gpt-3.5')) return 'bg-green-400/20 text-green-300';
    if (model.includes('opus')) return 'bg-purple-500/20 text-purple-400';
    if (model.includes('sonnet')) return 'bg-purple-400/20 text-purple-300';
    if (model.includes('haiku')) return 'bg-purple-300/20 text-purple-200';
    return 'bg-primary-500/20 text-primary-400';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white">API Logs</h1>
        <p className="text-dark-400 mt-1">Track all your LLM API calls</p>
      </div>

      {/* Filters */}
      <div className="glass rounded-2xl p-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[150px]">
            <label className="block text-xs text-dark-400 mb-1">Model</label>
            <select
              value={filters.model}
              onChange={(e) => handleFilterChange('model', e.target.value)}
              className="w-full px-3 py-2 bg-dark-800 border border-dark-600 rounded-xl text-white text-sm focus:outline-none focus:border-primary-500"
            >
              <option value="">All Models</option>
              <option value="gpt-4">GPT-4</option>
              <option value="gpt-4-turbo">GPT-4 Turbo</option>
              <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
              <option value="claude-3-opus">Claude 3 Opus</option>
              <option value="claude-3-sonnet">Claude 3 Sonnet</option>
              <option value="claude-3-haiku">Claude 3 Haiku</option>
            </select>
          </div>

          <div className="flex-1 min-w-[150px]">
            <label className="block text-xs text-dark-400 mb-1">Provider</label>
            <select
              value={filters.provider}
              onChange={(e) => handleFilterChange('provider', e.target.value)}
              className="w-full px-3 py-2 bg-dark-800 border border-dark-600 rounded-xl text-white text-sm focus:outline-none focus:border-primary-500"
            >
              <option value="">All Providers</option>
              <option value="openai">OpenAI</option>
              <option value="anthropic">Anthropic</option>
            </select>
          </div>

          <div className="flex-1 min-w-[150px]">
            <label className="block text-xs text-dark-400 mb-1">Start Date</label>
            <input
              type="date"
              value={filters.start_date}
              onChange={(e) => handleFilterChange('start_date', e.target.value)}
              className="w-full px-3 py-2 bg-dark-800 border border-dark-600 rounded-xl text-white text-sm focus:outline-none focus:border-primary-500"
            />
          </div>

          <div className="flex-1 min-w-[150px]">
            <label className="block text-xs text-dark-400 mb-1">End Date</label>
            <input
              type="date"
              value={filters.end_date}
              onChange={(e) => handleFilterChange('end_date', e.target.value)}
              className="w-full px-3 py-2 bg-dark-800 border border-dark-600 rounded-xl text-white text-sm focus:outline-none focus:border-primary-500"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={clearFilters}
              className="px-4 py-2 bg-dark-700 hover:bg-dark-600 text-white rounded-xl text-sm transition-colors"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="glass rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-dark-400">
            <Search className="w-12 h-12 mb-4 opacity-50" />
            <p>No logs found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-dark-700">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-dark-400 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-dark-400 uppercase">Model</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-dark-400 uppercase">Provider</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-dark-400 uppercase">Endpoint</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-dark-400 uppercase">Tokens</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-dark-400 uppercase">Cost</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-dark-400 uppercase">Latency</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-dark-400 uppercase">Time</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-dark-400 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-700/50">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-dark-800/50 transition-colors">
                      <td className="px-4 py-3">
                        {log.status === 'success' ? (
                          <CheckCircle className="w-5 h-5 text-emerald-400" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-400" />
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-lg text-xs font-medium ${getModelColor(log.model)}`}>
                          {log.model}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-dark-300 capitalize">{log.provider}</td>
                      <td className="px-4 py-3 text-sm text-dark-300">{log.endpoint}</td>
                      <td className="px-4 py-3 text-sm text-right text-dark-300">{log.total_tokens.toLocaleString()}</td>
                      <td className="px-4 py-3 text-sm text-right text-primary-400 font-medium">${log.total_cost.toFixed(4)}</td>
                      <td className="px-4 py-3 text-sm text-right text-dark-300">{log.latency_ms}ms</td>
                      <td className="px-4 py-3 text-sm text-dark-400">{formatDate(log.created_at)}</td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleDelete(log.id)}
                          className="p-1.5 text-dark-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-dark-700">
              <p className="text-sm text-dark-400">
                Showing {((pagination.page - 1) * 20) + 1} to {Math.min(pagination.page * 20, pagination.total)} of {pagination.total} logs
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                  disabled={pagination.page === 1}
                  className="p-2 rounded-lg hover:bg-dark-700 text-dark-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="text-sm text-dark-300">
                  Page {pagination.page} of {pagination.pages}
                </span>
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.pages, prev.page + 1) }))}
                  disabled={pagination.page === pagination.pages}
                  className="p-2 rounded-lg hover:bg-dark-700 text-dark-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Logs;

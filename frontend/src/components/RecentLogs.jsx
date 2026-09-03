import { useState, useEffect } from 'react';
import { logsAPI } from '../utils/api';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

const RecentLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecentLogs();
  }, []);

  const fetchRecentLogs = async () => {
    try {
      const response = await logsAPI.getRecent(8);
      setLogs(response.data);
    } catch (error) {
      console.error('Error fetching recent logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 text-primary-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-3 max-h-80 overflow-y-auto">
      {logs.length === 0 ? (
        <div className="text-center text-dark-400 py-8">No logs yet</div>
      ) : (
        logs.map((log) => (
          <div
            key={log.id}
            className="flex items-center gap-3 p-3 bg-dark-800/50 rounded-xl hover:bg-dark-800 transition-colors"
          >
            <div className={`p-1.5 rounded-lg ${log.status === 'success' ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}>
              {log.status === 'success' ? (
                <CheckCircle className="w-4 h-4 text-emerald-400" />
              ) : (
                <XCircle className="w-4 h-4 text-red-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-white truncate">{log.model}</span>
                <span className="text-xs text-dark-400">{log.endpoint}</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-dark-400 mt-1">
                <span>{log.total_tokens} tokens</span>
                <span>${log.total_cost.toFixed(4)}</span>
              </div>
            </div>
            <span className="text-xs text-dark-500 whitespace-nowrap">{formatTime(log.created_at)}</span>
          </div>
        ))
      )}
    </div>
  );
};

export default RecentLogs;

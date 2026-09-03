import { useState, useEffect } from 'react';
import { analyticsAPI } from '../utils/api';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';
import {
  Target,
  Zap,
  Clock,
  TrendingUp,
  Loader2
} from 'lucide-react';

const Analytics = () => {
  const [modelComparison, setModelComparison] = useState([]);
  const [promptEfficiency, setPromptEfficiency] = useState([]);
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState(30);

  useEffect(() => {
    fetchData();
  }, [timeRange]);

  const fetchData = async () => {
    try {
      const [modelRes, promptRes, forecastRes] = await Promise.all([
        analyticsAPI.getModelComparison(timeRange),
        analyticsAPI.getPromptEfficiency(timeRange),
        analyticsAPI.getForecast()
      ]);

      setModelComparison(modelRes.data);
      setPromptEfficiency(promptRes.data);
      setForecast(forecastRes.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-12 h-12 text-primary-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Analytics</h1>
          <p className="text-dark-400 mt-1">Deep insights into your AI usage</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-dark-400">Days:</label>
          <input
            type="number"
            min="1"
            max="365"
            value={timeRange}
            onChange={(e) => setTimeRange(Number(e.target.value) || 1)}
            className="w-20 px-3 py-2 bg-dark-800 border border-dark-600 rounded-xl text-white text-center focus:outline-none focus:border-primary-500"
          />
        </div>
      </div>

      {/* Model Comparison Chart */}
      <div className="glass rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-primary-400" />
          Model Performance Comparison
        </h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={modelComparison} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="model" stroke="#64748b" tick={{ fontSize: 12 }} />
              <YAxis yAxisId="left" stroke="#64748b" tick={{ fontSize: 12 }} />
              <YAxis yAxisId="right" orientation="right" stroke="#64748b" tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '12px'
                }}
              />
              <Bar yAxisId="left" dataKey="total_cost" fill="#0ea5e9" radius={[4, 4, 0, 0]} name="Cost ($)" />
              <Bar yAxisId="right" dataKey="avg_latency" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Avg Latency (ms)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Model Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {modelComparison.map((model, index) => (
          <div key={index} className="glass rounded-2xl p-5 card-hover">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-white">{model.model}</h4>
              <span className="text-xs px-2 py-1 bg-primary-500/20 text-primary-400 rounded-lg">
                {model.total_calls} calls
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-dark-400">Total Cost</p>
                <p className="text-lg font-bold text-primary-400">${model.total_cost.toFixed(4)}</p>
              </div>
              <div>
                <p className="text-xs text-dark-400">Cost/1K Tokens</p>
                <p className="text-lg font-bold text-cyan-400">${(model.cost_per_1k_tokens || 0).toFixed(4)}</p>
              </div>
              <div>
                <p className="text-xs text-dark-400">Avg Latency</p>
                <p className="text-lg font-bold text-amber-400">{Math.round(model.avg_latency)}ms</p>
              </div>
              <div>
                <p className="text-xs text-dark-400">Success Rate</p>
                <p className="text-lg font-bold text-emerald-400">{(model.success_rate || 100).toFixed(1)}%</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Prompt Efficiency */}
      <div className="glass rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Target className="w-5 h-5 text-cyan-400" />
          Endpoint Efficiency Analysis
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-dark-700">
                <th className="px-4 py-3 text-left text-xs font-semibold text-dark-400 uppercase">Endpoint</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-dark-400 uppercase">Usage</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-dark-400 uppercase">Avg Tokens</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-dark-400 uppercase">Avg Cost</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-dark-400 uppercase">Avg Latency</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-700/50">
              {promptEfficiency.map((item, index) => (
                <tr key={index} className="hover:bg-dark-800/50">
                  <td className="px-4 py-3 text-sm text-white font-medium">{item.endpoint}</td>
                  <td className="px-4 py-3 text-sm text-right text-dark-300">{item.usage_count}</td>
                  <td className="px-4 py-3 text-sm text-right text-dark-300">{Math.round(item.avg_total_tokens)}</td>
                  <td className="px-4 py-3 text-sm text-right text-primary-400">${(item.avg_cost || 0).toFixed(4)}</td>
                  <td className="px-4 py-3 text-sm text-right text-amber-400">{Math.round(item.avg_latency)}ms</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Forecast Chart */}
      {forecast && (
        <div className="glass rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            30-Day Cost Projection
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={forecast.daily_forecast?.slice(0, 14)} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="day" stroke="#64748b" tick={{ fontSize: 12 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '12px'
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="projected_cost"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ fill: '#10b981', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 text-center">
            <p className="text-dark-400">Projected 30-day total: <span className="text-white font-semibold">${forecast.forecast_30_days.toFixed(2)}</span></p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Analytics;

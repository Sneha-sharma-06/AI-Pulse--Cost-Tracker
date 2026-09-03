import { useState, useEffect } from 'react';
import { dashboardAPI, analyticsAPI } from '../utils/api';
import StatsCard from '../components/StatsCard';
import CostByModelChart from '../components/CostByModelChart';
import DailyTrendChart from '../components/DailyTrendChart';
import ProviderPieChart from '../components/ProviderPieChart';
import RecentLogs from '../components/RecentLogs';
import ForecastCard from '../components/ForecastCard';
import {
  DollarSign,
  Coins,
  Activity,
  Zap,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle
} from 'lucide-react';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [costByModel, setCostByModel] = useState([]);
  const [dailyTrend, setDailyTrend] = useState([]);
  const [costByProvider, setCostByProvider] = useState([]);
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState(30);

  useEffect(() => {
    fetchData();
  }, [timeRange]);

  const fetchData = async () => {
    try {
      const [statsRes, modelRes, trendRes, providerRes, forecastRes] = await Promise.all([
        dashboardAPI.getStats(),
        dashboardAPI.getCostByModel(timeRange),
        dashboardAPI.getDailyTrend(timeRange),
        dashboardAPI.getCostByProvider(timeRange),
        analyticsAPI.getForecast()
      ]);

      setStats(statsRes.data);
      setCostByModel(modelRes.data);
      setDailyTrend(trendRes.data);
      setCostByProvider(providerRes.data);
      setForecast(forecastRes.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-dark-400 mt-1">Monitor your AI usage and costs in real-time</p>
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Today's Cost"
          value={`$${stats?.todayCost || '0.00'}`}
          icon={DollarSign}
          trend={stats?.costChange > 0 ? 'up' : 'down'}
          trendValue={`${Math.abs(stats?.costChange || 0)}%`}
          color="primary"
        />
        <StatsCard
          title="Monthly Cost"
          value={`$${stats?.monthCost || '0.00'}`}
          icon={TrendingUp}
          subtitle="This month"
          color="cyan"
        />
        <StatsCard
          title="API Calls Today"
          value={stats?.todayCalls || 0}
          icon={Activity}
          subtitle={`${stats?.monthCalls || 0} this month`}
          color="emerald"
        />
        <StatsCard
          title="Avg Latency"
          value={`${stats?.avgLatency || 0}ms`}
          icon={Clock}
          subtitle={`${stats?.successRate || 100}% success rate`}
          color="amber"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Trend Chart */}
        <div className="lg:col-span-2 glass rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Cost Trend</h3>
          <DailyTrendChart data={dailyTrend} />
        </div>

        {/* Provider Pie Chart */}
        <div className="glass rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">By Provider</h3>
          <ProviderPieChart data={costByProvider} />
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cost by Model */}
        <div className="lg:col-span-1 glass rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Cost by Model</h3>
          <CostByModelChart data={costByModel} />
        </div>

        {/* Recent Logs */}
        <div className="lg:col-span-1 glass rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
          <RecentLogs />
        </div>

        {/* Forecast */}
        <div className="lg:col-span-1 glass rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">30-Day Forecast</h3>
          <ForecastCard data={forecast} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

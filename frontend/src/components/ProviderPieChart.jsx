import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const ProviderPieChart = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-dark-400">
        No data available
      </div>
    );
  }

  const COLORS = ['#0ea5e9', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-dark-800 border border-dark-600 rounded-xl p-4 shadow-xl">
          <p className="text-white font-semibold capitalize">{data.provider}</p>
          <div className="mt-2 space-y-1">
            <p className="text-primary-400">${data.total_cost.toFixed(4)}</p>
            <p className="text-dark-300 text-sm">{data.call_count} calls</p>
            <p className="text-dark-400 text-sm">{(data.total_tokens / 1000).toFixed(1)}K tokens</p>
          </div>
        </div>
      );
    }
    return null;
  };

  const totalCost = data.reduce((sum, item) => sum + item.total_cost, 0);

  return (
    <div className="space-y-4">
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={5}
              dataKey="total_cost"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="space-y-3">
        {data.map((item, index) => {
          const percentage = ((item.total_cost / totalCost) * 100).toFixed(1);
          return (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className="text-sm text-white capitalize">{item.provider}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-dark-300">${item.total_cost.toFixed(4)}</span>
                <span className="text-xs text-dark-400">{percentage}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProviderPieChart;

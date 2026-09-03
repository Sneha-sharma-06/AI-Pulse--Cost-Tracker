import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const DailyTrendChart = ({ data }) => {
  const formatDate = (date) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatCost = (value) => `$${value.toFixed(2)}`;

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-dark-800 border border-dark-600 rounded-xl p-4 shadow-xl">
          <p className="text-dark-300 text-sm mb-2">{formatDate(label)}</p>
          <div className="space-y-1">
            <p className="text-primary-400 font-semibold">
              Cost: {formatCost(payload[0].value)}
            </p>
            {payload[1] && (
              <p className="text-cyan-400 text-sm">
                Tokens: {payload[1].value?.toLocaleString()}
              </p>
            )}
            {payload[2] && (
              <p className="text-emerald-400 text-sm">
                Calls: {payload[2].value}
              </p>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-64 sm:h-80">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis
            dataKey="date"
            tickFormatter={formatDate}
            stroke="#64748b"
            tick={{ fontSize: 12 }}
          />
          <YAxis
            tickFormatter={formatCost}
            stroke="#64748b"
            tick={{ fontSize: 12 }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="cost"
            stroke="#0ea5e9"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorCost)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default DailyTrendChart;

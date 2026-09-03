const CostByModelChart = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-dark-400">
        No data available
      </div>
    );
  }

  const maxCost = Math.max(...data.map(d => d.total_cost));

  const getModelColor = (model) => {
    const colors = {
      'gpt-4': 'from-green-500 to-emerald-500',
      'gpt-4-turbo': 'from-green-400 to-emerald-400',
      'gpt-3.5-turbo': 'from-green-300 to-emerald-300',
      'claude-3-opus': 'from-purple-500 to-violet-500',
      'claude-3-sonnet': 'from-purple-400 to-violet-400',
      'claude-3-haiku': 'from-purple-300 to-violet-300'
    };
    return colors[model] || 'from-primary-500 to-cyan-500';
  };

  return (
    <div className="space-y-4">
      {data.map((item, index) => {
        const percentage = (item.total_cost / maxCost) * 100;
        return (
          <div key={index} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${getModelColor(item.model)}`}></div>
                <span className="text-sm font-medium text-white">{item.model}</span>
              </div>
              <span className="text-sm text-dark-300">${item.total_cost.toFixed(4)}</span>
            </div>
            <div className="h-2 bg-dark-700 rounded-full overflow-hidden">
              <div
                className={`h-full bg-gradient-to-r ${getModelColor(item.model)} rounded-full transition-all duration-500`}
                style={{ width: `${percentage}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-dark-400">
              <span>{item.call_count} calls</span>
              <span>{(item.total_tokens / 1000).toFixed(1)}K tokens</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default CostByModelChart;

import { TrendingUp, Calendar, DollarSign } from 'lucide-react';

const ForecastCard = ({ data }) => {
  if (!data) {
    return (
      <div className="flex items-center justify-center h-64 text-dark-400">
        No forecast data
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main forecast */}
      <div className="text-center p-4 bg-gradient-to-br from-primary-500/10 to-cyan-500/10 rounded-xl border border-primary-500/20">
        <p className="text-dark-400 text-sm mb-1">Projected 30-Day Cost</p>
        <p className="text-3xl font-bold gradient-text">${data.forecast_30_days.toFixed(2)}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 bg-dark-800/50 rounded-xl">
          <div className="flex items-center gap-2 text-dark-400 mb-1">
            <DollarSign className="w-4 h-4" />
            <span className="text-xs">Daily Avg</span>
          </div>
          <p className="text-lg font-semibold text-white">${data.current_avg_daily.toFixed(4)}</p>
        </div>
        <div className="p-3 bg-dark-800/50 rounded-xl">
          <div className="flex items-center gap-2 text-dark-400 mb-1">
            <TrendingUp className="w-4 h-4" />
            <span className="text-xs">Growth Rate</span>
          </div>
          <p className={`text-lg font-semibold ${data.growth_rate > 1 ? 'text-amber-400' : 'text-emerald-400'}`}>
            {data.growth_rate > 1 ? '+' : ''}{((data.growth_rate - 1) * 100).toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Mini forecast bars */}
      <div>
        <p className="text-xs text-dark-400 mb-2">Next 7 Days</p>
        <div className="flex items-end gap-1 h-16">
          {data.daily_forecast?.slice(0, 7).map((day, index) => {
            const maxCost = Math.max(...data.daily_forecast.slice(0, 7).map(d => d.projected_cost));
            const height = (day.projected_cost / maxCost) * 100;
            return (
              <div key={index} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full bg-gradient-to-t from-primary-500 to-cyan-400 rounded-t"
                  style={{ height: `${height}%`, minHeight: '4px' }}
                />
                <span className="text-[10px] text-dark-500">D{day.day}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Disclaimer */}
      <p className="text-xs text-dark-500 text-center">
        Based on your usage patterns over the last 7 days
      </p>
    </div>
  );
};

export default ForecastCard;

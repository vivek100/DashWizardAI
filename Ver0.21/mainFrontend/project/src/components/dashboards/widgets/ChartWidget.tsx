import React, { useState, useEffect } from 'react';
import { useDataStore } from '@/store/dataStore';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { Widget } from '@/types';

interface ChartWidgetProps {
  widget: Widget;
}

const COLOR_SCHEMES = {
  default: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16', '#F97316'],
  blue: ['#1E40AF', '#3B82F6', '#60A5FA', '#93C5FD', '#DBEAFE', '#EFF6FF'],
  green: ['#166534', '#16A34A', '#22C55E', '#4ADE80', '#86EFAC', '#DCFCE7'],
  purple: ['#581C87', '#7C3AED', '#8B5CF6', '#A78BFA', '#C4B5FD', '#E9D5FF']
};

export function ChartWidget({ widget }: ChartWidgetProps) {
  const { executeQuery } = useDataStore();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [widget.config.query, widget.config.dataSource, widget.config]);

  const loadData = async () => {
    if (!widget.config.query && !widget.config.dataSource) {
      setData([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let query = widget.config.query;
      if (!query && widget.config.dataSource) {
        query = `SELECT * FROM "${widget.config.dataSource}" LIMIT 50`;
      }

      if (query) {
        const result = await executeQuery(query);
        setData(result);
      }
    } catch (err) {
      setError(err.message);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const getColors = () => {
    const scheme = widget.config.colorScheme || 'default';
    if (scheme === 'custom' && widget.config.customColors?.length > 0) {
      return widget.config.customColors;
    }
    return COLOR_SCHEMES[scheme] || COLOR_SCHEMES.default;
  };

  const formatValue = (value: any) => {
    if (typeof value === 'number') {
      if (widget.config.format === 'currency') {
        return new Intl.NumberFormat('en-US', { 
          style: 'currency', 
          currency: 'USD' 
        }).format(value);
      } else if (widget.config.format === 'percentage') {
        return `${(value * 100).toFixed(1)}%`;
      } else if (widget.config.format === 'number' && (widget.title.toLowerCase().includes('attrition') || widget.title.toLowerCase().includes('rate'))) {
        // For attrition rates that are already in percentage format
        return `${value.toFixed(1)}%`;
      }
      return value.toLocaleString();
    }
    return value;
  };

  const renderChart = () => {
    if (data.length === 0) return null;

    const chartType = widget.config.chartType || 'bar';
    const colors = getColors();
    const showLabels = widget.config.showLabels !== false;
    const showLegend = widget.config.showLegend !== false;
    
    // Use configured columns or fallback to first available columns
    const keys = Object.keys(data[0] || {});
    const xKey = widget.config.xColumn || keys[0];
    const yKeys = widget.config.yColumn ? [widget.config.yColumn] : keys.slice(1).filter(key => {
      const value = data[0][key];
      return !isNaN(Number(value));
    });

    const chartData = data.map(item => ({
      ...item,
      [xKey]: String(item[xKey])
    }));

    const customTooltip = ({ active, payload, label }) => {
      if (active && payload && payload.length) {
        return (
          <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
            <p className="font-medium text-gray-900">{`${xKey}: ${label}`}</p>
            {payload.map((entry, index) => (
              <p key={index} style={{ color: entry.color }} className="text-sm">
                {`${entry.dataKey}: ${formatValue(entry.value)}`}
              </p>
            ))}
          </div>
        );
      }
      return null;
    };

    switch (chartType) {
      case 'line':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey={xKey} 
                tick={{ fontSize: 12 }}
                stroke="#666"
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                stroke="#666"
                tickFormatter={formatValue}
              />
              <Tooltip content={customTooltip} />
              {showLegend && <Legend />}
              {yKeys.map((key, index) => (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={colors[index % colors.length]}
                  strokeWidth={3}
                  dot={{ fill: colors[index % colors.length], strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: colors[index % colors.length], strokeWidth: 2 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        );

      case 'area':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey={xKey} 
                tick={{ fontSize: 12 }}
                stroke="#666"
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                stroke="#666"
                tickFormatter={formatValue}
              />
              <Tooltip content={customTooltip} />
              {showLegend && <Legend />}
              {yKeys.map((key, index) => (
                <Area
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stackId="1"
                  stroke={colors[index % colors.length]}
                  fill={colors[index % colors.length]}
                  fillOpacity={0.7}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        );

      case 'pie':
        const pieData = data.slice(0, 8).map((item, index) => ({
          name: String(item[xKey]),
          value: Number(item[yKeys[0]] || 0),
          fill: colors[index % colors.length]
        }));

        return (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={showLabels ? ({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%` : false}
                outerRadius="80%"
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value) => [formatValue(value), yKeys[0]]}
                labelFormatter={(label) => `${xKey}: ${label}`}
              />
              {showLegend && <Legend />}
            </PieChart>
          </ResponsiveContainer>
        );

      default: // bar
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey={xKey} 
                tick={{ fontSize: 12 }}
                stroke="#666"
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                stroke="#666"
                tickFormatter={formatValue}
              />
              <Tooltip content={customTooltip} />
              {showLegend && <Legend />}
              {yKeys.map((key, index) => (
                <Bar
                  key={key}
                  dataKey={key}
                  fill={colors[index % colors.length]}
                  radius={[4, 4, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-sm text-gray-600">Loading chart...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-red-600">
          <p className="text-sm font-medium">Error loading chart</p>
          <p className="text-xs mt-1">{error}</p>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-gray-500">
          <p className="text-sm">No data available</p>
          <p className="text-xs">Configure a data source to display chart</p>
        </div>
      </div>
    );
  }

  const containerStyle = {
    backgroundColor: widget.config.backgroundColor || '#ffffff',
    color: widget.config.textColor || '#000000',
    borderRadius: `${widget.config.borderRadius || 8}px`,
    padding: `${widget.config.padding || 16}px`
  };

  return (
    <div className="h-full" style={containerStyle}>
      <style>
        {widget.config.customCSS && `
          .widget-content {
            ${widget.config.customCSS}
          }
        `}
      </style>
      <div className="h-full widget-content custom-scrollbar">
        {renderChart()}
      </div>
    </div>
  );
}
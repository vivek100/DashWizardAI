import React, { useState, useEffect } from 'react';
import { useDataStore } from '@/store/dataStore';
import { TrendingUp, TrendingDown, Minus, Target } from 'lucide-react';
import { Widget } from '@/types';

interface MetricWidgetProps {
  widget: Widget;
}

export function MetricWidget({ widget }: MetricWidgetProps) {
  const { executeQuery } = useDataStore();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [widget.config.query, widget.config.dataSource, widget.config]);

  const loadData = async () => {
    console.log('Loading data for metric widget', widget);
    if (!widget.config.query && !widget.config.dataSource) {
      setData([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let query = widget.config.query;
      if (!query && widget.config.dataSource) {
        // Default to count for metric widgets
        const aggregation = widget.config.aggregationType?.toUpperCase() || 'COUNT';
        const column = widget.config.metricColumn || '*';
        query = `SELECT ${aggregation}(${column === '*' ? column : `"${column}"`}) as metric_value FROM "${widget.config.dataSource}"`;
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

  const getMetricValue = () => {
    if (data.length === 0) return null;
    
    const firstRow = data[0];
    const values = Object.values(firstRow);
    
    // Find the first numeric value
    for (const value of values) {
      if (typeof value === 'number' || !isNaN(Number(value))) {
        return Number(value);
      }
    }
    
    return null;
  };

  const formatValue = (value: number) => {
    const format = widget.config.format || 'number';
    
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('en-US', { 
          style: 'currency', 
          currency: 'USD',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }).format(value);
      
      case 'percentage':
        return `${value.toFixed(1)}%`;
      
      default:
        // For attrition rates and other metrics that are already in percentage format
        if (widget.title.toLowerCase().includes('attrition') || widget.title.toLowerCase().includes('rate')) {
          return `${value.toFixed(1)}%`;
        }
        if (value >= 1000000) {
          return `${(value / 1000000).toFixed(1)}M`;
        } else if (value >= 1000) {
          return `${(value / 1000).toFixed(1)}K`;
        }
        return value.toLocaleString();
    }
  };

  const getTrendData = () => {
    // Mock trend calculation - in real implementation, this would compare with previous period
    const trend = Math.random() - 0.5; // Random trend for demo
    const percentage = Math.abs(trend * 20).toFixed(1);
    
    return {
      direction: trend > 0.1 ? 'up' : trend < -0.1 ? 'down' : 'neutral',
      percentage,
      isPositive: trend > 0
    };
  };

  const getTrendIcon = (direction: string) => {
    switch (direction) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      default:
        return <Minus className="w-4 h-4 text-gray-400" />;
    }
  };

  const getTrendColor = (direction: string, isPositive: boolean) => {
    if (direction === 'neutral') return 'text-gray-400';
    return isPositive ? 'text-green-500' : 'text-red-500';
  };

  const getComparisonText = () => {
    const period = widget.config.comparisonPeriod || 'previous';
    switch (period) {
      case 'year':
        return 'vs same period last year';
      case 'target':
        return 'vs target';
      default:
        return 'vs previous period';
    }
  };

  const getTargetProgress = (currentValue: number) => {
    const targetValue = widget.config.targetValue;
    if (!targetValue) return null;
    
    const progress = (currentValue / targetValue) * 100;
    return {
      percentage: Math.min(progress, 100),
      isOnTrack: progress >= 90,
      difference: currentValue - targetValue
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Loading metric...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-red-600">
          <p className="text-sm font-medium">Error loading metric</p>
          <p className="text-xs mt-1">{error}</p>
        </div>
      </div>
    );
  }

  const metricValue = getMetricValue();

  if (metricValue === null) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-gray-500">
          <p className="text-sm">No data available</p>
          <p className="text-xs">Configure a data source to display metric</p>
        </div>
      </div>
    );
  }

  const trendData = getTrendData();
  const targetProgress = getTargetProgress(metricValue);
  // Hardcoding to false for now
  const showTrend = false;

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
      <div className="h-full flex flex-col justify-center widget-content custom-scrollbar">
        <div className="text-center space-y-4">
          {/* Main Metric Value */}
          <div>
            <div className="text-4xl font-bold mb-2">
              {formatValue(metricValue)}
            </div>
            
            {/* Trend Indicator */}
            {showTrend && (
              <div className="flex items-center justify-center space-x-2 mb-2">
                {getTrendIcon(trendData.direction)}
                <span className={`text-sm font-medium ${getTrendColor(trendData.direction, trendData.isPositive)}`}>
                  {trendData.percentage}%
                </span>
              </div>
            )}
            
            {showTrend && (
              <div className="text-xs text-gray-500">
                {getComparisonText()}
              </div>
            )}
          </div>

          {/* Target Progress */}
          {targetProgress && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600">Target Progress</span>
                <span className={targetProgress.isOnTrack ? 'text-green-600' : 'text-orange-600'}>
                  {targetProgress.percentage.toFixed(0)}%
                </span>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    targetProgress.isOnTrack ? 'bg-green-500' : 'bg-orange-500'
                  }`}
                  style={{ width: `${targetProgress.percentage}%` }}
                />
              </div>
              
              <div className="flex items-center justify-center space-x-1 text-xs text-gray-500">
                <Target className="w-3 h-3" />
                <span>
                  {targetProgress.difference >= 0 ? '+' : ''}
                  {formatValue(targetProgress.difference)} vs target
                </span>
              </div>
            </div>
          )}

          {/* Additional Context */}
          {widget.config.metricColumn && (
            <div className="text-xs text-gray-400 capitalize">
              {widget.config.aggregationType || 'count'} of {widget.config.metricColumn}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
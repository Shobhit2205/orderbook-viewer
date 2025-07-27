import React from 'react';
import type { OrderImpactMetrics as OrderImpactMetricsType } from '../../types/orderbook';

interface OrderImpactMetricsProps {
  impact: OrderImpactMetricsType;
  className?: string;
}

const OrderImpactMetrics: React.FC<OrderImpactMetricsProps> = ({ impact, className = '' }) => {
  const formatTime = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  const getFillPercentageColor = (percentage: number): string => {
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getMarketImpactColor = (impact: number): string => {
    if (impact < 5) return 'text-green-600';
    if (impact < 15) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getSlippageColor = (slippage: number): string => {
    if (slippage < 0.1) return 'text-green-600';
    if (slippage < 0.5) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border p-4 ${className}`}>
      <h4 className="text-lg font-semibold mb-4 text-gray-800">Order Impact Analysis</h4>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600">Fill %</span>
            <span className={`text-lg font-bold ${getFillPercentageColor(impact.estimatedFillPercentage)}`}>
              {impact.estimatedFillPercentage.toFixed(1)}%
            </span>
          </div>
          <div className="mt-2">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full ${
                  impact.estimatedFillPercentage >= 90 ? 'bg-green-500' :
                  impact.estimatedFillPercentage >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${Math.min(impact.estimatedFillPercentage, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600">Market Impact</span>
            <span className={`text-lg font-bold ${getMarketImpactColor(impact.marketImpact)}`}>
              {impact.marketImpact.toFixed(2)}%
            </span>
          </div>
          <div className="mt-1">
            <span className="text-xs text-gray-500">
              {impact.marketImpact < 5 ? 'Low' : 
               impact.marketImpact < 15 ? 'Medium' : 'High'} impact
            </span>
          </div>
        </div>

        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600">Slippage</span>
            <span className={`text-lg font-bold ${getSlippageColor(impact.slippageEstimation)}`}>
              ${impact.slippageEstimation.toFixed(4)}
            </span>
          </div>
          <div className="mt-1">
            <span className="text-xs text-gray-500">
              {impact.slippageEstimation < 0.1 ? 'Minimal' : 
               impact.slippageEstimation < 0.5 ? 'Moderate' : 'High'} slippage
            </span>
          </div>
        </div>

        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600">Time to Fill</span>
            <span className="text-lg font-bold text-blue-600">
              {impact.timeToFill ? formatTime(impact.timeToFill) : 'N/A'}
            </span>
          </div>
          <div className="mt-1">
            <span className="text-xs text-gray-500">
              {impact.timeToFill && impact.timeToFill < 1000 ? 'Instant' :
               impact.timeToFill && impact.timeToFill < 10000 ? 'Fast' : 'Slow'} execution
            </span>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="text-sm font-medium text-gray-600">Total Value</span>
            <div className="text-lg font-bold text-gray-800">
              ${impact.totalValue.toFixed(2)}
            </div>
          </div>
          <div>
            <span className="text-sm font-medium text-gray-600">Avg Fill Price</span>
            <div className="text-lg font-bold text-gray-800">
              ${impact.averageFillPrice.toFixed(2)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderImpactMetrics; 
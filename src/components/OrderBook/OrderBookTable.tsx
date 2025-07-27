import React, { useEffect, useState } from 'react';
import { OrderBook, OrderBookLevel, OrderPlacement } from '../../types/orderbook';

interface OrderBookTableProps {
  orderbook: OrderBook | null;
  loading?: boolean;
  simulatedOrder?: OrderPlacement | null;
}

const OrderBookTable: React.FC<OrderBookTableProps> = ({ orderbook, loading, simulatedOrder }) => {
  const [tableHeight, setTableHeight] = useState('600px');
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const handleResize = () => {
      const height = window.innerHeight;
      const width = window.innerWidth;
      const newHeight = Math.min(Math.max(height * 0.6, 400), 800);
      
      setIsMobile(width < 768);
      setTableHeight(`${newHeight}px`);
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (loading) {
    return (
      <div className="animate-pulse rounded-lg border shadow-sm bg-white overflow-hidden" style={{ height: tableHeight }}>
        <div className="p-4 border-b bg-gray-50">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
        </div>
        <div className="grid grid-cols-2 gap-0 h-full">
          <div className="space-y-2 p-3 border-r">
            <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
            {Array.from({ length: 15 }).map((_, i) => (
              <div key={i} className="h-6 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="space-y-2 p-3">
            <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
            {Array.from({ length: 15 }).map((_, i) => (
              <div key={i} className="h-6 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!orderbook) {
    return (
      <div className="flex items-center justify-center rounded-lg border shadow-sm bg-white overflow-hidden" style={{ height: tableHeight }}>
        <div className="text-gray-500 flex flex-col items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <p className="font-medium">No orderbook data available</p>
          <p className="text-sm mt-1">Please select a trading pair</p>
        </div>
      </div>
    );
  }

  const calculateCumulativeQuantities = (levels: OrderBookLevel[]): OrderBookLevel[] => {
    let cumulative = 0;
    return levels.map(level => {
      cumulative += level.quantity;
      return { ...level, total: cumulative };
    });
  };

  // Find the max total quantity for visual depth indicator
  const calculateMaxTotal = (levels: OrderBookLevel[]): number => {
    if (levels.length === 0) return 0;
    return Math.max(...levels.map(level => level.total || 0));
  };

  const bidsWithTotal = calculateCumulativeQuantities([...orderbook.bids].reverse());
  const asksWithTotal = calculateCumulativeQuantities(orderbook.asks);
  
  const maxBidTotal = calculateMaxTotal(bidsWithTotal);
  const maxAskTotal = calculateMaxTotal(asksWithTotal);

  // Helper function to check if a level should be highlighted
  const isSimulatedLevel = (levelIndex: number, side: 'bid' | 'ask') => {
    if (!simulatedOrder) return false;
    
    const { order, position } = simulatedOrder;
    const isCorrectSide = (side === 'bid' && order.side === 'sell') || (side === 'ask' && order.side === 'buy');
    
    if (!isCorrectSide) return false;
    
    if (order.orderType === 'market') {
      return levelIndex < Math.ceil(position.quantity / (orderbook.asks[0]?.quantity || 1));
    } else {
      return levelIndex === position.level;
    }
  };

  const formatNumber = (value: number | string | undefined, decimals: number): string => {
    if (value === undefined || value === null) return 'N/A';
    const num = Number(value);
    return isNaN(num) ? 'N/A' : num.toFixed(decimals);
  };

  // Calculate content height dynamically based on device
  const contentHeight = isMobile ? 'auto' : 'calc(100%-80px)';
  const headerHeight = simulatedOrder ? '80px' : '64px';

  return (
    <div className="bg-white rounded-lg shadow-sm border overflow-hidden" style={{ 
      height: isMobile ? 'auto' : tableHeight,
      maxHeight: isMobile ? '100%' : tableHeight
    }}>
      <div className="p-4 border-b bg-gray-50">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <h3 className="text-lg font-semibold text-gray-800">{orderbook.venue} - {orderbook.symbol}</h3>
          <div className="text-sm text-gray-500 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {new Date(orderbook.timestamp).toLocaleTimeString()}
          </div>
        </div>
        {simulatedOrder && (
          <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded">
            <div className="text-sm text-blue-800 flex items-center flex-wrap">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <span className="font-medium">Simulated Order:</span> 
              <span className={`ml-1 ${simulatedOrder.order.side === 'buy' ? 'text-green-700' : 'text-red-700'}`}>
                {simulatedOrder.order.side.toUpperCase()}
              </span> 
              <span className="ml-1">
                {simulatedOrder.order.quantity} @ {simulatedOrder.order.orderType === 'limit' ? `$${simulatedOrder.order.price}` : 'MARKET'}
              </span>
            </div>
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-0" style={{ 
        minHeight: isMobile ? 'auto' : `calc(100% - ${headerHeight})`
      }}>
        {/* Bids Column */}
        <div className="md:border-r border-b md:border-b-0 flex flex-col" style={{
          maxHeight: isMobile ? '50vh' : '100%',
        }}>
          <div className="bg-green-50 p-3 border-b sticky top-0 z-10">
            <h4 className="font-medium text-green-800">Bids</h4>
            <div className="grid grid-cols-3 gap-2 text-xs font-medium text-green-700 mt-2">
              <span>Price</span>
              <span>Quantity</span>
              <span>Total</span>
            </div>
          </div>
          <div className="overflow-y-auto flex-1 relative" style={{ maxHeight: isMobile ? '40vh' : 'none' }}>
            {bidsWithTotal.map((bid, index) => {
              const depthPercentage = ((bid.total || 0) / maxBidTotal) * 100;
              return (
                <div
                  key={`bid-${index}`}
                  className={`
                    relative grid grid-cols-3 gap-2 p-2 text-sm hover:bg-green-50 border-b border-gray-100
                    ${isSimulatedLevel(index, 'bid') 
                      ? 'bg-yellow-100 border-yellow-300 border-l-4 border-l-yellow-500' 
                      : ''
                    }
                  `}
                >
                  {/* Depth indicator */}
                  <div 
                    className="absolute top-0 right-0 bottom-0 bg-green-50 z-0" 
                    style={{ width: `${depthPercentage}%` }}
                  />
                  
                  <span className="font-mono text-green-600 z-10 relative">
                    {formatNumber(bid.price, 2)}
                  </span>
                  <span className="font-mono z-10 relative">
                    {formatNumber(bid.quantity, 4)}
                  </span>
                  <span className="font-mono text-gray-600 z-10 relative">
                    {formatNumber(bid.total, 4)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Asks Column */}
        <div className="flex flex-col" style={{
          maxHeight: isMobile ? '50vh' : '100%',
        }}>
          <div className="bg-red-50 p-3 border-b sticky top-0 z-10">
            <h4 className="font-medium text-red-800">Asks</h4>
            <div className="grid grid-cols-3 gap-2 text-xs font-medium text-red-700 mt-2">
              <span>Price</span>
              <span>Quantity</span>
              <span>Total</span>
            </div>
          </div>
          <div className="overflow-y-auto flex-1 relative" style={{ maxHeight: isMobile ? '40vh' : 'none' }}>
            {asksWithTotal.map((ask, index) => {
              const depthPercentage = ((ask.total || 0) / maxAskTotal) * 100;
              return (
                <div
                  key={`ask-${index}`}
                  className={`
                    relative grid grid-cols-3 gap-2 p-2 text-sm hover:bg-red-50 border-b border-gray-100
                    ${isSimulatedLevel(index, 'ask') 
                      ? 'bg-yellow-100 border-yellow-300 border-l-4 border-l-yellow-500' 
                      : ''
                    }
                  `}
                >
                  {/* Depth indicator */}
                  <div 
                    className="absolute top-0 left-0 bottom-0 bg-red-50 z-0" 
                    style={{ width: `${depthPercentage}%` }}
                  />
                  
                  <span className="font-mono text-red-600 z-10 relative">
                    {formatNumber(ask.price, 2)}
                  </span>
                  <span className="font-mono z-10 relative">
                    {formatNumber(ask.quantity, 4)}
                  </span>
                  <span className="font-mono text-gray-600 z-10 relative">
                    {formatNumber(ask.total, 4)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderBookTable;
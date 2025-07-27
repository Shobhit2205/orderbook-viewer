import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { OrderBook, OrderBookLevel, OrderPlacement } from '@/types/orderbook';

interface MarketDepthChartProps {
  orderbook: OrderBook | null;
  simulatedOrder?: OrderPlacement | null;
  height?: number;
}

interface DepthPoint {
  price: number;
  bidDepth: number;
  askDepth: number;
  side: 'bid' | 'ask';
  quantity: number;
  cumulative: number;
}

const MarketDepthChart: React.FC<MarketDepthChartProps> = ({ 
  orderbook, 
  simulatedOrder, 
  height = 400 
}) => {
  const depthData = useMemo(() => {
    if (!orderbook || !orderbook.bids.length || !orderbook.asks.length) return [];

    const bidsWithDepth: DepthPoint[] = [];
    const asksWithDepth: DepthPoint[] = [];
    
    let bidCumulative = 0;
    let askCumulative = 0;

    const sortedBids = [...orderbook.bids].sort((a, b) => b.price - a.price);
    for (let i = 0; i < sortedBids.length; i++) {
      bidCumulative += sortedBids[i].quantity;
      bidsWithDepth.push({
        price: sortedBids[i].price,
        bidDepth: bidCumulative,
        askDepth: 0,
        side: 'bid',
        quantity: sortedBids[i].quantity,
        cumulative: bidCumulative
      });
    }

    const sortedAsks = [...orderbook.asks].sort((a, b) => a.price - b.price);
    for (let i = 0; i < sortedAsks.length; i++) {
      askCumulative += sortedAsks[i].quantity;
      asksWithDepth.push({
        price: sortedAsks[i].price,
        bidDepth: 0,
        askDepth: askCumulative,
        side: 'ask',
        quantity: sortedAsks[i].quantity,
        cumulative: askCumulative
      });
    }

    const combined = [...bidsWithDepth, ...asksWithDepth].sort((a, b) => a.price - b.price);
    
    let lastBidDepth = 0;
    let lastAskDepth = 0;
    
    return combined.map(point => {
      if (point.side === 'bid') {
        lastBidDepth = point.bidDepth;
        return { ...point, askDepth: lastAskDepth };
      } else {
        lastAskDepth = point.askDepth;
        return { ...point, bidDepth: lastBidDepth };
      }
    });
  }, [orderbook]);

  const spreadInfo = useMemo(() => {
    if (!orderbook || !orderbook.bids.length || !orderbook.asks.length) return null;
    
    const bestBid = Math.max(...orderbook.bids.map(b => b.price));
    const bestAsk = Math.min(...orderbook.asks.map(a => a.price));
    const spread = bestAsk - bestBid;
    const spreadPercent = (spread / bestBid) * 100;
    
    return { bestBid, bestAsk, spread, spreadPercent };
  }, [orderbook]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as DepthPoint;
      return (
        <div className="bg-white p-3 border rounded shadow-lg">
          <p className="font-semibold">{`Price: $${Number(label).toFixed(2)}`}</p>
          {data.bidDepth > 0 && (
            <p className="text-green-600">{`Bid Depth: ${data.bidDepth.toFixed(4)}`}</p>
          )}
          {data.askDepth > 0 && (
            <p className="text-red-600">{`Ask Depth: ${data.askDepth.toFixed(4)}`}</p>
          )}
          <p className="text-gray-600">{`Quantity: ${data.quantity.toFixed(4)}`}</p>
        </div>
      );
    }
    return null;
  };

  if (!orderbook) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6" style={{ height }}>
        <div className="flex items-center justify-center h-full text-gray-500">
          No market depth data available
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="p-4 border-b">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Market Depth - {orderbook.venue}</h3>
          {spreadInfo && (
            <div className="text-sm text-gray-600">
              <span className="mr-4">Spread: ${spreadInfo.spread.toFixed(2)} ({spreadInfo.spreadPercent.toFixed(3)}%)</span>
              <span className="text-green-600 mr-2">Bid: ${spreadInfo.bestBid.toFixed(2)}</span>
              <span className="text-red-600">Ask: ${spreadInfo.bestAsk.toFixed(2)}</span>
            </div>
          )}
        </div>
        {simulatedOrder && (
          <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded">
            <div className="text-sm text-blue-800">
              <span className="font-medium">Simulated Impact:</span> {simulatedOrder.order.side.toUpperCase()} {simulatedOrder.order.quantity} @ {simulatedOrder.order.orderType === 'limit' ? `$${simulatedOrder.order.price}` : 'MARKET'}
            </div>
          </div>
        )}
      </div>

      <div className="p-4" style={{ height: height - 80 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={depthData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="bidGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.05}/>
              </linearGradient>
              <linearGradient id="askGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0.05}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="price" 
              type="number"
              scale="linear"
              domain={['dataMin', 'dataMax']}
              tickFormatter={(value) => `$${Number(value).toFixed(0)}`}
              stroke="#6b7280"
            />
            <YAxis 
              tickFormatter={(value) => Number(value).toFixed(2)}
              stroke="#6b7280"
            />
            <Tooltip content={<CustomTooltip />} />
            
            {/* Bid area */}
            <Area
              type="stepAfter"
              dataKey="bidDepth"
              stroke="#10b981"
              strokeWidth={2}
              fill="url(#bidGradient)"
              connectNulls={false}
            />
            
            <Area
              type="stepBefore"
              dataKey="askDepth"
              stroke="#ef4444"
              strokeWidth={2}
              fill="url(#askGradient)"
              connectNulls={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="px-4 pb-4 flex justify-center space-x-6">
        <div className="flex items-center">
          <div className="w-4 h-4 bg-green-500 rounded mr-2"></div>
          <span className="text-sm text-gray-600">Bid Depth (Cumulative Buy Orders)</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-red-500 rounded mr-2"></div>
          <span className="text-sm text-gray-600">Ask Depth (Cumulative Sell Orders)</span>
        </div>
      </div>
    </div>
  );
};

export default MarketDepthChart;
import React, { useState } from 'react';
import { useOrderBookStore } from '../../stores/orderbookStore';

const SymbolSelector: React.FC = () => {
  const { selectedSymbol, setSelectedSymbol, clearOrderBook } = useOrderBookStore();
  const [customSymbol, setCustomSymbol] = useState('');

  const popularSymbols = [
    'BTC-USD',
    'ETH-USD',
    'SOL-USD',
    'ADA-USD',
    'DOGE-USD',
    'XRP-USD',
    'BTC-USDT',
    'ETH-USDT',
    'SOL-USDT',
    'ADA-USDT',
    'DOGE-USDT',
    'XRP-USDT'
  ];

  const handleSymbolChange = (symbol: string) => {
    clearOrderBook('OKX');
    clearOrderBook('Bybit');
    clearOrderBook('Deribit');
    setSelectedSymbol(symbol);
    setCustomSymbol('');
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customSymbol.trim()) {
      // Clear all orderbooks immediately when symbol changes
      clearOrderBook('OKX');
      clearOrderBook('Bybit');
      clearOrderBook('Deribit');
      setSelectedSymbol(customSymbol.trim().toUpperCase());
      setCustomSymbol('');
    }
  };

  return (
    <div className="bg-white rounded-lg border p-4">
      <h3 className="font-medium text-gray-900 mb-3">Select Market</h3>
      
      <div className="grid grid-cols-4 gap-2 mb-4">
        {popularSymbols.map((symbol) => (
          <button
            key={symbol}
            onClick={() => handleSymbolChange(symbol)}
            className={`
              px-3 py-2 text-sm rounded-md border transition-colors
              ${selectedSymbol === symbol
                ? 'bg-blue-100 border-blue-300 text-blue-800'
                : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
              }
            `}
          >
            {symbol}
          </button>
        ))}
      </div>

      <form onSubmit={handleCustomSubmit} className="flex gap-2">
        <input
          type="text"
          value={customSymbol}
          onChange={(e) => setCustomSymbol(e.target.value)}
          placeholder="Enter custom symbol (e.g., MATIC-USD)"
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <button
          type="submit"
          disabled={!customSymbol.trim()}
          className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          Set
        </button>
      </form>
      
      <div className="mt-2 text-xs text-gray-500">
        Current: <span className="font-mono font-medium">{selectedSymbol}</span>
      </div>
    </div>
  );
};

export default SymbolSelector;
import React from 'react';
import { Venue } from '../../types/orderbook';
import { useOrderBookStore } from '../../stores/orderbookStore';

const VenueSwitcher: React.FC = () => {
  const { selectedVenue, setSelectedVenue, wsStates } = useOrderBookStore();

  const venues: Venue[] = ['OKX', 'Bybit', 'Deribit'];

  const getStatusColor = (venue: Venue) => {
    const state = wsStates[venue];
    if (state.connected) return 'bg-green-500';
    if (state.connecting) return 'bg-yellow-500';
    if (state.error) return 'bg-red-500';
    return 'bg-gray-400';
  };

  return (
    <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
      {venues.map((venue) => (
        <button
          key={venue}
          onClick={() => setSelectedVenue(venue)}
          className={`
            relative px-4 py-2 rounded-md font-medium text-sm transition-all duration-200
            ${selectedVenue === venue
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }
          `}
        >
          <div className="flex items-center space-x-2">
            <div
              className={`w-2 h-2 rounded-full ${getStatusColor(venue)}`}
              title={wsStates[venue].connected ? 'Connected' : 'Disconnected'}
            />
            <span>{venue}</span>
          </div>
          {wsStates[venue].error && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full" />
          )}
        </button>
      ))}
    </div>
  );
};

export default VenueSwitcher;
import React from 'react';
import { Venue } from '../../types/orderbook';
import { useOrderBookStore } from '../../stores/orderbookStore';
import { Wifi, WifiOff, RotateCcw, AlertCircle } from 'lucide-react';

const ConnectionStatus: React.FC = () => {
  const { wsStates } = useOrderBookStore();

  const getStatusIcon = (venue: Venue) => {
    const state = wsStates[venue];
    if (state.connected) return <Wifi className="w-4 h-4 text-green-600" />;
    if (state.connecting) return <RotateCcw className="w-4 h-4 text-yellow-600 animate-spin" />;
    if (state.error) return <AlertCircle className="w-4 h-4 text-red-600" />;
    return <WifiOff className="w-4 h-4 text-gray-400" />;
  };

  const getStatusText = (venue: Venue) => {
    const state = wsStates[venue];
    if (state.connected) return 'Connected';
    if (state.connecting) return 'Connecting...';
    if (state.error) return 'Error';
    return 'Disconnected';
  };

  const getStatusColor = (venue: Venue) => {
    const state = wsStates[venue];
    if (state.connected) return 'text-green-600';
    if (state.connecting) return 'text-yellow-600';
    if (state.error) return 'text-red-600';
    return 'text-gray-400';
  };

  return (
    <div className="bg-white rounded-lg border p-4">
      <h3 className="font-medium text-gray-900 mb-3">Connection Status</h3>
      
      <div className="space-y-3">
        {Object.keys(wsStates).map((venue) => {
          const venueKey = venue as Venue;
          return (
            <div key={venue} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {getStatusIcon(venueKey)}
                <span className="font-medium text-gray-900">{venue}</span>
              </div>
              <div className="flex flex-col items-end">
                <span className={`text-sm font-medium ${getStatusColor(venueKey)}`}>
                  {getStatusText(venueKey)}
                </span>
                {wsStates[venueKey].error && (
                  <span className="text-xs text-red-500 mt-1 max-w-32 truncate" title={wsStates[venueKey].error || ''}>
                    {wsStates[venueKey].error}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ConnectionStatus;
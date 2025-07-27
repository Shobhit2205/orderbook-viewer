import React, { useState } from 'react';
import { Venue } from '../../types/orderbook';
import { useOrderBookStore } from '../../stores/orderbookStore';

interface OrderSimulationFormProps {
  onSubmit: (orderData: OrderFormData) => void;
}

export interface OrderFormData {
  venue: Venue;
  symbol: string;
  orderType: 'market' | 'limit';
  side: 'buy' | 'sell';
  price?: number;
  quantity: number;
  timing: 'immediate' | '5s' | '10s' | '30s';
}

const OrderSimulationForm: React.FC<OrderSimulationFormProps> = ({ onSubmit }) => {
  const { selectedVenue, selectedSymbol } = useOrderBookStore();
  const [formData, setFormData] = useState<OrderFormData>({
    venue: selectedVenue,
    symbol: selectedSymbol,
    orderType: 'limit',
    side: 'buy',
    price: undefined,
    quantity: 0,
    timing: 'immediate'
  });

  const [errors, setErrors] = useState<Partial<Record<keyof OrderFormData, string>>>({});

  React.useEffect(() => {
    setFormData(prev => ({
      ...prev,
      venue: selectedVenue,
      symbol: selectedSymbol,
      price: undefined, 
      quantity: 0 
    }));

    setErrors({});
  }, [selectedVenue, selectedSymbol]);

  const venues: Venue[] = ['OKX', 'Bybit', 'Deribit'];
  const orderTypes = [
    { value: 'market', label: 'Market' },
    { value: 'limit', label: 'Limit' }
  ];
  const sides = [
    { value: 'buy', label: 'Buy' },
    { value: 'sell', label: 'Sell' }
  ];
  const timingOptions = [
    { value: 'immediate', label: 'Immediate' },
    { value: '5s', label: '5s delay' },
    { value: '10s', label: '10s delay' },
    { value: '30s', label: '30s delay' }
  ];

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof OrderFormData, string>> = {};

    // Price validation for limit orders
    if (formData.orderType === 'limit') {
      if (!formData.price || formData.price <= 0) {
        newErrors.price = 'Price is required and must be greater than 0';
      }
    }

    // Quantity validation
    if (!formData.quantity || formData.quantity <= 0) {
      newErrors.quantity = 'Quantity must be greater than 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const handleInputChange = (field: keyof OrderFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <h3 className="text-lg font-semibold mb-4">Order Simulation</h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Venue
          </label>
          <div className="flex space-x-2">
            {venues.map((venue) => (
              <button
                key={venue}
                type="button"
                onClick={() => handleInputChange('venue', venue)}
                className={`
                  px-3 py-2 rounded-md text-sm font-medium transition-colors
                  ${formData.venue === venue
                    ? 'bg-blue-100 text-blue-700 border border-blue-300'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
                  }
                `}
              >
                {venue}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Symbol
          </label>
          <div className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-gray-50 text-gray-700">
            {formData.symbol}
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Change symbol using the market selector above
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Order Type
            </label>
            <select
              value={formData.orderType}
              onChange={(e) => handleInputChange('orderType', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {orderTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Side
            </label>
            <select
              value={formData.side}
              onChange={(e) => handleInputChange('side', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {sides.map(side => (
                <option key={side.value} value={side.value}>
                  {side.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {formData.orderType === 'limit' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Price
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.price || ''}
              onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || undefined)}
              className={`
                w-full px-3 py-2 border rounded-md text-sm
                ${errors.price ? 'border-red-500' : 'border-gray-300'}
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
              `}
              placeholder="Enter price"
            />
            {errors.price && (
              <p className="mt-1 text-sm text-red-600">{errors.price}</p>
            )}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Quantity
          </label>
          <input
            type="number"
            step="0.0001"
            min="0"
            value={formData.quantity || ''}
            onChange={(e) => handleInputChange('quantity', parseFloat(e.target.value) || 0)}
            className={`
              w-full px-3 py-2 border rounded-md text-sm
              ${errors.quantity ? 'border-red-500' : 'border-gray-300'}
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
            `}
            placeholder="Enter quantity"
          />
          {errors.quantity && (
            <p className="mt-1 text-sm text-red-600">{errors.quantity}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Timing
          </label>
          <div className="grid grid-cols-2 gap-2">
            {timingOptions.map(timing => (
              <button
                key={timing.value}
                type="button"
                onClick={() => handleInputChange('timing', timing.value)}
                className={`
                  px-3 py-2 rounded-md text-sm font-medium transition-colors
                  ${formData.timing === timing.value
                    ? 'bg-green-100 text-green-700 border border-green-300'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
                  }
                `}
              >
                {timing.label}
              </button>
            ))}
          </div>
        </div>

        <div className="pt-4">
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            Simulate Order
          </button>
        </div>
      </form>
    </div>
  );
};

export default OrderSimulationForm; 
# OrderBook Viewer

A real-time cryptocurrency orderbook visualization tool for tracking market depth across multiple exchanges.

![OrderBook Viewer](/public/orderbook.png)
![Market Depth](/public/market-depth.png)

## Features

- Real-time orderbook data visualization from multiple cryptocurrency exchanges
- Support for OKX, Bybit, and Deribit exchanges
- Responsive design for desktop and mobile viewing
- Order simulation to visualize potential market impact
- Market depth chart visualization
- WebSocket connections for live data updates

## Technologies Used

- **Framework**: Next.js 15 with React 19
- **State Management**: Zustand
- **Styling**: Tailwind CSS v4
- **Data Visualization**: Recharts, D3.js
- **WebSocket Communication**: Native WebSocket API
- **TypeScript** for type safety

## Prerequisites

- Node.js 18.x or higher
- npm or yarn

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/orderbook-viewer.git
   cd orderbook-viewer
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Run the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
orderbook-viewer/
├── src/
│   ├── app/                # Next.js app directory
│   ├── components/         # React components
│   │   ├── OrderBook/      # OrderBook related components
│   │   ├── SymbolSelector/ # Exchange symbol selection components
│   │   └── VenueSwitcher/  # Exchange venue switching components
│   ├── config/             # Configuration files
│   │   └── venues.ts       # Exchange-specific configurations
│   ├── lib/                # Utility functions
│   │   └── orderBookUtils.ts # OrderBook data processing utilities
│   ├── services/           # API services
│   │   ├── websocketService.ts # WebSocket connection handling
│   │   └── symbolsService.ts   # Symbol data fetching
│   ├── stores/             # Zustand state stores
│   │   └── orderbookStore.ts   # OrderBook state management
│   └── types/              # TypeScript type definitions
│       └── orderbook.ts    # OrderBook data types
```

## Key Components

### `OrderBookTable`

Displays the orderbook with bids and asks in a responsive table format.

- Supports both desktop and mobile view layouts
- Shows price, quantity, and cumulative totals
- Visual depth indicators
- Highlighting for simulated orders

### `WebSocketService`

Manages connections to exchange WebSocket APIs:

- Automatic reconnection on disconnection
- Subscription handling
- Data parsing and normalization

### `OrderBookPollingService`

Fallback service for REST API polling when WebSocket is not available:

- Configurable polling rate
- Handles API-specific data formats

## Exchange APIs

### Supported Exchanges

1. **OKX**
   - WebSocket API: wss://ws.okx.com:8443/ws/v5/public
   - REST API: https://www.okx.com/api/v5

2. **Bybit**
   - WebSocket API: wss://stream.bybit.com/v5/public/spot
   - REST API: https://api.bybit.com/v5

3. **Deribit**
   - WebSocket API: wss://www.deribit.com/ws/api/v2
   - REST API: https://www.deribit.com/api/v2

### API Documentation

#### WebSocket Connections

The application connects to exchange WebSockets and subscribes to orderbook channels:

```typescript
// Example WebSocket connection
websocketService.connect('OKX', 'BTC-USD');
```

#### OrderBook Data Structure

OrderBook data is normalized across exchanges to the following format:

```typescript
interface OrderBook {
  symbol: string;
  venue: string;
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
  timestamp: number;
}

interface OrderBookLevel {
  price: number;
  quantity: number;
  total?: number; // Cumulative quantity
}
```

## Order Simulation

You can simulate market and limit orders to visualize their potential impact:

```typescript
// Example order simulation
const orderData = {
  venue: 'OKX',
  symbol: 'BTC-USD',
  side: 'buy',
  orderType: 'market',
  quantity: 1.0
};

const simulationResult = OrderSimulationService.simulateOrder(orderbook, orderData);
```

## Design Decisions and Assumptions

1. **Exchange API Compatibility**: The application assumes that the exchange APIs maintain their current structure. Any API changes by exchanges may require updates to the parsing logic.

2. **Data Normalization**: Exchange-specific data formats are normalized into a consistent format for the application, allowing for unified display and processing.

3. **Mobile Responsiveness**: The UI is designed to be responsive with specific optimizations for mobile devices (width < 768px).

4. **WebSocket Fallback**: If WebSocket connections fail, the application falls back to REST API polling for continued functionality.

5. **Market Depth Visualization**: Market depth is calculated cumulatively to visualize liquidity at different price levels.

6. **Simulation Only**: Order placement is simulated but not executed. No real trades are placed.

## Future Improvements

- Add more exchanges (Coinbase, Binance, etc.)
- Implement authentication for private API access
- Add historical data and time-series analysis
- Improve performance with WebWorkers for data processing
- Add trading functionality (requires authentication)

## Troubleshooting

- If WebSocket connections fail, check your internet connection and firewall settings
- Ensure you're using a modern browser with WebSocket support
- Check browser console for any error messages
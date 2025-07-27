export interface OrderBookLevel {
  price: number;
  quantity: number;
  total?: number;
}

export interface OrderBook {
  symbol: string;
  venue: Venue;
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
  timestamp: number;
}

export type Venue = "OKX" | "Bybit" | "Deribit";

export interface VenueConfig {
  name: Venue;
  baseUrl: string;
  wsUrl: string;
  symbolFormat: (symbol: string) => string;
  parseOrderBook: (
    data: any,
    existingOrderBook?: OrderBook,
    expectedSymbol?: string
  ) => OrderBook | null;
}

export interface WebSocketState {
  connected: boolean;
  connecting: boolean;
  error: string | null;
}

export interface SimulatedOrder {
  venue: Venue;
  symbol: string;
  orderType: "market" | "limit";
  side: "buy" | "sell";
  price?: number;
  quantity: number;
  timing: "immediate" | "5s" | "10s" | "30s";
}

export interface OrderImpactMetrics {
  estimatedFillPercentage: number;
  marketImpact: number;
  slippageEstimation: number;
  timeToFill?: number;
  totalValue: number;
  averageFillPrice: number;
}

export interface OrderPlacement {
  order: SimulatedOrder;
  impact: OrderImpactMetrics;
  position: {
    level: number;
    isNewLevel: boolean;
    price: number;
    quantity: number;
  };
}

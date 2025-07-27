import { create } from "zustand";
import { OrderBook, Venue, WebSocketState } from "../types/orderbook";
import type { VenueSymbol } from "../services/symbolsService";

interface OrderBookStore {
  orderbooks: Record<Venue, OrderBook | null>;
  selectedVenue: Venue;
  selectedSymbol: string;
  wsStates: Record<Venue, WebSocketState>;
  symbols: Record<Venue, VenueSymbol[]>;
  symbolsLoading: boolean;

  setOrderBook: (venue: Venue, orderbook: OrderBook) => void;
  setSelectedVenue: (venue: Venue) => void;
  setSelectedSymbol: (symbol: string) => void;
  clearOrderBook: (venue: Venue) => void;
  setWebSocketState: (venue: Venue, state: Partial<WebSocketState>) => void;
  setSymbols: (venue: Venue, symbols: VenueSymbol[]) => void;
  setSymbolsLoading: (loading: boolean) => void;
}

export const useOrderBookStore = create<OrderBookStore>((set) => ({
  orderbooks: {
    OKX: null,
    Bybit: null,
    Deribit: null,
  },
  selectedVenue: "OKX",
  selectedSymbol: "BTC-USD", // Hardcoded symbol
  wsStates: {
    OKX: { connected: false, connecting: false, error: null },
    Bybit: { connected: false, connecting: false, error: null },
    Deribit: { connected: false, connecting: false, error: null },
  },
  symbols: {
    OKX: [],
    Bybit: [],
    Deribit: [],
  },
  symbolsLoading: false,

  setOrderBook: (venue, orderbook) =>
    set((state) => ({
      orderbooks: { ...state.orderbooks, [venue]: orderbook },
    })),

  setSelectedVenue: (venue) => set({ selectedVenue: venue }),

  setSelectedSymbol: (symbol) => set({ selectedSymbol: symbol }),

  clearOrderBook: (venue) =>
    set((state) => ({
      orderbooks: { ...state.orderbooks, [venue]: null },
    })),

  setWebSocketState: (venue, newState) =>
    set((state) => ({
      wsStates: {
        ...state.wsStates,
        [venue]: { ...state.wsStates[venue], ...newState },
      },
    })),

  setSymbols: (venue, symbols) =>
    set((state) => ({
      symbols: { ...state.symbols, [venue]: symbols },
    })),

  setSymbolsLoading: (loading) => set({ symbolsLoading: loading }),
}));

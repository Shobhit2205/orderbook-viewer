import { mergeOrderBookLevels } from '@/lib/orderBookUtils';
import { VenueConfig, OrderBook, OrderBookLevel } from '../types/orderbook';
import { useOrderBookStore } from '@/stores/orderbookStore';

export const VENUE_CONFIGS: Record<string, VenueConfig> = {
  OKX: {
    name: 'OKX',
    baseUrl: 'https://www.okx.com/api/v5',
    wsUrl: 'wss://ws.okx.com:8443/ws/v5/public',
    symbolFormat: (symbol: string) => symbol.replace('-', '-'),
    parseOrderBook: (data: any, existingOrderBook?: OrderBook): OrderBook | null => {
      if (!data?.data?.[0]) return existingOrderBook || null;

      const bookData = data.data[0];

      const bids: OrderBookLevel[] = bookData.bids?.map(([price, qty]: [string, string]) => ({
        price: parseFloat(price),
        quantity: parseFloat(qty)
      })) || [];

      const asks: OrderBookLevel[] = bookData.asks?.map(([price, qty]: [string, string]) => ({
        price: parseFloat(price),
        quantity: parseFloat(qty)
      })) || [];

      const updatedBids = mergeOrderBookLevels(existingOrderBook?.bids || [], bids);
      const updatedAsks = mergeOrderBookLevels(existingOrderBook?.asks || [], asks);

      return {
        symbol: data.arg.instId,
        venue: 'OKX',
        bids: updatedBids.slice(0, 15),
        asks: updatedAsks.slice(0, 15),
        timestamp: parseInt(bookData.ts)
      };
    }
  },
  
  Bybit: {
    name: 'Bybit',
    baseUrl: 'https://api.bybit.com/v5',
    wsUrl: 'wss://stream.bybit.com/v5/public/spot',
    symbolFormat: (symbol: string) => {
      if (symbol === 'BTC-USD') return 'BTCUSDT';
      return symbol.replace('-', 'T'); 
    },
    parseOrderBook: (data: any, existingOrderBook?: OrderBook): OrderBook | null => {
      if (data.op === 'subscribe' && data.success) {
        console.log('Bybit subscription confirmed');
        return null;
      }

      if (!data?.data || !data.topic) return null;

      const bookData = data.data;
      const isSnapshot = data.type === 'snapshot';
      
      const bids: OrderBookLevel[] = bookData.b?.map(([price, qty]: [string, string]) => ({
        price: parseFloat(price),
        quantity: parseFloat(qty),
      })) || [];

      const asks: OrderBookLevel[] = bookData.a?.map(([price, qty]: [string, string]) => ({
        price: parseFloat(price),
        quantity: parseFloat(qty),
      })) || [];

      let updatedBids: OrderBookLevel[];
      let updatedAsks: OrderBookLevel[];

      if (isSnapshot || !existingOrderBook) {
        updatedBids = bids.sort((a, b) => b.price - a.price);
        updatedAsks = asks.sort((a, b) => a.price - b.price);
      } else {
        updatedBids = mergeOrderBookLevels(existingOrderBook.bids, bids);
        updatedAsks = mergeOrderBookLevels(existingOrderBook.asks, asks);
      }

      return {
        symbol: bookData.s,
        venue: 'Bybit',
        bids: updatedBids.slice(0, 15),
        asks: updatedAsks.slice(0, 15),
        timestamp: parseInt(bookData.u),
      };
    },
  },
  
  Deribit: {
    name: 'Deribit',
    baseUrl: 'https://www.deribit.com/api/v2',
    wsUrl: 'wss://www.deribit.com/ws/api/v2',
    symbolFormat: (symbol: string) => {
      if (symbol === 'BTC-USD') return 'BTC-PERPETUAL';
      return symbol.replace('-USD', '-PERPETUAL');
    },
    parseOrderBook: (data: any, existingOrderBook?: OrderBook): OrderBook | null => {
      // Handle subscription confirmation
      if (data.id && data.result !== undefined && !data.params) {
        console.log('Deribit subscription confirmed:', data);
        return null;
      }

      if (!data?.params?.data) return null;

      const bookData = data.params.data;
      
      console.log('Deribit orderbook data:', JSON.stringify(bookData, null, 2));
      
      const isSnapshot = bookData.type === 'snapshot';
      
      const bids: OrderBookLevel[] = bookData.bids?.map((item: any) => {
        if (Array.isArray(item)) {
          if (item.length === 2) {
            return {
              price: parseFloat(item[0]),
              quantity: parseFloat(item[1])
            };
          } else if (item.length === 3) {
            return {
              price: parseFloat(item[1]),
              quantity: parseFloat(item[2])
            };
          }
        }
        return { price: 0, quantity: 0 };
      }).filter((item: any) => item.price > 0) || [];

      const asks: OrderBookLevel[] = bookData.asks?.map((item: any) => {
        if (Array.isArray(item)) {
          if (item.length === 2) {
            return {
              price: parseFloat(item[0]),
              quantity: parseFloat(item[1])
            };
          } else if (item.length === 3) {
            return {
              price: parseFloat(item[1]),
              quantity: parseFloat(item[2])
            };
          }
        }
        return { price: 0, quantity: 0 };
      }).filter((item: any) => item.price > 0) || [];
      let updatedBids: OrderBookLevel[];
      let updatedAsks: OrderBookLevel[];

      if (isSnapshot || !existingOrderBook) {
        updatedBids = bids.sort((a, b) => b.price - a.price);
        updatedAsks = asks.sort((a, b) => a.price - b.price);
      } else {
        updatedBids = mergeOrderBookLevels(existingOrderBook.bids, bids);
        updatedAsks = mergeOrderBookLevels(existingOrderBook.asks, asks);
      }

      return {
        symbol: bookData.instrument_name,
        venue: 'Deribit',
        bids: updatedBids.slice(0, 15),
        asks: updatedAsks.slice(0, 15),
        timestamp: bookData.timestamp,
      };
    },
  },
};

export class OrderBookPollingService {
  private intervals: Map<string, NodeJS.Timeout> = new Map();
  private pollingRate = 1000; // 1 second

  async startPolling(venue: string, symbol: string) {
    const key = `${venue}-${symbol}`;
    
    if (this.intervals.has(key)) {
      this.stopPolling(venue, symbol);
    }

    const config = VENUE_CONFIGS[venue];
    if (!config) return;

    const pollOrderbook = async () => {
      try {
        const orderbook = await this.fetchOrderbook(venue, symbol);
        if (orderbook) {
          const { setOrderBook } = useOrderBookStore.getState();
          setOrderBook(venue as any, orderbook);
        }
      } catch (error) {
        console.error(`Polling error for ${venue}:`, error);
      }
    };

    await pollOrderbook();
    
    const intervalId = setInterval(pollOrderbook, this.pollingRate);
    this.intervals.set(key, intervalId);
  }

  stopPolling(venue: string, symbol: string) {
    const key = `${venue}-${symbol}`;
    const intervalId = this.intervals.get(key);
    
    if (intervalId) {
      clearInterval(intervalId);
      this.intervals.delete(key);
    }
  }

  private async fetchOrderbook(venue: string, symbol: string): Promise<OrderBook | null> {
    const config = VENUE_CONFIGS[venue];
    if (!config) return null;

    const formattedSymbol = config.symbolFormat(symbol);
    
    try {
      let url: string;
      
      switch (venue) {
        case 'OKX':
          url = `${config.baseUrl}/market/books?instId=${formattedSymbol}&sz=15`;
          break;
        case 'Bybit':
          url = `${config.baseUrl}/market/orderbook?category=spot&symbol=${formattedSymbol}&limit=25`;
          break;
        case 'Deribit':
          url = `${config.baseUrl}/public/get_order_book?instrument_name=${formattedSymbol}&depth=15`;
          break;
        default:
          return null;
      }

      const response = await fetch(url);
      const data = await response.json();
      
      return this.parseRestOrderbook(venue, data, symbol);
    } catch (error) {
      console.error(`Failed to fetch orderbook for ${venue}:`, error);
      return null;
    }
  }

  private parseRestOrderbook(venue: string, data: any, symbol: string): OrderBook | null {
    try {
      switch (venue) {
        case 'OKX':
          if (!data?.data?.[0]) return null;
          const okxData = data.data[0];
          return {
            symbol,
            venue,
            bids: okxData.bids?.map(([price, qty]: [string, string]) => ({
              price: parseFloat(price),
              quantity: parseFloat(qty)
            })).slice(0, 15) || [],
            asks: okxData.asks?.map(([price, qty]: [string, string]) => ({
              price: parseFloat(price),
              quantity: parseFloat(qty)
            })).slice(0, 15) || [],
            timestamp: parseInt(okxData.ts)
          };

        case 'Bybit':
          if (!data?.result) return null;
          const bybitData = data.result;
          return {
            symbol,
            venue,
            bids: bybitData.b?.map(([price, qty]: [string, string]) => ({
              price: parseFloat(price),
              quantity: parseFloat(qty)
            })).slice(0, 15) || [],
            asks: bybitData.a?.map(([price, qty]: [string, string]) => ({
              price: parseFloat(price),
              quantity: parseFloat(qty)
            })).slice(0, 15) || [],
            timestamp: parseInt(bybitData.u)
          };

        case 'Deribit':
          if (!data?.result) return null;
          const deribitData = data.result;
          return {
            symbol,
            venue,
            bids: deribitData.bids?.map(([price, qty]: [number, number]) => ({
              price: parseFloat(price.toString()),
              quantity: parseFloat(qty.toString())
            })).slice(0, 15) || [],
            asks: deribitData.asks?.map(([price, qty]: [number, number]) => ({
              price: parseFloat(price.toString()),
              quantity: parseFloat(qty.toString())
            })).slice(0, 15) || [],
            timestamp: deribitData.timestamp || Date.now()
          };

        default:
          return null;
      }
    } catch (error) {
      console.error(`Failed to parse REST orderbook for ${venue}:`, error);
      return null;
    }
  }
}

export const pollingService = new OrderBookPollingService();
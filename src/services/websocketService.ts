import { VENUE_CONFIGS } from '../config/venues';
import { useOrderBookStore } from '../stores/orderbookStore';
import { Venue } from '../types/orderbook';

class WebSocketService {
  private connections: Map<Venue, WebSocket> = new Map();
  private reconnectAttempts: Map<Venue, number> = new Map();
  private currentSymbols: Map<Venue, string> = new Map();
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  connect(venue: Venue, symbol: string = 'BTC-USD') {
    const config = VENUE_CONFIGS[venue];
    if (!config) return;

    const currentSymbol = this.currentSymbols.get(venue);

    if (currentSymbol && currentSymbol !== symbol) {
        console.log(`Symbol changed from ${currentSymbol} to ${symbol}, reconnecting...`);
        const { clearOrderBook } = useOrderBookStore.getState();
        clearOrderBook(venue);
        this.disconnect(venue);
        this.currentSymbols.delete(venue);
    }

    if (currentSymbol === symbol && this.connections.get(venue)?.readyState === WebSocket.OPEN) {
        return;
    }

    const { setWebSocketState, setOrderBook } = useOrderBookStore.getState();
    setWebSocketState(venue, { connecting: true, error: null });

    try {
        const ws = new WebSocket(config.wsUrl);
        this.connections.set(venue, ws);

        ws.onopen = () => {
            console.log(`Connected to ${venue} for ${symbol}`);
            setWebSocketState(venue, { connected: true, connecting: false });
            this.reconnectAttempts.set(venue, 0);
            this.currentSymbols.set(venue, symbol);
            this.subscribe(venue, symbol);
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                
                if (this.shouldSkipMessage(venue, data)) {
                    return;
                }

                const existingOrderBook = useOrderBookStore.getState().orderbooks[venue];
                const updatedOrderBook = config.parseOrderBook(data, existingOrderBook || undefined);

                if (updatedOrderBook) {
                    console.log(`Updated orderbook for ${venue}: ${updatedOrderBook.symbol}`);
                    setOrderBook(venue, updatedOrderBook);
                }
            } catch (error) {
                console.error(`Error parsing message from ${venue}:`, error);
            }
        };

        ws.onclose = () => {
            console.log(`Disconnected from ${venue}`);
            setWebSocketState(venue, { connected: false, connecting: false });
            this.connections.delete(venue);
            this.attemptReconnection(venue, symbol);
        };

        ws.onerror = (error) => {
            console.error(`WebSocket error for ${venue}:`, error);
            setWebSocketState(venue, { error: `Connection error: ${error}`, connecting: false });
        };

    } catch (error) {
        setWebSocketState(venue, { error: `Failed to connect: ${error}`, connecting: false });
    }
  }

  private shouldSkipMessage(venue: Venue, data: any): boolean {
    switch (venue) {
      case 'OKX':
        return !data?.data?.[0] || data.event;
      
      case 'Bybit':
        return !data?.data || data.op === 'subscribe' || !data.topic?.includes('orderbook');
      
      case 'Deribit':
        return !data?.params?.data || (data.method !== 'subscription' && !data.params?.channel);
      
      default:
        return false;
    }
  }

  private subscribe(venue: Venue, symbol: string = 'BTC-USD') {
    const ws = this.connections.get(venue);
    if (!ws || ws.readyState !== WebSocket.OPEN) return;

    const config = VENUE_CONFIGS[venue];
    const formattedSymbol = config.symbolFormat(symbol);

    let subscribeMessage: any;

    switch (venue) {
      case 'OKX':
        subscribeMessage = {
          op: 'subscribe',
          args: [{ channel: 'books', instId: formattedSymbol }],
        };
        break;

      case 'Bybit':
        subscribeMessage = {
          op: 'subscribe',
          args: [`orderbook.1.${formattedSymbol}`],
        };
        break;

      case 'Deribit':
        subscribeMessage = {
          jsonrpc: '2.0',
          method: 'public/subscribe',
          id: Date.now(),
          params: { 
            channels: [`book.${formattedSymbol}.100ms`] 
          },
        };
        break;
    }

    if (subscribeMessage) {
      console.log(`Subscribing to ${venue} with message:`, subscribeMessage);
      ws.send(JSON.stringify(subscribeMessage));
    }
  }

  private unsubscribe(venue: Venue, symbol: string = 'BTC-USD') {
    const ws = this.connections.get(venue);
    if (!ws || ws.readyState !== WebSocket.OPEN) return;

    const config = VENUE_CONFIGS[venue];
    const formattedSymbol = config.symbolFormat(symbol);

    let unsubscribeMessage: any;

    switch (venue) {
      case 'OKX':
        unsubscribeMessage = {
          op: 'unsubscribe',
          args: [{ channel: 'books', instId: formattedSymbol }]
        };
        break;

      case 'Bybit':
        unsubscribeMessage = {
          op: 'unsubscribe',
          args: [`orderbook.1.${formattedSymbol}`]
        };
        break;

      case 'Deribit':
        unsubscribeMessage = {
          jsonrpc: '2.0',
          method: 'public/unsubscribe',
          id: Date.now(),
          params: { 
            channels: [`book.${formattedSymbol}.100ms`] 
          }
        };
        break;
    }

    if (unsubscribeMessage) {
      ws.send(JSON.stringify(unsubscribeMessage));
    }
  }

  private attemptReconnection(venue: Venue, symbol: string = 'BTC-USD') {
    const attempts = this.reconnectAttempts.get(venue) || 0;
    
    if (attempts < this.maxReconnectAttempts) {
      this.reconnectAttempts.set(venue, attempts + 1);
      
      setTimeout(() => {
        console.log(`Attempting to reconnect to ${venue} (attempt ${attempts + 1})`);
        this.connect(venue, symbol);
      }, this.reconnectDelay * Math.pow(2, attempts));
    }
  }

  disconnect(venue: Venue) {
    const ws = this.connections.get(venue);
    const currentSymbol = this.currentSymbols.get(venue);

    if (ws && currentSymbol) {
      this.unsubscribe(venue, currentSymbol);
    }

    if (ws) {
      ws.close();
      this.connections.delete(venue);
      this.currentSymbols.delete(venue);
    }

    const { clearOrderBook } = useOrderBookStore.getState();
    clearOrderBook(venue);
  }

  disconnectAll() {
    this.connections.forEach((ws, venue) => {
      this.disconnect(venue);
    });
  }

  forceReconnect(venue: Venue, symbol: string = 'BTC-USD') {
    console.log(`Force reconnecting ${venue} for ${symbol}`);
    this.disconnect(venue);
    this.currentSymbols.delete(venue);
    
    const { clearOrderBook } = useOrderBookStore.getState();
    clearOrderBook(venue);
    
    setTimeout(() => {
      this.connect(venue, symbol);
    }, 100);
  }
}

export const websocketService = new WebSocketService();
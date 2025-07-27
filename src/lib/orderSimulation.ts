import { OrderBook, OrderBookLevel, SimulatedOrder, OrderImpactMetrics, OrderPlacement } from '../types/orderbook';

export class OrderSimulationService {
  static calculateOrderPlacement(order: SimulatedOrder, orderbook: OrderBook): OrderPlacement | null {
    if (!orderbook) return null;

    const { side, orderType, price, quantity } = order;
    const levels = side === 'buy' ? orderbook.asks : orderbook.bids;
    
    if (orderType === 'market') {
      return this.calculateMarketOrderPlacement(order, orderbook);
    } else {
      return this.calculateLimitOrderPlacement(order, orderbook);
    }
  }

  private static calculateMarketOrderPlacement(order: SimulatedOrder, orderbook: OrderBook): OrderPlacement {
    const { side, quantity } = order;
    const levels = side === 'buy' ? orderbook.asks : orderbook.bids;
    
    let remainingQuantity = quantity;
    let totalValue = 0;
    let filledQuantity = 0;
    let averagePrice = 0;

    for (let i = 0; i < levels.length && remainingQuantity > 0; i++) {
      const level = levels[i];
      const fillQuantity = Math.min(remainingQuantity, level.quantity);
      
      totalValue += fillQuantity * level.price;
      filledQuantity += fillQuantity;
      remainingQuantity -= fillQuantity;
    }

    averagePrice = filledQuantity > 0 ? totalValue / filledQuantity : 0;
    const estimatedFillPercentage = (filledQuantity / quantity) * 100;
    const unfilledQuantity = quantity - filledQuantity;

    const marketImpact = this.calculateMarketImpact(order, orderbook, filledQuantity);
    
    const expectedPrice = side === 'buy' ? orderbook.asks[0]?.price : orderbook.bids[0]?.price;
    const slippageEstimation = expectedPrice ? Math.abs(averagePrice - expectedPrice) : 0;

    return {
      order,
      impact: {
        estimatedFillPercentage,
        marketImpact,
        slippageEstimation,
        totalValue,
        averageFillPrice: averagePrice,
        timeToFill: this.estimateTimeToFill(order, filledQuantity, quantity)
      },
      position: {
        level: -1, 
        isNewLevel: false,
        price: averagePrice,
        quantity: filledQuantity
      }
    };
  }

  private static calculateLimitOrderPlacement(order: SimulatedOrder, orderbook: OrderBook): OrderPlacement {
    const { side, price, quantity } = order;
    if (!price) return null!;

    const levels = side === 'buy' ? orderbook.asks : orderbook.bids;
    const oppositeLevels = side === 'buy' ? orderbook.bids : orderbook.asks;
    
    let insertIndex = -1;
    let isNewLevel = false;
    
    if (side === 'buy') {
      for (let i = 0; i < levels.length; i++) {
        if (levels[i].price >= price) {
          insertIndex = i;
          isNewLevel = levels[i].price > price;
          break;
        }
      }
      if (insertIndex === -1) {
        insertIndex = levels.length;
        isNewLevel = true;
      }
    } else {
      for (let i = 0; i < levels.length; i++) {
        if (levels[i].price <= price) {
          insertIndex = i;
          isNewLevel = levels[i].price < price;
          break;
        }
      }
      if (insertIndex === -1) {
        insertIndex = levels.length;
        isNewLevel = true;
      }
    }

    let estimatedFillPercentage = 0;
    let totalValue = 0;
    let filledQuantity = 0;

    if (side === 'buy') {
      for (let i = 0; i < levels.length && levels[i].price <= price; i++) {
        const fillQuantity = Math.min(quantity - filledQuantity, levels[i].quantity);
        totalValue += fillQuantity * levels[i].price;
        filledQuantity += fillQuantity;
      }
    } else {
      for (let i = 0; i < levels.length && levels[i].price >= price; i++) {
        const fillQuantity = Math.min(quantity - filledQuantity, levels[i].quantity);
        totalValue += fillQuantity * levels[i].price;
        filledQuantity += fillQuantity;
      }
    }

    estimatedFillPercentage = (filledQuantity / quantity) * 100;
    const averageFillPrice = filledQuantity > 0 ? totalValue / filledQuantity : price;
    
    const marketImpact = this.calculateMarketImpact(order, orderbook, filledQuantity);
    
    const slippageEstimation = Math.abs(averageFillPrice - price);

    return {
      order,
      impact: {
        estimatedFillPercentage,
        marketImpact,
        slippageEstimation,
        totalValue,
        averageFillPrice,
        timeToFill: this.estimateTimeToFill(order, filledQuantity, quantity)
      },
      position: {
        level: insertIndex,
        isNewLevel,
        price,
        quantity
      }
    };
  }

  private static calculateMarketImpact(order: SimulatedOrder, orderbook: OrderBook, filledQuantity: number): number {
    const { side, quantity } = order;
    const levels = side === 'buy' ? orderbook.asks : orderbook.bids;
    
    if (levels.length === 0) return 0;

    let cumulativeQuantity = 0;
    let impactLevel = 0;
    
    for (let i = 0; i < levels.length; i++) {
      cumulativeQuantity += levels[i].quantity;
      if (cumulativeQuantity >= filledQuantity) {
        impactLevel = i;
        break;
      }
    }

    const totalDepth = levels.reduce((sum, level) => sum + level.quantity, 0);
    return (filledQuantity / totalDepth) * 100;
  }

  private static estimateTimeToFill(order: SimulatedOrder, filledQuantity: number, totalQuantity: number): number {
    const fillPercentage = filledQuantity / totalQuantity;
    
    if (fillPercentage >= 0.9) {
      return order.timing === 'immediate' ? 100 : this.getTimingMs(order.timing);
    } else if (fillPercentage >= 0.5) {
      return order.timing === 'immediate' ? 5000 : this.getTimingMs(order.timing) * 2;
    } else {
      return order.timing === 'immediate' ? 30000 : this.getTimingMs(order.timing) * 10;
    }
  }

  private static getTimingMs(timing: string): number {
    switch (timing) {
      case '5s': return 5000;
      case '10s': return 10000;
      case '30s': return 30000;
      default: return 0;
    }
  }
} 
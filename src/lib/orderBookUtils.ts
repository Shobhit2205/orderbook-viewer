import { OrderBookLevel } from "@/types/orderbook";

export const mergeOrderBookLevels = (
  existingLevels: OrderBookLevel[],
  updates: OrderBookLevel[]
): OrderBookLevel[] => {
  const levelMap = new Map(existingLevels.map(level => [level.price, level.quantity]));

  updates.forEach(update => {
    if (update.quantity === 0) {
      levelMap.delete(update.price);
    } else {
      levelMap.set(update.price, update.quantity);
    }
  });

  return Array.from(levelMap.entries()).map(([price, quantity]) => ({ price, quantity }));
};
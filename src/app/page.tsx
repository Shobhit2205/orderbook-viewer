"use client";
import React, { useEffect, useState } from "react";
import VenueSwitcher from "../components/VenueSwitcher/VenueSwitcher";
import SymbolSelector from "../components/SymbolSelector/SymbolSelector";
import OrderBookTable from "../components/OrderBook/OrderBookTable";
import OrderSimulationForm from "../components/OrderSimulation/OrderSimulationForm";
import OrderImpactMetrics from "../components/OrderSimulation/OrderImpactMetrics";
import { useOrderBookStore } from "../stores/orderbookStore";
import { websocketService } from "../services/websocketService";
import { OrderFormData } from "../components/OrderSimulation/OrderSimulationForm";
import { OrderPlacement, SimulatedOrder } from "../types/orderbook";
import { OrderSimulationService } from "../lib/orderSimulation";
import MarketDepthChart from "@/components/MarketDepthChart";

export default function Home() {
  const { selectedVenue, selectedSymbol, orderbooks, wsStates } = useOrderBookStore();
  const orderbook = orderbooks[selectedVenue];
  const loading = wsStates[selectedVenue]?.connecting || !orderbook;
  const [simulatedOrder, setSimulatedOrder] = useState<OrderPlacement | null>(null);

  useEffect(() => {
    useOrderBookStore.getState().clearOrderBook(selectedVenue);

    websocketService.forceReconnect(selectedVenue, selectedSymbol);

  }, [selectedVenue, selectedSymbol]);

  useEffect(() => {
    setSimulatedOrder(null);
  }, [selectedVenue, selectedSymbol]);

  const handleOrderSimulation = (orderData: OrderFormData) => {
    if (!orderbook) {
      console.warn('No orderbook data available for simulation');
      return;
    }

    const simulatedOrderData: SimulatedOrder = {
      venue: orderData.venue,
      symbol: orderData.symbol,
      orderType: orderData.orderType,
      side: orderData.side,
      price: orderData.price,
      quantity: orderData.quantity,
      timing: orderData.timing
    };

    const placement = OrderSimulationService.calculateOrderPlacement(simulatedOrderData, orderbook);
    setSimulatedOrder(placement);
  };

  return (
    <div className="font-sans min-h-screen flex flex-col items-center justify-center p-4 sm:p-8 bg-gray-50">
      <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Real-Time Orderbook Viewer
          </h1>
          <p className="text-gray-600">
            Monitor live orderbooks from multiple cryptocurrency exchanges with real-time updates
          </p>
        </div>
      <div className="w-full max-w-7xl flex flex-col gap-6">
        <VenueSwitcher />
        {/* <SymbolSelector /> */}
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 gap-8 flex flex-col">
              <OrderBookTable 
                orderbook={orderbook} 
                loading={loading} 
                simulatedOrder={simulatedOrder}
              />
              <MarketDepthChart orderbook={orderbook}/>
          </div>
          
          <div className="lg:col-span-1 space-y-6">
            <OrderSimulationForm onSubmit={handleOrderSimulation} />
            
            {simulatedOrder && (
              <OrderImpactMetrics impact={simulatedOrder.impact} />
            )}
            
          </div>
        </div>
      </div>
    </div>
  );
}

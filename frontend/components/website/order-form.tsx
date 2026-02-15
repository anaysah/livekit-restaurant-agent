// components/website/order-form.tsx

"use client";

import { useEffect, useState } from "react";
import { useFormSync } from "@/hooks/useFormSync";
import { useAppStore } from "@/lib/store/app-store";

const FORM_ID = "order-form";

const MENU_ITEMS = [
  { id: "burger", name: "Classic Burger", price: 12.99 },
  { id: "pizza", name: "Margherita Pizza", price: 14.99 },
  { id: "pasta", name: "Pasta Carbonara", price: 13.99 },
  { id: "salad", name: "Caesar Salad", price: 9.99 },
  { id: "steak", name: "Grilled Steak", price: 24.99 },
];

export default function OrderForm() {
  const { formState, updateField, sendAction } = useFormSync(FORM_ID);
  const setContext = useAppStore((state) => state.setContext);
  const [selectedItems, setSelectedItems] = useState<Record<string, number>>({});

  // Set context when component mounts
  useEffect(() => {
    setContext("ordering");
  }, [setContext]);

  const handleQuantityChange = (itemId: string, quantity: number) => {
    const newItems = { ...selectedItems, [itemId]: quantity };
    if (quantity === 0) {
      delete newItems[itemId];
    }
    setSelectedItems(newItems);
    updateField("items", newItems, true); // Immediate update
  };

  const calculateTotal = () => {
    return Object.entries(selectedItems).reduce((total, [itemId, quantity]) => {
      const item = MENU_ITEMS.find((i) => i.id === itemId);
      return total + (item?.price || 0) * quantity;
    }, 0);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const orderData = {
      items: selectedItems,
      total: calculateTotal(),
      ...formState,
    };

    sendAction("submit-order", {
      formData: orderData,
      timestamp: Date.now(),
    });

    console.log("Order submitted:", orderData);
    alert("Order placed! Check console for details.");
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Order Food</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Menu Items */}
        <div>
          <h3 className="text-lg font-semibold mb-3">Select Items</h3>
          <div className="space-y-3">
            {MENU_ITEMS.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 border border-gray-300 rounded-md"
              >
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-gray-600">${item.price.toFixed(2)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      handleQuantityChange(item.id, (selectedItems[item.id] || 0) - 1)
                    }
                    className="w-8 h-8 border border-gray-300 rounded-md hover:bg-gray-100"
                    disabled={!selectedItems[item.id]}
                  >
                    -
                  </button>
                  <span className="w-8 text-center">{selectedItems[item.id] || 0}</span>
                  <button
                    type="button"
                    onClick={() =>
                      handleQuantityChange(item.id, (selectedItems[item.id] || 0) + 1)
                    }
                    className="w-8 h-8 border border-gray-300 rounded-md hover:bg-gray-100"
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Delivery Details */}
        <div>
          <h3 className="text-lg font-semibold mb-3">Delivery Details</h3>
          
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Your Name"
              value={formState.name || ""}
              onChange={(e) => updateField("name", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            
            <input
              type="tel"
              placeholder="Phone Number"
              value={formState.phone || ""}
              onChange={(e) => updateField("phone", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            
            <textarea
              placeholder="Delivery Address"
              value={formState.address || ""}
              onChange={(e) => updateField("address", e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Total */}
        <div className="p-4 bg-gray-100 rounded-md">
          <div className="flex justify-between text-lg font-bold">
            <span>Total:</span>
            <span>${calculateTotal().toFixed(2)}</span>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={Object.keys(selectedItems).length === 0}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          Place Order
        </button>
      </form>

      {/* Debug Info */}
      <div className="mt-6 p-4 bg-gray-100 rounded-md">
        <p className="text-sm font-semibold mb-2">Form State (Debug):</p>
        <pre className="text-xs overflow-auto">
          {JSON.stringify({ ...formState, items: selectedItems }, null, 2)}
        </pre>
      </div>
    </div>
  );
}

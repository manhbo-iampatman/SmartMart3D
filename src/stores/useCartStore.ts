import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Product, CartItem } from "../types";

interface CartState {
  items: CartItem[];
  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getTotalVND: () => number;
  getTotalItems: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (product: Product) => {
        const currentItems = get().items;
        const existingIndex = currentItems.findIndex(
          (item) => item.product.id === product.id
        );

        if (existingIndex > -1) {
          const newItems = [...currentItems];
          newItems[existingIndex] = {
            ...newItems[existingIndex],
            quantity: newItems[existingIndex].quantity + 1,
          };
          set({ items: newItems });
        } else {
          set({ items: [...currentItems, { product, quantity: 1 }] });
        }
      },
      removeItem: (productId: string) => {
        set({
          items: get().items.filter((item) => item.product.id !== productId),
        });
      },
      updateQuantity: (productId: string, quantity: number) => {
        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }
        set({
          items: get().items.map((item) =>
            item.product.id === productId ? { ...item, quantity } : item
          ),
        });
      },
      clearCart: () => set({ items: [] }),
      getTotalVND: () => {
        return get().items.reduce(
          (sum, item) => sum + item.product.price * item.quantity,
          0
        );
      },
      getTotalItems: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      },
    }),
    {
      name: "smartmart-cart-storage",
    }
  )
);


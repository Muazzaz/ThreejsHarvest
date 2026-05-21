import { create } from 'zustand';
import type { FruitType } from '../lib/products';
import { PRODUCTS } from '../lib/products';

export interface CartItem {
  id: FruitType;
  name: string;
  emoji: string;
  pricePerKg: number;
  weightKg: number;
}

export type AppMode = 'explore' | 'checkout';
export type CheckoutStep = 'cart' | 'shipping' | 'payment' | 'success';

interface OrderDetails {
  name: string;
  phone: string;
  address: string;
  district: string;
}

interface OrchardStore {
  // App mode
  mode: AppMode;
  setMode: (m: AppMode) => void;

  // Checkout step
  checkoutStep: CheckoutStep;
  setCheckoutStep: (s: CheckoutStep) => void;

  // Order details
  orderDetails: OrderDetails;
  setOrderDetails: (d: Partial<OrderDetails>) => void;
  orderId: string | null;
  setOrderId: (id: string) => void;

  // Cart
  cart: CartItem[];
  addToCart: (id: FruitType, kg?: number) => void;
  removeFromCart: (id: FruitType) => void;
  updateWeight: (id: FruitType, kg: number) => void;
  clearCart: () => void;
  totalItems: () => number;
  totalWeight: () => number;
  totalPrice: () => number;

  // HUD / proximity state
  nearbyFruit: FruitType | null;
  setNearbyFruit: (id: FruitType | null) => void;
  harvestCooldown: boolean;
  setHarvestCooldown: (v: boolean) => void;

  // Cart panel visibility
  cartOpen: boolean;
  setCartOpen: (v: boolean) => void;
}

export const useOrchardStore = create<OrchardStore>((set, get) => ({
  mode: 'explore',
  setMode: (m) => set({ mode: m }),

  checkoutStep: 'cart',
  setCheckoutStep: (s) => set({ checkoutStep: s }),

  orderDetails: { name: '', phone: '', address: '', district: '' },
  setOrderDetails: (d) =>
    set((state) => ({ orderDetails: { ...state.orderDetails, ...d } })),
  orderId: null,
  setOrderId: (id) => set({ orderId: id }),

  cart: [],
  addToCart: (id, kg = 1) => {
    const product = PRODUCTS[id];
    set((state) => {
      const existing = state.cart.find((i) => i.id === id);
      if (existing) {
        return {
          cart: state.cart.map((i) =>
            i.id === id ? { ...i, weightKg: i.weightKg + kg } : i
          ),
        };
      }
      return {
        cart: [
          ...state.cart,
          {
            id,
            name: product.name,
            emoji: product.emoji,
            pricePerKg: product.pricePerKg,
            weightKg: kg,
          },
        ],
      };
    });
  },
  removeFromCart: (id) =>
    set((state) => ({ cart: state.cart.filter((i) => i.id !== id) })),
  updateWeight: (id, kg) =>
    set((state) => ({
      cart: state.cart.map((i) => (i.id === id ? { ...i, weightKg: kg } : i)),
    })),
  clearCart: () => set({ cart: [] }),
  totalItems: () => get().cart.length,
  totalWeight: () => get().cart.reduce((s, i) => s + i.weightKg, 0),
  totalPrice: () =>
    get().cart.reduce((s, i) => s + i.pricePerKg * i.weightKg, 0),

  nearbyFruit: null,
  setNearbyFruit: (id) => set({ nearbyFruit: id }),
  harvestCooldown: false,
  setHarvestCooldown: (v) => set({ harvestCooldown: v }),

  cartOpen: false,
  setCartOpen: (v) => set({ cartOpen: v }),
}));

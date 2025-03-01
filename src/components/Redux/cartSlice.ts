// Redux/cartSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

/** Updated CartItem interface to include quantity. */
interface CartItem {
  productId: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
}

interface CartState {
  items: CartItem[];
}

// Load cart items from local storage
const loadCartFromLocalStorage = (): CartItem[] => {
  const savedCart = localStorage.getItem("cartItems");
  return savedCart ? JSON.parse(savedCart) : [];
};

const initialState: CartState = {
  items: loadCartFromLocalStorage(),
};

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    /**
     * If the product is already in the cart, increment its quantity;
     * otherwise, add it as a new item.
     */
    addToCart(state, action: PayloadAction<CartItem>) {
      const existingItem = state.items.find(
        (item) => item.productId === action.payload.productId
      );

      if (existingItem) {
        existingItem.quantity += action.payload.quantity;
      } else {
        state.items.push(action.payload);
      }

      saveCartToLocalStorage(state.items);
    },

    /**
     * Remove the item entirely from the cart.
     * (Optionally, you could decrement quantity here instead of removing the item.)
     */
    removeFromCart(state, action: PayloadAction<string>) {
      state.items = state.items.filter(
        (item) => item.productId !== action.payload
      );
      saveCartToLocalStorage(state.items);
    },

    /**
     * Clears the entire cart.
     */
    clearCart(state) {
      state.items = [];
      saveCartToLocalStorage(state.items);
    },
  },
});

// Helper function to save cart items to local storage
const saveCartToLocalStorage = (items: CartItem[]) => {
  localStorage.setItem("cartItems", JSON.stringify(items));
};

export const { addToCart, removeFromCart, clearCart } = cartSlice.actions;
export default cartSlice.reducer;

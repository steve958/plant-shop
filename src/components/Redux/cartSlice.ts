import { cartKey } from '../../data/productOptions';
// Redux/cartSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

/** Updated CartItem interface to include quantity. */
interface CartItem {
  productId: string;
  packageId?: string;
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
        (item) => cartKey(item) === cartKey(action.payload)
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
        (item) => cartKey(item) !== action.payload
      );
      saveCartToLocalStorage(state.items);
    },

    increaseQuantity(state, action: PayloadAction<string>) {
      const item = state.items.find((cartItem) => cartKey(cartItem) === action.payload);
      if (item) item.quantity += 1;
      saveCartToLocalStorage(state.items);
    },

    decreaseQuantity(state, action: PayloadAction<string>) {
      const item = state.items.find((cartItem) => cartKey(cartItem) === action.payload);
      if (!item) return;
      if (item.quantity > 1) {
        item.quantity -= 1;
      } else {
        state.items = state.items.filter((cartItem) => cartKey(cartItem) !== action.payload);
      }
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

export const {
  addToCart,
  removeFromCart,
  increaseQuantity,
  decreaseQuantity,
  clearCart,
} = cartSlice.actions;
export default cartSlice.reducer;

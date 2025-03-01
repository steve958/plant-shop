import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// Define an interface for the User object to include additional fields
interface User {
  email: string;
  isAdmin: boolean;
  name?: string;
  number?: string;
  phoneNumber?: string;
  place?: string;
  postalCode?: string;
  street?: string;
  surname?: string;
}

// Update the UserState interface to reflect the new User structure
interface UserState {
  user: User | null; // Allow user to be null or an object with User properties
}

const initialState: UserState = {
  user: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    login(state, action: PayloadAction<User>) { // Update PayloadAction to use User interface
      state.user = action.payload;
    },
    logout(state) {
      state.user = null;
    },
  },
});

export const { login, logout } = authSlice.actions;
export default authSlice.reducer;

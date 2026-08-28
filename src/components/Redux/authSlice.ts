import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface AdminUser {
  email: string;
  isAdmin: boolean;
}

// Update the UserState interface to reflect the new User structure
interface UserState {
  user: AdminUser | null;
}

const initialState: UserState = {
  user: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    login(state, action: PayloadAction<AdminUser>) {
      state.user = action.payload;
    },
    logout(state) {
      state.user = null;
    },
  },
});

export const { login, logout } = authSlice.actions;
export default authSlice.reducer;

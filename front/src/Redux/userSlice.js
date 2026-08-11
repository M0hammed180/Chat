import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  userId: "",
  userName: "",
  username: "",
  email: "",
  phone: "",
  bio: "",
  avatar: "",
  isAuthenticated: false,
};


const storedUser = JSON.parse(localStorage.getItem("userData")) || initialState;

const UserSlice = createSlice({
  name: "User",
  initialState: storedUser,
  reducers: {
    setUserData: (state, action) => {
      state.userId = action.payload._id;
      state.userName = action.payload.name;
      state.username = action.payload.username;
      state.email = action.payload.email;
      state.phone = action.payload.phone;
      state.bio = action.payload.bio;
      state.avatar = action.payload.avatar;
      state.isAuthenticated = true;

      localStorage.setItem("userData", JSON.stringify(state));
    },

    logout: (state) => {
      Object.assign(state, initialState);
      localStorage.removeItem("userData");
    },
  },
});

export const { setUserData, logout } = UserSlice.actions;
export default UserSlice.reducer;

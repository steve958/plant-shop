// src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import "./index.css";
import { router } from "./routes";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import store, { persistor } from "./components/Redux/store";
import { ThemeProvider } from "@emotion/react";
import theme from "./theme";

ReactDOM.createRoot(document.getElementById("root")!).render(

  
  <React.StrictMode>
    <Provider store={store}>
      <ThemeProvider theme={theme}>
      <PersistGate loading={null} persistor={persistor}>
        <RouterProvider router={router} />
      </PersistGate>
      </ThemeProvider>
    </Provider>
  </React.StrictMode>
);

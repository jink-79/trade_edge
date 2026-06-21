import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";

import App from "./app/app";
import { AppProviders } from "./app/providers";

document.documentElement.classList.add("dark");

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AppProviders>
      <App />
    </AppProviders>
  </React.StrictMode>,
);

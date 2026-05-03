import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { Toaster } from "react-hot-toast";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <Toaster
      position="bottom-right"
      reverseOrder={false}
      toastOptions={{
        style: {
          background: "#1C1C1C",
          color: "#c8a84b",
          border: "1px solid #c8a84b",
          borderRadius: "10px",
          fontSize: "14px",
        },
      }}
    />
    <App />
  </React.StrictMode>,
);

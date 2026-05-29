import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { Toaster } from "react-hot-toast";
import Titlebar from "./components/ui/titlebar/Titlebar";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <div className="flex flex-col h-screen overflow-hidden">
      <Titlebar />
      <div className="flex-1 flex flex-col overflow-hidden min-h-0 relative">
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
      </div>
    </div>

  </React.StrictMode>,
);

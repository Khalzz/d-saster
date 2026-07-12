import { getCurrentWindow } from "@tauri-apps/api/window";
import { Dices, Maximize2, Minus, X } from "lucide-react";
import { useEffect, useState } from "react";

export default function Titlebar() {
  const appWindow = getCurrentWindow();
  const [title, setTitle] = useState("");

  useEffect(() => {
    appWindow.title().then(setTitle).catch(() => {});
  }, [appWindow]);

  const minimize = () => appWindow.minimize();
  const toggleMaximize = () => appWindow.toggleMaximize();
  const close = () => appWindow.close();

  return (
    <div
      data-tauri-drag-region
      className="titlebar flex justify-between items-center bg-base p-2 border-b border-gold-500/20"
      onDoubleClick={toggleMaximize}
    >
      <div className="flex items-center gap-1.5 px-1 text-gold-400 pointer-events-none">
        <Dices className="h-3.5 w-3.5" />
        <span className="text-xs font-medium">{title}</span>
      </div>
      <div className="controls flex flex-row gap-1">
        <button className=" h-5 w-5 min-w-0 rounded-full" title="minimize" onClick={minimize}>
          <Minus className="h-3 w-3" />
        </button>
        <button className=" h-5 w-5 min-w-0 rounded-full" title="maximize" onClick={toggleMaximize}>
          <Maximize2 className="h-3 w-3" />
        </button>
        <button className=" h-5 w-5 min-w-0 rounded-full hover:bg-red-500" title="close" onClick={close}>
          <X className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}
import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { AlertTriangle } from "lucide-react";

const ConfirmModal = ({ 
  message, 
  onResolve, 
  onClose 
}: { 
  message: string; 
  onResolve: (val: boolean) => void;
  onClose: () => void;
}) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Trigger enter animation
    requestAnimationFrame(() => setVisible(true));
  }, []);

  const handleClose = (result: boolean) => {
    setVisible(false);
    setTimeout(() => {
      onResolve(result);
      onClose();
    }, 200); // wait for fade out
  };

  return (
    <div 
      className={`fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm transition-opacity duration-200 ${visible ? "opacity-100" : "opacity-0"}`}
      onClick={() => handleClose(false)}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`max-w-md w-full bg-white shadow-2xl rounded-2xl pointer-events-auto flex flex-col ring-1 ring-black/5 transition-all duration-200 ${
          visible ? "scale-100 opacity-100" : "scale-95 opacity-0"
        }`}
      >
        <div className="p-6 flex flex-col items-center text-center gap-4">
          <div className="flex-shrink-0 flex items-center justify-center w-14 h-14 rounded-full bg-amber-100">
            <AlertTriangle className="w-7 h-7 text-amber-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Please Confirm</h3>
            <p className="text-sm text-slate-500 leading-relaxed max-w-sm mx-auto">{message}</p>
          </div>
        </div>
        <div className="flex border-t border-slate-100 bg-slate-50 rounded-b-2xl">
          <button
            onClick={() => handleClose(false)}
            className="w-full border-r border-slate-200 p-4 flex items-center justify-center text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors focus:outline-none rounded-bl-2xl"
          >
            Cancel
          </button>
          <button
            onClick={() => handleClose(true)}
            className="w-full p-4 flex items-center justify-center text-sm font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 transition-colors focus:outline-none rounded-br-2xl"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

export const customConfirm = (message: string): Promise<boolean> => {
  return new Promise((resolve) => {
    if (typeof document === "undefined") {
      resolve(false);
      return;
    }

    const div = document.createElement("div");
    document.body.appendChild(div);
    const root = createRoot(div);

    const cleanup = () => {
      root.unmount();
      if (div.parentNode) {
        div.parentNode.removeChild(div);
      }
    };

    root.render(
      <ConfirmModal 
        message={message} 
        onResolve={resolve} 
        onClose={cleanup} 
      />
    );
  });
};

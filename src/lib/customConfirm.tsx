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

  const hostName = typeof window !== "undefined" ? window.location.host : "localhost:3000";

  return (
    <div 
      className={`fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/40 backdrop-blur-[2px] transition-opacity duration-200 ${visible ? "opacity-100" : "opacity-0"}`}
      onClick={() => handleClose(false)}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-[420px] max-w-[90vw] bg-white shadow-xl rounded-2xl pointer-events-auto flex flex-col transition-all duration-200 ${
          visible ? "scale-100 opacity-100" : "scale-95 opacity-0"
        }`}
      >
        <div className="px-6 pt-6 pb-8">
          <h3 className="text-[16px] font-bold text-slate-900 mb-4">{hostName} says</h3>
          <p className="text-[15px] text-slate-800 leading-snug">{message}</p>
        </div>
        <div className="px-6 pb-6 flex justify-end gap-3">
          <button
            onClick={() => handleClose(false)}
            className="px-6 py-2.5 bg-[#F3E779] hover:bg-[#E8DB6A] text-slate-900 text-[15px] font-medium rounded-full transition-colors focus:outline-none"
          >
            Cancel
          </button>
          <button
            onClick={() => handleClose(true)}
            className="px-8 py-2.5 bg-[#636C18] hover:bg-[#525912] text-white text-[15px] font-medium rounded-full transition-colors focus:outline-none"
          >
            OK
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

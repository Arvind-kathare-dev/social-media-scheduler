import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: string;
}

export default function Modal({ isOpen, onClose, title, children, maxWidth = "max-w-md" }: ModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998] flex items-center justify-center p-4">
      <div className={`bg-panel border border-strong-line rounded-custom shadow-custom w-full ${maxWidth} overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-[9999]`}>
        <div className="flex justify-between items-center p-4 border-b border-line bg-panel-2/30">
          <h2 className="font-bold text-lg m-0">{title}</h2>
          <button className="icon-btn text-muted hover:text-text" onClick={onClose} type="button">
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body
  );
}

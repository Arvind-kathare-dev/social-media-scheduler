import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

interface SlideOverProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  width?: string;
}

export default function SlideOver({ isOpen, onClose, children, width = "max-w-3xl" }: SlideOverProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <>
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998] transition-opacity" 
        onClick={onClose}
      />
      <div className={`fixed inset-y-0 right-0 z-[9999] w-full ${width} bg-panel shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out`}>
        {children}
      </div>
    </>,
    document.body
  );
}

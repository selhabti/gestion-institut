import { toast as sonnerToast } from "sonner";
import { useState } from "react";

export interface Toast {
  id: string;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  variant?: "default" | "destructive";
  duration?: number;
}

export interface ToastOptions {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  variant?: "default" | "destructive";
  duration?: number;
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = (options: ToastOptions) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: Toast = {
      id,
      title: options.title,
      description: options.description,
      action: options.action,
      variant: options.variant,
    };
    
    setToasts((prev) => [...prev, newToast]);

    // Auto-dismiss
    if (options.duration !== 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, options.duration || 3000);
    }

    // Afficher aussi avec sonner
    if (options.variant === "destructive") {
      sonnerToast.error(options.title, {
        description: options.description,
        duration: options.duration || 3000,
      });
    } else {
      sonnerToast.success(options.title, {
        description: options.description,
        duration: options.duration || 3000,
      });
    }

    return id;
  };

  const dismiss = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    sonnerToast.dismiss(id);
  };

  return { toast, dismiss, toasts };
}

// Pour les appels globaux sans hook
export const toast = (options: ToastOptions) => {
  if (options.variant === "destructive") {
    return sonnerToast.error(options.title, {
      description: options.description,
      duration: options.duration || 3000,
    });
  }
  return sonnerToast.success(options.title, {
    description: options.description,
    duration: options.duration || 3000,
  });
};
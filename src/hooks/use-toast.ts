// src/hooks/use-toast.ts
import { toast as sonnerToast } from "sonner";

export interface ToastProps {
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
  duration?: number;
}

export function toast(props: ToastProps) {
  const { title, description, variant, duration } = props;
  
  if (variant === "destructive") {
    return sonnerToast.error(title, {
      description,
      duration: duration || 3000,
    });
  }
  
  return sonnerToast.success(title, {
    description,
    duration: duration || 3000,
  });
}

export function useToast() {
  return {
    toast,
    dismiss: (id: string) => sonnerToast.dismiss(id),
    toasts: [], // Pour compatibilité avec shadcn/ui
  };
}
"use client";

import {
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  registerToastHandler,
  ToastView,
  type ToastItem,
  type ToastType,
} from "./toast";

const TOAST_DURATION_MS = 4000;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const show = useCallback((message: string, type: ToastType) => {
    const id = crypto.randomUUID();
    setToasts((current) => [...current, { id, message, type }]);

    window.setTimeout(() => {
      dismiss(id);
    }, TOAST_DURATION_MS);
  }, [dismiss]);

  useEffect(() => {
    registerToastHandler(show);
    return () => registerToastHandler(null);
  }, [show]);

  return (
    <>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed bottom-4 right-4 z-[100] flex flex-col gap-2"
      >
        {toasts.map((item) => (
          <ToastView key={item.id} item={item} onDismiss={dismiss} />
        ))}
      </div>
    </>
  );
}

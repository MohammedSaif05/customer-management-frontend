/**
 * Toast notifications context (wrapper around react-hot-toast)
 */

import { createContext, useContext, useCallback } from 'react';
import toast from 'react-hot-toast';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const showToast = useCallback((message, type = 'default') => {
    switch (type) {
      case 'success':
        toast.success(message);
        break;
      case 'error':
        toast.error(message);
        break;
      case 'loading':
        return toast.loading(message);
      default:
        toast(message);
    }
  }, []);

  const dismissToast = useCallback((id) => {
    toast.dismiss(id);
  }, []);

  const value = { showToast, dismissToast, toast };
  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

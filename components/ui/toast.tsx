'use client';

import { useState, useCallback } from 'react';
import { X, CheckCircle, AlertCircle, Info, Loader2 } from 'lucide-react';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'info' | 'loading';
  title: string;
  description?: string;
  duration?: number;
  action?: { label: string; onClick: () => void };
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const TOAST_LIMIT = 5;
const TOAST_REMOVE_DELAY = 1000000;

type ToastAction = 
  | { type: 'ADD_TOAST'; toast: Toast }
  | { type: 'UPDATE_TOAST'; toast: Partial<Toast> & { id: string } }
  | { type: 'DISMISS_TOAST'; toastId?: string }
  | { type: 'REMOVE_TOAST'; toastId?: string };

interface ToastState {
  toasts: Toast[];
}

export function toastReducer(state: ToastState, action: ToastAction): ToastState {
  switch (action.type) {
    case 'ADD_TOAST':
      return { toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT) };
    case 'UPDATE_TOAST':
      return { toasts: state.toasts.map(t => t.id === action.toast.id ? { ...t, ...action.toast } : t) };
    case 'DISMISS_TOAST': {
      const { toastId } = action;
      if (toastId) {
        return { toasts: state.toasts.map(t => t.id === toastId ? { ...t, open: false } : t) };
      }
      return { toasts: state.toasts.map(t => ({ ...t, open: false })) };
    }
    case 'REMOVE_TOAST':
      if (action.toastId === undefined) return { toasts: [] };
      return { toasts: state.toasts.filter(t => t.id !== action.toastId) };
    default:
      return state;
  }
}

const listeners: Array<(state: ToastState) => void> = [];
let memoryState: ToastState = { toasts: [] };

function dispatch(action: ToastAction) {
  memoryState = toastReducer(memoryState, action);
  listeners.forEach(listener => listener(memoryState));
}

function genId() {
  return Math.random().toString(36).substring(2, 9);
}

type ToastOptions = Omit<Toast, 'id'>;

function toast({ ...props }: ToastOptions) {
  const id = genId();
  const update = (props: ToastOptions) => dispatch({ type: 'UPDATE_TOAST', toast: { ...props, id } });
  const dismiss = () => dispatch({ type: 'DISMISS_TOAST', toastId: id });

  dispatch({
    type: 'ADD_TOAST',
    toast: { ...props, id, open: true, onOpenChange: (open: boolean) => { if (!open) dismiss(); } },
  });

  return { id, dismiss, update };
}

export function useToast() {
  const [state, setState] = useState<ToastState>(memoryState);

  useEffect(() => {
    listeners.push(setState);
    return () => {
      const index = listeners.indexOf(setState);
      if (index > -1) listeners.splice(index, 1);
    };
  }, []);

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) => dispatch({ type: 'DISMISS_TOAST', toastId }),
  };
}

function Toast({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  const icons = {
    success: <CheckCircle className="w-5 h-5 text-green-500" />,
    error: <AlertCircle className="w-5 h-5 text-red-500" />,
    info: <Info className="w-5 h-5 text-blue-500" />,
    loading: <Loader2 className="w-5 h-5 text-amber-500 animate-spin" />,
  };

  return (
    <div className={`flex items-start gap-3 p-4 rounded-xl border shadow-lg animate-in slide-in-from-right-4 ${
      toast.type === 'success' ? 'bg-green-500/10 border-green-500/30' :
      toast.type === 'error' ? 'bg-red-500/10 border-red-500/30' :
      toast.type === 'loading' ? 'bg-amber-500/10 border-amber-500/30' :
      'bg-blue-500/10 border-blue-500/30'
    }`}>
      <div className="flex-shrink-0 mt-0.5">{icons[toast.type]}</div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-white">{toast.title}</p>
        {toast.description && <p className="text-xs text-zinc-400 mt-1">{toast.description}</p>}
        {toast.action && (
          <button onClick={toast.action.onClick} className="mt-2 text-xs font-medium text-amber-400 hover:text-amber-300 underline">
            {toast.action.label}
          </button>
        )}
      </div>
      <button onClick={() => onDismiss(toast.id)} className="flex-shrink-0 text-zinc-500 hover:text-zinc-300">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const { toasts, dismiss } = useToast();

  return (
    <>
      {children}
      <div className="fixed bottom-20 left-4 right-4 z-50 max-w-md mx-auto flex flex-col gap-2 pointer-events-none">
        {toasts.map(toast => (
          <div key={toast.id} className="pointer-events-auto">
            <Toast toast={toast} onDismiss={dismiss} />
          </div>
        ))}
      </div>
    </>
  );
}

import { useEffect } from 'react';
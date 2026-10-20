'use client'

import { useCallback, useEffect, useState } from 'react'
import { X, CheckCircle, AlertCircle, Info, Loader2 } from 'lucide-react'

interface ToastItem {
  id: string
  type: 'success' | 'error' | 'info' | 'loading'
  title: string
  description?: string
  duration?: number
  action?: { label: string; onClick: () => void }
  open?: boolean
}

const TOAST_LIMIT = 5

type ToastAction =
  | { type: 'ADD_TOAST'; toast: ToastItem }
  | { type: 'UPDATE_TOAST'; toast: Partial<ToastItem> & { id: string } }
  | { type: 'DISMISS_TOAST'; toastId?: string }
  | { type: 'REMOVE_TOAST'; toastId?: string }

interface ToastState {
  toasts: ToastItem[]
}

function toastReducer(state: ToastState, action: ToastAction): ToastState {
  switch (action.type) {
    case 'ADD_TOAST':
      return { toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT) }
    case 'UPDATE_TOAST':
      return { toasts: state.toasts.map((t) => (t.id === action.toast.id ? { ...t, ...action.toast } : t)) }
    case 'DISMISS_TOAST': {
      const { toastId } = action
      if (toastId) {
        return { toasts: state.toasts.map((t) => (t.id === toastId ? { ...t, open: false } : t)) }
      }
      return { toasts: state.toasts.map((t) => ({ ...t, open: false })) }
    }
    case 'REMOVE_TOAST':
      if (action.toastId === undefined) return { toasts: [] }
      return { toasts: state.toasts.filter((t) => t.id !== action.toastId) }
    default:
      return state
  }
}

const listeners: Array<(state: ToastState) => void> = []
let memoryState: ToastState = { toasts: [] }

function dispatch(action: ToastAction) {
  memoryState = toastReducer(memoryState, action)
  listeners.forEach((listener) => listener(memoryState))
}

function genId() {
  return Math.random().toString(36).substring(2, 9)
}

type ToastOptions = Omit<ToastItem, 'id'>

function createToast(props: ToastOptions) {
  const id = genId()
  const update = (next: ToastOptions) => dispatch({ type: 'UPDATE_TOAST', toast: { ...next, id } })
  const dismiss = () => dispatch({ type: 'DISMISS_TOAST', toastId: id })

  dispatch({
    type: 'ADD_TOAST',
    toast: { ...props, id, open: true, duration: props.duration ?? 4000 },
  })

  return { id, dismiss, update }
}

export const toast = Object.assign(createToast, {
  error(title: string, description?: string) {
    return createToast({ type: 'error', title, description })
  },
  success(title: string, description?: string) {
    return createToast({ type: 'success', title, description })
  },
  info(title: string, description?: string) {
    return createToast({ type: 'info', title, description })
  },
})

export function useToast() {
  const [state, setState] = useState<ToastState>(memoryState)

  useEffect(() => {
    listeners.push(setState)
    return () => {
      const index = listeners.indexOf(setState)
      if (index > -1) listeners.splice(index, 1)
    }
  }, [])

  const dismiss = useCallback((toastId?: string) => dispatch({ type: 'DISMISS_TOAST', toastId }), [])

  return {
    ...state,
    toast,
    dismiss,
  }
}

function ToastCard({ item, onDismiss }: { item: ToastItem; onDismiss: (id: string) => void }) {
  useEffect(() => {
    if (!item.duration || item.type === 'loading') return
    const timer = window.setTimeout(() => onDismiss(item.id), item.duration)
    return () => window.clearTimeout(timer)
  }, [item.duration, item.id, item.type, onDismiss])

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-wine-600" aria-hidden="true" />,
    error: <AlertCircle className="w-5 h-5 text-wine-700" aria-hidden="true" />,
    info: <Info className="w-5 h-5 text-wine-600" aria-hidden="true" />,
    loading: <Loader2 className="w-5 h-5 text-wine-600 animate-spin" aria-hidden="true" />,
  }

  return (
    <div
      className="flex items-start gap-3 p-4 rounded-xl border border-cream-300 bg-cream-50 shadow-sm"
      role="status"
      aria-live="polite"
    >
      <div className="flex-shrink-0 mt-0.5">{icons[item.type]}</div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-wine-900">{item.title}</p>
        {item.description && <p className="text-xs text-wine-500 mt-1">{item.description}</p>}
        {item.action && (
          <button type="button" onClick={item.action.onClick} className="mt-2 text-xs font-semibold text-wine-700 underline">
            {item.action.label}
          </button>
        )}
      </div>
      <button
        type="button"
        onClick={() => onDismiss(item.id)}
        className="flex-shrink-0 text-wine-500 hover:text-wine-800"
        aria-label="Dismiss notification"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const { toasts, dismiss } = useToast()

  return (
    <>
      {children}
      <div className="fixed bottom-20 left-4 right-4 z-50 max-w-md mx-auto flex flex-col gap-2 pointer-events-none">
        {toasts.filter((item) => item.open !== false).map((item) => (
          <div key={item.id} className="pointer-events-auto">
            <ToastCard item={item} onDismiss={dismiss} />
          </div>
        ))}
      </div>
    </>
  )
}

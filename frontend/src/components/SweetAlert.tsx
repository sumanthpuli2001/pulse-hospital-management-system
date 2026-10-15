import React, { useState, useEffect } from 'react';
import { Check, X, AlertTriangle, Info } from 'lucide-react';

export type SweetAlertType = 'success' | 'error' | 'warning' | 'info';

export interface SweetAlertOptions {
  type?: SweetAlertType;
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  showCancel?: boolean;
  onConfirm?: () => void;
  onCancel?: () => void;
}

type AlertCallback = (confirmed: boolean) => void;

interface AlertState extends SweetAlertOptions {
  isOpen: boolean;
  callback?: AlertCallback;
}

let alertHandler: ((options: SweetAlertOptions, callback?: AlertCallback) => void) | null = null;

export const sweetAlert = {
  fire: (options: SweetAlertOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      if (alertHandler) {
        alertHandler(options, (confirmed) => resolve(confirmed));
      } else {
        resolve(true);
      }
    });
  },
  success: (title: string, message?: string, confirmText = 'OK'): Promise<boolean> => {
    return sweetAlert.fire({ type: 'success', title, message, confirmText, showCancel: false });
  },
  error: (title: string, message?: string, confirmText = 'Understood'): Promise<boolean> => {
    return sweetAlert.fire({ type: 'error', title, message, confirmText, showCancel: false });
  },
  warning: (title: string, message?: string, confirmText = 'Acknowledge'): Promise<boolean> => {
    return sweetAlert.fire({ type: 'warning', title, message, confirmText, showCancel: false });
  },
  info: (title: string, message?: string, confirmText = 'OK'): Promise<boolean> => {
    return sweetAlert.fire({ type: 'info', title, message, confirmText, showCancel: false });
  },
  confirm: (title: string, message?: string, confirmText = 'Yes, Proceed', cancelText = 'Cancel'): Promise<boolean> => {
    return sweetAlert.fire({
      type: 'warning',
      title,
      message,
      confirmText,
      cancelText,
      showCancel: true,
    });
  },
};

export const SweetAlertContainer: React.FC = () => {
  const [state, setState] = useState<AlertState>({
    isOpen: false,
    title: '',
    type: 'info',
  });

  useEffect(() => {
    alertHandler = (options, callback) => {
      setState({
        ...options,
        isOpen: true,
        type: options.type || 'info',
        confirmText: options.confirmText || 'OK',
        cancelText: options.cancelText || 'Cancel',
        callback,
      });
    };

    return () => {
      alertHandler = null;
    };
  }, []);

  if (!state.isOpen) return null;

  const handleConfirm = () => {
    setState((prev) => ({ ...prev, isOpen: false }));
    if (state.onConfirm) state.onConfirm();
    if (state.callback) state.callback(true);
  };

  const handleCancel = () => {
    setState((prev) => ({ ...prev, isOpen: false }));
    if (state.onCancel) state.onCancel();
    if (state.callback) state.callback(false);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/25 transition-opacity">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200/90 max-w-sm w-full p-6 text-center transform transition-all animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Animated Icon Ring */}
        <div className="mx-auto flex items-center justify-center mb-4">
          {state.type === 'success' && (
            <div className="w-16 h-16 rounded-full bg-emerald-50 border-4 border-emerald-200 flex items-center justify-center text-emerald-600 animate-bounce">
              <Check className="w-8 h-8 stroke-[3]" />
            </div>
          )}
          {state.type === 'error' && (
            <div className="w-16 h-16 rounded-full bg-rose-50 border-4 border-rose-200 flex items-center justify-center text-rose-600">
              <X className="w-8 h-8 stroke-[3]" />
            </div>
          )}
          {state.type === 'warning' && (
            <div className="w-16 h-16 rounded-full bg-amber-50 border-4 border-amber-200 flex items-center justify-center text-amber-600">
              <AlertTriangle className="w-8 h-8 stroke-[2.5]" />
            </div>
          )}
          {state.type === 'info' && (
            <div className="w-16 h-16 rounded-full bg-teal-50 border-4 border-teal-200 flex items-center justify-center text-teal-600">
              <Info className="w-8 h-8 stroke-[2.5]" />
            </div>
          )}
        </div>

        {/* Title */}
        <h3 className="text-lg font-bold text-slate-900 tracking-tight mb-2">
          {state.title}
        </h3>

        {/* Message */}
        {state.message && (
          <p className="text-xs text-slate-600 leading-relaxed mb-6 px-2">
            {state.message}
          </p>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-center gap-3 mt-4">
          {state.showCancel && (
            <button
              onClick={handleCancel}
              className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition active:scale-95"
            >
              {state.cancelText}
            </button>
          )}
          <button
            onClick={handleConfirm}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold text-white shadow-md transition active:scale-95 ${
              state.type === 'error'
                ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20'
                : state.type === 'warning'
                ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/20'
                : 'bg-teal-600 hover:bg-teal-700 shadow-teal-600/20'
            }`}
          >
            {state.confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

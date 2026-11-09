import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

type ToastKind = 'ok' | 'error';
type ToastItem = { id: number; msg: string; kind: ToastKind };
type ConfirmOpts = { message: string; danger?: boolean; okText?: string; cancelText?: string };
type Ctx = { toast: (msg: string, kind?: ToastKind | 'success') => void; confirm: (o: ConfirmOpts) => Promise<boolean> };

const UICtx = createContext<Ctx>({ toast: () => {}, confirm: async () => false });
export const useUI = () => useContext(UICtx);

export function Spinner() {
  return <div className="center"><span className="spinner" role="status" aria-label="Đang tải" /></div>;
}

export function UIProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [ask, setAsk] = useState<(ConfirmOpts & { resolve: (v: boolean) => void }) | null>(null);
  const seq = useRef(0);
  const okRef = useRef<HTMLButtonElement>(null);

  const dismiss = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), []);
  const toast = useCallback((msg: string, kind: ToastKind | 'success' = 'ok') => {
    const id = ++seq.current;
    const k: ToastKind = kind === 'error' ? 'error' : 'ok';
    setToasts((t) => [...t, { id, msg, kind: k }].slice(-4));
    setTimeout(() => dismiss(id), k === 'error' ? 5000 : 3000);
  }, [dismiss]);
  const confirm = useCallback((o: ConfirmOpts) => new Promise<boolean>((resolve) => setAsk({ ...o, resolve })), []);

  const close = (v: boolean) => { ask?.resolve(v); setAsk(null); };

  useEffect(() => {
    if (!ask) return;
    okRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { ask.resolve(false); setAsk(null); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [ask]);

  const value = useMemo(() => ({ toast, confirm }), [toast, confirm]);

  return (
    <UICtx.Provider value={value}>
      {children}
      <div className="toasts" aria-live="polite" role="status">
        {toasts.map((t) => (
          <button key={t.id} type="button" className={`toast ${t.kind}`} onClick={() => dismiss(t.id)}>{t.msg}</button>
        ))}
      </div>
      {ask && (
        <div className="modal-bg" onClick={() => close(false)}>
          <div className="modal confirm" role="dialog" aria-modal="true" aria-label={ask.message} onClick={(e) => e.stopPropagation()}>
            <p className="confirm-msg">{ask.message}</p>
            <div className="row" style={{ justifyContent: 'flex-end' }}>
              <button type="button" className="btn ghost" onClick={() => close(false)}>{ask.cancelText ?? 'Huỷ'}</button>
              <button type="button" ref={okRef} className={`btn${ask.danger ? ' danger' : ''}`} onClick={() => close(true)}>{ask.okText ?? 'Đồng ý'}</button>
            </div>
          </div>
        </div>
      )}
    </UICtx.Provider>
  );
}

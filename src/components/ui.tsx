import React from 'react';
import { avatarColors, categoryOf, fmtDate, initials, type HelpRequest } from '../lib/types';

/* ---------- Аватар ---------- */
export function Avatar({ seed, name, size = 44, ring = false }: { seed: number; name: string; size?: number; ring?: boolean }) {
  const { from, to } = avatarColors(seed ?? Math.abs(hashCode(name)) % 360);
  return (
    <div
      className="rounded-full flex items-center justify-center text-white font-bold select-none shrink-0"
      style={{
        width: size,
        height: size,
        fontSize: Math.round(size * 0.36),
        background: `linear-gradient(135deg, ${from}, ${to})`,
        boxShadow: ring ? '0 0 0 2px #fff, 0 0 0 4px #fb923c' : undefined,
      }}
    >
      {initials(name)}
    </div>
  );
}
function hashCode(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/* ---------- Звёзды рейтинга ---------- */
export function Stars({ value, count, size = 13 }: { value: number; count?: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className="inline-flex" style={{ gap: 1 }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <i
            key={i}
            className={`fa-solid fa-star ${i <= Math.round(value) ? 'text-amber-400' : 'text-slate-200'}`}
            style={{ fontSize: size }}
          />
        ))}
      </span>
      <span className="text-xs font-semibold text-slate-700 ml-1">{Number(value || 0).toFixed(1)}</span>
      {typeof count === 'number' && <span className="text-xs text-slate-400">({count})</span>}
    </span>
  );
}

/* ---------- Чип ---------- */
export function Chip({ children, className = '', onClick, active }: { children: React.ReactNode; className?: string; onClick?: () => void; active?: boolean }) {
  const Comp = onClick ? 'button' : 'span';
  return (
    <Comp
      onClick={onClick}
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
        active ? 'bg-orange-600 border-orange-600 text-white shadow-sm' : 'bg-white border-slate-200 text-slate-600'
      } ${onClick ? 'cursor-pointer hover:border-orange-400 active:scale-95' : ''} ${className}`}
    >
      {children}
    </Comp>
  );
}

/* ---------- Кнопки ---------- */
export function Btn({
  children, onClick, variant = 'primary', disabled, full, type = 'button', small, className = '',
}: {
  children: React.ReactNode; onClick?: () => void; variant?: 'primary' | 'ghost' | 'soft' | 'danger' | 'dark';
  disabled?: boolean; full?: boolean; type?: 'button' | 'submit'; small?: boolean; className?: string;
}) {
  const base = `inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all active:scale-[0.98] disabled:opacity-45 disabled:pointer-events-none whitespace-nowrap ${
    small ? 'px-3.5 py-2 text-sm' : 'px-5 py-3 text-[15px]'
  } ${full ? 'w-full' : ''}`;
  const variants: Record<string, string> = {
    primary: 'bg-orange-600 text-white hover:bg-orange-700 shadow-md shadow-orange-600/20',
    soft: 'bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200',
    ghost: 'bg-transparent text-slate-600 hover:bg-slate-100 border border-transparent',
    danger: 'bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200',
    dark: 'bg-stone-900 text-white hover:bg-stone-800',
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`${base} ${variants[variant]} ${className}`}>
      {children}
    </button>
  );
}

/* ---------- Поле ввода ---------- */
export function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="block text-[13px] font-semibold text-slate-600 mb-1.5">{label}</span>
      {children}
      {hint && <span className="block text-xs text-slate-400 mt-1">{hint}</span>}
    </label>
  );
}

export const inputCls =
  'w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 text-[15px] outline-none focus:ring-2 focus:ring-orange-500/60 focus:border-orange-400 transition-all placeholder:text-slate-300';

/* ---------- Модалка ---------- */
export function Modal({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; wide?: boolean }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/45 backdrop-blur-[2px]" onClick={onClose} />
      <div
        className={`relative bg-white w-full ${wide ? 'sm:max-w-2xl' : 'sm:max-w-md'} max-h-[92dvh] sm:max-h-[85vh] rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-[pop_0.18s_ease]`}
        style={{ animationName: 'slideUp' }}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0 sticky top-0 bg-white/90 backdrop-blur z-10">
          <h3 className="font-bold text-lg text-slate-900">{title}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-400 flex items-center justify-center" aria-label="Закрыть">
            <i className="fa-solid fa-xmark text-lg" />
          </button>
        </div>
        <div className="px-5 py-4 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

/* ---------- Категория ---------- */
export function CategoryTag({ id, small }: { id: string; small?: boolean }) {
  const c = categoryOf(id);
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-lg font-medium ${small ? 'px-1.5 py-0.5 text-[11px]' : 'px-2 py-1 text-xs'} ${c.color}`}>
      <i className={`fa-solid ${c.icon} text-[10px]`} /> {c.label}
    </span>
  );
}

/* ---------- Карточка периода заявки ---------- */
export function RequestDates({ r, compact }: { r: HelpRequest; compact?: boolean }) {
  const one = r.dateStart && (!r.dateEnd || r.dateEnd === r.dateStart);
  if (one) {
    return (
      <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-slate-600">
        <i className="fa-regular fa-calendar text-orange-500" />
        {fmtDate(r.dateStart)}
        {r.timeText ? <span className="text-slate-400">· {r.timeText}</span> : null}
      </span>
    );
  }
  if (r.dateStart && r.dateEnd) {
    return (
      <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-slate-600 flex-wrap">
        <i className="fa-regular fa-calendar text-orange-500" />
        {fmtDate(r.dateStart)} — {fmtDate(r.dateEnd)}
        {r.timeText ? <span className="text-slate-400">· {r.timeText}</span> : null}
      </span>
    );
  }
  if (r.dateStart) {
    return (
      <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-slate-600 flex-wrap">
        <i className="fa-regular fa-calendar text-orange-500" />
        {fmtDate(r.dateStart)}
        {r.timeText ? <span className="text-slate-400">· {r.timeText}</span> : null}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-emerald-600">
      <i className="fa-regular fa-calendar-plus" /> Дата по договорённости{compact ? '' : r.timeText ? ` · ${r.timeText}` : ''}
    </span>
  );
}

/* ---------- Пустое состояние ---------- */
export function Empty({ icon, title, text, action }: { icon: string; title: string; text?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-6">
      <div className="w-16 h-16 rounded-2xl bg-orange-50 text-orange-400 flex items-center justify-center mb-4">
        <i className={`fa-solid ${icon} text-2xl`} />
      </div>
      <h3 className="font-bold text-slate-800 text-lg">{title}</h3>
      {text && <p className="text-slate-500 text-sm mt-1 max-w-sm leading-relaxed">{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

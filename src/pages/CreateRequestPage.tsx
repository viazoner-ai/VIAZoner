import React, { useState } from 'react';
import { api } from '../lib/api';
import { useRoute } from '../lib/router';
import { useStore } from '../lib/store';
import { Btn, Chip, Field, inputCls } from '../components/ui';
import { CATEGORIES, CITIES } from '../lib/types';

export default function CreateRequestPage() {
  const { nav } = useRoute();
  const { user, toast } = useStore();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    category: 'elderly',
    title: '',
    description: '',
    city: user?.city || 'Минск',
    dateType: 'specific' as 'specific' | 'flexible' | 'range',
    dateStart: '',
    dateEnd: '',
    timeText: '',
    urgent: false,
    conditions: '',
    volunteersNeeded: 1,
  });
  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

  if (user?.role === 'volunteer') {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <i className="fa-regular fa-face-smile-wink text-5xl text-slate-300" />
        <h1 className="font-display font-bold text-xl mt-5">Волонтёры заявки не создают :)</h1>
        <p className="text-slate-500 mt-2">Заявки на помощь оставляют организации и частные лица. А вы ищите, где помочь, в разделе <b>«Помощь»</b>.</p>
        <Btn className="mt-6" onClick={() => nav('/help')}><i className="fa-solid fa-hands-holding-circle" /> Где помочь</Btn>
      </div>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    const payload: any = {
      category: form.category,
      title: form.title.trim(),
      description: form.description.trim(),
      city: form.city,
      dateStart: form.dateType === 'flexible' ? null : form.dateStart || null,
      dateEnd: form.dateType === 'range' ? form.dateEnd || null : null,
      timeText: form.timeText.trim(),
      urgent: form.urgent,
      conditions: form.conditions.trim(),
      volunteersNeeded: form.volunteersNeeded,
    };
    try {
      const res = await api.createRequest(payload);
      toast('Заявка опубликована! Теперь волонтёры смогут её увидеть', 'ok');
      nav(`/help/${res.request.id}`);
    } catch (err: any) {
      if (err.status === 401) { toast('Войдите, чтобы публиковать заявки', 'info'); nav('/login'); return; }
      setError(err.message || 'Не удалось опубликовать заявку');
    } finally {
      setBusy(false);
    }
  };

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="max-w-2xl mx-auto px-4 md:px-6 py-5 md:py-8">
      <button onClick={() => nav('/help')} className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800 mb-4">
        <i className="fa-solid fa-arrow-left text-xs" /> К заявкам
      </button>
      <div className="bg-white rounded-3xl border border-slate-100 shadow-card overflow-hidden">
        <div className="px-6 md:px-8 py-6 bg-gradient-to-br from-orange-600 to-orange-700 text-white">
          <h1 className="font-display font-bold text-2xl">Новая заявка на помощь</h1>
          <p className="text-orange-100 text-sm mt-1.5">Расскажите, что нужно — и волонтёры вашего города откликнутся.</p>
        </div>

        <form onSubmit={submit} className="p-5 md:p-8 space-y-5">
          <div>
            <span className="block text-[13px] font-semibold text-slate-600 mb-2">Что за помощь нужна?</span>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map((c) => (
                <Chip key={c.id} active={form.category === c.id} onClick={() => set('category', c.id)}>
                  <i className={`fa-solid ${c.icon} text-[11px]`} /> {c.label}
                </Chip>
              ))}
            </div>
          </div>

          <Field label="Заголовок заявки">
            <input className={inputCls} required minLength={5} maxLength={120} value={form.title}
              onChange={(e) => set('title', e.target.value)} placeholder="Например: Помочь бабушке с покупкой продуктов" />
          </Field>

          <Field label="Подробности" hint="Опишите задачу: объём, что нужно взять с собой, сколько человек">
            <textarea className={inputCls} rows={4} value={form.description} onChange={(e) => set('description', e.target.value)}
              placeholder="Расскажите подробнее, чтобы волонтёру было понятно…" />
          </Field>

          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Город">
              <select className={inputCls} value={form.city} onChange={(e) => set('city', e.target.value)}>
                {CITIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Сколько волонтёров нужно?">
              <select className={inputCls} value={form.volunteersNeeded} onChange={(e) => set('volunteersNeeded', Number(e.target.value))}>
                {[1, 2, 3, 4, 5, 10, 20].map((n) => <option key={n} value={n}>{n === 20 ? '20 и больше' : n}</option>)}
              </select>
            </Field>
          </div>

          {/* Дата */}
          <div>
            <span className="block text-[13px] font-semibold text-slate-600 mb-2">Когда нужна помощь?</span>
            <div className="flex gap-2 mb-3">
              {([['specific', 'Конкретная дата'], ['range', 'Несколько дней'], ['flexible', 'По договорённости']] as const).map(([id, label]) => (
                <Chip key={id} active={form.dateType === id} onClick={() => set('dateType', id)}>{label}</Chip>
              ))}
            </div>
            {form.dateType !== 'flexible' && (
              <div className="grid sm:grid-cols-2 gap-3">
                <Field label={form.dateType === 'range' ? 'С даты' : 'Дата'}>
                  <input type="date" className={inputCls} min={today} required value={form.dateStart} onChange={(e) => set('dateStart', e.target.value)} />
                </Field>
                {form.dateType === 'range' && (
                  <Field label="По дату">
                    <input type="date" className={inputCls} min={form.dateStart || today} value={form.dateEnd} onChange={(e) => set('dateEnd', e.target.value)} />
                  </Field>
                )}
              </div>
            )}
            <div className="mt-3">
              <Field label="Во сколько (например: 10:00–14:00, «в течение дня»)">
                <input className={inputCls} value={form.timeText} onChange={(e) => set('timeText', e.target.value)} placeholder="10:00–14:00" />
              </Field>
            </div>
          </div>

          <Field label="Условия для волонтёра" hint="Например: «нужна физподготовка», «свои перчатки», «не пугаться собак»">
            <textarea className={inputCls} rows={2} value={form.conditions} onChange={(e) => set('conditions', e.target.value)} placeholder="Если условий нет — оставьте пустым" />
          </Field>

          <label className="flex items-center gap-3 bg-rose-50 border border-rose-100 rounded-2xl p-4 cursor-pointer">
            <input type="checkbox" checked={form.urgent} onChange={(e) => set('urgent', e.target.checked)} className="w-5 h-5 accent-rose-600" />
            <span className="text-sm">
              <span className="font-bold text-rose-700">Срочная помощь</span>
              <span className="text-rose-500/80 block text-xs mt-0.5">Заявка получит отметку «СРОЧНО» и будет показываться первой</span>
            </span>
          </label>

          {error && <div className="text-sm text-rose-600 bg-rose-50 border border-rose-100 rounded-xl px-3.5 py-2.5">{error}</div>}

          <Btn type="submit" full disabled={busy} className="!py-4 text-base">
            {busy ? <><i className="fa-solid fa-spinner fa-spin" /> Публикуем…</> : <><i className="fa-solid fa-bullhorn" /> Опубликовать заявку</>}
          </Btn>
          <p className="text-xs text-slate-400 text-center">После публикации заявка появится в общей ленте вашего города.</p>
        </form>
      </div>
    </div>
  );
}

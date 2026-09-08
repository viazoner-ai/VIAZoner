import React, { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useRoute } from '../lib/router';
import { useStore } from '../lib/store';
import { CategoryTag, Chip, Empty, RequestDates } from '../components/ui';
import { CATEGORIES, CITIES, type HelpRequest } from '../lib/types';

export default function RequestsPage() {
  const { nav } = useRoute();
  const { user } = useStore();
  const [requests, setRequests] = useState<HelpRequest[] | null>(null);
  const [city, setCity] = useState('');
  const [category, setCategory] = useState('');
  const [urgent, setUrgent] = useState(false);
  const [q, setQ] = useState('');
  const [loadedQ, setLoadedQ] = useState('');

  const load = useCallback(async () => {
    const params: Record<string, string> = {};
    if (city) params.city = city;
    if (category) params.category = category;
    if (urgent) params.urgent = '1';
    if (loadedQ) params.q = loadedQ;
    const d = await api.requests(params);
    setRequests(d.requests);
  }, [city, category, urgent, loadedQ]);

  useEffect(() => { load().catch(() => setRequests([])); }, [load]);

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setLoadedQ(q.trim());
  };

  const canCreate = user && user.role !== 'volunteer';

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-5 md:py-8">
      {/* Шапка */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display font-bold text-2xl md:text-3xl text-slate-900">
            {user?.role === 'volunteer' ? 'Где помочь' : 'Заявки на помощь'}
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {user?.role === 'volunteer' ? 'Выберите дату и город — и откликнитесь.' : 'Свежие заявки от людей и организаций Беларуси.'}
          </p>
        </div>
        {canCreate && (
          <button onClick={() => nav('/help/new')} className="bg-orange-600 hover:bg-orange-700 text-white font-bold px-5 py-3 rounded-2xl shadow-md shadow-orange-600/25 flex items-center gap-2 text-sm transition-all active:scale-[0.98]">
            <i className="fa-solid fa-plus" /> Новая заявка
          </button>
        )}
      </div>

      {/* Поиск и фильтры */}
      <div className="mt-5 bg-white rounded-3xl border border-slate-100 shadow-card p-4 space-y-3">
        <form onSubmit={submitSearch} className="flex gap-2">
          <div className="relative flex-1">
            <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 text-sm" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Поиск: что нужно, кому…"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-100 text-[15px] outline-none focus:ring-2 focus:ring-orange-500/50 transition-all placeholder:text-slate-300" />
          </div>
          <button type="submit" className="px-4 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-bold hover:bg-slate-800 transition-colors">Найти</button>
        </form>
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <Chip onClick={() => setCity('')} active={city === ''}>Все города</Chip>
          {CITIES.slice(0, 7).map((c) => <Chip key={c} onClick={() => setCity(city === c ? '' : c)} active={city === c}>{c}</Chip>)}
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <Chip onClick={() => { setCategory(''); setUrgent(false); }} active={category === '' && !urgent}>Все</Chip>
          <Chip onClick={() => setUrgent(!urgent)} active={urgent} className={urgent ? '!bg-rose-600 !border-rose-600' : ''}>
            <i className="fa-solid fa-bolt" /> Срочно
          </Chip>
          {CATEGORIES.map((c) => <Chip key={c.id} onClick={() => setCategory(category === c.id ? '' : c.id)} active={category === c.id}>{c.label}</Chip>)}
        </div>
      </div>

      {/* Список */}
      <div className="mt-6 space-y-3.5">
        {requests === null && <SkeletonCards />}
        {requests && requests.length === 0 && (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-card">
            <Empty icon="fa-magnifying-glass" title="Ничего не нашлось" text="Попробуйте снять фильтры или изменить город — добрые дела точно рядом." />
          </div>
        )}
        {requests?.map((r) => (
          <RequestCard key={r.id} r={r} onClick={() => nav(`/help/${r.id}`)} />
        ))}
      </div>

      {/* Плавающая кнопка на мобильном */}
      {canCreate && (
        <button onClick={() => nav('/help/new')}
          className="md:hidden fixed right-5 bottom-24 z-40 w-14 h-14 rounded-2xl bg-orange-600 text-white text-2xl shadow-xl shadow-orange-600/40 flex items-center justify-center active:scale-90 transition-transform">
          <i className="fa-solid fa-plus" />
        </button>
      )}
    </div>
  );
}

export function RequestCard({ r, onClick, active }: { r: HelpRequest; onClick: () => void; active?: boolean }) {
  const { user } = useStore();
  const done = r.status === 'done' || r.status === 'closed';
  const found = r.acceptedCount ?? r.volunteersFound;
  const need = r.volunteersNeeded;
  return (
    <button onClick={onClick}
      className={`w-full text-left bg-white rounded-3xl border shadow-card p-5 transition-all hover:shadow-lg hover:-translate-y-0.5 ${active ? 'border-orange-400 ring-2 ring-orange-500/40' : 'border-slate-100'} ${done ? 'opacity-80' : ''}`}>
      <div className="flex items-start gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <CategoryTag id={r.category} small />
            {r.urgent && <span className="inline-flex items-center gap-1 text-[11px] font-bold text-white bg-rose-500 px-2 py-0.5 rounded-full animate-pulse"><i className="fa-solid fa-circle-exclamation" /> срочно</span>}
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${r.status === 'open' ? 'bg-emerald-100 text-emerald-700' : r.status === 'in_progress' ? 'bg-amber-100 text-amber-700' : r.status === 'done' ? 'bg-slate-200 text-slate-600' : 'bg-slate-100 text-slate-400'}`}>
              {r.status === 'open' ? 'ищем волонтёров' : r.status === 'in_progress' ? 'есть отклики' : r.status === 'done' ? 'помощь оказана' : 'закрыта'}
            </span>
            {r.myStatus === 'applied' && <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">вы откликнулись</span>}
            {r.myStatus === 'accepted' && <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">вы приняты</span>}
          </div>
          <h2 className={`font-bold text-slate-900 leading-snug mt-2.5 ${done ? 'line-through decoration-slate-300' : ''}`}>{r.title}</h2>
          <p className="text-slate-500 text-sm mt-1.5 line-clamp-2 leading-relaxed">{r.description}</p>
          <div className="mt-3.5 flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px]">
            <span className="inline-flex items-center gap-1.5 text-slate-600 font-medium"><i className="fa-solid fa-location-dot text-orange-500" />{r.city}</span>
            <RequestDates r={r} compact />
            <span className="inline-flex items-center gap-1.5 text-slate-400"><i className="fa-solid fa-user" />{r.authorName}</span>
          </div>
        </div>
        {user?.role === 'volunteer' && need > 0 && (
          <div className="hidden sm:flex flex-col items-center gap-1 shrink-0 pt-1">
            <span className={`text-lg font-extrabold ${found >= need ? 'text-emerald-600' : 'text-orange-600'}`}>{found}<span className="text-slate-300 text-sm font-semibold">/{need}</span></span>
            <span className="text-[10px] uppercase tracking-wide text-slate-400 font-bold">волонтёров</span>
          </div>
        )}
      </div>
    </button>
  );
}

function SkeletonCards() {
  return (
    <div className="space-y-3.5">
      {[0, 1, 2].map((i) => (
        <div key={i} className="bg-white rounded-3xl border border-slate-100 shadow-card p-5 animate-pulse">
          <div className="h-4 bg-slate-100 rounded-full w-32" />
          <div className="h-6 bg-slate-100 rounded-xl mt-3 w-3/4" />
          <div className="h-4 bg-slate-100 rounded-full mt-3 w-full" />
          <div className="h-4 bg-slate-100 rounded-full mt-2 w-2/3" />
        </div>
      ))}
    </div>
  );
}

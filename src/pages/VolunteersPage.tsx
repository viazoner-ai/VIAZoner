import React, { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useRoute } from '../lib/router';
import { Avatar, Chip, Empty, Stars } from '../components/ui';
import { CITIES, type Volunteer } from '../lib/types';

export default function VolunteersPage() {
  const { nav } = useRoute();
  const [volunteers, setVolunteers] = useState<Volunteer[] | null>(null);
  const [city, setCity] = useState('');
  const [skill, setSkill] = useState('');
  const [q, setQ] = useState('');
  const [sort, setSort] = useState('rating');

  const load = useCallback(async () => {
    const params: Record<string, string> = { sort };
    if (city) params.city = city;
    if (skill) params.skill = skill;
    if (q.trim()) params.q = q.trim();
    const d = await api.volunteers(params);
    setVolunteers(d.volunteers);
  }, [city, skill, q, sort]);

  useEffect(() => { load().catch(() => setVolunteers([])); }, [load]);

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-5 md:py-8">
      <h1 className="font-display font-bold text-2xl md:text-3xl text-slate-900">База волонтёров</h1>
      <p className="text-slate-500 text-sm mt-1">Люди, которые готовы помогать. Выбирайте и пишите напрямую.</p>

      <div className="mt-5 bg-white rounded-3xl border border-slate-100 shadow-card p-4 space-y-3">
        <div className="relative">
          <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 text-sm" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Поиск по имени или рассказу о себе…"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-100 text-[15px] outline-none focus:ring-2 focus:ring-orange-500/50" />
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <Chip onClick={() => setCity('')} active={city === ''}>Все города</Chip>
          {CITIES.slice(0, 7).map((c) => <Chip key={c} onClick={() => setCity(city === c ? '' : c)} active={city === c}>{c}</Chip>)}
        </div>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <Chip onClick={() => setSkill('')} active={skill === ''}>Любые навыки</Chip>
            {['уход за пожилыми', 'мелкий ремонт', 'IT-помощь', 'дети', 'животные', 'переводы', 'психолог'].map((s) => (
              <Chip key={s} onClick={() => setSkill(skill === s ? '' : s)} active={skill === s}>{s}</Chip>
            ))}
          </div>
          <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1 shrink-0">
            {([['rating', 'По рейтингу'], ['help', 'По опыту']] as const).map(([id, label]) => (
              <button key={id} onClick={() => setSort(id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${sort === id ? 'bg-white text-orange-700 shadow-sm' : 'text-slate-500'}`}>{label}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6">
        {volunteers === null && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[0, 1, 2, 3, 4, 5].map((i) => <div key={i} className="bg-white rounded-3xl border border-slate-100 p-5 animate-pulse"><div className="h-12 w-12 rounded-full bg-slate-100" /><div className="h-5 bg-slate-100 rounded-lg mt-4 w-1/2" /><div className="h-3 bg-slate-100 rounded-full mt-2 w-3/4" /></div>)}
          </div>
        )}
        {volunteers && volunteers.length === 0 && (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-card">
            <Empty icon="fa-people-group" title="Пока никого не нашли" text="Попробуйте изменить город или убрать фильтр навыков." />
          </div>
        )}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {volunteers?.map((v) => (
            <button key={v.id} onClick={() => nav(`/volunteers/${v.id}`)}
              className="text-left bg-white rounded-3xl border border-slate-100 shadow-card p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all flex flex-col">
              <div className="flex items-start gap-3">
                <Avatar seed={v.avatarSeed || v.id} name={v.name} size={52} ring={v.verified} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-bold text-slate-900 truncate">{v.name}</span>
                    {v.verified && <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full" title="Проверенный волонтёр"><i className="fa-solid fa-circle-check" /> проверен</span>}
                  </div>
                  <div className="text-xs text-slate-400 flex items-center gap-1 mt-1"><i className="fa-solid fa-location-dot" />{v.city}</div>
                </div>
              </div>
              <p className="text-slate-600 text-sm mt-3 line-clamp-2 leading-relaxed flex-1">{v.about}</p>
              <div className="flex flex-wrap gap-1 mt-3.5">
                {v.skills.slice(0, 3).map((s) => (
                  <span key={s} className="text-[11px] font-medium bg-orange-50 text-orange-700 border border-orange-100 px-2 py-0.5 rounded-full">{s}</span>
                ))}
                {v.skills.length > 3 && <span className="text-[11px] text-slate-400 self-center">+{v.skills.length - 3}</span>}
              </div>
              <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between">
                <Stars value={v.ratingAvg} count={v.ratingCount} size={12} />
                <span className="text-xs font-semibold text-slate-400">{v.helpCount} дел · {v.hoursTotal} ч</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

import React, { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useRoute } from '../lib/router';
import { useStore } from '../lib/store';
import { Avatar, Btn, Chip, Empty, RequestDates } from '../components/ui';
import type { HelpRequest, MyResponse } from '../lib/types';
import { RESPONSE_STATUS_LABELS, fmtDate } from '../lib/types';

export default function CabinetPage() {
  const { nav } = useRoute();
  const { user } = useStore();
  const [myReq, setMyReq] = useState<HelpRequest[] | null>(null);
  const [myResp, setMyResp] = useState<MyResponse[] | null>(null);

  const load = useCallback(() => {
    if (user?.role === 'volunteer') {
      api.myResponses().then((d) => setMyResp(d.responses)).catch(() => setMyResp([]));
    } else {
      api.myRequests().then((d) => setMyReq(d.requests)).catch(() => setMyReq([]));
    }
  }, [user?.role]);

  useEffect(() => { load(); }, [load]);

  if (!user) return <LoginHint nav={nav} />;

  const open = (myReq || myResp)?.filter((x: any) => x.status === 'open' || x.status === 'in_progress' || x.status === 'applied' || x.status === 'accepted').length || 0;
  const doneCount = (myResp || []).filter((r) => r.status === 'done').length;
  const doneHours = (myResp || []).filter((r) => r.status === 'done').reduce((s, r) => s + (r.hours || 0), 0);
  const doneRatings = (myResp || []).filter((r) => r.status === 'done' && r.rating);
  const avgRating = doneRatings.length ? Math.round((doneRatings.reduce((s, r) => s + (r.rating || 0), 0) / doneRatings.length) * 10) / 10 : 0;

  if (user.role === 'volunteer') {
    const active = (myResp || []).filter((r) => r.status === 'applied' || r.status === 'accepted');
    const history = (myResp || []).filter((r) => r.status === 'done' || r.status === 'declined');
    return (
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-5 md:py-8">
        <h1 className="font-display font-bold text-2xl md:text-3xl text-slate-900">Мой волонтёрский кабинет</h1>
        <p className="text-slate-500 text-sm mt-1">Ваша история помощи и рейтинг на volonter.by</p>

        {/* Приветствие */}
        <div className="mt-5 bg-white rounded-3xl border border-slate-100 shadow-card p-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Avatar seed={user.avatarSeed || user.id} name={user.name} size={52} ring />
            <div className="min-w-0">
              <div className="font-bold text-slate-900 truncate">{user.name}</div>
              <div className="text-xs text-slate-400"><i className="fa-solid fa-location-dot" /> {user.city} · волонтёр</div>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <Btn variant="soft" small onClick={() => nav('/profile')}><i className="fa-solid fa-gear" /> <span className="hidden sm:inline">Профиль</span></Btn>
            <Btn small onClick={() => nav('/help')}><i className="fa-solid fa-magnifying-glass" /> Найти, где помочь</Btn>
          </div>
        </div>

        {/* Статистика */}
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { n: active.length, l: 'активных откликов', i: 'fa-hand-holding-heart', c: 'text-orange-600 bg-orange-50 border-orange-100' },
            { n: doneCount, l: 'дел сделано', i: 'fa-circle-check', c: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
            { n: doneHours, l: 'часов помощи', i: 'fa-clock', c: 'text-sky-600 bg-sky-50 border-sky-100' },
            { n: avgRating ? avgRating.toFixed(1) : '—', l: 'мой рейтинг', i: 'fa-star', c: 'text-amber-600 bg-amber-50 border-amber-100', star: true },
          ].map((s) => (
            <div key={s.l} className={`rounded-3xl border p-4 ${s.c}`}>
              <div className="text-2xl font-extrabold flex items-center gap-1.5">{s.star && <i className="fa-solid fa-star text-amber-400 text-base" />}{s.n}</div>
              <div className="text-xs font-semibold opacity-70 mt-1 flex items-center gap-1.5"><i className={`fa-solid ${s.i}`} /> {s.l}</div>
            </div>
          ))}
        </div>

        {/* Активные отклики */}
        <section className="mt-7">
          <h2 className="font-display font-bold text-xl text-slate-900 mb-3">Мои отклики</h2>
          {myResp === null && <div className="h-32 bg-white rounded-3xl animate-pulse border border-slate-100" />}
          {active.length === 0 && history.length === 0 && (
            <div className="bg-white rounded-3xl border border-slate-100 shadow-card">
              <Empty icon="fa-hands-holding-circle" title="Вы ещё не откликались" text="Зайдите в раздел «Помощь», выберите заявку по душе — и откликнитесь."
                action={<Btn small onClick={() => nav('/help')}><i className="fa-solid fa-hands-holding-circle" /> Найти заявку</Btn>} />
            </div>
          )}
          {active.length === 0 && history.length > 0 && null}
          <div className="space-y-3">
            {active.map((r) => (
              <button key={r.id} onClick={() => nav(`/help/${r.requestId}`)} className="w-full text-left bg-white rounded-3xl border border-slate-100 shadow-card p-5 hover:shadow-lg transition-shadow">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${r.status === 'applied' ? 'bg-orange-100 text-orange-700' : 'bg-emerald-100 text-emerald-700'}`}>
                    {RESPONSE_STATUS_LABELS[r.status]}
                  </span>
                  {r.requestStatus === 'in_progress' && <span className="text-[11px] text-slate-400">заявка открыта</span>}
                </div>
                <h3 className="font-bold text-slate-900 mt-2">{r.requestTitle}</h3>
                <p className="text-sm text-slate-500 mt-1"><i className="fa-solid fa-location-dot text-orange-500" /> {r.requestCity}{r.requestDateStart ? ` · ${fmtDate(r.requestDateStart)}` : ' · дата по договорённости'}</p>
                <p className="text-sm text-slate-600 mt-2 bg-slate-50 rounded-xl px-3 py-2">Вы писали: «{r.message}»</p>
                {r.status === 'applied' && <span className="text-xs text-slate-400 mt-2 inline-block">Ждёт решения автора заявки…</span>}
                {r.status === 'accepted' && <span className="text-xs font-bold text-emerald-600 mt-2 inline-block">Вас приняли! Свяжитесь с автором в «Чатах» 🎉</span>}
              </button>
            ))}
          </div>

          {/* История */}
          {history.length > 0 && (
            <>
              <h3 className="font-bold text-slate-800 mt-8 mb-3 flex items-center gap-2 text-[15px]"><i className="fa-solid fa-clock-rotate-left text-slate-400" /> История помощи</h3>
              <div className="space-y-2.5">
                {history.map((r) => (
                  <button key={r.id} onClick={() => nav(`/help/${r.requestId}`)} className={`w-full text-left bg-white rounded-2xl border shadow-card p-4 flex items-center justify-between gap-3 ${r.status === 'declined' ? 'opacity-70' : ''}`}>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${r.status === 'done' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                          {r.status === 'done' ? 'помощь оказана ✓' : 'отклонено'}
                        </span>
                        <span className="font-semibold text-slate-800 truncate text-[14px]">{r.requestTitle}</span>
                      </div>
                      <div className="text-xs text-slate-400 mt-1">{r.requestCity} · автор: {r.requestAuthorName}</div>
                      {r.status === 'done' && r.rating && (
                        <div className="text-xs text-slate-500 mt-1.5">⭐ {r.rating}/5 {r.hours > 0 ? `· ${r.hours} ч` : ''}</div>
                      )}
                    </div>
                    <i className="fa-solid fa-chevron-right text-slate-200 shrink-0" />
                  </button>
                ))}
              </div>
            </>
          )}
        </section>
      </div>
    );
  }

  /* ---- Организация / частное лицо ---- */
  const requests = myReq || [];
  const activeReq = requests.filter((r) => ['open', 'in_progress'].includes(r.status));
  const doneReq = requests.filter((r) => r.status === 'done');
  const totalResponses = requests.reduce((s, r) => s + (r.responsesCount || 0), 0);

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 py-5 md:py-8">
      <h1 className="font-display font-bold text-2xl md:text-3xl text-slate-900">
        {user.role === 'organization' ? 'Кабинет организации' : 'Мои заявки'}
      </h1>
      <p className="text-slate-500 text-sm mt-1">{user.role === 'organization' ? `${user.name} · ${user.city}` : `${user.name}, ${user.city}`}</p>

      <div className="mt-5 bg-white rounded-3xl border border-slate-100 shadow-card p-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center text-xl"><i className={`fa-solid ${user.role === 'organization' ? 'fa-building' : 'fa-user'}`} /></div>
          <div>
            <div className="font-bold text-slate-900">{user.name}</div>
            <div className="text-xs text-slate-400">{user.role === 'organization' ? 'Организация · волонтёры помогают по вашим заявкам' : 'Частное лицо · волонтёры помогают по вашим заявкам'}</div>
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <Btn variant="soft" small onClick={() => nav('/profile')}><i className="fa-solid fa-gear" /> <span className="hidden sm:inline">Настройки</span></Btn>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { n: requests.length, l: 'всего заявок', c: 'bg-white text-slate-700 border-slate-100' },
          { n: activeReq.length, l: 'открытых', c: 'bg-orange-50 text-orange-700 border-orange-100' },
          { n: totalResponses, l: 'откликов волонтёров', c: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
          { n: doneReq.length, l: 'выполнено', c: 'bg-sky-50 text-sky-700 border-sky-100' },
        ].map((s) => (
          <div key={s.l} className={`rounded-3xl border p-4 shadow-card ${s.c}`}>
            <div className="text-2xl font-extrabold">{s.n}</div>
            <div className="text-xs font-semibold opacity-70 mt-1">{s.l}</div>
          </div>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <Btn onClick={() => nav('/help/new')}><i className="fa-solid fa-plus" /> Новая заявка</Btn>
        <Btn variant="soft" onClick={() => nav('/volunteers')}><i className="fa-solid fa-people-group" /> Найти волонтёра в базе</Btn>
      </div>

      <section className="mt-8">
        <h2 className="font-display font-bold text-xl text-slate-900 mb-3">Мои заявки и отклики</h2>
        {myReq === null && <div className="h-32 bg-white rounded-3xl animate-pulse border border-slate-100" />}
        {requests.length === 0 && (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-card">
            <Empty icon="fa-bullhorn" title="У вас пока нет заявок" text="Опубликуйте заявку — и волонтёры вашего города смогут на неё откликнуться."
              action={<Btn onClick={() => nav('/help/new')}><i className="fa-solid fa-plus" /> Создать первую заявку</Btn>} />
          </div>
        )}
        <div className="space-y-3">
          {requests.map((r) => (
            <button key={r.id} onClick={() => nav(`/help/${r.id}`)} className="w-full text-left bg-white rounded-3xl border border-slate-100 shadow-card p-5 hover:shadow-lg transition-shadow">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${r.status === 'open' ? 'bg-emerald-100 text-emerald-700' : r.status === 'in_progress' ? 'bg-amber-100 text-amber-700' : r.status === 'done' ? 'bg-slate-200 text-slate-600' : 'bg-slate-100 text-slate-400'}`}>
                  {r.status === 'open' ? 'ищем волонтёров' : r.status === 'in_progress' ? 'есть отклики' : r.status === 'done' ? 'помощь оказана' : 'закрыта'}
                </span>
                <span className="text-xs text-slate-400">{r.volunteersFound}/{r.volunteersNeeded} волонтёров</span>
                {r.urgent && <span className="text-[10px] font-bold text-white bg-rose-500 px-2 py-0.5 rounded-full">срочно</span>}
              </div>
              <h3 className="font-bold text-slate-900 mt-2">{r.title}</h3>
              <div className="mt-1.5 flex items-center gap-1.5 text-sm text-slate-500">
                <i className="fa-solid fa-location-dot text-orange-500 text-xs" /> {r.city} · <RequestDates r={r} compact />
              </div>
              <div className="mt-3 flex items-center justify-between text-sm">
                <span className={`font-bold ${(r.responsesCount || 0) > 0 ? 'text-emerald-600' : 'text-slate-400'}`}>
                  <i className="fa-solid fa-envelope-open-text mr-1.5" />{(r.responsesCount || 0)} отклик(ов)
                </span>
                <span className="text-orange-600 font-semibold text-xs">открыть →</span>
              </div>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

function LoginHint({ nav }: { nav: (to: string) => void }) {
  return (
    <div className="max-w-lg mx-auto px-4 py-16">
      <div className="bg-white rounded-3xl border border-slate-100 shadow-card p-8 text-center">
        <i className="fa-regular fa-user text-5xl text-slate-300" />
        <h2 className="font-display font-bold text-xl mt-5">Нужно войти</h2>
        <p className="text-slate-500 mt-2">Войдите, чтобы увидеть свой кабинет, отклики и заявки.</p>
        <div className="mt-6 flex gap-2 justify-center">
          <Btn onClick={() => nav('/login')}>Войти</Btn>
          <Btn variant="soft" onClick={() => nav('/register')}>Регистрация</Btn>
        </div>
      </div>
    </div>
  );
}

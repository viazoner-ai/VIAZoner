import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useRoute } from '../lib/router';
import { useStore } from '../lib/store';
import { CategoryTag, Chip, RequestDates, Stars } from '../components/ui';
import type { HelpRequest } from '../lib/types';

export default function HomePage() {
  const { nav } = useRoute();
  const { user, toast } = useStore();
  const [stats, setStats] = useState<{ volunteers: number; activeRequests: number; helpDone: number; topCity: string } | null>(null);
  const [recent, setRecent] = useState<HelpRequest[]>([]);
  const [installEvt, setInstallEvt] = useState<any>(null);

  useEffect(() => {
    api.stats().then((d) => setStats(d.stats)).catch(() => {});
    api.requests({}).then((d) => setRecent(d.requests.slice(0, 3))).catch(() => {});
  }, []);

  useEffect(() => {
    const onBefore = (e: Event) => { e.preventDefault(); setInstallEvt(e as any); };
    window.addEventListener('beforeinstallprompt', onBefore);
    return () => window.removeEventListener('beforeinstallprompt', onBefore);
  }, []);

  const install = async () => {
    if (!installEvt) { toast('Откройте сайт в меню браузера: «Добавить на главный экран»', 'info'); return; }
    installEvt.prompt();
    const res = await installEvt.userChoice;
    if (res.outcome === 'accepted') toast('volonter.by установлен! Ищите иконку на главном экране', 'ok');
    setInstallEvt(null);
  };

  const hero = (
    <div className="md:rounded-[2rem] overflow-hidden relative bg-gradient-to-br from-orange-600 via-orange-600 to-orange-800 md:shadow-xl md:shadow-orange-600/20">
      <div className="absolute -right-20 -top-24 w-72 h-72 rounded-full bg-white/10 blur-2xl" />
      <div className="absolute right-10 bottom-0 opacity-10 hidden md:block" style={{ fontSize: 240 }}>
        <i className="fa-solid fa-hands-holding-child" />
      </div>
      <div className="relative px-6 md:px-12 py-10 md:py-16 text-white max-w-2xl">
        <span className="inline-flex items-center gap-2 bg-white/15 backdrop-blur px-3 py-1.5 rounded-full text-[12px] font-semibold tracking-wide">
          <i className="fa-solid fa-location-dot text-orange-200" /> Беларусь · помощь рядом с вами
        </span>
        <h1 className="font-display font-bold leading-tight mt-5 text-3xl md:text-5xl">
          Здесь встречаются те, кому нужна помощь,<br className="hidden md:block" /> и те, кто готов помочь
        </h1>
        <p className="mt-4 text-orange-100/90 text-[15px] md:text-lg leading-relaxed max-w-xl">
          Оставьте заявку — и волонтёры вашего города откликнутся. Или найдите, где ваши руки и доброе сердце нужны уже в эту дату.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <button onClick={() => nav(user?.role === 'volunteer' ? '/help' : '/help/new')}
            className="bg-white text-orange-700 font-bold px-6 py-3.5 rounded-2xl shadow-lg hover:bg-orange-50 active:scale-[0.98] transition-all text-[15px] flex items-center gap-2">
            <i className="fa-solid fa-bullhorn" /> {user?.role === 'volunteer' ? 'Найти, где помочь' : 'Мне нужна помощь'}
          </button>
          <button onClick={() => nav('/volunteers')}
            className="bg-white/15 hover:bg-white/25 backdrop-blur border border-white/30 text-white font-bold px-6 py-3.5 rounded-2xl transition-all active:scale-[0.98] text-[15px] flex items-center gap-2">
            <i className="fa-solid fa-people-group" /> Я волонтёр — помогаю
          </button>
        </div>
        <div className="mt-9 grid grid-cols-3 gap-4 max-w-md">
          {[
            { n: stats?.volunteers ?? '—', l: 'волонтёров', i: 'fa-people-group' },
            { n: stats?.activeRequests ?? '—', l: 'открытых заявок', i: 'fa-bullhorn' },
            { n: stats?.helpDone ?? '—', l: 'дел сделано', i: 'fa-handshake-angle' },
          ].map((s) => (
            <div key={s.l} className="bg-white/10 backdrop-blur rounded-2xl px-3.5 py-3 border border-white/15">
              <div className="text-2xl md:text-3xl font-extrabold">{s.n}</div>
              <div className="text-[11px] md:text-xs text-orange-100/80 mt-0.5 flex items-center gap-1"><i className={`fa-solid ${s.i}`} /> {s.l}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 pt-4 md:pt-8 space-y-8 md:space-y-14">
      {hero}

      {/* Роли */}
      <section className="grid md:grid-cols-3 gap-4">
        {[
          { icon: 'fa-people-group', title: 'Волонтёрам', color: 'text-emerald-600 bg-emerald-50 border-emerald-100',
            points: ['Ищите заявки по датам и городам', 'Откликайтесь одним касанием', 'Копите историю, часы и рейтинг'] },
          { icon: 'fa-building', title: 'Организациям', color: 'text-orange-600 bg-orange-50 border-orange-100',
            points: ['Публикуйте заявки с датами и условиями', 'Выбирайте волонтёров из базы', 'Оценивайте помощь и оставляйте отзывы'] },
          { icon: 'fa-house-user', title: 'Людям, которым нужна помощь', color: 'text-sky-600 bg-sky-50 border-sky-100',
            points: ['Расскажите, что нужно и когда', 'Получайте отклики волонтёров', 'Или сами напишите тому, кому доверяете'] },
        ].map((r) => (
          <div key={r.title} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-card">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl border ${r.color}`}>
              <i className={`fa-solid ${r.icon}`} />
            </div>
            <h3 className="font-bold text-lg text-slate-900 mt-4">{r.title}</h3>
            <ul className="mt-3 space-y-2">
              {r.points.map((pt) => (
                <li key={pt} className="flex gap-2 text-sm text-slate-600"><i className="fa-solid fa-check text-emerald-500 mt-0.5 text-xs" />{pt}</li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      {/* Как это работает */}
      <section className="bg-white rounded-3xl border border-slate-100 shadow-card p-6 md:p-9">
        <h2 className="font-display font-bold text-xl md:text-2xl text-slate-900">Как это работает</h2>
        <div className="mt-6 grid md:grid-cols-4 gap-5">
          {[
            { n: '1', t: 'Заявка', d: 'Человек или организация описывают, какая помощь нужна: что, где, в какую дату и при каких условиях.', i: 'fa-file-circle-plus' },
            { n: '2', t: 'Отклик', d: 'Волонтёр находит заявку по своему городу, навыкам и свободной дате и откликается с личным сообщением.', i: 'fa-comment-dots' },
            { n: '3', t: 'Помощь', d: 'Автор заявки выбирает волонтёра из откликов — или сам пишет волонтёру из базы.', i: 'fa-hand-holding-heart' },
            { n: '4', t: 'Рейтинг', d: 'После дела автор оценивает волонтёра. Из истории помощи складывается рейтинг и часы.', i: 'fa-ranking-star' },
          ].map((s, idx) => (
            <div key={s.n} className="relative">
              {idx < 3 && <div className="hidden md:block absolute top-6 left-full w-5 border-t-2 border-dashed border-orange-200 -translate-x-1/2" style={{ width: 'calc(100% + 20px)' }} />}
              <div className="w-12 h-12 rounded-2xl bg-orange-600 text-white font-extrabold text-lg flex items-center justify-center shadow-md shadow-orange-600/25">{s.n}</div>
              <h3 className="font-bold text-slate-900 mt-3">{s.t}</h3>
              <p className="text-sm text-slate-500 leading-relaxed mt-1.5">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Свежие заявки */}
      {recent.length > 0 && (
        <section>
          <div className="flex items-end justify-between mb-4">
            <div>
              <h2 className="font-display font-bold text-xl md:text-2xl text-slate-900">Сейчас ищут помощь</h2>
              <p className="text-slate-500 text-sm mt-1">Свежие заявки со всей Беларуси</p>
            </div>
            <button onClick={() => nav('/help')} className="text-sm font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1.5">
              Все заявки <i className="fa-solid fa-arrow-right text-xs" />
            </button>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {recent.map((r) => (
              <button key={r.id} onClick={() => nav(`/help/${r.id}`)} className="text-left bg-white rounded-3xl border border-slate-100 shadow-card p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all">
                <div className="flex items-center justify-between gap-2">
                  <CategoryTag id={r.category} small />
                  {r.urgent && <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full"><i className="fa-solid fa-circle-exclamation" /> СРОЧНО</span>}
                </div>
                <h3 className="font-bold text-slate-900 leading-snug mt-3 line-clamp-2">{r.title}</h3>
                <p className="text-slate-500 text-sm mt-2 line-clamp-2 leading-relaxed">{r.description}</p>
                <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1.5"><i className="fa-solid fa-location-dot text-orange-500" />{r.city}</span>
                  <RequestDates r={r} compact />
                </div>
                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-400 truncate mr-2">{r.authorType === 'organization' ? '🏢' : '👤'} {r.authorName}</span>
                  <span className="text-orange-600 font-semibold shrink-0">откликнуться →</span>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Установка */}
      <section className="rounded-3xl p-6 md:p-9 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white relative overflow-hidden md:shadow-xl">
        <div className="absolute -right-10 -bottom-16 opacity-15 text-[180px]"><i className="fa-solid fa-mobile-screen-button" /></div>
        <div className="relative md:max-w-xl">
          <h2 className="font-display font-bold text-xl md:text-2xl leading-snug">Приложение volonter.by всегда под рукой</h2>
          <p className="mt-3 text-emerald-50/90 text-[15px] leading-relaxed">Установите volonter.by на телефон как обычное приложение — оно появится на главном экране и будет работать как мобильное.</p>
          <button onClick={install} className="mt-5 bg-white text-emerald-700 font-bold px-5 py-3 rounded-2xl flex items-center gap-2 hover:bg-emerald-50 active:scale-[0.98] transition-all shadow-lg">
            <i className="fa-solid fa-download" /> Установить приложение
          </button>
        </div>
      </section>
    </div>
  );
}

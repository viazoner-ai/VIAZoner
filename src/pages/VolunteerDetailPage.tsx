import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useRoute } from '../lib/router';
import { useStore } from '../lib/store';
import { Avatar, Btn, Modal, Stars } from '../components/ui';
import type { Review, Volunteer } from '../lib/types';
import { fmtDateTime } from '../lib/types';

export default function VolunteerDetailPage({ id }: { id: number }) {
  const { nav } = useRoute();
  const { user, toast } = useStore();
  const [v, setV] = useState<Volunteer | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [notFound, setNotFound] = useState(false);
  const [msgOpen, setMsgOpen] = useState(false);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    api.volunteer(id).then((d) => { setV(d.volunteer); setReviews(d.reviews); }).catch(() => setNotFound(true));
  }, [id]);

  if (notFound) return <div className="max-w-3xl mx-auto px-4 py-16 text-center"><h1 className="font-display font-bold text-xl">Волонтёр не найден</h1></div>;
  if (!v) return <div className="max-w-3xl mx-auto px-4 py-10 animate-pulse"><div className="h-44 bg-white rounded-3xl border border-slate-100" /></div>;

  const sendMsg = async () => {
    if (!user) { nav('/login'); return; }
    if (!text.trim()) return;
    setSending(true);
    try {
      await api.sendMessage(v.id, text.trim());
      toast('Сообщение отправлено! Волонтёр увидит его в разделе «Чаты»', 'ok');
      setText('');
      setMsgOpen(false);
      nav(`/messages/${v.id}`);
    } catch (err: any) {
      toast(err.message || 'Ошибка', 'err');
    } finally {
      setSending(false);
    }
  };

  const isSelf = user?.id === v.id;
  const canContact = user && !isSelf;

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 py-5 md:py-8">
      <button onClick={() => nav('/volunteers')} className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800 mb-4">
        <i className="fa-solid fa-arrow-left text-xs" /> База волонтёров
      </button>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-card overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-orange-500 via-orange-600 to-amber-500 relative">
          {canContact && (
            <div className="absolute right-4 bottom-4 flex gap-2">
              <button onClick={() => setMsgOpen(true)} className="bg-white text-orange-700 font-bold px-4 py-2.5 rounded-xl text-sm shadow-lg hover:bg-orange-50 flex items-center gap-2 transition-all active:scale-95">
                <i className="fa-solid fa-envelope" /> Написать
              </button>
            </div>
          )}
        </div>
        <div className="px-5 md:px-8 pb-7">
          <div className="flex flex-wrap items-end justify-between gap-4 -mt-8">
            <div className="flex items-end gap-4">
              <div className="rounded-full ring-4 ring-white shadow-lg"><Avatar seed={v.avatarSeed || v.id} name={v.name} size={84} /></div>
              <div className="pb-1">
                <h1 className="font-display font-bold text-2xl flex items-center gap-2 flex-wrap">
                  {v.name}
                  {v.verified && <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full"><i className="fa-solid fa-circle-check" /> проверенный волонтёр</span>}
                </h1>
                <div className="text-slate-500 text-sm mt-0.5 flex items-center gap-1.5"><i className="fa-solid fa-location-dot text-orange-500" />{v.city}</div>
              </div>
            </div>
          </div>

          {/* Статистика */}
          <div className="mt-5 grid grid-cols-4 gap-2 sm:gap-3">
            {[
              { n: v.helpCount, l: 'дел помощи', i: 'fa-hand-holding-heart' },
              { n: v.hoursTotal, l: 'часов', i: 'fa-clock' },
              { n: v.ratingCount ? Number(v.ratingAvg).toFixed(1) : '—', l: 'рейтинг', i: 'fa-star', star: true },
              { n: v.ratingCount, l: 'оценок', i: 'fa-comment-dots' },
            ].map((s) => (
              <div key={s.l} className="bg-orange-50/70 rounded-2xl px-3 py-3.5 text-center border border-orange-100/60">
                <div className="font-extrabold text-slate-900 text-xl sm:text-2xl flex items-center justify-center gap-1">
                  {s.star && <i className="fa-solid fa-star text-amber-400 text-sm" />}{s.n}
                </div>
                <div className="text-[11px] text-slate-500 font-medium mt-1">{s.l}</div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex items-center gap-3 flex-wrap">
            <Stars value={v.ratingAvg} count={v.ratingCount} />
            <span className="text-xs text-slate-400">· на volonter.by с {v.lastActive ? 'активен недавно' : 'недавно'}</span>
          </div>

          <div className="h-px bg-slate-100 my-6" />

          {v.skills.length > 0 && (
            <div>
              <h2 className="font-bold text-slate-900 flex items-center gap-2"><i className="fa-solid fa-toolbox text-orange-500 text-sm" /> Чем может помочь</h2>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {v.skills.map((s) => (
                  <span key={s} className="bg-orange-50 text-orange-800 border border-orange-200 text-[13px] font-medium px-3 py-1.5 rounded-full">{s}</span>
                ))}
              </div>
            </div>
          )}

          {v.schedule && (
            <div className="mt-5">
              <h2 className="font-bold text-slate-900 flex items-center gap-2"><i className="fa-regular fa-calendar text-orange-500 text-sm" /> Когда свободен</h2>
              <p className="text-slate-600 mt-1.5">{v.schedule}</p>
            </div>
          )}

          {v.about && (
            <div className="mt-5">
              <h2 className="font-bold text-slate-900 flex items-center gap-2"><i className="fa-solid fa-user text-orange-500 text-sm" /> О себе</h2>
              <p className="text-slate-600 leading-relaxed mt-1.5 whitespace-pre-wrap">{v.about}</p>
            </div>
          )}
        </div>
      </div>

      {/* Отзывы */}
      <div className="mt-6">
        <h2 className="font-display font-bold text-lg text-slate-900 mb-3 flex items-center gap-2">
          <i className="fa-solid fa-heart text-rose-400 text-base" /> Отзывы об этом волонтёре
          <span className="text-sm text-slate-400">({reviews.length})</span>
        </h2>
        {reviews.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-100 p-6 text-center text-sm text-slate-400">
            Пока нет отзывов — волонтёр только начинает путь. Оценки появятся после первых дел.
          </div>
        ) : (
          <div className="space-y-3">
            {reviews.map((rv, i) => (
              <div key={i} className="bg-white rounded-3xl border border-slate-100 shadow-card p-5">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <Stars value={rv.rating} size={12} />
                  <span className="text-xs text-slate-400">{fmtDateTime(rv.createdAt)}</span>
                </div>
                <p className="text-slate-700 leading-relaxed mt-3">«{rv.review}»</p>
                <div className="text-xs text-slate-400 mt-3 flex items-center gap-1.5">
                  <i className="fa-solid fa-circle-user" /> {rv.authorName} · {rv.city} · заявка «{rv.requestTitle}»
                  {rv.hours > 0 && <span className="ml-1 text-emerald-600 font-semibold">· {rv.hours} ч</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Кнопка для организации: связаться */}
      {!user && (
        <div className="mt-6 bg-gradient-to-r from-orange-600 to-orange-700 rounded-3xl p-6 text-white flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="font-bold text-lg">Этот волонтёр вам подходит?</div>
            <p className="text-orange-100 text-sm mt-1">Войдите, чтобы написать ему напрямую или позвать на свою заявку.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => nav('/login')} className="bg-white text-orange-700 font-bold px-5 py-2.5 rounded-xl text-sm">Войти</button>
            <button onClick={() => nav('/register')} className="bg-white/20 border border-white/40 font-bold px-5 py-2.5 rounded-xl text-sm">Регистрация</button>
          </div>
        </div>
      )}

      <Modal open={msgOpen} onClose={() => setMsgOpen(false)} title={`Сообщение для ${v.name}`}>
        <p className="text-sm text-slate-500">Напишите, чем вы хотите позвать волонтёра, и договоритесь о деталях. Ответ придёт в раздел «Чаты».</p>
        <textarea autoFocus value={text} onChange={(e) => setText(e.target.value)} rows={4}
          placeholder="Здравствуйте! Мы из… Хотим позвать вас помочь…"
          className="mt-3 w-full px-4 py-3 rounded-2xl border border-slate-200 text-[15px] outline-none focus:ring-2 focus:ring-orange-500/50 resize-none" />
        <Btn full className="mt-3" disabled={sending || !text.trim()} onClick={sendMsg}>
          {sending ? <><i className="fa-solid fa-spinner fa-spin" /> Отправляем…</> : <><i className="fa-solid fa-paper-plane" /> Отправить</>}
        </Btn>
      </Modal>
    </div>
  );
}

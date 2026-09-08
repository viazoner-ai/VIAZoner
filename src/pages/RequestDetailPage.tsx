import React, { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useRoute } from '../lib/router';
import { useStore } from '../lib/store';
import { Avatar, Btn, CategoryTag, Chip, Modal, RequestDates, Stars } from '../components/ui';
import type { HelpRequest, RequestVolunteer } from '../lib/types';
import { RESPONSE_STATUS_LABELS, fmtDate, timeAgo } from '../lib/types';

export default function RequestDetailPage({ id }: { id: number }) {
  const { nav } = useRoute();
  const { user, toast } = useStore();
  const [req, setReq] = useState<HelpRequest | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [busy, setBusy] = useState(false);
  const [respondText, setRespondText] = useState('');
  const [finishResp, setFinishResp] = useState<RequestVolunteer | null>(null);

  const load = useCallback(async () => {
    try {
      const d = await api.request(id);
      setReq(d.request);
    } catch {
      setNotFound(true);
    }
  }, [id]);

  useEffect(() => { load(); window.scrollTo(0, 0); }, [load]);

  const isAuthor = !!user && req?.authorId === user.id;
  const isVolunteer = user?.role === 'volunteer';

  const respond = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { nav('/login'); return; }
    if (!respondText.trim()) { toast('Напишите пару слов о себе', 'err'); return; }
    setBusy(true);
    try {
      await api.respond(id, respondText);
      toast('Отклик отправлен! Автор заявки увидит его в разделе «Отклики»', 'ok');
      setRespondText('');
      await load();
    } catch (err: any) { toast(err.message || 'Ошибка', 'err'); }
    finally { setBusy(false); }
  };

  const act = async (respId: number, action: string, extra?: any) => {
    setBusy(true);
    try {
      await api.responseAction(respId, action, extra);
      toast(action === 'accept' ? 'Волонтёр принят!' : action === 'decline' ? 'Отклик отклонён' : 'Спасибо! Оценка учтена в рейтинге волонтёра', 'ok');
      setFinishResp(null);
      await load();
    } catch (err: any) { toast(err.message || 'Ошибка', 'err'); }
    finally { setBusy(false); }
  };

  const setStatus = async (status: string) => {
    setBusy(true);
    try {
      await api.updateRequestStatus(id, status);
      toast(status === 'done' ? 'Заявка отмечена выполненной 🎉' : status === 'closed' ? 'Заявка закрыта' : 'Заявка снова открыта', 'ok');
      await load();
    } catch (err: any) { toast(err.message || 'Ошибка', 'err'); }
    finally { setBusy(false); }
  };

  if (notFound) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <i className="fa-regular fa-face-frown text-5xl text-slate-300" />
        <h1 className="font-display font-bold text-2xl mt-5">Заявка не найдена</h1>
        <p className="text-slate-500 mt-2">Возможно, она была удалена.</p>
        <button onClick={() => nav('/help')} className="mt-6 text-orange-600 font-bold">← Все заявки</button>
      </div>
    );
  }
  if (!req) return <div className="max-w-3xl mx-auto px-4 py-10 animate-pulse space-y-4"><div className="h-6 bg-white rounded-xl w-1/3 border border-slate-100" /><div className="h-40 bg-white rounded-3xl border border-slate-100" /><div className="h-52 bg-white rounded-3xl border border-slate-100" /></div>;

  const myResp = req.volunteers?.find((v) => v.volunteerId === user?.id);
  const canRespond = isVolunteer && !myResp && !isAuthor && ['open', 'in_progress'].includes(req.status);
  const openForAuthor = ['open', 'in_progress'].includes(req.status);

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 py-5 md:py-8">
      <button onClick={() => nav('/help')} className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800 mb-4 transition-colors">
        <i className="fa-solid fa-arrow-left text-xs" /> Все заявки
      </button>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-card overflow-hidden">
        {/* Шапка заявки */}
        <div className={`px-5 md:px-8 py-6 md:py-7 ${req.urgent ? 'bg-gradient-to-br from-rose-600 to-rose-700 text-white' : 'bg-gradient-to-br from-orange-600 to-orange-700 text-white'}`}>
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-bold ${req.urgent ? 'bg-white/20 text-white' : 'bg-white/20 text-white'}`}>
              {req.urgent && <i className="fa-solid fa-circle-exclamation" />} {req.urgent ? 'СРОЧНАЯ ЗАЯВКА' : 'Заявка на помощь'}
            </span>
            <CategoryTag id={req.category} small />
            <span className={`text-[11px] font-bold px-2 py-1 rounded-full ${req.status === 'open' ? 'bg-emerald-500/90 text-white' : req.status === 'in_progress' ? 'bg-amber-400/90 text-white' : 'bg-white/25 text-white'}`}>
              {req.status === 'open' ? 'ищем волонтёров' : req.status === 'in_progress' ? 'отклики есть' : req.status === 'done' ? 'помощь оказана ✓' : 'закрыта'}
            </span>
          </div>
          <h1 className="font-display font-bold text-2xl md:text-3xl leading-tight mt-4">{req.title}</h1>
          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-[13px] font-medium opacity-95">
            <span className="inline-flex items-center gap-1.5"><i className="fa-solid fa-location-dot" />{req.city}</span>
            {req.dateStart && <span className="inline-flex items-center gap-1.5"><i className="fa-regular fa-calendar" />{fmtDate(req.dateStart)}{req.dateEnd && req.dateEnd !== req.dateStart ? ` — ${fmtDate(req.dateEnd)}` : ''}</span>}
            {!req.dateStart && <span className="inline-flex items-center gap-1.5"><i className="fa-regular fa-calendar-plus" />Дата по договорённости</span>}
            <span className="inline-flex items-center gap-1.5"><i className="fa-regular fa-clock" />{req.timeText || 'время по договорённости'}</span>
          </div>
        </div>

        <div className="p-5 md:p-8 space-y-6">
          {/* Автор */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 text-lg shrink-0">
                <i className={`fa-solid ${req.authorType === 'organization' ? 'fa-building' : 'fa-user'}`} />
              </div>
              <div className="min-w-0">
                <div className="font-bold text-slate-900 truncate">{req.authorName}</div>
                <div className="text-xs text-slate-400">{req.authorType === 'organization' ? 'Организация' : 'Частное лицо'} · {req.city}</div>
              </div>
            </div>
            {user && !isAuthor && (
              <Btn variant="soft" small onClick={() => nav(`/messages/${req.authorId || '0'}${req.authorId ? `?req=${req.id}` : ''}`)}>
                <i className="fa-solid fa-envelope" /> Написать
              </Btn>
            )}
          </div>

          <div className="h-px bg-slate-100" />

          {/* Описание */}
          <div>
            <h2 className="font-bold text-slate-900 text-lg">Что нужно</h2>
            <p className="text-slate-600 leading-relaxed mt-2 whitespace-pre-wrap">{req.description || '—'}</p>
          </div>

          {req.conditions && (
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
              <div className="flex gap-2.5">
                <i className="fa-solid fa-circle-info text-amber-500 mt-0.5" />
                <div>
                  <div className="font-bold text-amber-800 text-sm">Условия и особенности</div>
                  <p className="text-amber-700/90 text-sm mt-1 leading-relaxed">{req.conditions}</p>
                </div>
              </div>
            </div>
          )}

          {req.volunteersNeeded > 0 && (
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <div className="flex justify-between text-xs font-bold text-slate-500 mb-1.5">
                  <span>Откликнулось волонтёров</span>
                  <span>{Math.min(req.volunteersFound, req.volunteersNeeded)} / {req.volunteersNeeded}</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full transition-all" style={{ width: `${Math.min(100, (req.volunteersFound / req.volunteersNeeded) * 100)}%` }} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Панель волонтёра */}
      {canRespond && (
        <form onSubmit={respond} className="mt-5 bg-white rounded-3xl border-2 border-orange-200 shadow-card p-5 md:p-6">
          <h3 className="font-bold text-slate-900 flex items-center gap-2"><i className="fa-solid fa-hand-holding-heart text-orange-600" /> Я готов помочь</h3>
          <p className="text-slate-500 text-sm mt-1">Напишите, кто вы и когда сможете прийти. Автор заявки получит уведомление.</p>
          <textarea value={respondText} onChange={(e) => setRespondText(e.target.value)} rows={3} required
            placeholder="Здравствуйте! Я волонтёр из вашего города, могу прийти…"
            className="mt-3 w-full px-4 py-3 rounded-2xl border border-slate-200 text-[15px] outline-none focus:ring-2 focus:ring-orange-500/50 transition-all resize-none" />
          <Btn type="submit" full disabled={busy} className="mt-3 !py-3.5">
            <i className="fa-solid fa-paper-plane" /> Откликнуться на заявку
          </Btn>
        </form>
      )}

      {/* Состояние моего отклика (волонтёр) */}
      {isVolunteer && myResp && (
        <div className={`mt-5 rounded-3xl border p-5 shadow-card flex flex-wrap items-center justify-between gap-3 ${myResp.status === 'done' ? 'bg-emerald-50 border-emerald-200' : myResp.status === 'declined' ? 'bg-slate-50 border-slate-200 opacity-80' : 'bg-white border-slate-100'}`}>
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-lg ${myResp.status === 'done' ? 'bg-emerald-100 text-emerald-600' : myResp.status === 'declined' ? 'bg-slate-200 text-slate-500' : 'bg-orange-100 text-orange-600'}`}>
              <i className={`fa-solid ${myResp.status === 'done' ? 'fa-circle-check' : myResp.status === 'declined' ? 'fa-circle-xmark' : 'fa-hourglass-half'}`} />
            </div>
            <div>
              <div className="font-bold text-slate-900">{RESPONSE_STATUS_LABELS[myResp.status]}</div>
              <div className="text-sm text-slate-500">Ваш отклик: «{myResp.message}»</div>
              {myResp.status === 'done' && myResp.rating && (
                <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                  <Stars value={myResp.rating} size={12} />
                  {myResp.review && <span className="text-sm text-slate-600 italic">«{myResp.review}»</span>}
                </div>
              )}
            </div>
          </div>
          {myResp.status === 'applied' && (
            <Btn variant="danger" small onClick={() => act(myResp.id, 'cancel')} disabled={busy}>Отменить отклик</Btn>
          )}
        </div>
      )}

      {/* Отклики — для автора */}
      {isAuthor && (
        <div className="mt-6">
          <h2 className="font-display font-bold text-xl text-slate-900 mb-3 flex items-center gap-2">
            Отклики волонтёров
            <span className="text-sm font-semibold text-slate-400">({req.volunteers?.length || 0})</span>
          </h2>
          {(!req.volunteers || req.volunteers.length === 0) && (
            <div className="bg-white rounded-3xl border border-slate-100 shadow-card p-8 text-center">
              <i className="fa-regular fa-bell text-3xl text-slate-300" />
              <p className="font-bold text-slate-700 mt-3">Пока нет откликов</p>
              <p className="text-sm text-slate-500 mt-1">Попробуйте сами написать волонтёру из базы — в разделе «Волонтёры».</p>
              <Btn variant="soft" small className="mt-4" onClick={() => nav('/volunteers')}><i className="fa-solid fa-people-group" /> Открыть базу волонтёров</Btn>
            </div>
          )}
          <div className="space-y-3.5 mt-1">
            {req.volunteers?.map((v) => <ResponseCard key={v.id} v={v} isAuthor={isAuthor} busy={busy} onAct={act} onFinish={() => setFinishResp(v)} onChat={() => nav(`/messages/${v.volunteerId}?req=${req.id}`)} />)}
          </div>

          {openForAuthor && req.status !== 'done' && (
            <div className="mt-5 flex flex-wrap gap-2">
              <Btn variant="soft" small onClick={() => setStatus('done')}><i className="fa-solid fa-flag-checkered" /> Помощь оказана — закрыть заявку</Btn>
              <Btn variant="ghost" small onClick={() => setStatus('closed')}>Отменить заявку</Btn>
            </div>
          )}
          {!openForAuthor && (
            <div className="mt-5">
              <Btn variant="soft" small onClick={() => setStatus('open')}><i className="fa-solid fa-rotate-left" /> Снова открыть заявку</Btn>
            </div>
          )}
        </div>
      )}

      {/* Подсказка незалогиненному волонтёру */}
      {!user && ['open', 'in_progress'].includes(req.status) && (
        <div className="mt-5 bg-gradient-to-r from-orange-600 to-orange-700 text-white rounded-3xl p-6 flex flex-wrap items-center justify-between gap-4 shadow-lg shadow-orange-600/20">
          <div>
            <div className="font-bold text-lg">Хотите помочь?</div>
            <p className="text-orange-100 text-sm mt-1">Войдите или зарегистрируйтесь как волонтёр — и откликнитесь на эту заявку.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => nav('/login')} className="bg-white text-orange-700 font-bold px-5 py-2.5 rounded-xl text-sm">Войти</button>
            <button onClick={() => nav('/register')} className="bg-white/20 border border-white/40 font-bold px-5 py-2.5 rounded-xl text-sm">Регистрация</button>
          </div>
        </div>
      )}

      <FinishModal resp={finishResp} onClose={() => setFinishResp(null)} busy={busy} onFinish={(rating, review, hours) => finishResp && act(finishResp.id, 'finish', { rating, review, hours })} />
    </div>
  );
}

function ResponseCard({ v, isAuthor, busy, onAct, onFinish, onChat }: {
  v: RequestVolunteer; isAuthor: boolean; busy: boolean;
  onAct: (id: number, action: string) => void; onFinish: () => void; onChat: () => void;
}) {
  const statusChip = (s: string) => (
    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${s === 'applied' ? 'bg-orange-100 text-orange-700' : s === 'accepted' ? 'bg-emerald-100 text-emerald-700' : s === 'done' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
      {s === 'applied' ? 'ждёт решения' : s === 'accepted' ? 'принят ✓' : s === 'done' ? 'помощь оказана' : 'отклонён'}
    </span>
  );
  return (
    <div className={`bg-white rounded-3xl border shadow-card p-5 ${v.status === 'declined' ? 'opacity-70 border-slate-100' : 'border-slate-100'}`}>
      <div className="flex items-start gap-3.5">
        <Avatar seed={v.volunteerId * 37} name={v.volunteerName} size={46} />
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-slate-900">{v.volunteerName}</span>
            {v.status !== 'applied' && statusChip(v.status)}
          </div>
          <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
            <i className="fa-solid fa-location-dot" /> {v.volunteerCity} · помог(ла) уже {v.volunteerHelpCount} раз(а)
          </div>
          <p className="text-slate-600 text-sm mt-2.5 leading-relaxed bg-slate-50 rounded-2xl px-4 py-3">«{v.message}»</p>
          <div className="text-[11px] text-slate-400 mt-1.5">{timeAgo(v.createdAt)}</div>

          {isAuthor && v.status === 'accepted' && (
            <div className="mt-3 flex flex-wrap gap-2">
              <Btn variant="primary" small onClick={onFinish} disabled={busy}><i className="fa-solid fa-star" /> Помощь оказана — оценить</Btn>
              <Btn variant="ghost" small onClick={onChat} disabled={busy}><i className="fa-solid fa-comment-dots" /> Написать</Btn>
            </div>
          )}
          {isAuthor && v.status === 'applied' && (
            <div className="mt-3 flex flex-wrap gap-2">
              <Btn variant="primary" small onClick={() => onAct(v.id, 'accept')} disabled={busy}><i className="fa-solid fa-check" /> Принять</Btn>
              <Btn variant="ghost" small onClick={() => onAct(v.id, 'decline')} disabled={busy}>Отклонить</Btn>
              <Btn variant="ghost" small onClick={onChat} disabled={busy}><i className="fa-solid fa-comment-dots" /></Btn>
            </div>
          )}
          {isAuthor && v.status === 'done' && v.rating && (
            <div className="mt-3.5 bg-emerald-50 rounded-2xl px-4 py-3 flex items-start gap-2.5">
              <i className="fa-solid fa-star text-amber-400 mt-0.5" />
              <div>
                <Stars value={v.rating} size={12} />
                {v.review && <p className="text-sm text-slate-700 mt-1">«{v.review}»</p>}
                {v.hours > 0 && <p className="text-xs text-slate-400 mt-1">{v.hours} ч — учтено в профиле волонтёра</p>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FinishModal({ resp, onClose, busy, onFinish }: {
  resp: RequestVolunteer | null; onClose: () => void; busy: boolean;
  onFinish: (rating: number, review: string, hours: number) => void;
}) {
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState('');
  const [hours, setHours] = useState(2);
  useEffect(() => { if (resp) { setRating(5); setReview(''); setHours(2); } }, [resp]);

  return (
    <Modal open={!!resp} onClose={onClose} title="Помощь оказана — оцените волонтёра">
      {resp && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 bg-orange-50 rounded-2xl p-4">
            <Avatar seed={resp.volunteerId * 37} name={resp.volunteerName} size={40} />
            <div>
              <div className="font-bold text-slate-900">{resp.volunteerName}</div>
              <div className="text-xs text-slate-500">Оценка попадёт в рейтинг волонтёра</div>
            </div>
          </div>
          <div>
            <div className="text-[13px] font-semibold text-slate-600 mb-2">Ваша оценка</div>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <button key={i} onClick={() => setRating(i)} className={`text-3xl transition-transform ${i <= rating ? 'text-amber-400 scale-110' : 'text-slate-200 hover:scale-105'}`}>
                  <i className="fa-solid fa-star" />
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-slate-600 mb-1.5">Сколько часов длилась помощь?</label>
            <input type="number" min={0} max={24} value={hours} onChange={(e) => setHours(Number(e.target.value))} className="w-24 px-3 py-2 rounded-xl border border-slate-200 text-center font-bold" />
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-slate-600 mb-1.5">Отзыв (необязательно)</label>
            <textarea value={review} onChange={(e) => setReview(e.target.value)} rows={3} placeholder="Как прошла помощь? Что получилось?"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-[15px] outline-none focus:ring-2 focus:ring-orange-500/50 resize-none" />
          </div>
          <Btn full disabled={busy} onClick={() => onFinish(rating, review.trim(), hours)} className="!py-3.5">
            <i className="fa-solid fa-check" /> Подтвердить
          </Btn>
        </div>
      )}
    </Modal>
  );
}

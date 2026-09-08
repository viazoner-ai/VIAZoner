import React, { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../lib/api';
import { useRoute } from '../lib/router';
import { useStore } from '../lib/store';
import { Avatar, Btn, Empty } from '../components/ui';
import type { ChatMessage, Conversation } from '../lib/types';
import { fmtDateTime, timeAgo } from '../lib/types';

export default function ChatPage({ peerId }: { peerId?: number }) {
  const { nav } = useRoute();
  const { user, toast } = useStore();
  const [convs, setConvs] = useState<Conversation[] | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [peerName, setPeerName] = useState<string>('');
  const bottomRef = useRef<HTMLDivElement>(null);

  const loadConvs = useCallback(() => {
    api.inbox().then((d) => setConvs(d.conversations)).catch(() => setConvs([]));
  }, []);

  const loadThread = useCallback(async (peer: number) => {
    const d = await api.messages(peer);
    setMessages(d.messages);
    const last = d.messages[d.messages.length - 1];
    if (last) {
      setPeerName(last.fromUser === peer ? last.fromName : last.toName);
    } else {
      const c = await api.inbox();
      const found = c.conversations.find((x) => x.peerId === peer);
      setPeerName(found?.peerName || '');
    }
  }, []);

  useEffect(() => { loadConvs(); }, [loadConvs]);

  useEffect(() => {
    if (peerId) loadThread(peerId).catch(() => {});
  }, [peerId, loadThread]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!peerId || !text.trim()) return;
    setSending(true);
    try {
      await api.sendMessage(peerId, text.trim());
      setText('');
      await loadThread(peerId);
      loadConvs();
    } catch (err: any) { toast(err.message || 'Ошибка отправки', 'err'); }
    finally { setSending(false); }
  };

  const thread = (
    <div className="flex flex-col h-full">
      <div className="bg-white border-b border-slate-100 px-4 py-3 flex items-center gap-3 shrink-0">
        {peerId && (
          <>
            <button onClick={() => nav('/messages')} className="md:hidden text-slate-400 mr-1"><i className="fa-solid fa-arrow-left" /></button>
            <Avatar seed={peerId * 37} name={peerName || 'Пользователь'} size={38} />
            <div className="min-w-0">
              <div className="font-bold text-slate-900 truncate">{peerName || 'Диалог'}</div>
              <div className="text-xs text-emerald-600"><i className="fa-solid fa-circle text-[8px]" /> на платформе volonter.by</div>
            </div>
          </>
        )}
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2.5 bg-slate-50/60" style={{ minHeight: 300, maxHeight: '60dvh' }}>
        {messages.length === 0 && (
          <div className="py-8 text-center text-sm text-slate-400">Пока нет сообщений. Напишите первым!</div>
        )}
        {messages.map((m) => {
          const mine = m.fromUser === user?.id;
          return (
            <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-3xl px-4 py-2.5 text-[14.5px] leading-relaxed ${mine ? 'bg-orange-600 text-white rounded-br-lg' : 'bg-white border border-slate-100 text-slate-800 rounded-bl-lg shadow-sm'}`}>
                {!mine && <div className="text-[11px] font-bold text-orange-600 mb-0.5">{m.fromName}</div>}
                <p className="whitespace-pre-wrap break-words">{m.text}</p>
                <div className={`text-[10px] mt-1 ${mine ? 'text-orange-200' : 'text-slate-400'}`}>{fmtDateTime(m.createdAt)}</div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={send} className="p-3 bg-white border-t border-slate-100 flex gap-2 shrink-0">
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Написать сообщение…"
          className="flex-1 px-4 py-3 rounded-2xl bg-slate-50 border border-slate-100 text-[15px] outline-none focus:ring-2 focus:ring-orange-500/50" />
        <button type="submit" disabled={sending || !text.trim()} className="w-12 h-12 rounded-2xl bg-orange-600 text-white flex items-center justify-center hover:bg-orange-700 disabled:opacity-40 transition-all active:scale-90 shrink-0">
          <i className={`fa-solid ${sending ? 'fa-spinner fa-spin' : 'fa-paper-plane'}`} />
        </button>
      </form>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 py-5 md:py-8">
      <h1 className="font-display font-bold text-2xl md:text-3xl text-slate-900 mb-1">Чаты</h1>
      <p className="text-slate-500 text-sm mb-5">Переписка с волонтёрами и авторами заявок</p>

      {!user ? (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-card">
          <Empty icon="fa-comment-dots" title="Войдите, чтобы читать сообщения"
            text="После входа здесь появится переписка с волонтёрами и теми, кому вы помогаете." />
        </div>
      ) : (
        <div className="grid md:grid-cols-[300px_1fr] gap-4 items-start">
          {/* Список диалогов */}
          <div className={`bg-white rounded-3xl border border-slate-100 shadow-card overflow-hidden ${peerId ? 'hidden md:block' : ''}`}>
            <div className="px-4 py-3 border-b border-slate-100 text-sm font-bold text-slate-500">Диалоги</div>
            <div className="max-h-[70dvh] overflow-y-auto">
              {convs === null && <div className="p-6 text-center text-sm text-slate-300">загрузка…</div>}
              {convs && convs.length === 0 && (
                <div className="p-6 text-center text-sm text-slate-400">Пока пусто.<br />Напишите волонтёру из базы — и диалог появится здесь.</div>
              )}
              {convs?.map((c) => (
                <button key={c.peerId} onClick={() => nav(`/messages/${c.peerId}`)}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 hover:bg-orange-50/60 transition-colors border-b border-slate-50 text-left ${peerId === c.peerId ? 'bg-orange-50' : ''}`}>
                  <Avatar seed={c.peerId * 37} name={c.peerName} size={42} />
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-slate-900 text-[14px] truncate">{c.peerName}</div>
                    <div className="text-slate-400 text-[13px] truncate">{c.lastText}</div>
                  </div>
                  <span className="text-[10px] text-slate-300 shrink-0">{timeAgo(c.lastAt)}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Переписка */}
          <div className={`bg-white rounded-3xl border border-slate-100 shadow-card overflow-hidden ${peerId ? '' : 'hidden md:block'}`}>
            {peerId ? thread : (
              <div className="p-10 text-center text-slate-300">
                <i className="fa-regular fa-comments text-4xl" />
                <p className="mt-3 text-sm">Выберите диалог слева</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

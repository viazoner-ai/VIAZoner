import React, { useState } from 'react';
import { StoreProvider, useStore } from './lib/store';
import { RouterProvider, useRoute } from './lib/router';
import { Avatar, Chip } from './components/ui';
import { usePageTitle } from './lib/router';

import HomePage from './pages/HomePage';
import RequestsPage from './pages/RequestsPage';
import RequestDetailPage from './pages/RequestDetailPage';
import CreateRequestPage from './pages/CreateRequestPage';
import VolunteersPage from './pages/VolunteersPage';
import VolunteerDetailPage from './pages/VolunteerDetailPage';
import ChatPage from './pages/ChatPage';
import CabinetPage from './pages/CabinetPage';
import ProfilePage from './pages/ProfilePage';
import LoginPage from './pages/LoginPage';

function Logo({ light = false }: { light?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5 select-none">
      <span className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-md ${light ? 'bg-white/15' : 'bg-orange-600 shadow-orange-600/30'}`}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 21s-7.5-4.7-9.8-9C.6 8.6 2.6 5 6.2 5c2 0 3.6 1 4.8 2.6h2c1.2-1.6 2.8-2.6 4.8-2.6 3.6 0 5.6 3.6 4 7-2.3 4.3-9.8 9-9.8 9z" />
          <path d="M12 7.6c.5-.5 1.2-.8 2-.8 2 0 3 1.6 2.2 3.4-1 2.1-4.2 4.2-4.2 4.2s-3.2-2.1-4.2-4.2C6 8.4 7 6.8 9 6.8c.8 0 1.5.3 2 .8h1z" fill="#fff" stroke="none" />
        </svg>
      </span>
      <span className={`font-display font-semibold tracking-tight ${light ? 'text-white' : 'text-stone-900'}`} style={{ fontSize: 19 }}>
        volonter<span className={light ? 'text-orange-300' : 'text-orange-600'}>.by</span>
      </span>
    </span>
  );
}

function Toasts() {
  const { toasts, dismissToast } = useStore();
  return (
    <div className="fixed top-3 left-0 right-0 z-[100] flex flex-col items-center gap-2 px-4 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          onClick={() => dismissToast(t.id)}
          className={`pointer-events-auto max-w-md w-auto rounded-xl px-4 py-3 text-sm font-medium text-white shadow-xl flex items-center gap-2.5 cursor-pointer animate-[toastIn_.25s_ease] ${
            t.kind === 'err' ? 'bg-rose-600' : t.kind === 'ok' ? 'bg-emerald-600' : 'bg-stone-900'
          }`}
        >
          <i className={`fa-solid ${t.kind === 'err' ? 'fa-circle-exclamation' : t.kind === 'ok' ? 'fa-circle-check' : 'fa-circle-info'} text-white/80`} />
          <span>{t.text}</span>
        </div>
      ))}
    </div>
  );
}

function TopBar() {
  const { route, nav } = useRoute();
  const { user } = useStore();
  const isHome = route.path === '/';
  return (
    <header className={`hidden md:block sticky top-0 z-40 backdrop-blur-lg border-b ${isHome ? 'bg-transparent border-transparent' : 'bg-white/80 border-slate-200/70'}`}>
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between gap-6">
        <a href="#/" onClick={() => nav('/')} className={isHome ? '' : ''}><Logo /></a>
        <nav className="flex items-center gap-1 text-[15px] font-medium">
          {[
            ['#/help', 'fa-hands-holding-circle', 'Найти помощь'],
            ['#/volunteers', 'fa-people-group', 'Волонтёры'],
            ['#/messages', 'fa-comment-dots', 'Сообщения'],
            user && ['#/cabinet', 'fa-table-cells-large', 'Кабинет'],
          ].filter(Boolean).map(([href, icon, label]: any) => (
            <a key={href} href={href}
              className={`px-3.5 py-2 rounded-xl flex items-center gap-2 transition-colors ${route.path.startsWith(href.replace('#', '')) ? 'bg-orange-100 text-orange-800' : 'hover:bg-slate-100 text-slate-600 hover:text-slate-900'}`}>
              <i className={`fa-solid ${icon} text-[13px]`} /> {label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          {user ? (
            <a href="#/profile" className="flex items-center gap-2.5 pl-1.5 pr-3 py-1.5 rounded-full hover:bg-slate-100 transition-colors">
              <Avatar seed={user.avatarSeed || user.id} name={user.name} size={34} />
              <span className="max-w-[140px] truncate text-sm font-semibold text-slate-800">{user.name}</span>
              <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${user.role === 'volunteer' ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}`}>
                {user.role === 'volunteer' ? 'волонтёр' : user.role === 'organization' ? 'организация' : 'частное лицо'}
              </span>
            </a>
          ) : (
            <>
              <a href="#/login" className="text-sm font-semibold text-slate-600 hover:text-slate-900 px-3 py-2">Войти</a>
              <a href="#/register" className="bg-orange-600 hover:bg-orange-700 text-white text-sm font-semibold px-4 py-2 rounded-xl shadow-md shadow-orange-600/25">Присоединиться</a>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

function MobileNav() {
  const { route, nav } = useRoute();
  const { user } = useStore();
  const items = [
    { href: '/', icon: 'fa-house', label: 'Главная' },
    { href: '/help', icon: 'fa-hands-holding-circle', label: 'Помощь' },
    { href: '/volunteers', icon: 'fa-people-group', label: 'Волонтёры' },
    { href: '/messages', icon: 'fa-comment-dots', label: 'Чаты', badge: false },
    { href: user ? '/cabinet' : '/login', icon: 'fa-circle-user', label: user ? 'Кабинет' : 'Войти' },
  ];
  const active = (href: string) => {
    if (href === '/') return route.path === '/';
    if (href === '/help') return route.path.startsWith('/help');
    if (href === '/volunteers') return route.path.startsWith('/volunteers');
    if (href === '/messages') return route.path.startsWith('/messages');
    if (href === '/cabinet') return route.path.startsWith('/cabinet') || route.path.startsWith('/profile');
    return false;
  };
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/92 backdrop-blur-lg border-t border-slate-200 pb-safe" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="grid grid-cols-5">
        {items.map((it) => (
          <button key={it.href} onClick={() => nav(it.href)}
            className={`flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-semibold transition-colors ${active(it.href) ? 'text-orange-600' : 'text-slate-400'}`}>
            <i className={`fa-solid ${it.icon} text-[17px] ${active(it.href) ? '' : ''}`} />
            {it.label}
          </button>
        ))}
      </div>
    </nav>
  );
}

function MainContent() {
  const { route } = useRoute();
  const p = route.parts; // ['help','3']
  const top = p[0] || '';

  if (top === 'help' && p[1] === 'new') return <CreateRequestPage />;
  if (top === 'help' && p[1]) return <RequestDetailPage id={Number(p[1])} />;
  if (top === 'help') return <RequestsPage />;
  if (top === 'volunteers' && p[1]) return <VolunteerDetailPage id={Number(p[1])} />;
  if (top === 'volunteers') return <VolunteersPage />;
  if (top === 'messages' && p[1]) return <ChatPage peerId={Number(p[1])} />;
  if (top === 'messages') return <ChatPage />;
  if (top === 'cabinet') return <CabinetPage />;
  if (top === 'profile') return <ProfilePage />;
  if (top === 'register' || top === 'login') return <LoginPage mode={top === 'register' ? 'register' : 'login'} />;
  return <HomePage />;
}

export default function App() {
  usePageTitle('');
  return (
    <StoreProvider>
      <RouterProvider>
        <AppInner />
      </RouterProvider>
    </StoreProvider>
  );
}

function AppInner() {
  const { booting } = useStore();
  if (booting) return null;
  return (
    <div className="min-h-dvh bg-brand-50 md:bg-gradient-to-b md:from-brand-50 md:to-white flex flex-col">
      <TopBar />
      <main className="flex-1 md:pb-10 pb-24">
        <MainContent />
      </main>
      <MobileNav />
      <Toasts />
    </div>
  );
}

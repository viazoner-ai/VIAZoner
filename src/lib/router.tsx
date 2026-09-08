import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

/** Простейший hash-роутер: #/help, #/volunteers/3, #/login?next=/help */
export interface Route {
  path: string;        // '/help' '/volunteers/3' ...
  parts: string[];     // ['volunteers','3']
}

function parse(): Route {
  const raw = window.location.hash.replace(/^#/, '') || '/';
  const [pathPart] = raw.split('?');
  const path = pathPart.startsWith('/') ? pathPart : '/' + pathPart;
  return { path, parts: path.split('/').filter(Boolean) };
}

const RouterCtx = createContext<{ route: Route; nav: (to: string) => void } | null>(null);

export function RouterProvider({ children }: { children: React.ReactNode }) {
  const [route, setRoute] = useState<Route>(parse);
  useEffect(() => {
    const onHash = () => {
      setRoute(parse());
      window.scrollTo({ top: 0 });
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
  const nav = useCallback((to: string) => {
    if (window.location.hash === '#' + to) return;
    window.location.hash = to;
  }, []);
  const value = useMemo(() => ({ route, nav }), [route, nav]);
  return <RouterCtx.Provider value={value}>{children}</RouterCtx.Provider>;
}

export function useRoute() {
  const ctx = useContext(RouterCtx);
  if (!ctx) throw new Error('Router missing');
  return ctx;
}

export function usePageTitle(title: string) {
  useEffect(() => {
    document.title = title ? `${title} · volonter.by` : 'volonter.by — помоги рядом';
  }, [title]);
}

import React, { useEffect, useState } from 'react';
import { useRoute } from '../lib/router';
import { useStore } from '../lib/store';
import { Btn, Chip, Field, inputCls } from '../components/ui';
import { CITIES, SKILLS, type Role } from '../lib/types';

const DEMO: Record<string, { name: string; hint: string }> = {
  volunteer: { name: 'Алеся Ковалёва', hint: 'alesia@demo.by · 1234' },
  organization: { name: 'БФ «Вектор добра»', hint: 'vektor@demo.by · 1234' },
  person: { name: 'Марфа Ивановна', hint: 'marta@demo.by · 1234' },
};

export default function LoginPage({ mode }: { mode: 'login' | 'register' }) {
  const { nav } = useRoute();
  const { login, register, toast, user } = useStore();
  const [role, setRole] = useState<Role>('volunteer');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    email: '', password: '', name: '', phone: '', city: 'Минск', about: '',
    skills: [] as string[], schedule: '', category: 'Помощь людям' as string,
  });
  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    if (user && mode === 'login') nav('/');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      if (mode === 'login') {
        await login(form.email.trim(), form.password);
        toast('С возвращением!', 'ok');
        nav('/');
      } else {
        await register({
          role,
          name: form.name.trim(), email: form.email.trim(), password: form.password,
          phone: form.phone.trim(), city: form.city, about: form.about.trim(),
          skills: form.skills.join(','), schedule: form.schedule.trim(),
        });
        toast('Добро пожаловать на volonter.by! 🎉', 'ok');
        nav(role === 'volunteer' ? '/help' : '/help/new');
      }
    } catch (err: any) {
      setError(err.message || 'Не получилось. Попробуйте ещё раз.');
    } finally {
      setBusy(false);
    }
  };

  const fillDemo = (r: Role) => {
    setRole(r);
    set('email', DEMO[r].hint.split(' · ')[0]);
    set('password', '1234');
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-6 md:py-12">
      <div className="bg-white rounded-3xl border border-slate-100 shadow-card overflow-hidden">
        <div className="px-6 pt-7 pb-5 bg-gradient-to-br from-orange-50 to-white border-b border-orange-100/60">
          <h1 className="font-display font-bold text-2xl text-slate-900">
            {mode === 'login' ? 'Вход на volonter.by' : 'Присоединяйтесь к команде'}
          </h1>
          <p className="text-slate-500 text-sm mt-1.5">
            {mode === 'login' ? 'Рады видеть вас снова — добрые дела ждут.' : 'Регистрация занимает минуту.'}
          </p>
        </div>

        {/* выбор роли при регистрации */}
        {mode === 'register' && (
          <div className="px-6 pt-5 grid grid-cols-3 gap-2">
            {([
              { id: 'volunteer', icon: 'fa-people-group', label: 'Я волонтёр', sub: 'хочу помогать' },
              { id: 'organization', icon: 'fa-building', label: 'Организация', sub: 'нужны волонтёры' },
              { id: 'person', icon: 'fa-house-user', label: 'Частное лицо', sub: 'нужна помощь' },
            ] as const).map((r) => (
              <button key={r.id} type="button" onClick={() => setRole(r.id)}
                className={`rounded-2xl border-2 p-3 text-center transition-all ${role === r.id ? 'border-orange-500 bg-orange-50' : 'border-slate-100 hover:border-orange-200'}`}>
                <i className={`fa-solid ${r.icon} text-lg ${role === r.id ? 'text-orange-600' : 'text-slate-400'}`} />
                <div className="text-[13px] font-bold text-slate-800 mt-1.5">{r.label}</div>
                <div className="text-[11px] text-slate-400">{r.sub}</div>
              </button>
            ))}
          </div>
        )}

        <form onSubmit={submit} className="px-6 py-5 space-y-4">
          {mode === 'register' && (
            <>
              <Field label={role === 'organization' ? 'Название организации' : role === 'volunteer' ? 'Ваше имя' : 'Ваше имя'}>
                <input className={inputCls} value={form.name} onChange={(e) => set('name', e.target.value)} required placeholder={role === 'organization' ? 'Например: БФ «Вектор добра»' : 'Например: Алеся Ковалёва'} />
              </Field>
              {role === 'organization' && (
                <Field label="Кто вы и чем занимаетесь" hint="Это увидят волонтёры при выборе, кому помочь">
                  <textarea className={inputCls} rows={2} value={form.about} onChange={(e) => set('about', e.target.value)} placeholder="Коротко о вашей деятельности" />
                </Field>
              )}
              {role === 'volunteer' && (
                <>
                  <Field label="Чем можете помогать" hint="Выберите до 5 направлений">
                    <div className="flex flex-wrap gap-1.5">
                      {SKILLS.map((s) => (
                        <Chip key={s} active={form.skills.includes(s)}
                          onClick={() => set('skills', form.skills.includes(s) ? form.skills.filter((x) => x !== s) : (form.skills.length < 5 ? [...form.skills, s] : form.skills))}>
                          {s}
                        </Chip>
                      ))}
                    </div>
                  </Field>
                  <Field label="Когда обычно свободны">
                    <input className={inputCls} value={form.schedule} onChange={(e) => set('schedule', e.target.value)} placeholder="например: будни после 18:00, выходные" />
                  </Field>
                </>
              )}
              {role === 'person' && (
                <Field label="Расскажите о себе" hint="Необязательно. Это поможет волонтёрам понять, чем помочь">
                  <textarea className={inputCls} rows={2} value={form.about} onChange={(e) => set('about', e.target.value)} placeholder="Например: мне 84 года, живу одна..." />
                </Field>
              )}
              <Field label="Город">
                <select className={inputCls} value={form.city} onChange={(e) => set('city', e.target.value)}>
                  {CITIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </Field>
              <Field label="Телефон" hint="Необязательно, но удобно для связи">
                <input className={inputCls} value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+375 __ ___ __ __" />
              </Field>
            </>
          )}

          <Field label="Электронная почта">
            <input className={inputCls} type="email" value={form.email} onChange={(e) => set('email', e.target.value)} required placeholder="you@example.com" />
          </Field>
          <Field label="Пароль">
            <input className={inputCls} type="password" value={form.password} onChange={(e) => set('password', e.target.value)} required minLength={4} placeholder="••••••••" />
          </Field>

          {error && <div className="text-sm text-rose-600 bg-rose-50 border border-rose-100 rounded-xl px-3.5 py-2.5 flex items-start gap-2"><i className="fa-solid fa-circle-exclamation mt-0.5" />{error}</div>}

          <Btn type="submit" full disabled={busy} className="!py-3.5">
            {busy ? <span className="flex items-center gap-2"><i className="fa-solid fa-spinner fa-spin" /> Минуточку…</span> :
              mode === 'login' ? 'Войти' : 'Создать аккаунт'}
          </Btn>

          <p className="text-center text-sm text-slate-500 pt-1">
            {mode === 'login' ? (
              <>Нет аккаунта? <button type="button" className="text-orange-600 font-bold hover:underline" onClick={() => nav('/register')}>Зарегистрируйтесь</button></>
            ) : (
              <>Уже есть аккаунт? <button type="button" className="text-orange-600 font-bold hover:underline" onClick={() => nav('/login')}>Войти</button></>
            )}
          </p>
        </form>

        {/* демо-доступ */}
        <div className="px-6 pb-6 pt-1 border-t border-slate-100 mt-2">
          <p className="text-xs text-slate-400 mb-2 flex items-center gap-1.5"><i className="fa-solid fa-flask" /> Демо-доступ (пароль 1234) — нажмите, чтобы заполнить:</p>
          <div className="flex flex-wrap gap-1.5">
            {(Object.keys(DEMO) as Role[]).map((r) => (
              <button key={r} onClick={() => fillDemo(r)} className="text-[12px] font-semibold bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 px-2.5 py-1.5 rounded-lg transition-colors">
                {DEMO[r].name}
              </button>
            ))}
          </div>
          <p className="text-[11px] text-slate-300 mt-2 leading-relaxed">Заполнив форму, вы соглашаетесь с правилами платформы volonter.by.</p>
        </div>
      </div>
    </div>
  );
}

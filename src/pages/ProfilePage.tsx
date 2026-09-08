import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useRoute } from '../lib/router';
import { useStore } from '../lib/store';
import { Avatar, Btn, Chip, Field, inputCls } from '../components/ui';
import { CITIES, INTERESTS, SKILLS } from '../lib/types';

export default function ProfilePage() {
  const { nav } = useRoute();
  const { user, setUser, toast, logout } = useStore();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState<any>(null);

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name, phone: user.phone || '', city: user.city, about: user.about || '',
        skills: [], interests: [], schedule: '',
      });
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.role === 'volunteer' && user && !form?.skillsLoaded) {
      api.volunteer(user.id).then((d) => {
        const me = d.volunteer;
        if (me) {
          setForm((f: any) => f && ({ ...f, skills: me.skills, interests: me.interests, schedule: me.schedule || '', skillsLoaded: true }));
        }
      }).catch(() => {});
    }
  }, [user?.id]);

  if (!user) {
    return <div className="max-w-lg mx-auto px-4 py-16 text-center"><Btn onClick={() => nav('/login')}>Войти</Btn></div>;
  }
  if (!form) return <div className="max-w-xl mx-auto px-4 py-10" />;

  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  const save = async () => {
    setBusy(true);
    try {
      const res = await api.updateProfile({
        name: form.name, phone: form.phone, city: form.city, about: form.about,
        skills: form.skills.join(','), interests: form.interests.join(','), schedule: form.schedule,
      });
      setUser(res.user);
      toast('Профиль сохранён', 'ok');
    } catch (err: any) {
      toast(err.message || 'Не удалось сохранить', 'err');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 md:px-6 py-5 md:py-8">
      <h1 className="font-display font-bold text-2xl text-slate-900">Профиль</h1>

      <div className="mt-5 bg-white rounded-3xl border border-slate-100 shadow-card overflow-hidden">
        <div className="bg-gradient-to-r from-orange-600 to-orange-700 px-6 py-6 flex items-center gap-4">
          <Avatar seed={user.avatarSeed || user.id} name={user.name} size={64} />
          <div className="text-white min-w-0">
            <div className="font-display font-bold text-lg truncate">{user.name}</div>
            <div className="text-orange-100 text-sm">{user.email}</div>
            <span className="inline-block mt-1.5 text-[11px] font-bold uppercase px-2 py-0.5 rounded bg-white/20">
              {user.role === 'volunteer' ? 'волонтёр' : user.role === 'organization' ? 'организация' : 'частное лицо'}
            </span>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <Field label="Имя / название">
            <input className={inputCls} value={form.name} onChange={(e) => set('name', e.target.value)} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Город">
              <select className={inputCls} value={form.city} onChange={(e) => set('city', e.target.value)}>
                {CITIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Телефон">
              <input className={inputCls} value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+375 __" />
            </Field>
          </div>
          <Field label={user.role === 'organization' ? 'О вас (увидят волонтёры)' : 'О себе (увидят те, кому вы помогаете / волонтёры)'}>
            <textarea className={inputCls} rows={3} value={form.about} onChange={(e) => set('about', e.target.value)} />
          </Field>

          {user.role === 'volunteer' && (
            <>
              <Field label="Чем помогаете" hint="До 5 направлений — их ищут организации">
                <div className="flex flex-wrap gap-1.5">
                  {SKILLS.map((s) => (
                    <Chip key={s} active={(form.skills || []).includes(s)}
                      onClick={() => set('skills', (form.skills || []).includes(s) ? form.skills.filter((x: string) => x !== s) : (form.skills || []).length < 5 ? [...form.skills, s] : form.skills)}>
                      {s}
                    </Chip>
                  ))}
                </div>
              </Field>
              <Field label="Интересы">
                <div className="flex flex-wrap gap-1.5">
                  {INTERESTS.map((s) => (
                    <Chip key={s} active={(form.interests || []).includes(s)}
                      onClick={() => set('interests', (form.interests || []).includes(s) ? form.interests.filter((x: string) => x !== s) : [...(form.interests || []), s])}>
                      {s}
                    </Chip>
                  ))}
                </div>
              </Field>
              <Field label="Когда обычно свободны">
                <input className={inputCls} value={form.schedule || ''} onChange={(e) => set('schedule', e.target.value)} placeholder="будни после 18:00, выходные" />
              </Field>
            </>
          )}

          <Btn full disabled={busy} onClick={save} className="!py-3.5">
            {busy ? <><i className="fa-solid fa-spinner fa-spin" /> Сохраняем…</> : <><i className="fa-solid fa-floppy-disk" /> Сохранить изменения</>}
          </Btn>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between bg-white rounded-2xl border border-slate-100 p-4">
        <span className="text-sm text-slate-400">Смена пароля появится позже.</span>
        <Btn variant="danger" small onClick={async () => { await logout(); toast('Вы вышли из аккаунта', 'info'); nav('/'); }}>
          <i className="fa-solid fa-right-from-bracket" /> Выйти
        </Btn>
      </div>
    </div>
  );
}

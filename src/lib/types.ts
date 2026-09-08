// Общие типы данных приложения volonter.by

export type Role = 'volunteer' | 'organization' | 'person';

export interface User {
  id: number;
  role: Role;
  name: string;
  email: string;
  phone: string;
  city: string;
  about: string;
  avatarSeed: number;
  createdAt?: string;
}

export interface Volunteer extends User {
  verified: boolean;
  skills: string[];
  interests: string[];
  schedule: string;
  lastActive: string;
  ratingAvg: number;
  ratingCount: number;
  helpCount: number;
  hoursTotal: number;
}

export type RequestStatus = 'open' | 'in_progress' | 'done' | 'closed';

export interface HelpRequest {
  id: number;
  authorId: number | null;
  authorName: string;
  authorType: 'organization' | 'person';
  city: string;
  title: string;
  description: string;
  category: string;
  dateStart: string | null;
  dateEnd: string | null;
  timeText: string;
  urgent: boolean;
  volunteersNeeded: number;
  volunteersFound: number;
  status: RequestStatus;
  conditions: string;
  createdAt: string;
  // расширения, которые приходят с сервера:
  responsesCount?: number;
  acceptedCount?: number;
  myStatus?: string | null;
  myResponseId?: number | null;
  volunteers?: RequestVolunteer[];
}

export type ResponseStatus = 'applied' | 'accepted' | 'declined' | 'done';

export interface RequestVolunteer {
  id: number;
  requestId: number;
  volunteerId: number;
  volunteerName: string;
  volunteerCity: string;
  volunteerPhone: string;
  volunteerEmail: string;
  volunteerHelpCount: number;
  message: string;
  status: ResponseStatus;
  rating: number | null;
  review: string;
  hours: number;
  createdAt: string;
}

export interface ChatMessage {
  id: number;
  requestId: number | null;
  fromUser: number;
  toUser: number;
  text: string;
  createdAt: string;
  fromName: string;
  toName: string;
  fromRole: Role;
}

export interface Conversation {
  peerId: number;
  peerName: string;
  peerRole: Role;
  lastText: string;
  lastAt: string;
}

export interface Review {
  rating: number;
  review: string;
  hours: number;
  createdAt: string;
  requestTitle: string;
  city: string;
  authorName: string;
}

export interface MyResponse {
  id: number;
  requestId: number;
  requestTitle: string;
  requestCity: string;
  requestDateStart: string | null;
  requestAuthorName: string;
  requestStatus: RequestStatus;
  message: string;
  status: ResponseStatus;
  rating: number | null;
  review: string;
  hours: number;
  createdAt: string;
}

export interface CategoryInfo {
  id: string;
  label: string;
  icon: string; // font-awesome класс
  color: string; // tailwind-цвет для плашки
}

export const CATEGORIES: CategoryInfo[] = [
  { id: 'elderly', label: 'Помощь пожилым', icon: 'fa-person-cane', color: 'bg-rose-100 text-rose-700' },
  { id: 'children', label: 'Дети', icon: 'fa-child-reaching', color: 'bg-sky-100 text-sky-700' },
  { id: 'animals', label: 'Животные', icon: 'fa-paw', color: 'bg-amber-100 text-amber-700' },
  { id: 'delivery', label: 'Доставка', icon: 'fa-truck-fast', color: 'bg-teal-100 text-teal-700' },
  { id: 'repair', label: 'Ремонт и руки', icon: 'fa-hammer', color: 'bg-stone-200 text-stone-700' },
  { id: 'move', label: 'Переезды', icon: 'fa-boxes-stacked', color: 'bg-indigo-100 text-indigo-700' },
  { id: 'eco', label: 'Экология', icon: 'fa-tree', color: 'bg-green-100 text-green-700' },
  { id: 'warehouse', label: 'Склад и погрузка', icon: 'fa-warehouse', color: 'bg-yellow-100 text-yellow-800' },
  { id: 'creative', label: 'Творчество', icon: 'fa-palette', color: 'bg-fuchsia-100 text-fuchsia-700' },
  { id: 'it', label: 'IT-помощь', icon: 'fa-laptop', color: 'bg-cyan-100 text-cyan-700' },
  { id: 'translate', label: 'Переводы', icon: 'fa-language', color: 'bg-violet-100 text-violet-700' },
  { id: 'care', label: 'Уход и поддержка', icon: 'fa-heart-pulse', color: 'bg-red-100 text-red-700' },
  { id: 'online', label: 'Онлайн-помощь', icon: 'fa-globe', color: 'bg-slate-200 text-slate-700' },
  { id: 'other', label: 'Другое', icon: 'fa-hands-holding-child', color: 'bg-orange-100 text-orange-700' },
];

export function categoryOf(id: string): CategoryInfo {
  return CATEGORIES.find((c) => c.id === id) || CATEGORIES[CATEGORIES.length - 1];
}

export const CITIES = [
  'Минск', 'Гродно', 'Брест', 'Витебск', 'Гомель', 'Могилёв',
  'Бобруйск', 'Барановичи', 'Борисов', 'Пинск', 'Орша', 'Мозырь',
  'Лида', 'Солигорск', 'Полоцк', 'Жлобин', 'Светлогорск', 'Слуцк',
  'Кобрин', 'Новополоцк', 'Онлайн',
];

export const SKILLS = [
  'уход за пожилыми', 'помощь животным', 'занятия с детьми', 'доставка продуктов',
  'мелкий ремонт', 'переезды', 'IT-помощь', 'переводы', 'психологическая поддержка',
  'уход за больными', 'творчество', 'экология', 'субботники', 'работа руками',
  'собеседник', 'документы', 'первая помощь', 'перевозки', 'онлайн-помощь',
];

export const INTERESTS = [
  'помощь пожилым', 'дети', 'приюты', 'больницы и хосписы', 'одинокие люди',
  'экология', 'город', 'цифровая грамотность', 'переводы', 'горячая линия',
];

export function fmtDate(d: string | null): string {
  if (!d) return '';
  const date = new Date(d.length <= 10 ? d + 'T00:00:00' : d);
  if (Number.isNaN(date.getTime())) return d;
  return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
}

export function fmtDateShort(d: string | null): string {
  if (!d) return '';
  const date = new Date(d.length <= 10 ? d + 'T00:00:00' : d);
  if (Number.isNaN(date.getTime())) return d;
  return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}

export function weekdayOf(d: string | null): string {
  if (!d) return '';
  const date = new Date(d + 'T00:00:00');
  return date.toLocaleDateString('ru-RU', { weekday: 'short' });
}

export function fmtDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export function timeAgo(iso: string): string {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 60) return 'только что';
  if (s < 3600) return `${Math.floor(s / 60)} мин назад`;
  if (s < 86400) return `${Math.floor(s / 3600)} ч назад`;
  return `${Math.floor(s / 86400)} дн назад`;
}

export const STATUS_LABELS: Record<RequestStatus, string> = {
  open: 'Ищем волонтёров',
  in_progress: 'Волонтёры найдены',
  done: 'Помощь оказана',
  closed: 'Закрыта',
};

export const RESPONSE_STATUS_LABELS: Record<ResponseStatus, string> = {
  applied: 'Отклик отправлен',
  accepted: 'Вы приняты ✅',
  declined: 'Отклонено',
  done: 'Помощь оказана 🎉',
};

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export function avatarColors(seed: number): { from: string; to: string } {
  const hues = [
    ['#f97316', '#c2410c'],
    ['#f43f5e', '#9f1239'],
    ['#8b5cf6', '#5b21b6'],
    ['#0ea5e9', '#075985'],
    ['#10b981', '#065f46'],
    ['#f59e0b', '#b45309'],
    ['#ec4899', '#9d174d'],
    ['#14b8a6', '#115e59'],
  ];
  const pair = hues[seed % hues.length];
  return { from: pair[0], to: pair[1] };
}

'use client';

import type { BookingService } from '@/lib/booking-types';
import { money, serviceCopy, t, type Lang } from '@/lib/i18n';

// Small medical salon icons used in the featured row and service list.
// The `icon` field on a service/category is the key to pick one of these.
export const categoryIconMap: Record<string, any> = {
  corte: (
    <>
      <path d="M6 20h12" />
      <path d="M9 20V8L12 4L15 8V20" />
      <path d="M12 4v4" />
      <path d="M9 10l3-3 3 3" />
    </>
  ),
  barba: (
    <>
      <path d="M20 20.55v-7a4.8 4.8 0 0 0-9.4-1.86A4.94 4.94 0 0 0 16 9.5v2a5.03 5.03 0 0 0 2.95-4.44" />
      <path d="M8 7a3 3 0 0 1 0 5" />
      <path d="M16 7a3 3 0 0 0 0 5" />
      <path d="M2 21h20" />
      <path d="M4 21v-4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4" />
      <path d="M10 11h4" />
    </>
  ),
  cejas: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 9v4" />
      <path d="M12 15h.01" />
      <path d="M9 12h6" />
      <path d="M12 6v3" />
    </>
  ),
  combo: (
    <>
      <path d="M12 3a9 9 0 1 0 9 9" />
      <path d="M12 3v6l3 3" />
      <path d="M12 19a9 9 0 1 1 9-9" />
      <path d="M12 19V13l-3-3" />
      <path d="M4 12h.01" />
      <path d="M20 12h-.01" />
      <path d="M2 12h4" />
      <path d="M22 12h-4" />
    </>
  ),
  peinado: (
    <>
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" />
      <path d="M12 8v7" />
      <path d="M7 12h10" />
      <path d="M8 14l2 2 2-2 2 2 2-2" />
      <path d="M6 19h12" />
    </>
  ),
  bienestar: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 8v8" />
      <path d="M8 12h8" />
      <path d="M12 4v16" />
      <circle cx="12" cy="12" r="2" fill="currentColor" />
    </>
  ),
  atencion: (
    <>
      <path d="M12 2a10 10 0 0 0-10 10h.01" />
      <path d="M12 6v6l4 2" />
      <path d="M12 14c-3 0-5 2-5 4s2 4 5 4" />
      <path d="M8 12h8" />
    </>
  ),
  estetica: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 6v6l3 2" />
      <path d="M6 18h12" />
      <path d="M9 6l3 3 3-3" />
    </>
  ),
  Barberia: (
    <>
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
      <line x1="7" y1="7" x2="7" y2="7" />
      <line x1="7" y1="12" x2="7" y2="12" />
      <line x1="7" y1="17" x2="7" y2="17" />
    </>
  ),
  scissors: (
    <>
      <circle cx="6" cy="6" r="3" />
      <circle cx="6" cy="18" r="3" />
      <path d="M20 4 8.12 15.88" />
      <path d="M14.47 14.48 20 20" />
      <path d="M8.12 8.12 12 12" />
    </>
  ),
  razor: (
    <>
      <path d="m18 2 4 4-10 10H8v-4L18 2z" />
      <path d="m8 16-5 5" />
      <path d="m14 6 4 4" />
    </>
  ),
  brow: (
    <>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
};

// Per-service icons for the catalog (DB categoryIcon is an emoji, not a map key).
export const serviceIconMap: Record<string, string> = {
  'dm-corte': 'scissors',
  'dm-barba': 'razor',
  'dm-cabello-barba': 'combo',
  'dm-cejas': 'brow',
};

export function serviceIconKey(service: { id: string; categoryIcon?: string | null }): string | undefined {
  return serviceIconMap[service.id]
    ?? (service.categoryIcon && categoryIconMap[service.categoryIcon] ? service.categoryIcon : undefined);
}

interface HighlightCardProps {
  service: BookingService;
  /** Optional icon name from icons.ts or a config categoryIcon; falls back to built-in medical SVG */
  icon?: string;
  imageUrl?: string;
  isSelected: boolean;
  onToggle: (service: BookingService) => void;
  lang: Lang;
}

export function HighlightCard({ service, imageUrl, isSelected, onToggle, lang, icon }: HighlightCardProps) {
  const copy = serviceCopy(service.id, lang);
  const name = copy?.name ?? service.name;
  const description = copy?.description ?? service.description;

  return (
    <div
      className="relative flex-none w-[220px] rounded-2xl snap-center cursor-pointer transition-all duration-300 flex flex-col overflow-hidden"
      style={{
        backgroundColor: 'var(--bg-surface)',
        border: isSelected ? '1.5px solid var(--text-primary)' : '1px solid var(--border-subtle)',
        boxShadow: isSelected ? '0 2px 16px rgba(0,0,0,0.1)' : '0 1px 4px rgba(0,0,0,0.04)',
      }}
      onClick={() => onToggle(service)}
    >
      <div className="w-full h-48 overflow-hidden flex-shrink-0" style={{ backgroundColor: 'var(--bg-surface-hover)' }}>
        {icon && categoryIconMap[icon] ? (
          <div className="w-full h-full flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-primary)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              {categoryIconMap[icon]}
            </svg>
          </div>
        ) : imageUrl ? (
          <img src={imageUrl} alt={name} loading="lazy" className="w-full h-full object-cover" style={{ objectPosition: 'center 15%' }} />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-primary)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.55 }}>
              <circle cx="12" cy="12" r="8" />
              <path d="M12 8v8M8 12h8" />
            </svg>
          </div>
        )}
      </div>

      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-display text-xl font-light leading-tight mb-2" style={{ color: 'var(--text-primary)' }}>
          {name}
        </h3>

        <p className="text-xs leading-relaxed flex-1 mb-4 line-clamp-3" style={{ color: 'var(--text-secondary)' }}>
          {description}
        </p>

        <div className="pt-3 flex items-center justify-between" style={{ borderTop: '1px solid var(--border-subtle)' }}>
          <div>
            <div className="font-display text-lg font-light" style={{ color: 'var(--text-primary)' }}>{money(service.price, lang)}</div>
            <div className="flex items-center gap-1 text-xs mt-0.5" style={{ color: 'var(--text-disabled)' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              {service.duration} min
            </div>
          </div>

          <button
            className="w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300"
            style={isSelected
              ? { backgroundColor: 'var(--text-primary)', color: 'var(--bg-app)', transform: 'scale(1.05)' }
              : { backgroundColor: 'var(--bg-surface-hover)', color: 'var(--text-disabled)', border: '1px solid var(--border-subtle)' }}
            onClick={(event) => { event.stopPropagation(); onToggle(service); }}
            aria-label={isSelected ? t('remove', lang) : t('add', lang)}
          >
            {isSelected ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
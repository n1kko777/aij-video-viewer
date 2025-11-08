export type YandexResolveResult = {
  href: string;
  method?: string;
  templated?: boolean;
};

const API_BASE = 'https://cloud-api.yandex.net/v1/disk/public/resources/download';

export function isYandexDiskUrl(url: string): boolean {
  try {
    const u = new URL(url);
    const host = u.hostname.toLowerCase();
    return (
      host === 'disk.yandex.ru' ||
      (host.startsWith('disk.') && host.endsWith('.yandex.ru'))
    );
  } catch {
    return false;
  }
}

type KeyAndPath = { key: string; path?: string; origin: string };

function extractKeyAndPath(publicUrl: string): KeyAndPath | null {
  try {
    const u = new URL(publicUrl);
    const parts = u.pathname.split('/').filter(Boolean);
    const dIndex = parts.findIndex(p => p === 'd');
    if (dIndex === -1 || !parts[dIndex + 1]) return null;
    const key = parts[dIndex + 1];
    const tail = parts.slice(dIndex + 2).join('/');
    const path = tail ? '/' + decodeURIComponent(tail) : undefined;
    return { key, path, origin: u.origin };
  } catch {
    return null;
  }
}

export async function resolveYandexPublicUrl(publicUrl: string): Promise<string> {
  if (!isYandexDiskUrl(publicUrl)) {
    throw new Error('Ожидается ссылка disk.yandex.ru');
  }

  // Attempt 1: pass the full URL as public_key
  const url1 = `${API_BASE}?public_key=${encodeURIComponent(publicUrl)}`;
  let r = await fetch(url1);
  if (r.ok) {
    const data = (await r.json()) as YandexResolveResult;
    if (data.href) return data.href;
  }

  // Attempt 2: split to key + path if present
  const kp = extractKeyAndPath(publicUrl);
  if (kp) {
    const baseOriginal = `${kp.origin}/d/${kp.key}`;
    const params = new URLSearchParams({ public_key: baseOriginal });
    if (kp.path) params.set('path', kp.path);
    const url2 = `${API_BASE}?${params.toString()}`;
    r = await fetch(url2);
    if (r.ok) {
      const data = (await r.json()) as YandexResolveResult;
      if (data.href) return data.href;
    }

    // Attempt 2b: same but forcing canonical host
    const canonicalParams = new URLSearchParams({
      public_key: `https://disk.yandex.ru/d/${kp.key}`,
    });
    if (kp.path) canonicalParams.set('path', kp.path);
    const url2b = `${API_BASE}?${canonicalParams.toString()}`;
    r = await fetch(url2b);
    if (r.ok) {
      const data = (await r.json()) as YandexResolveResult;
      if (data.href) return data.href;
    }
  }

  // Attempt 3: try without path at all (folder root)
  if (kp) {
    const baseOriginal = `${kp.origin}/d/${kp.key}`;
    const url3 = `${API_BASE}?public_key=${encodeURIComponent(baseOriginal)}`;
    r = await fetch(url3);
    if (r.ok) {
      const data = (await r.json()) as YandexResolveResult;
      if (data.href) return data.href;
    }

    // Attempt 4: fallback to canonical disk.yandex.ru in case API requires it
    const canonicalBase = `https://disk.yandex.ru/d/${kp.key}`;
    const url4 = `${API_BASE}?public_key=${encodeURIComponent(canonicalBase)}`;
    r = await fetch(url4);
    if (r.ok) {
      const data = (await r.json()) as YandexResolveResult;
      if (data.href) return data.href;
    }
  }

  throw new Error('Не удалось получить прямую ссылку с Яндекс.Диска');
}

export function isProbablyDirectMedia(url: string): boolean {
  try {
    const u = new URL(url);
    const ext = (u.pathname.split('.').pop() || '').toLowerCase();
    return ['mp4', 'webm', 'mov', 'm4v'].includes(ext);
  } catch {
    return false;
  }
}

import React from 'react';
import { isProbablyDirectMedia, isYandexDiskUrl, resolveYandexPublicUrl } from '@/lib/yandex';

type Props = {
  initialUrl?: string;
};

type State = {
  input: string;
  resolved?: string;
  loading: boolean;
  error?: string;
};

export function Player({ initialUrl = '' }: Props) {
  const [{ input, resolved, loading, error }, setState] = React.useState<State>(() => {
    const fromStorage = localStorage.getItem('lastUrl') ?? '';
    const start = fromStorage || initialUrl || '';
    return { input: start, loading: false };
  });

  const resolvedRef = React.useRef<HTMLVideoElement | null>(null);

  React.useEffect(() => {
    // Try auto-load on first mount if initial is present
    if (input) void handleResolve(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleResolve(explicit = true) {
    const url = input.trim();
    if (!url) return;

    setState(s => ({ ...s, loading: true, error: undefined }));
    localStorage.setItem('lastUrl', url);

    try {
      let direct = url;
      if (isYandexDiskUrl(url) || !isProbablyDirectMedia(url)) {
        direct = await resolveYandexPublicUrl(url);
      }

      setState(s => ({ ...s, resolved: direct, loading: false }));

      // Attach to video
      const v = resolvedRef.current;
      if (v) {
        // Force reload of the source
        v.pause();
        v.src = direct;
        v.load();
        await v.play().catch(() => void 0);
      }

      // No longer push url to the browser address bar
    } catch (e) {
      console.error(e);
      const message = e instanceof Error ? e.message : 'Неизвестная ошибка';
      setState(s => ({ ...s, error: message, loading: false }));
    }
  }

  return (
    <div className="player-grid">
      <form
        className="card"
        onSubmit={e => {
          e.preventDefault();
          void handleResolve();
        }}
        style={{ display: 'grid', gap: 8 }}
      >
        <label htmlFor="url">Ссылка на видео (disk.yandex.ru)</label>
        <input
          id="url"
          type="url"
          inputMode="url"
          placeholder="https://disk.yandex.ru/d/.../video.mov"
          value={input}
          onChange={e => setState(s => ({ ...s, input: e.target.value }))}
          style={{
            width: '100%',
            padding: '10px 12px',
            borderRadius: 8,
            border: '1px solid var(--border)',
            background: 'var(--bg)',
            color: 'var(--fg)'
          }}
          required
        />
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="submit"
            disabled={loading || !input.trim()}
            style={{
              padding: '8px 12px',
              borderRadius: 8,
              border: '1px solid var(--border)',
              background: 'var(--accent)',
              color: '#fff',
              cursor: 'pointer'
            }}
          >
            {loading ? 'Загрузка…' : 'Загрузить'}
          </button>
        </div>
        {error && (
          <div style={{ color: '#ff6b6b' }}>
            {error}
          </div>
        )}
        <div style={{ color: 'var(--muted)', fontSize: 12 }}>
          Поддерживаются прямые ссылки на .mp4/.webm/.mov и публичные ссылки Яндекс.Диска.
        </div>
      </form>

      <div
        className="card"
        style={{
          display: 'grid',
          placeItems: 'center',
          width: '100%',
          maxWidth: 640,
          justifySelf: 'center',
          aspectRatio: '16 / 9'
        }}
      >
        {resolved ? (
          <video
            ref={resolvedRef}
            src={resolved}
            controls
            playsInline
            preload="metadata"
            crossOrigin="anonymous"
            style={{ width: '100%', height: '100%', background: 'black', borderRadius: 8 }}
          />
        ) : (
          <div style={{ color: 'var(--muted)' }}>Здесь появится видео</div>
        )}
      </div>
    </div>
  );
}

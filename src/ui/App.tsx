import React from 'react';
import { Player } from './Player';

const DEFAULT_URL =
  'https://disk.yandex.ru/d/Xr_9lvutffODYA/%D0%91%D0%91_%D0%98%D1%80%D0%BA%D1%83%D1%82%D1%81%D0%BA_AI-%D0%BF%D0%BE%D0%BC%D0%BE%D1%89%D0%BD%D0%B8%D0%BA%C2%A0%D1%81%D1%82%D1%83%D0%B4%D0%B5%D0%BD%D1%82%D0%B0.mov';

export default function App() {
  return (
    <div className="container">
      <header className="card">
        <h2 style={{ margin: 0 }}>AIJ Video Viewer</h2>
        <p style={{ margin: '8px 0 0', color: 'var(--muted)' }}>
          Вставьте публичную ссылку Яндекс.Диска на видео файл и нажмите «Загрузить».
        </p>
      </header>

      <main className="card" style={{ display: 'grid', gap: 12 }}>
        <Player initialUrl={DEFAULT_URL} />
      </main>
    </div>
  );
}


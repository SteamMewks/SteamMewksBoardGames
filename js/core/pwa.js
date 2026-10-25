import { gameMode, pwaInstallPrompt, pwaReloading, pwaUpdatePending, set_pwaInstallPrompt, set_pwaReloading, set_pwaUpdatePending } from './state.js';

export function setPWAStatus(e) {
  const t = document.getElementById('pwaStatus');
  if (t)
    t.textContent = e;
}

export function isPWAInstalled() {
  return typeof navigator !== 'undefined' && (navigator.standalone === true || typeof matchMedia === 'function' && matchMedia('(display-mode: standalone)').matches);
}

export function updatePWAInstallButton() {
  const e = document.getElementById('pwaInstall');
  if (!e)
    return;
  e.disabled = false;
  e.textContent = isPWAInstalled() ? '追加済み' : 'インストール';
  e.setAttribute('aria-label', isPWAInstalled() ? 'ホーム画面への追加は完了しています' : '機巧の遊戯卓をホーム画面に追加');
}

export async function installPWA() {
  if (isPWAInstalled()) {
    setPWAStatus('ホーム画面から遊べます\u3002');
    return;
  }
  if (pwaInstallPrompt) {
    const e = pwaInstallPrompt;
    set_pwaInstallPrompt(null);
    try {
      await e.prompt();
      const t = await e.userChoice;
      setPWAStatus(t.outcome === 'accepted' ? '追加を受け付けました\u3002' : '今回は追加を見送りました\u3002');
    } catch {
      setPWAStatus('ブラウザのメニューから\u300Cホーム画面に追加\u300Dを選んでください\u3002');
    }
    updatePWAInstallButton();
    return;
  }
  if (typeof location !== 'undefined' && location.protocol === 'file:') {
    setPWAStatus('公開先のURLをブラウザで開くと\u3001ホーム画面に追加できます\u3002');
    return;
  }
  if (typeof isSecureContext !== 'undefined' && !isSecureContext) {
    setPWAStatus('ホーム画面への追加にはHTTPSの公開先を使ってください\u3002');
    return;
  }
  setPWAStatus(/iPad|iPhone|iPod/.test(navigator.userAgent) ? 'Safariの共有メニューから\u300Cホーム画面に追加\u300Dを選んでください\u3002' : 'ブラウザのメニューから\u300Cアプリをインストール\u300Dまたは\u300Cホーム画面に追加\u300Dを選んでください\u3002');
}

export function applyPendingPWAUpdate() {
  if (pwaUpdatePending && !gameMode && !pwaReloading) {
    set_pwaReloading(true);
    location.reload();
  }
}

export function initializePWA() {
  updatePWAInstallButton();
  if (typeof navigator === 'undefined' || typeof location === 'undefined')
    return;
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    set_pwaInstallPrompt(e);
    updatePWAInstallButton();
  });
  window.addEventListener('appinstalled', () => {
    set_pwaInstallPrompt(null);
    updatePWAInstallButton();
    setPWAStatus('ホーム画面に追加しました\u3002');
  });
  if (!('serviceWorker' in navigator) || ![
      'https:',
      'http:'
    ].includes(location.protocol) || !isSecureContext)
    return;
  let e = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!e) {
      e = true;
      return;
    }
    set_pwaUpdatePending(true);
    if (gameMode)
      setPWAStatus('新版の準備ができました\u3002タイトルに戻ると更新します\u3002');
    applyPendingPWAUpdate();
  });
  const t = new URL(location.href);
  if (!t.pathname.endsWith('/') && !t.pathname.endsWith('/index.html'))
    return;
  navigator.serviceWorker.register('./sw.js', {
    scope: './',
    updateViaCache: 'none'
  }).then(e => {
    e.update().catch(() => {
    });
    navigator.serviceWorker.ready.then(() => setPWAStatus('オフラインでも遊べます\u3002')).catch(() => {
    });
    window.addEventListener('online', () => e.update().catch(() => {
    }));
  }).catch(() => setPWAStatus('オフライン用の準備ができませんでした\u3002接続中はそのまま遊べます\u3002'));
}

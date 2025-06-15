# 運転日誌アプリのモバイル対応 実装ガイド

## GitHub Pages でのホスティング設定

### 1. リポジトリの設定
1. GitHubでリポジトリを作成
2. プロジェクトファイルをアップロード
3. Settings → Pages → Source を "Deploy from a branch" に設定
4. Branch を "main" 、フォルダを "/ (root)" に設定

### 2. 必要なファイル構成
```
your-repository/
├── index.html          # メインのHTMLファイル
├── style.css          # CSSファイル  
├── script.js          # JavaScriptファイル
├── manifest.json      # PWA設定ファイル
└── sw.js             # Service Worker (オプション)
```

## モバイル最適化のHTMLヘッダー

### viewportメタタグの設定
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
<meta name="theme-color" content="#2196F3">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
```

### PWA用linkタグ
```html
<link rel="manifest" href="manifest.json">
<link rel="apple-touch-icon" href="icon-192x192.png">
```

## PWA manifest.json 設定例

```json
{
  "name": "運転日誌アプリ",
  "short_name": "運転日誌",
  "description": "運転記録を管理するアプリ",
  "start_url": "./index.html",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#2196F3",
  "icons": [
    {
      "src": "icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "icon-512x512.png", 
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

## スマートフォンでのアクセス方法

### GitHub Pagesアクセス手順
1. ブラウザで `https://[ユーザー名].github.io/[リポジトリ名]` にアクセス
2. ブックマークまたはホーム画面に追加

### ショートカット作成手順

#### iPhoneの場合
1. Safariでアプリにアクセス
2. 共有ボタン（□↑）をタップ
3. 「ホーム画面に追加」を選択
4. アプリ名を確認して「追加」をタップ

#### Androidの場合
1. Chromeでアプリにアクセス  
2. メニュー（⋮）をタップ
3. 「ホーム画面に追加」を選択
4. アプリ名を確認して「追加」をタップ

## モバイル向けJavaScript実装

### タッチイベントの処理
```javascript
// PC/スマホ判定
const isTouchDevice = 'ontouchstart' in window;

// イベント設定
const eventType = isTouchDevice ? 'touchstart' : 'click';
button.addEventListener(eventType, function() {
    // タップ/クリック処理
});
```

### レスポンシブ対応のCSS
```css
/* モバイル向けスタイル */
@media (max-width: 768px) {
    .container {
        padding: 10px;
    }
    
    input, button {
        min-height: 44px; /* タップしやすいサイズ */
        font-size: 16px;  /* ズームを防ぐ */
    }
}

/* タッチハイライト無効化 */
* {
    -webkit-tap-highlight-color: transparent;
    -webkit-user-select: none;
}
```

## デプロイの自動化（GitHub Actions）

```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: [ main ]
    
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - name: Deploy to GitHub Pages
      uses: peaceiris/actions-gh-pages@v3
      with:
        github_token: ${{ secrets.GITHUB_TOKEN }}
        publish_dir: ./
```

## セキュリティとベストプラクティス

### HTTPS対応
- GitHub Pagesは自動的にHTTPS対応
- PWA機能にはHTTPS必須

### パフォーマンス最適化
- 画像の最適化
- CSSの軽量化
- JavaScriptの圧縮

### オフライン対応（Service Worker）
```javascript
// sw.js
const CACHE_NAME = 'driving-log-v1';
const urlsToCache = [
  './',
  './index.html',
  './style.css',
  './script.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});
```
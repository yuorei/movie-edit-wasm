# movie-edit-wasm

FFmpeg.wasm を活用したブラウザ完結型動画編集アプリケーションの開発リポジトリです。詳細な要件は [docs/requirements-ja.md](docs/requirements-ja.md) を参照してください。

## 開発環境のセットアップ

```bash
npm install
npm run dev
```

ブラウザで `http://localhost:5173` を開くとアプリケーションを利用できます。

## 主な機能

- 複数動画の取り込み、トリム、クロップ、回転・反転、速度調整、フェード処理
- 1:1 / 9:16 / 16:9 / 4:5 などのアスペクト比プリセット付きプレビュー
- BGM の複数レーン追加と音量・開始位置調整、元動画とのミックス
- テキスト・画像のオーバーレイ追加と位置・サイズ・時間の制御
- FFmpeg.wasm による WebM (VP9 + Opus) 形式でのブラウザ内エクスポート

## ビルド

```bash
npm run build
```

生成された静的ファイルは `dist/` ディレクトリに出力されます。

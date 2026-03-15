# 住宅ローンシミュレーター

日本市場に特化した住宅ローンシミュレーター。物件価格・金利・維持費から月々の支払額を算出し、必要な年収の目安や住宅ローン控除の概算まで一括でシミュレーションできるWebアプリケーション。

## スクリーンショット

> TODO: スクリーンショットを追加

## 機能一覧

- 元利均等返済 / 元金均等返済の計算
- ボーナス返済対応
- 変動金利シナリオ（楽観・基準・悲観・手動）と5年ルール / 125%ルールの適用
- 繰り上げ返済シミュレーション（期間短縮型 / 返済額軽減型、最大5回設定可能）
- 住宅ローン控除の概算（2026年度税制改正対応）
- 諸費用の概算（仲介手数料、登録免許税、保証料など）
- 賃貸との比較（家賃上昇率を考慮した総支払額の比較）
- 返済比率に基づく目安年収の表示（20% / 25% / 30%）
- URLクエリパラメータによるシミュレーション結果の共有
- プランの保存と比較（localStorage、最大3プラン横並び比較）
- 住宅ローン用語のツールチップ表示
- 印刷 / PDF出力対応（`@media print`）
- ライト / ダークモード
- レスポンシブデザイン（スマートフォン対応）

## 技術スタック

| 領域 | 技術 |
| --- | --- |
| フレームワーク | TanStack Start + React 19 |
| スタイリング | Tailwind CSS v4 + shadcn/ui |
| チャート | Recharts |
| バリデーション | Zod |
| フォーム | TanStack Form |
| デプロイ | Cloudflare Workers |
| ツールチェーン | Vite+ (vp) |

## セットアップ

### 前提条件

- Node.js 24以上
- pnpm
- vp CLI（Vite+）

### インストールと起動

```bash
# 依存関係のインストール
vp install

# 開発サーバーの起動（ポート3000）
vp dev

# プロダクションビルド
vp build

# ビルド結果のプレビュー
vp preview
```

## テスト

ユニットテスト174件、E2Eテスト15件。

```bash
# 全テストの実行
vp test run

# ウォッチモードでの実行
vp test

# 特定ファイルのテスト
vp test run src/lib/loan-calculator.test.ts
```

## プロジェクト構成

```
src/
├── routes/
│   ├── __root.tsx            # ルートレイアウト
│   ├── index.tsx             # メインシミュレーター
│   ├── plans.tsx             # 保存済みプラン一覧
│   └── compare.tsx           # プラン比較
├── components/
│   ├── simulator/            # 入力フォーム系コンポーネント
│   ├── results/              # 結果表示系コンポーネント
│   ├── plans/                # プラン管理系コンポーネント
│   ├── shared/               # 共通コンポーネント（ツールチップ等）
│   └── ui/                   # shadcn/ui
├── server/
│   ├── calculate.ts          # サーバーファンクション
│   └── validation.ts         # Zodバリデーション
├── lib/
│   ├── loan-calculator.ts    # ローン計算ロジック
│   ├── prepayment-calculator.ts  # 繰り上げ返済計算
│   ├── tax-deduction.ts      # 住宅ローン控除計算
│   ├── closing-costs.ts      # 諸費用計算
│   ├── rent-comparison.ts    # 賃貸比較計算
│   ├── glossary.ts           # 用語辞書データ
│   ├── url-params.ts         # URL共有用パラメータ変換
│   ├── types.ts              # 型定義
│   └── plans-storage.ts      # localStorage操作
├── hooks/
│   └── use-plans.ts          # プラン管理フック
└── styles/
    └── print.css             # 印刷用スタイル
```

## ライセンス

MIT

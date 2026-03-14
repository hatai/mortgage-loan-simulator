# 住宅ローンシミュレーター設計書

## 概要

初めて住宅を購入する人向けの、日本市場特化型住宅ローンシミュレーター。住宅価格・金利・維持費から月々の支払額を算出し、必要な収入の目安を提示するWebアプリケーション。

## ターゲットユーザー

初めての住宅購入者。住宅ローンの基本を知りたい、マイホームを初めて検討している人。

## 言語

日本語のみ。i18n対応は不要。

## 技術スタック

- **フレームワーク:** TanStack Start + React 19
- **スタイリング:** Tailwind CSS v4 + shadcn/ui
- **チャート:** Recharts（要インストール: `vp add recharts`）
- **バリデーション:** Zod
- **フォーム:** TanStack Form
- **デプロイ:** Cloudflare Workers
- **ツールチェーン:** Vite+ (vp)

## アーキテクチャ

### アプローチ: SSR + API

TanStack Startのサーバーファンクション（`createServerFn`）で計算ロジックをサーバーサイドに配置。

```
[ブラウザ] ←→ [TanStack Start (Cloudflare Workers)]
                ├── SSR: ページレンダリング
                └── Server Functions: ローン計算API
```

### レイヤー構成

1. **プレゼンテーション層** — Reactコンポーネント + Tailwind CSS + Recharts
2. **フォーム管理層** — TanStack Form + Zodバリデーション
3. **API層** — TanStack Start Server Functions（`createServerFn`）
4. **ドメインロジック層** — 純粋な計算関数（ローン計算、返済スケジュール生成）
5. **永続化層** — localStorage（プラン保存・比較）

## UIレイアウト

### 2カラムレイアウト

- **左パネル:** 入力フォーム（物件・ローン・維持費の3セクション）
- **右パネル:** 結果表示（サマリー・チャート・収入ガイド）
- **レスポンシブ:** スマホでは自動的に縦積み

### ルート構成

| パス | 用途 |
|------|------|
| `/` | メインシミュレーター（2カラムレイアウト） |
| `/plans` | 保存済みプラン一覧（カード形式、削除・名前変更可能） |
| `/compare` | 複数プラン比較（最大3プランまで横並びテーブル） |

### /plans ページ仕様

保存済みプランをカード形式で一覧表示。各カードには：プラン名、物件価格、月々支払額、作成日時、「比較に追加」「削除」ボタン。プランが0件の場合は空状態メッセージを表示。

### /compare ページ仕様

最大3つのプランを横並びテーブルで比較。比較項目：
- 物件価格、頭金、借入額
- 金利タイプ、金利、返済期間
- 月々ローン返済額、月々総支払額
- 総返済額、利息総額
- 目安年収（返済比率25%）

プラン選択はlocalStorageから読み出したプラン一覧からチェックボックスで選択。

## バリデーション制約

| パラメータ | 最小値 | 最大値 | 備考 |
|-----------|--------|--------|------|
| 物件価格 | 100万円 | 50,000万円 | — |
| 頭金 | 0万円 | 物件価格以下 | 物件価格を超えない |
| 金利 | 0.01% | 15.0% | 0%は不可 |
| 返済期間 | 1年 | 50年 | — |
| ボーナス返済額 | 0万円 | 借入額の50% | — |
| 修繕積立金 | 0円 | 100,000円 | — |
| 管理費 | 0円 | 100,000円 | — |
| 固定資産税 | 0万円 | 100万円 | — |

バリデーションエラー時はフィールド直下にエラーメッセージを赤文字で表示。

## 入力パラメータ

| カテゴリ | パラメータ | 型 | デフォルト値 |
|---------|-----------|-----|------------|
| **物件** | 物件価格 | 数値（万円） | 3,000 |
| **物件** | 頭金 | 数値（万円） | 300 |
| **ローン** | 金利タイプ | 固定 / 変動 / フラット35 | 固定 |
| **ローン** | 金利（年率%） | 数値 | 固定:1.5 / 変動:0.5 / フラット35:1.8 |
| **ローン** | 返済期間 | 数値（年） | 35 |
| **ローン** | 返済方式 | 元利均等 / 元金均等 | 元利均等 |
| **ローン** | ボーナス返済額 | 数値（万円） | 0 |
| **維持費** | 修繕積立金 | 数値（円/月） | 12,000 |
| **維持費** | 管理費 | 数値（円/月） | 15,000 |
| **維持費** | 固定資産税（年額） | 数値（万円） | 10 |

## 計算ロジック

### 元利均等返済（PMT）

```
月利 = 年利 / 12
月々返済額 = 借入額 × 月利 × (1 + 月利)^返済月数 / ((1 + 月利)^返済月数 - 1)
```

### 元金均等返済

```
月々元金 = 借入額 / 返済月数
n月目の利息 = (借入額 - 月々元金 × (n-1)) × 月利
```

### ボーナス返済

ボーナス返済は年2回（6月・12月）適用。借入額をボーナス返済分と毎月返済分に分割して計算する。

```
ボーナス返済対象額 = ボーナス返済額 × 返済回数(年2回 × 返済年数)  ※ 借入額の50%以下に制限
毎月返済対象額 = 借入額 - ボーナス返済対象額
毎月返済額 = PMT(毎月返済対象額) + ボーナス月は PMT(ボーナス返済対象額) × 6
```

ただし実装上は、毎月返済分とボーナス返済分をそれぞれ独立にPMT計算し、ボーナス月（6月・12月）に加算する。

### 変動金利シナリオ（金利タイプが変動の場合）

- 楽観: 現状維持
- 基準: 5年ごとに+0.25%上昇
- 悲観: 5年ごとに+0.5%上昇

**5年ルール:** 変動金利の月々返済額は5年間固定。金利が変動しても、返済額の見直しは5年ごとにのみ行う。見直し間の金利変動は元金と利息の内訳比率で調整される。

**125%ルール:** 5年ごとの返済額見直し時、新しい返済額は前回の返済額の125%を上限とする。上限を超えた未払い利息は元金に加算される。

### 変動金利シナリオのデータ最適化

チャート表示用に返済スケジュールは年次サマリー（12ヶ月ごとの集計）で返す。フル月次データは不要。

```typescript
interface YearlyScheduleSummary {
  year: number
  totalPrincipal: number    // その年に返済した元金合計
  totalInterest: number     // その年に支払った利息合計
  endBalance: number        // 年末残高
  averagePayment: number    // 月平均支払額
}
```

### 月々の総支払額

```
= ローン返済額 + 修繕積立金 + 管理費 + (固定資産税 / 12)
```

### 目安年収

```
= 月々ローン返済額 × 12 / 返済比率
```

返済比率は20%（安心）、25%（適正）、30%（注意）の3段階で表示。

### Server Function定義

```typescript
createServerFn({ method: 'POST' })
  .validator(loanInputSchema)
  .handler(async ({ data }) => {
    return {
      monthlyLoanPayment,    // 月々のローン返済額
      totalMonthlyPayment,   // 維持費込みの月々総額
      totalRepayment,        // 総返済額
      totalInterest,         // 利息総額
      requiredIncome,        // 返済比率別の目安年収
      schedule,              // 返済スケジュール配列
      scenarios,             // 変動金利シナリオ（変動の場合のみ）
    }
  })
```

## コンポーネント構成

```
SimulatorPage
├── Header
│   ├── Logo
│   └── NavLinks (保存済みプラン, 比較)
├── SimulatorLayout (2カラム grid)
│   ├── InputPanel
│   │   ├── PropertySection (物件価格, 頭金)
│   │   ├── LoanSection (金利タイプ, 金利, 返済期間, 返済方式, ボーナス)
│   │   ├── MaintenanceSection (修繕積立金, 管理費, 固定資産税)
│   │   └── CalculateButton
│   └── ResultPanel
│       ├── SummaryCard (月々総額, 総返済額, 利息, 目安年収)
│       ├── PaymentBreakdownChart (内訳バーチャート)
│       ├── RepaymentScheduleChart (返済スケジュール折れ線)
│       └── IncomeGuideline (返済比率別の年収目安)
└── SavePlanBar (保存, 比較に追加)
```

## 型定義

```typescript
type InterestType = 'fixed' | 'variable' | 'flat35'
type RepaymentMethod = 'equal_payment' | 'equal_principal'

interface LoanInput {
  propertyPrice: number      // 万円
  downPayment: number        // 万円
  interestType: InterestType
  interestRate: number       // 年率%
  loanTermYears: number
  repaymentMethod: RepaymentMethod
  bonusPayment: number       // 万円
  maintenanceFee: number     // 円/月
  repairReserve: number      // 円/月
  propertyTax: number        // 万円/年
}

interface LoanResult {
  monthlyLoanPayment: number
  totalMonthlyPayment: number
  totalRepayment: number
  totalInterest: number
  requiredIncome: Record<number, number>  // 返済比率 → 年収
  schedule: MonthlyScheduleItem[]
  scenarios?: VariableRateScenario[]
}

interface MonthlyScheduleItem {
  month: number
  principal: number
  interest: number
  balance: number
  payment: number
}

interface YearlyScheduleSummary {
  year: number
  totalPrincipal: number
  totalInterest: number
  endBalance: number
  averagePayment: number
}

interface VariableRateScenario {
  name: string           // 楽観, 基準, 悲観
  rate: number           // 最終金利
  monthlyPayment: number // 最終月の支払額
  totalRepayment: number
  yearlySummary: YearlyScheduleSummary[]
}

interface SavedPlan {
  id: string
  name: string
  input: LoanInput
  result: LoanResult
  createdAt: string
}
```

## ファイル構成

```
src/
├── routes/
│   ├── __root.tsx
│   ├── index.tsx               # メインシミュレーター
│   ├── plans.tsx               # 保存済みプラン一覧
│   └── compare.tsx             # プラン比較
├── components/
│   ├── simulator/
│   │   ├── InputPanel.tsx
│   │   ├── PropertySection.tsx
│   │   ├── LoanSection.tsx
│   │   ├── MaintenanceSection.tsx
│   │   └── CalculateButton.tsx
│   ├── results/
│   │   ├── ResultPanel.tsx
│   │   ├── SummaryCard.tsx
│   │   ├── PaymentBreakdownChart.tsx
│   │   ├── RepaymentScheduleChart.tsx
│   │   └── IncomeGuideline.tsx
│   ├── plans/
│   │   ├── SavePlanBar.tsx
│   │   ├── PlanCard.tsx
│   │   └── CompareTable.tsx
│   └── ui/                     # shadcn/ui (既存)
├── server/
│   ├── calculate.ts
│   └── validation.ts
├── lib/
│   ├── loan-calculator.ts
│   ├── types.ts
│   ├── plans-storage.ts
│   └── utils.ts
└── hooks/
    └── use-plans.ts
```

## データ永続化

localStorageを使用。キー: `mortgage-simulator-plans`。

```typescript
// 保存
localStorage.setItem('mortgage-simulator-plans', JSON.stringify(plans))

// 読み出し
const plans: SavedPlan[] = JSON.parse(
  localStorage.getItem('mortgage-simulator-plans') ?? '[]'
)
```

## テスト方針

- `lib/loan-calculator.ts` — 単体テスト（元利均等・元金均等の計算精度を既知の値で検証）
- `server/validation.ts` — Zodバリデーションのテスト
- `components/` — 結合テスト（入力→結果表示フロー）

## エージェントチーム構成

| 役割 | 担当範囲 |
|------|---------|
| プロダクトマネージャー | 要件の最終確認、優先順位付け、スコープ管理 |
| プロダクトオーナー | ユーザーストーリー定義、受け入れ基準の策定 |
| カスタマーサクセス | 初心者目線でのUXレビュー、用語の分かりやすさチェック |
| シニアエンジニア 1 | アーキテクチャ設計、サーバーファンクション、計算ロジック、テスト |
| シニアエンジニア 2 | 型定義、Zodスキーマ、localStorage層、全体結合 |
| フロントエンドエキスパート 1 | InputPanel系コンポーネント |
| フロントエンドエキスパート 2 | ResultPanel系コンポーネント |
| バックエンドエキスパート 1 | 計算ロジックの実装とテスト |
| バックエンドエキスパート 2 | サーバーファンクション定義、バリデーション |

## 開発フェーズ

### フェーズ 1: 基盤（並列）

- バックエンドエキスパート1 → `lib/loan-calculator.ts` + テスト
- バックエンドエキスパート2 → `lib/types.ts`, `server/validation.ts`, `server/calculate.ts`
- シニアエンジニア2 → `lib/plans-storage.ts`, `hooks/use-plans.ts`

### フェーズ 2: UI（並列）

- フロントエンドエキスパート1 → InputPanel系コンポーネント
- フロントエンドエキスパート2 → ResultPanel系コンポーネント

### フェーズ 3: 統合

- シニアエンジニア1 → ルート統合（index.tsx, plans.tsx, compare.tsx）
- フロントエンドエキスパート1 → SavePlanBar, PlanCard
- フロントエンドエキスパート2 → CompareTable

### フェーズ 4: レビュー（全メンバー並列）

- プロダクトマネージャー → スコープ・要件の充足確認
- プロダクトオーナー → 受け入れ基準の確認
- カスタマーサクセス → 初心者UXレビュー
- シニアエンジニア1 → コードレビュー・テスト確認
- シニアエンジニア2 → 型整合性・全体結合確認

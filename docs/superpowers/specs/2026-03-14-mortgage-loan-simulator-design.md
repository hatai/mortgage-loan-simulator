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

| パス       | 用途                                                 |
| ---------- | ---------------------------------------------------- |
| `/`        | メインシミュレーター（2カラムレイアウト）            |
| `/plans`   | 保存済みプラン一覧（カード形式、削除・名前変更可能） |
| `/compare` | 複数プラン比較（最大3プランまで横並びテーブル）      |

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

### URL共有機能

シミュレーション結果をURLで他人と共有できる。入力パラメータをURLのクエリパラメータにエンコードする方式（サーバーサイド保存不要）。

**URL形式:**

```
/?p=3000&d=300&t=fixed&r=1.5&y=35&m=equal_payment&b=0&mf=12000&rr=15000&pt=10
```

**パラメータマッピング:**

| クエリキー | パラメータ             | 例                              |
| ---------- | ---------------------- | ------------------------------- |
| `p`        | 物件価格（万円）       | 3000                            |
| `d`        | 頭金（万円）           | 300                             |
| `t`        | 金利タイプ             | fixed / variable / flat35       |
| `r`        | 金利（%）              | 1.5                             |
| `y`        | 返済期間（年）         | 35                              |
| `m`        | 返済方式               | equal_payment / equal_principal |
| `b`        | ボーナス返済額（万円） | 0                               |
| `mf`       | 修繕積立金（円/月）    | 12000                           |
| `rr`       | 管理費（円/月）        | 15000                           |
| `pt`       | 固定資産税（万円/年）  | 10                              |

**動作フロー:**

1. 「共有リンクをコピー」ボタンをクリック → クエリパラメータ付きURLをクリップボードにコピー
2. 共有URLにアクセス → クエリパラメータからフォームに値を復元 → 自動的にシミュレーション実行
3. クエリパラメータがない場合はデフォルト値を使用（既存動作）

**UI:** ResultPanelのSummaryCard内またはSavePlanBar内に「共有リンクをコピー」ボタンを配置。コピー完了時にトースト通知を表示。

### 繰り上げ返済シミュレーション

任意のタイミングでの繰り上げ返済による効果を計算する。

**入力:**

- 繰り上げ返済時期（年目）
- 繰り上げ返済額（万円）
- 繰り上げ返済方式: 期間短縮型 / 返済額軽減型
- 複数回の繰り上げ返済を設定可能（最大5回）

**出力:**

- 繰り上げ返済なしとの比較（総返済額の差額、短縮される期間）
- 繰り上げ返済後の新しい月々返済額または残り期間
- 利息軽減効果

**UI:** InputPanel内に「繰り上げ返済」アコーディオンセクションとして追加。結果はResultPanel内で「繰り上げ返済なし」と「あり」の比較表として表示。

### 住宅ローン控除（減税）の概算

2026年度税制改正（令和8年度）に基づく住宅ローン控除の概算額を表示する。
参照: [国土交通省 住宅ローン減税](https://www.mlit.go.jp/jutakukentiku/house/jutakukentiku_house_tk2_000017.html)

**制度概要:**

- 控除率: 一律 **0.7%**（年末ローン残高に対して）
- 控除期間: **13年間**（新築・既存ともに）
- 所得要件: 合計所得金額 **2,000万円以下**（床面積40〜50㎡の場合は1,000万円以下）
- 床面積要件: **40㎡以上**（既存住宅にも緩和適用。ただし所得1,000万円超は50㎡以上）

**借入限度額（新築住宅）:**

| 住宅の種類                   | 一般世帯  | 子育て・若者夫婦世帯 |
| ---------------------------- | --------- | -------------------- |
| 認定住宅（長期優良・低炭素） | 4,500万円 | 5,000万円            |
| ZEH水準省エネ住宅            | 3,500万円 | 4,500万円            |
| 省エネ基準適合住宅           | 2,000万円 | 3,000万円            |

**借入限度額（既存住宅）:**

| 住宅の種類                 | 一般世帯  | 子育て・若者夫婦世帯 |
| -------------------------- | --------- | -------------------- |
| 認定住宅・ZEH水準          | 3,500万円 | 4,500万円            |
| 省エネ基準適合住宅         | 2,000万円 | 3,000万円            |
| その他（省エネ基準非適合） | 2,000万円 | 2,000万円            |

**子育て・若者夫婦世帯の定義:**

- 19歳未満の子を有する世帯（子育て世帯）
- 夫婦のいずれかが40歳未満の世帯（若者夫婦世帯）

**計算ロジック:**

```
年間控除額 = min(年末ローン残高, 借入限度額) × 0.7%
```

**入力（追加）:**

- 住宅の省エネ性能: 認定住宅 / ZEH水準 / 省エネ基準適合 / その他（デフォルト: 省エネ基準適合）
- 子育て・若者夫婦世帯: はい / いいえ（デフォルト: いいえ）

**出力:**

- 適用される借入限度額
- 年ごとの控除額一覧（13年分）
- 控除総額
- 実質総返済額（総返済額 - 控除総額）

**UI:** ResultPanel内に「住宅ローン控除」セクションとして表示。控除総額はSummaryCardにも表示。

### 諸費用の概算

住宅購入時の初期費用を概算する。

**計算項目:**

| 費目             | 計算方法                                                                  |
| ---------------- | ------------------------------------------------------------------------- |
| 仲介手数料       | 物件価格 × 3% + 6万円 + 消費税（中古のみ）                                |
| 登録免許税       | 固定資産税評価額(物件価格×70%) × 0.4%（所有権） + 借入額 × 0.1%（抵当権） |
| 司法書士報酬     | 一律10万円（概算）                                                        |
| 印紙税           | 借入額に応じた段階税率（1,000万超〜5,000万以下: 2万円）                   |
| 火災保険料       | 一律20万円（概算、10年一括）                                              |
| ローン事務手数料 | 借入額 × 2.2%（ネット銀行）or 一律3〜5万円（都市銀行）                    |
| 保証料           | 借入額 × 2%（一括前払い方式、概算）                                       |

**入力（追加）:**

- 物件種別: 新築 / 中古（デフォルト: 新築）
- 銀行タイプ: ネット銀行 / 都市銀行（デフォルト: ネット銀行）

**出力:**

- 各費目の概算額と合計
- 「頭金 + 諸費用」で必要な自己資金の総額

**UI:** ResultPanel内に「諸費用の目安」セクションとして表示。折りたたみ可能。

### 賃貸との比較

現在の家賃で賃貸に住み続けた場合と購入した場合のコストを比較する。

**入力（追加）:**

- 現在の家賃（円/月、デフォルト: 空欄）
- 家賃の年間上昇率（%、デフォルト: 0.5%）

**比較項目（35年間想定）:**

- 賃貸の総支払額 = 家賃 × 12ヶ月 × 年数（上昇率考慮）
- 購入の総支出 = 頭金 + 諸費用 + 総返済額 + 維持費総額 - ローン控除総額
- 差額（購入した方がいくらお得/高い）

**UI:** ResultPanel内に「賃貸との比較」セクションとして表示。バーチャートで視覚的に比較。家賃が未入力の場合はセクション非表示。

### 用語ツールチップ

住宅ローンの専門用語にホバー（モバイルではタップ）で説明を表示する。

**対象用語:**

- 元利均等返済、元金均等返済
- フラット35
- 変動金利、固定金利
- 修繕積立金、管理費
- 返済比率
- 繰り上げ返済（期間短縮型/返済額軽減型）
- 住宅ローン控除
- 5年ルール、125%ルール

**実装:** 用語辞書データを `lib/glossary.ts` に定義。`<Tooltip>` コンポーネントでラップ。アイコン（ℹ️）付きのテキストとして表示。

### 印刷／PDF出力

シミュレーション結果を印刷またはPDFとして保存できる。

**実装方式:** ブラウザの `window.print()` を使用。`@media print` で印刷用レイアウトを定義。専用のPDFライブラリは使用しない（軽量化のため）。

**印刷レイアウト:**

- ヘッダー・フッター・ナビゲーション非表示
- 入力パラメータのサマリー表
- 結果サマリー（月々支払額、総返済額、利息、目安年収）
- 返済スケジュール表（年次）
- 住宅ローン控除・諸費用（入力されている場合）
- 賃貸比較（入力されている場合）
- フッター: URL（共有リンク）、出力日時

**UI:** SavePlanBar内に「印刷/PDF保存」ボタンを配置。

## バリデーション制約

| パラメータ       | 最小値  | 最大値       | 備考               |
| ---------------- | ------- | ------------ | ------------------ |
| 物件価格         | 100万円 | 50,000万円   | —                  |
| 頭金             | 0万円   | 物件価格以下 | 物件価格を超えない |
| 金利             | 0.01%   | 15.0%        | 0%は不可           |
| 返済期間         | 1年     | 50年         | —                  |
| ボーナス返済額   | 0万円   | 借入額の50%  | —                  |
| 修繕積立金       | 0円     | 100,000円    | —                  |
| 管理費           | 0円     | 100,000円    | —                  |
| 固定資産税       | 0万円   | 100万円      | —                  |
| 家賃             | 0円     | 500,000円    | 任意入力           |
| 家賃上昇率       | 0%      | 5%           | —                  |
| 繰り上げ返済時期 | 1年目   | 返済期間内   | —                  |
| 繰り上げ返済額   | 1万円   | 残高以下     | —                  |

バリデーションエラー時はフィールド直下にエラーメッセージを赤文字で表示。

## 入力パラメータ

| カテゴリ   | パラメータ         | 型                       | デフォルト値                         |
| ---------- | ------------------ | ------------------------ | ------------------------------------ |
| **物件**   | 物件価格           | 数値（万円）             | 3,000                                |
| **物件**   | 頭金               | 数値（万円）             | 300                                  |
| **ローン** | 金利タイプ         | 固定 / 変動 / フラット35 | 固定                                 |
| **ローン** | 金利（年率%）      | 数値                     | 固定:1.5 / 変動:0.5 / フラット35:1.8 |
| **ローン** | 返済期間           | 数値（年）               | 35                                   |
| **ローン** | 返済方式           | 元利均等 / 元金均等      | 元利均等                             |
| **ローン** | ボーナス返済額     | 数値（万円）             | 0                                    |
| **維持費** | 修繕積立金         | 数値（円/月）            | 12,000                               |
| **維持費** | 管理費             | 数値（円/月）            | 15,000                               |
| **維持費** | 固定資産税（年額） | 数値（万円）             | 10                                   |

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
- 手動: 5年ごとの上昇率を手動で入力可能

**5年ルール:** 変動金利の月々返済額は5年間固定。金利が変動しても、返済額の見直しは5年ごとにのみ行う。見直し間の金利変動は元金と利息の内訳比率で調整される。

**125%ルール:** 5年ごとの返済額見直し時、新しい返済額は前回の返済額の125%を上限とする。上限を超えた未払い利息は元金に加算される。

### 変動金利シナリオのデータ最適化

チャート表示用に返済スケジュールは年次サマリー（12ヶ月ごとの集計）で返す。フル月次データは不要。

```typescript
interface YearlyScheduleSummary {
  year: number;
  totalPrincipal: number; // その年に返済した元金合計
  totalInterest: number; // その年に支払った利息合計
  endBalance: number; // 年末残高
  averagePayment: number; // 月平均支払額
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
createServerFn({ method: "POST" })
  .validator(loanInputSchema)
  .handler(async ({ data }) => {
    return {
      monthlyLoanPayment, // 月々のローン返済額
      totalMonthlyPayment, // 維持費込みの月々総額
      totalRepayment, // 総返済額
      totalInterest, // 利息総額
      requiredIncome, // 返済比率別の目安年収
      schedule, // 返済スケジュール配列
      scenarios, // 変動金利シナリオ（変動の場合のみ）
      prepayment, // 繰り上げ返済の効果（設定されている場合のみ）
      taxDeduction, // 住宅ローン控除の概算
      closingCosts, // 諸費用の概算
      rentComparison, // 賃貸との比較（家賃が入力されている場合のみ）
    };
  });
```

## コンポーネント構成

```
SimulatorPage
├── Header
│   ├── Logo
│   └── NavLinks (保存済みプラン, 比較)
├── SimulatorLayout (2カラム grid)
│   ├── InputPanel
│   │   ├── PropertySection (物件価格, 頭金, 物件種別)
│   │   ├── LoanSection (金利タイプ, 金利, 返済期間, 返済方式, ボーナス, 銀行タイプ)
│   │   ├── MaintenanceSection (修繕積立金, 管理費, 固定資産税)
│   │   ├── PrepaymentSection (繰り上げ返済設定、アコーディオン)
│   │   ├── RentComparisonInput (家賃, 上昇率、アコーディオン)
│   │   └── CalculateButton
│   └── ResultPanel
│       ├── SummaryCard (月々総額, 総返済額, 利息, 目安年収, 控除総額)
│       ├── PaymentBreakdownChart (内訳バーチャート)
│       ├── RepaymentScheduleChart (返済スケジュール折れ線)
│       ├── IncomeGuideline (返済比率別の年収目安)
│       ├── PrepaymentResult (繰り上げ返済の効果比較)
│       ├── TaxDeductionSection (住宅ローン控除の年次一覧)
│       ├── ClosingCostsSection (諸費用の内訳、折りたたみ)
│       └── RentComparisonChart (賃貸vs購入の比較バーチャート)
├── SavePlanBar (保存, 比較に追加, 共有リンク, 印刷/PDF)
└── Tooltip (用語ツールチップ、各セクションで使用)
```

## 型定義

```typescript
type InterestType = "fixed" | "variable" | "flat35";
type RepaymentMethod = "equal_payment" | "equal_principal";

type PropertyType = "new" | "used";
type BankType = "online" | "major";
type EnergyPerformance = "certified" | "zeh" | "energy_standard" | "other"; // 認定住宅 / ZEH水準 / 省エネ基準適合 / その他
type PrepaymentType = "shorten_term" | "reduce_payment"; // 期間短縮型 / 返済額軽減型

interface PrepaymentInput {
  year: number; // 繰り上げ返済する年目
  amount: number; // 万円
  type: PrepaymentType;
}

interface LoanInput {
  propertyPrice: number; // 万円
  downPayment: number; // 万円
  propertyType: PropertyType;
  interestType: InterestType;
  interestRate: number; // 年率%
  loanTermYears: number;
  repaymentMethod: RepaymentMethod;
  bonusPayment: number; // 万円
  bankType: BankType;
  maintenanceFee: number; // 円/月
  repairReserve: number; // 円/月
  propertyTax: number; // 万円/年
  energyPerformance: EnergyPerformance;
  isChildRearingHousehold: boolean; // 子育て・若者夫婦世帯
  prepayments: PrepaymentInput[]; // 繰り上げ返済設定（最大5件）
  currentRent?: number; // 円/月（任意）
  rentIncreaseRate?: number; // %/年（任意）
}

interface PrepaymentEffect {
  totalSaved: number; // 利息軽減額
  newTotalRepayment: number;
  shortenedMonths?: number; // 短縮月数（期間短縮型の場合）
  newMonthlyPayment?: number; // 新月々返済額（返済額軽減型の場合）
}

interface TaxDeduction {
  borrowingLimit: number; // 適用される借入限度額
  yearlyDeductions: { year: number; amount: number; balance: number }[];
  totalDeduction: number;
  effectiveTotalRepayment: number; // 総返済額 - 控除総額
}

interface ClosingCostItem {
  name: string;
  amount: number;
  description: string;
}

interface ClosingCosts {
  items: ClosingCostItem[];
  total: number;
  totalWithDownPayment: number; // 頭金 + 諸費用 = 必要自己資金
}

interface RentComparison {
  rentTotal: number; // 賃貸の総支払額（上昇率考慮）
  purchaseTotal: number; // 購入の総支出
  difference: number; // 差額（正=購入が安い）
  breakEvenYear?: number; // 損益分岐年（ある場合）
}

interface LoanResult {
  monthlyLoanPayment: number;
  totalMonthlyPayment: number;
  totalRepayment: number;
  totalInterest: number;
  requiredIncome: Record<number, number>; // 返済比率 → 年収
  schedule: MonthlyScheduleItem[];
  scenarios?: VariableRateScenario[];
  prepayment?: PrepaymentEffect;
  taxDeduction: TaxDeduction;
  closingCosts: ClosingCosts;
  rentComparison?: RentComparison; // 家賃入力時のみ
}

interface MonthlyScheduleItem {
  month: number;
  principal: number;
  interest: number;
  balance: number;
  payment: number;
}

interface YearlyScheduleSummary {
  year: number;
  totalPrincipal: number;
  totalInterest: number;
  endBalance: number;
  averagePayment: number;
}

interface VariableRateScenario {
  name: string; // 楽観, 基準, 悲観
  rate: number; // 最終金利
  monthlyPayment: number; // 最終月の支払額
  totalRepayment: number;
  yearlySummary: YearlyScheduleSummary[];
}

interface SavedPlan {
  id: string;
  name: string;
  input: LoanInput;
  result: LoanResult;
  createdAt: string;
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
│   │   ├── PrepaymentSection.tsx
│   │   ├── RentComparisonInput.tsx
│   │   └── CalculateButton.tsx
│   ├── results/
│   │   ├── ResultPanel.tsx
│   │   ├── SummaryCard.tsx
│   │   ├── PaymentBreakdownChart.tsx
│   │   ├── RepaymentScheduleChart.tsx
│   │   ├── IncomeGuideline.tsx
│   │   ├── PrepaymentResult.tsx
│   │   ├── TaxDeductionSection.tsx
│   │   ├── ClosingCostsSection.tsx
│   │   └── RentComparisonChart.tsx
│   ├── plans/
│   │   ├── SavePlanBar.tsx
│   │   ├── PlanCard.tsx
│   │   └── CompareTable.tsx
│   ├── shared/
│   │   └── Tooltip.tsx         # 用語ツールチップ
│   └── ui/                     # shadcn/ui (既存)
├── server/
│   ├── calculate.ts
│   └── validation.ts
├── lib/
│   ├── loan-calculator.ts
│   ├── prepayment-calculator.ts
│   ├── tax-deduction.ts
│   ├── closing-costs.ts
│   ├── rent-comparison.ts
│   ├── glossary.ts             # 用語辞書データ
│   ├── url-params.ts           # URL共有用パラメータ変換
│   ├── types.ts
│   ├── plans-storage.ts
│   └── utils.ts
├── hooks/
│   └── use-plans.ts
└── styles/
    └── print.css               # 印刷用スタイル
```

## データ永続化

localStorageを使用。キー: `mortgage-simulator-plans`。

```typescript
// 保存
localStorage.setItem("mortgage-simulator-plans", JSON.stringify(plans));

// 読み出し
const plans: SavedPlan[] = JSON.parse(localStorage.getItem("mortgage-simulator-plans") ?? "[]");
```

## テスト方針

- `lib/loan-calculator.ts` — 単体テスト（元利均等・元金均等の計算精度を既知の値で検証）
- `lib/prepayment-calculator.ts` — 単体テスト（期間短縮型・返済額軽減型の効果検証）
- `lib/tax-deduction.ts` — 単体テスト（控除額計算、上限額の検証）
- `lib/closing-costs.ts` — 単体テスト（各費目の計算検証）
- `lib/rent-comparison.ts` — 単体テスト（家賃上昇率考慮の総額比較）
- `lib/url-params.ts` — 単体テスト（エンコード・デコードの往復一致）
- `server/validation.ts` — Zodバリデーションのテスト
- `components/` — 結合テスト（入力→結果表示フロー）

## エージェントチーム構成

| 役割                         | 担当範囲                                                         |
| ---------------------------- | ---------------------------------------------------------------- |
| プロダクトマネージャー       | 要件の最終確認、優先順位付け、スコープ管理                       |
| プロダクトオーナー           | ユーザーストーリー定義、受け入れ基準の策定                       |
| カスタマーサクセス           | 初心者目線でのUXレビュー、用語の分かりやすさチェック             |
| シニアエンジニア 1           | アーキテクチャ設計、サーバーファンクション、計算ロジック、テスト |
| シニアエンジニア 2           | 型定義、Zodスキーマ、localStorage層、全体結合                    |
| フロントエンドエキスパート 1 | InputPanel系コンポーネント                                       |
| フロントエンドエキスパート 2 | ResultPanel系コンポーネント                                      |
| バックエンドエキスパート 1   | 計算ロジックの実装とテスト                                       |
| バックエンドエキスパート 2   | サーバーファンクション定義、バリデーション                       |

## 開発フェーズ

### フェーズ 1: 基盤（並列）

- バックエンドエキスパート1 → `lib/loan-calculator.ts`, `lib/prepayment-calculator.ts` + テスト
- バックエンドエキスパート2 → `lib/types.ts`, `lib/tax-deduction.ts`, `lib/closing-costs.ts`, `lib/rent-comparison.ts` + テスト
- シニアエンジニア2 → `server/validation.ts`, `server/calculate.ts`, `lib/plans-storage.ts`, `hooks/use-plans.ts`

### フェーズ 2: UI（並列）

- フロントエンドエキスパート1 → InputPanel系（PropertySection, LoanSection, MaintenanceSection, PrepaymentSection, RentComparisonInput）
- フロントエンドエキスパート2 → ResultPanel系（SummaryCard, チャート, IncomeGuideline, PrepaymentResult, TaxDeductionSection, ClosingCostsSection, RentComparisonChart）

### フェーズ 3: 統合・付加機能（並列）

- シニアエンジニア1 → ルート統合（index.tsx, plans.tsx, compare.tsx）、URL共有（`lib/url-params.ts`）
- フロントエンドエキスパート1 → SavePlanBar, PlanCard, CompareTable, 印刷スタイル（`styles/print.css`）
- フロントエンドエキスパート2 → Tooltip, `lib/glossary.ts`, 用語ツールチップの各セクション統合

### フェーズ 4: レビュー（全メンバー並列）

- プロダクトマネージャー → スコープ・要件の充足確認
- プロダクトオーナー → 受け入れ基準の確認
- カスタマーサクセス → 初心者UXレビュー、用語ツールチップの内容確認
- シニアエンジニア1 → コードレビュー・テスト確認
- シニアエンジニア2 → 型整合性・全体結合確認

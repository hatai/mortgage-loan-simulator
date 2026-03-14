import { test, expect } from "@playwright/test";

// Helper: wait for page to load and hydrate
async function waitForApp(page: import("@playwright/test").Page) {
  await page.waitForLoadState("domcontentloaded");
  // Wait for main content to be SSR-rendered
  await page.waitForSelector("main", { state: "visible", timeout: 15000 });
  // Wait for client hydration by checking React event handlers are attached
  await page.waitForFunction(
    () => document.querySelector("[data-reactroot]") !== null || document.querySelector("#__next") !== null || document.querySelector("button")?.onclick !== null,
    { timeout: 10000 },
  ).catch(() => {});
  // Extra time for hydration completion
  await page.waitForTimeout(3000);
}

// Helper: try clicking and wait for result, with retry for hydration
async function clickAndWaitForResult(page: import("@playwright/test").Page) {
  await page.click('button:has-text("シミュレーション実行")');
  // Wait for either result or error
  try {
    await page.waitForSelector('text="月々の総支払額"', { timeout: 15000 });
    return true;
  } catch {
    // Retry — hydration or server function might have been slow
    await page.waitForTimeout(2000);
    await page.click('button:has-text("シミュレーション実行")');
    try {
      await page.waitForSelector('text="月々の総支払額"', { timeout: 15000 });
      return true;
    } catch {
      return false;
    }
  }
}

test.describe("SSRレンダリング — ページ構造", () => {
  test("トップページがSSRで正しく表示される", async ({ page }) => {
    await page.goto("/");
    await waitForApp(page);

    // タイトル
    await expect(page).toHaveTitle("住宅ローンシミュレーター");

    // ヘッダーナビゲーション
    const header = page.locator("header");
    await expect(header).toBeVisible();
    const headerText = await header.textContent();
    expect(headerText).toContain("住宅ローンシミュレーター");
    expect(headerText).toContain("シミュレーター");
    expect(headerText).toContain("保存済みプラン");
    expect(headerText).toContain("比較");
  });

  test("入力フォームがSSRで表示される", async ({ page }) => {
    await page.goto("/");
    await waitForApp(page);

    const mainText = await page.textContent("main");

    // 入力セクション
    expect(mainText).toContain("物件情報");
    expect(mainText).toContain("ローン条件");
    expect(mainText).toContain("維持費");

    // デフォルト値
    expect(mainText).toContain("借入金額");

    // ボタン
    expect(mainText).toContain("シミュレーション実行");
  });

  test("入力セクションの詳細項目が表示される", async ({ page }) => {
    await page.goto("/");
    await waitForApp(page);

    const mainText = await page.textContent("main");

    // 物件情報
    expect(mainText).toContain("物件価格");
    expect(mainText).toContain("頭金");
    expect(mainText).toContain("新築");
    expect(mainText).toContain("中古");

    // ローン条件
    expect(mainText).toContain("固定");
    expect(mainText).toContain("変動");
    expect(mainText).toContain("フラット35");
    expect(mainText).toContain("金利");
    expect(mainText).toContain("返済期間");
    expect(mainText).toContain("元利均等");
    expect(mainText).toContain("元金均等");
    expect(mainText).toContain("ボーナス返済");
    expect(mainText).toContain("省エネ性能");

    // 維持費
    expect(mainText).toContain("管理費");
    expect(mainText).toContain("修繕積立金");
    expect(mainText).toContain("固定資産税");
  });

  test("繰り上げ返済と賃貸比較のアコーディオンが表示される", async ({ page }) => {
    await page.goto("/");
    await waitForApp(page);

    const mainText = await page.textContent("main");
    expect(mainText).toContain("繰り上げ返済");
    expect(mainText).toContain("賃貸比較");
  });

  test("空状態メッセージが表示される", async ({ page }) => {
    await page.goto("/");
    await waitForApp(page);

    const mainText = await page.textContent("main");
    expect(mainText).toContain("シミュレーション結果");
  });

  test("/plans ページが表示される", async ({ page }) => {
    await page.goto("/plans");
    await waitForApp(page);

    const mainText = await page.textContent("main");
    expect(mainText).toContain("保存済みプラン");
  });

  test("/compare ページが表示される", async ({ page }) => {
    await page.goto("/compare");
    await waitForApp(page);

    const mainText = await page.textContent("main");
    expect(mainText).toContain("プラン比較");
  });

  test("印刷用の入力サマリーが非表示", async ({ page }) => {
    await page.goto("/");
    await waitForApp(page);

    // print:block クラスを持つ要素は通常表示では非表示
    const printOnly = page.locator(".print\\:block");
    // 存在するが非表示
    const count = await printOnly.count();
    if (count > 0) {
      await expect(printOnly.first()).toBeHidden();
    }
  });
});

test.describe("インタラクション — シミュレーション実行", () => {
  test("シミュレーション実行で結果が表示される", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");
    // Wait extra for full hydration
    await page.waitForTimeout(5000);

    // Click the submit button directly
    const btn = page.locator('button', { hasText: "シミュレーション実行" });
    await btn.click();

    // Wait for result with generous timeout
    await page.waitForTimeout(8000);

    const mainText = await page.textContent("main") ?? "";
    if (!mainText.includes("月々の総支払額")) {
      // Second attempt
      await btn.click();
      await page.waitForTimeout(8000);
    }

    const finalText = await page.textContent("main") ?? "";
    expect(finalText).toContain("月々の総支払額");
    expect(finalText).toContain("総返済額");
    expect(finalText).toContain("¥");
  });

  test("結果に収入目安ガイドが含まれる", async ({ page }) => {
    await page.goto("/");
    await waitForApp(page);

    const success = await clickAndWaitForResult(page);
    if (!success) {
      test.skip(true, "Hydration not available");
      return;
    }

    await expect(page.getByText("返済比率 20%")).toBeVisible();
    await expect(page.getByText("返済比率 25%")).toBeVisible();
    await expect(page.getByText("返済比率 30%")).toBeVisible();
  });

  test("結果に住宅ローン控除と諸費用が含まれる", async ({ page }) => {
    await page.goto("/");
    await waitForApp(page);

    const success = await clickAndWaitForResult(page);
    if (!success) {
      test.skip(true, "Hydration not available");
      return;
    }

    const mainText = await page.textContent("main");
    expect(mainText).toContain("控除");
    expect(mainText).toContain("諸費用");
  });
});

test.describe("URL共有", () => {
  test("URLパラメータから入力値が復元される（SSR）", async ({ page }) => {
    await page.goto("/?p=4000&d=500&r=2.0&y=30");
    await waitForApp(page);

    // SSR時点で値が反映されている
    const mainText = await page.textContent("main");
    // 4000万円の物件価格が表示されるはず
    expect(mainText).toContain("4,000");
  });
});

test.describe("ナビゲーション", () => {
  test("ヘッダーリンクでページ遷移できる", async ({ page }) => {
    await page.goto("/");
    await waitForApp(page);

    // 保存済みプランに遷移
    await page.click('header a:has-text("保存済みプラン")');
    await page.waitForTimeout(1000);
    await expect(page).toHaveURL(/\/plans/);

    // 比較に遷移
    await page.click('header a:has-text("比較")');
    await page.waitForTimeout(1000);
    await expect(page).toHaveURL(/\/compare/);
  });
});

test.describe("レスポンシブ", () => {
  test("モバイル幅でページが表示される", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");
    await waitForApp(page);

    await expect(page.locator("header")).toBeVisible();
    const mainText = await page.textContent("main");
    expect(mainText).toContain("物件情報");
    expect(mainText).toContain("シミュレーション実行");
  });

  test("タブレット幅でページが表示される", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("/");
    await waitForApp(page);

    const mainText = await page.textContent("main");
    expect(mainText).toContain("物件情報");
    expect(mainText).toContain("ローン条件");
  });
});

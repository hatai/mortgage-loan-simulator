import { describe, expect, test } from "vite-plus/test";
import { calculateClosingCosts } from "../closing-costs";

describe("calculateClosingCosts", () => {
  // Test data: 3000万円 property, 2700万円 principal, new property, online bank
  describe("new property with online bank", () => {
    const result = calculateClosingCosts(3000, 2700, "new", "online");

    test("returns items array", () => {
      expect(result.items).toBeInstanceOf(Array);
      expect(result.items.length).toBeGreaterThan(0);
    });

    test("仲介手数料 is 0 for new property", () => {
      const item = result.items.find((i) => i.name === "仲介手数料");
      expect(item).toBeDefined();
      expect(item!.amount).toBe(0);
    });

    test("登録免許税 calculation", () => {
      // assessedValue = 3000 * 10000 * 70% = 21,000,000
      // ownership = 21,000,000 * 0.4% = 84,000
      // mortgage = 2700 * 10000 * 0.1% = 27,000
      // total = 111,000
      const item = result.items.find((i) => i.name === "登録免許税");
      expect(item).toBeDefined();
      expect(item!.amount).toBe(111_000);
    });

    test("司法書士報酬 is fixed ¥100,000", () => {
      const item = result.items.find((i) => i.name === "司法書士報酬");
      expect(item).toBeDefined();
      expect(item!.amount).toBe(100_000);
    });

    test("印紙税 for 2700万円 principal (≤¥50M → ¥20,000)", () => {
      // principal = 2700 * 10000 = 27,000,000 which is ≤50M
      const item = result.items.find((i) => i.name === "印紙税");
      expect(item).toBeDefined();
      expect(item!.amount).toBe(20_000);
    });

    test("火災保険料 is fixed ¥200,000", () => {
      const item = result.items.find((i) => i.name === "火災保険料");
      expect(item).toBeDefined();
      expect(item!.amount).toBe(200_000);
    });

    test("ローン事務手数料 is principal × 2.2% for online bank", () => {
      // 2700 * 10000 * 2.2% = 594,000
      const item = result.items.find((i) => i.name === "ローン事務手数料");
      expect(item).toBeDefined();
      expect(item!.amount).toBe(594_000);
    });

    test("保証料 is principal × 2%", () => {
      // 2700 * 10000 * 2% = 540,000
      const item = result.items.find((i) => i.name === "保証料");
      expect(item).toBeDefined();
      expect(item!.amount).toBe(540_000);
    });

    test("total is sum of all items", () => {
      const sum = result.items.reduce((acc, item) => acc + item.amount, 0);
      expect(result.total).toBe(sum);
    });

    test("totalWithDownPayment includes downPayment", () => {
      // downPayment = (3000 - 2700) * 10000 = 3,000,000
      const downPayment = (3000 - 2700) * 10_000;
      expect(result.totalWithDownPayment).toBe(result.total + downPayment);
    });
  });

  describe("used property with major bank", () => {
    const result = calculateClosingCosts(3000, 2700, "used", "major");

    test("仲介手数料 is calculated for used property", () => {
      // 3000 * 10000 = 30,000,000
      // 30,000,000 * 3% + 60,000 = 960,000
      // 960,000 * 1.1 = 1,056,000
      const item = result.items.find((i) => i.name === "仲介手数料");
      expect(item).toBeDefined();
      expect(item!.amount).toBe(1_056_000);
    });

    test("ローン事務手数料 is fixed ¥44,000 for major bank", () => {
      const item = result.items.find((i) => i.name === "ローン事務手数料");
      expect(item).toBeDefined();
      expect(item!.amount).toBe(44_000);
    });

    test("total is sum of all items", () => {
      const sum = result.items.reduce((acc, item) => acc + item.amount, 0);
      expect(result.total).toBe(sum);
    });

    test("totalWithDownPayment is correct", () => {
      const downPayment = (3000 - 2700) * 10_000;
      expect(result.totalWithDownPayment).toBe(result.total + downPayment);
    });
  });

  describe("印紙税 tiers", () => {
    test("≤¥1M → ¥200 (principal = 100万)", () => {
      const result = calculateClosingCosts(200, 100, "new", "online");
      const item = result.items.find((i) => i.name === "印紙税");
      // 100 * 10000 = 1,000,000 which is ≤1M
      expect(item!.amount).toBe(200);
    });

    test("≤¥5M → ¥2,000 (principal = 200万)", () => {
      const result = calculateClosingCosts(300, 200, "new", "online");
      const item = result.items.find((i) => i.name === "印紙税");
      // 200 * 10000 = 2,000,000 which is ≤5M
      expect(item!.amount).toBe(2_000);
    });

    test("≤¥10M → ¥10,000 (principal = 700万)", () => {
      const result = calculateClosingCosts(1000, 700, "new", "online");
      const item = result.items.find((i) => i.name === "印紙税");
      // 700 * 10000 = 7,000,000 which is ≤10M
      expect(item!.amount).toBe(10_000);
    });

    test("≤¥100M → ¥60,000 (principal = 6000万)", () => {
      const result = calculateClosingCosts(7000, 6000, "new", "online");
      const item = result.items.find((i) => i.name === "印紙税");
      // 6000 * 10000 = 60,000,000 which is ≤100M
      expect(item!.amount).toBe(60_000);
    });

    test("else → ¥100,000 (principal = 20000万)", () => {
      const result = calculateClosingCosts(25000, 20000, "new", "online");
      const item = result.items.find((i) => i.name === "印紙税");
      // 20000 * 10000 = 200,000,000 which is >100M
      expect(item!.amount).toBe(100_000);
    });
  });

  describe("each item has name, amount and description", () => {
    test("all items have required fields", () => {
      const result = calculateClosingCosts(3000, 2700, "new", "online");
      for (const item of result.items) {
        expect(item).toHaveProperty("name");
        expect(item).toHaveProperty("amount");
        expect(item).toHaveProperty("description");
        expect(typeof item.name).toBe("string");
        expect(typeof item.amount).toBe("number");
        expect(typeof item.description).toBe("string");
      }
    });
  });
});

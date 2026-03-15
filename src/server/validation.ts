import { z } from "zod";

const prepaymentInputSchema = z.object({
  year: z.number().min(1),
  amount: z.number().min(1),
  type: z.enum(["shorten_term", "reduce_payment"]),
});

export const loanInputSchema = z
  .object({
    propertyPrice: z.number().min(100).max(50000),
    downPayment: z.number().min(0),
    propertyType: z.enum(["new", "used"]),
    interestType: z.enum(["fixed", "variable", "flat35"]),
    interestRate: z.number().gt(0).max(15),
    loanTermYears: z.number().min(1).max(50),
    repaymentMethod: z.enum(["equal_payment", "equal_principal"]),
    bonusPayment: z.number().min(0),
    bankType: z.enum(["online", "major"]),
    maintenanceFee: z.number().min(0).max(100000),
    repairReserve: z.number().min(0).max(100000),
    propertyTax: z.number().min(0).max(100),
    energyPerformance: z.enum(["certified", "zeh", "energy_standard", "other"]),
    isChildRearingHousehold: z.boolean(),
    prepayments: z.array(prepaymentInputSchema).max(5),
    currentRent: z.number().min(0).max(500000).optional(),
    rentIncreaseRate: z.number().min(0).max(5).optional(),
  })
  .refine((data) => data.downPayment < data.propertyPrice, {
    message: "頭金は物件価格未満にしてください（借入額が必要です）",
    path: ["downPayment"],
  })
  .refine(
    (data) => {
      const loanAmount = data.propertyPrice - data.downPayment;
      return data.bonusPayment <= loanAmount * 0.5;
    },
    {
      message: "ボーナス返済額は借入額の50%以下にしてください",
      path: ["bonusPayment"],
    },
  )
  .refine(
    (data) =>
      data.prepayments.every((p) => p.year <= data.loanTermYears),
    {
      message: "繰り上げ返済時期は返済期間内にしてください",
      path: ["prepayments"],
    },
  );

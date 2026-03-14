import type { LoanInput } from "#/lib/types";
import { CalculateButton } from "./CalculateButton";
import { LoanSection } from "./LoanSection";
import { MaintenanceSection } from "./MaintenanceSection";
import { PrepaymentSection } from "./PrepaymentSection";
import { PropertySection } from "./PropertySection";
import { RentComparisonInput } from "./RentComparisonInput";

interface InputPanelProps {
  input: LoanInput;
  onChange: (input: LoanInput) => void;
  onSubmit: () => void;
  isLoading: boolean;
}

export function InputPanel({ input, onChange, onSubmit, isLoading }: InputPanelProps) {
  const handleFieldChange = (field: string, value: unknown) => {
    onChange({ ...input, [field]: value });
  };

  return (
    <div className="space-y-4">
      <PropertySection
        propertyPrice={input.propertyPrice}
        downPayment={input.downPayment}
        propertyType={input.propertyType}
        onChange={handleFieldChange}
      />

      <LoanSection
        interestType={input.interestType}
        interestRate={input.interestRate}
        loanTermYears={input.loanTermYears}
        repaymentMethod={input.repaymentMethod}
        bonusPayment={input.bonusPayment}
        bankType={input.bankType}
        energyPerformance={input.energyPerformance}
        isChildRearingHousehold={input.isChildRearingHousehold}
        onChange={handleFieldChange}
      />

      <MaintenanceSection
        maintenanceFee={input.maintenanceFee}
        repairReserve={input.repairReserve}
        propertyTax={input.propertyTax}
        onChange={handleFieldChange}
      />

      <PrepaymentSection prepayments={input.prepayments} onChange={handleFieldChange} />

      <RentComparisonInput
        currentRent={input.currentRent}
        rentIncreaseRate={input.rentIncreaseRate}
        onChange={handleFieldChange}
      />

      <CalculateButton onClick={onSubmit} isLoading={isLoading} />
    </div>
  );
}

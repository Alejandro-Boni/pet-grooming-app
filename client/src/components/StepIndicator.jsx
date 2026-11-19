export default function StepIndicator({ steps, currentStep }) {
  return (
    <ol className="flex items-center gap-2 sm:gap-4">
      {steps.map((label, index) => {
        const stepNumber = index + 1;
        const isActive = stepNumber === currentStep;
        const isDone = stepNumber < currentStep;
        return (
          <li key={label} className="flex items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-2">
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-sm font-medium ${
                  isActive
                    ? 'border-[#E5C158] bg-[#D4AF37] text-[#0F0F0F]'
                    : isDone
                      ? 'border-[#D4AF37]/60 bg-[#D4AF37]/15 text-[#E5C158]'
                      : 'border-[#D4AF37]/30 bg-[#111111] text-[#F1E5C5]/60'
                }`}
              >
                {stepNumber}
              </span>
              <span
                className={`hidden text-sm sm:inline ${
                  isActive ? 'font-medium text-[#E5C158]' : 'text-[#F1E5C5]/65'
                }`}
              >
                {label}
              </span>
            </div>
            {stepNumber !== steps.length && (
              <span className="h-px w-4 bg-[#D4AF37]/40 sm:w-8" />
            )}
          </li>
        );
      })}
    </ol>
  );
}

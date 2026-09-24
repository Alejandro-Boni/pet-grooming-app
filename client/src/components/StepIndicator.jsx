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
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-medium
                  ${isActive ? 'bg-ochre text-cream' : isDone ? 'bg-pine text-cream' : 'bg-cream text-ink/40 border border-sage/60'}`}
              >
                {stepNumber}
              </span>
              <span className={`hidden text-sm sm:inline ${isActive ? 'text-ink font-medium' : 'text-ink/50'}`}>
                {label}
              </span>
            </div>
            {stepNumber !== steps.length && <span className="h-px w-4 bg-sage/60 sm:w-8" />}
          </li>
        );
      })}
    </ol>
  );
}

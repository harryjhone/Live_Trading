import React from "react";

interface VisualToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
  size?: "sm" | "md" | "lg";
  asDiv?: boolean;
  id?: string;
}

export const VisualToggle: React.FC<VisualToggleProps> = ({
  checked,
  onChange,
  disabled = false,
  className = "",
  size = "md",
  asDiv = false,
  id
}) => {
  // Dimensions based on size
  let trackWidthClass = "w-[54px]";
  let trackHeightClass = "h-[28px]";
  let thumbSizeClass = "w-[24px] h-[24px]";
  let translateClass = checked ? "translate-x-[26px]" : "translate-x-0";

  if (size === "sm") {
    trackWidthClass = "w-[42px]";
    trackHeightClass = "h-[22px]";
    thumbSizeClass = "w-[18px] h-[18px]";
    translateClass = checked ? "translate-x-[20px]" : "translate-x-0";
  } else if (size === "lg") {
    trackWidthClass = "w-[66px]";
    trackHeightClass = "h-[34px]";
    thumbSizeClass = "w-[30px] h-[30px]";
    translateClass = checked ? "translate-x-[32px]" : "translate-x-0";
  }

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!disabled) {
      onChange(!checked);
    }
  };

  const sharedClasses = `relative inline-flex shrink-0 cursor-pointer rounded-full p-[2px] transition-colors duration-250 ease-in-out border border-black/30 outline-none select-none hover:scale-[1.02] active:scale-[0.98] ${trackWidthClass} ${trackHeightClass} ${
    checked
      ? "bg-[#15b34d] shadow-[inset_0_2.5px_4px_rgba(0,0,0,0.35),_0_1px_1px_rgba(255,255,255,0.08)]"
      : "bg-[#d5292a] shadow-[inset_0_2.5px_4px_rgba(0,0,0,0.35),_0_1px_1px_rgba(255,255,255,0.08)]"
  } ${disabled ? "opacity-50 cursor-not-allowed" : ""} ${className}`;

  if (asDiv) {
    return (
      <div
        id={id}
        onClick={handleToggle}
        className={sharedClasses}
      >
        <span
          className={`pointer-events-none inline-block rounded-full bg-gradient-to-b from-white via-zinc-50 to-zinc-200 transition-transform duration-250 ease-out shadow-[0_3px_5px_rgba(0,0,0,0.4),_inset_0_-1px_1.5px_rgba(0,0,0,0.25)] ${thumbSizeClass} ${translateClass}`}
        />
      </div>
    );
  }

  return (
    <button
      id={id}
      type="button"
      onClick={handleToggle}
      disabled={disabled}
      className={`${sharedClasses} focus:outline-none focus:ring-1 focus:ring-white/20`}
    >
      <span
        className={`pointer-events-none inline-block rounded-full bg-gradient-to-b from-white via-zinc-50 to-zinc-200 transition-transform duration-250 ease-out shadow-[0_3px_5px_rgba(0,0,0,0.4),_inset_0_-1px_1.5px_rgba(0,0,0,0.25)] ${thumbSizeClass} ${translateClass}`}
      />
    </button>
  );
};

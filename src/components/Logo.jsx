import React from "react";

export function Logo({ className = "h-9", withText = true, dark = false }) {
  return (
    <div className={`flex items-center ${className}`}>
      <span
        className={`font-display text-2xl font-bold tracking-tight ${
          dark ? "text-white" : "text-[#1A2951]"
        }`}
      >
        Diafa<span className="text-[#F97316]">.</span>
      </span>
    </div>
  );
}

export default Logo;

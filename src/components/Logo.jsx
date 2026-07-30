import React from "react";

export function Logo({ className = "h-9", withText = true, dark = false }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <img
        src="/brand/diafa-icon.png"
        alt="Diafa"
        className="h-full w-auto object-contain"
      />
      {withText && (
        <span
          className={`font-display text-2xl font-bold tracking-tight ${
            dark ? "text-white" : "text-[#152A54]"
          }`}
        >
          Diafa<span className="text-[#CB9A56]">.</span>
        </span>
      )}
    </div>
  );
}

export default Logo;

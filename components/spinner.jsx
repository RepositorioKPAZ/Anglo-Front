import React from "react";

function Spinner({ color = "text-accent" }) {
  return (
    <div className={color}>
      <svg
        className="w-16 h-16 stroke-current fill-current animate-spin"
        viewBox="0 0 800 800"
      >
        <circle
          cx="400"
          cy="400"
          fill="transparent"
          r="154"
          strokeWidth="84"
          stroke="currentColor"
          strokeDasharray="646 1400"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

export default Spinner;

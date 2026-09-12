import React from "react";

export default function Card({ title, right, children, className = "" }) {
  return (
    <div className={`qcard ${className}`}>
      <div className="qcard-header">
        <span className="qcard-title">{title}</span>
        {right}
      </div>
      {children}
    </div>
  );
}

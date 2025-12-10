// src/components/TagChip.jsx
import React from "react";
import "./styles/TagChip.css";

const TagChip = ({ label, count, onClick }) => {
  return (
    <button className="tagchip" onClick={onClick}>
      <span className="tagchip-label">{label}</span>
      {count !== undefined && (
        <span className="tagchip-count">({count})</span>
      )}
    </button>
  );
};

export default TagChip;

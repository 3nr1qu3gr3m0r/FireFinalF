"use client";
import { useState, useEffect } from "react";

interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (color: string) => void;
}

export default function ColorPicker({ label, value, onChange }: ColorPickerProps) {
  return (
    <div>
      <label className="block text-sm font-bold text-gray-400 mb-2">{label}</label>
      <div className="flex items-center gap-3 bg-[#111827] border border-gray-700 rounded-xl p-2">
        <input 
            type="color" 
            value={value} 
            onChange={(e) => onChange(e.target.value)}
            className="w-10 h-10 rounded bg-transparent cursor-pointer border-none outline-none p-0"
        />
        <span className="text-gray-400 font-mono text-sm uppercase">{value}</span>
      </div>
    </div>
  );
}
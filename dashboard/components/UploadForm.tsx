"use client";

import { useRef } from "react";

interface Props {
  onFileSelected: (file: File) => void;
  disabled?: boolean;
}

const EXAMPLE_IMAGES = [
  { label: "Example 1", src: "/examples/Example1.jpg" },
  { label: "Example 2", src: "/examples/Example2.jpg" },
  { label: "Example 3", src: "/examples/Example3.jpg" },
];

export function UploadForm({ onFileSelected, disabled }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList | null) => {
    const file = files?.[0];
    if (file) onFileSelected(file);
  };

  const handleExample = async (src: string) => {
    const res = await fetch(src);
    const blob = await res.blob();
    const file = new File([blob], src.split("/").pop() ?? "example.jpg", {
      type: blob.type,
    });
    onFileSelected(file);
  };

  return (
    <div className="flex flex-col gap-4">
      <label
        htmlFor="tvus-upload"
        className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed border-slate-600 px-6 py-10 text-center text-sm text-slate-400 transition hover:border-teal-500 hover:text-slate-200"
      >
        <span className="font-medium text-slate-200">Upload a TVUS frame</span>
        <span>PNG or JPG &middot; demo only, not for clinical use</span>
        <input
          id="tvus-upload"
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          disabled={disabled}
          onChange={(e) => handleFiles(e.target.files)}
        />
      </label>

      <div className="flex flex-col gap-2">
        <span className="text-xs uppercase tracking-wide text-slate-500">
          Or try a sample image
        </span>
        <div className="flex gap-2">
          {EXAMPLE_IMAGES.map((ex) => (
            <button
              key={ex.src}
              type="button"
              disabled={disabled}
              onClick={() => handleExample(ex.src)}
              className="rounded-md border border-slate-700 px-3 py-1.5 text-sm text-slate-300 transition cursor-pointer hover:border-teal-500 hover:text-teal-300 disabled:opacity-50"
            >
              {ex.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

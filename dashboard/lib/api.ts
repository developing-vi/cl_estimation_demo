import type { PredictionResponse } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function predictCervicalLength(
  file: File
): Promise<PredictionResponse> {
  if (!API_URL) {
    throw new Error(
      "NEXT_PUBLIC_API_URL is not set. Add it to .env.local (dev) or your Vercel project's environment variables (prod)."
    );
  }

  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_URL}/predict`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `Prediction failed (${res.status}). ${text || "The model service may be starting up \u2014 try again in a moment."}`
    );
  }

  return res.json();
}

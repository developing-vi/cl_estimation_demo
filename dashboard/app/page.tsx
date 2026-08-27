"use client";

import { useState } from "react";
import { UploadForm } from "@/components/UploadForm";
import { CLOverlay } from "@/components/CLOverlay";
import { predictCervicalLength } from "@/lib/api";
import type { PredictionResponse } from "@/lib/types";

export default function Home() {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageName, setImageName] = useState<string | null>(null);
  const [prediction, setPrediction] = useState<PredictionResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelected = async (file: File) => {
    setLoading(true);
    setError(null);
    setPrediction(null);
    setImageUrl(URL.createObjectURL(file));
    setImageName(file.name);

    try {
      const result = await predictCervicalLength(file);
      setPrediction(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold">Automated Cervical Length (CL) Estimation</h1>
        <p className="text-sm text-slate-400">
          ResUNet segmentation + heatmap landmark localisation, trained on the Farr&agrave;s et al. transvaginal
          ultrasound dataset. This is a technical feasibility demo and is <em>not validated for clinical use.</em>
        </p>
      </div>

      <UploadForm onFileSelected={handleFileSelected} disabled={loading} />

      {loading && <p className="font-mono text-sm text-slate-400">Running inference&hellip;</p>}

      {error && (
        <p className="rounded-md border border-red-900 bg-red-950/40 px-4 py-3 text-sm text-red-300">{error}</p>
      )}

      {imageUrl && prediction && (
        <section className="flex flex-col gap-6 sm:flex-row sm:items-start">
          <CLOverlay imageUrl={imageUrl} prediction={prediction} />

          <div className="flex flex-col gap-2">
            <span>{imageName}</span>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3 font-mono text-sm">
              <dt className="text-slate-500">Predicted CL</dt>
              <dd className="text-teal-300">{prediction.cl_pixels.toFixed(2)} px</dd>

              <dt className="text-slate-500">Internal Os</dt>
              <dd>
                ({prediction.internal_os[0].toFixed(0)}, {prediction.internal_os[1].toFixed(0)})
              </dd>

              <dt className="text-slate-500">External Os</dt>
              <dd>
                ({prediction.external_os[0].toFixed(0)}, {prediction.external_os[1].toFixed(0)})
              </dd>

              <dt className="col-span-2 pt-2 text-xs text-slate-500">{prediction.note}</dt>
            </dl>
          </div>
        </section>
      )}
    </main>
  );
}

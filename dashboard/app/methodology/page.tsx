export default function Methodology() {
  return (
    <main className="flex flex-col gap-10">
      <header className="flex flex-col gap-2">
        <span className="font-mono text-xs uppercase tracking-widest text-teal-400">
          Methodology
        </span>
        <h1 className="text-3xl font-semibold">How this pipeline works</h1>
        <p className="text-sm text-slate-400">
          A summary of the architecture, training setup, and evaluation
          findings from the underlying capstone thesis.
        </p>
      </header>

      <Section title="The pipeline">
        <ol className="flex flex-col gap-4">
          <Step
            n={1}
            title="Segmentation"
            body="A ResUNet — an encoder-decoder with residual blocks at each level (4 encoder stages, base channel width 32) — takes a single-channel grayscale TVUS frame and predicts a binary mask of the cervical canal. Trained with a combined BCE + Dice loss to handle the class imbalance from the canal occupying a small fraction of the image."
          />
          <Step
            n={2}
            title="Landmark localisation"
            body="A second, plain U-Net-style network takes a 2-channel input — the original image stacked with the predicted mask — and outputs two probability heatmaps, one for the internal os (IO) and one for the external os (EO). Landmark coordinates are extracted via argmax over each heatmap."
          />
          <Step
            n={3}
            title="CL estimation"
            body="Cervical length is the Euclidean distance between the predicted IO and EO coordinates, in pixels. No calibration data was available to convert this to millimetres — see the Context page for why that matters."
          />
        </ol>
      </Section>

      <Section title="Why ResUNet segmentation and not U-Net">
        <p className="text-sm text-slate-300">
          Both a plain U-Net (ResNet-34 encoder) and the custom ResUNet were
          trained and evaluated. U-Net scored marginally higher on
          segmentation overlap metrics, but that didn&apos;t translate to better
          downstream measurements:
        </p>
        <MetricTable
          rows={[
            ["Dice (segmentation)", "0.262", "0.252"],
            ["IoU (segmentation)", "0.160", "0.154"],
            ["MRE (landmarks, px)", "46.17", "26.65"],
            ["CL-MAE (px)", "38.47", "28.74"],
            ["UCA-MAE (deg, exploratory)", "30.48", "14.57"],
          ]}
          headers={["Metric", "U-Net", "ResUNet"]}
        />
        <p className="text-sm text-slate-400">
          The key reason: U-Net produced an <em>empty</em> segmentation mask
          on 2 of 8 test images — complete failures that wrecked its average
          localisation and CL error despite otherwise-strong overlap scores.
          ResUNet never failed completely, even when its masks were
          imperfect. For a downstream measurement pipeline, robustness to
          failure mattered more than maximising pixel-wise overlap.
        </p>
      </Section>

      <Section title="Why no ROI cropping">
        <p className="text-sm text-slate-300">
          An earlier design cropped the localiser&apos;s input to a
          region-of-interest (ROI) around the predicted mask, on the assumption
          that a tighter field of view would make landmark prediction easier.
          It did the opposite: ROI cropping increased CL-MAE for the ResUNet
          pipeline from 28.74px to 51.32px. When the segmentation mask
          under-captured the canal (which happened often, given the modest
          Dice scores above), the crop excluded the true landmark location
          entirely — a case of a multi-stage pipeline propagating and
          amplifying its own errors. The full, uncropped frame gave the
          localiser more context to recover from imperfect segmentation, so
          this demo uses the no-ROI configuration throughout.
        </p>
      </Section>

      <Section title="Honest limitations">
        <ul className="flex list-disc flex-col gap-2 pl-5 text-sm text-slate-300">
          <li>
            Trained and evaluated on 70 annotated images (56 train / 6
            validation / 8 test) from a single publicly available dataset —
            small enough that individual test cases materially shift the
            aggregate metrics above.
          </li>
          <li>
            No external validation on a different ultrasound system,
            operator, or patient population.
          </li>
          <li>
            No inter-observer variability data, so there&apos;s no baseline for
            how these errors compare to disagreement between expert
            clinicians.
          </li>
          <li>
            This is a feasibility study, not a validated clinical tool — see
            the Context page for how this relates to real-world use.
          </li>
        </ul>
      </Section>
    </main>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-slate-100">{title}</h2>
      {children}
    </section>
  );
}

function Step({ n, title, body }: { n: number; title: string; body: string }) {
  return (
    <li className="flex gap-4">
      <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full border border-teal-700 font-mono text-xs text-teal-300">
        {n}
      </span>
      <div className="flex flex-col gap-1">
        <span className="font-medium text-slate-100">{title}</span>
        <p className="text-sm text-slate-400">{body}</p>
      </div>
    </li>
  );
}

function MetricTable({
  headers,
  rows,
}: {
  headers: string[];
  rows: string[][];
}) {
  return (
    <div className="overflow-x-auto rounded-md border border-slate-800">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-slate-800 text-slate-500">
            {headers.map((h) => (
              <th key={h} className="px-4 py-2 font-normal">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="font-mono">
          {rows.map((row) => (
            <tr key={row[0]} className="border-b border-slate-900 last:border-0">
              {row.map((cell, i) => (
                <td
                  key={i}
                  className={
                    i === 0
                      ? "px-4 py-2 font-sans text-slate-300"
                      : "px-4 py-2 text-slate-300"
                  }
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
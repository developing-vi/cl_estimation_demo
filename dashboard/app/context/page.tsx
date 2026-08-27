export default function Context() {
  return (
    <main className="flex flex-col gap-10">
      <header className="flex flex-col gap-2">
        <span className="font-mono text-xs uppercase tracking-widest text-teal-400">
          Context
        </span>
        <h1 className="text-3xl font-semibold">
          Why cervical length, and why automate it
        </h1>
      </header>

      <Section title="The clinical problem">
        <p className="text-sm text-slate-300">
          Preterm birth — before 37 completed weeks of gestation — affects
          roughly 1 in 10 births worldwide and remains a leading cause of
          mortality in children under five. Most preterm births happen
          spontaneously, which makes early risk detection valuable: it opens
          a window for preventative care.
        </p>
        <p className="text-sm text-slate-300">
          Cervical length, measured via transvaginal ultrasound, is one of
          the most established predictors of spontaneous preterm birth, and
          international guidelines (ISUOG) recommend routine CL screening
          where feasible. The catch is that measuring it well requires a
          trained sonographer to correctly identify the internal and
          external cervical os by eye — a process that&apos;s inherently
          operator-dependent and sensitive to image quality, probe angle,
          and experience.
        </p>
      </Section>

      <Section title="Why automate it">
        <p className="text-sm text-slate-300">
          Automating landmark detection doesn&apos;t remove the need for a
          skilled sonographer to acquire the image, but it could reduce
          measurement variability once the image is captured, and support
          more consistent screening — particularly useful in settings with
          less ultrasound expertise available. That&apos;s the motivation
          behind this project: not to replace clinical judgment, but to
          explore whether a segmentation-and-landmark pipeline can extract
          this measurement reliably enough to be a useful support tool.
        </p>
        <p className="text-sm text-slate-300">
          The same underlying landmarks also enable a second, related
          measurement — the uterocervical angle (UCA), an emerging
          complementary predictor of preterm birth risk. This pipeline
          produces exploratory UCA estimates alongside CL, using the same
          predicted landmarks.
        </p>
      </Section>

      <Section title="Where this demo fits">
        <p className="text-sm text-slate-300">
          This is a technical feasibility study, built to demonstrate an
          end-to-end deep learning pipeline — not a validated diagnostic
          tool. The reported errors (roughly 29px CL-MAE on an 8-image test
          set) are far from clinical-grade accuracy, and the dataset is too
          small and too narrow in source to generalise confidently. What
          this project does show is a full working pipeline from raw
          ultrasound frame to measurement, an honest evaluation of where and
          why it fails, and a live, interactive way to see both.
        </p>
      </Section>

      <Section title="Data & ethics">
        <p className="text-sm text-slate-300">
          All images used — in training and in this demo — come from the
          publicly available, de-identified{" "}
          <a
            href="https://data.mendeley.com/datasets/s27zfxgbpj/2"
            className="text-teal-300 underline underline-offset-2"
            target="_blank"
          >
            Farràs et al. TVUS dataset
          </a>{" "}
          on Mendeley Data. No new patient data was collected, and no
          identifiable information was ever accessible during this project.
          As a secondary analysis of existing, publicly accessible,
          anonymised data, this work did not require separate human research
          ethics approval.
        </p>
      </Section>

      <Section title="About this project">
        <p className="text-sm text-slate-300">
          This demo adapts the capstone thesis from my Master of Digital
          Health and Data Science at the University of Sydney, supervised by
          Professor Jinman Kim, with clinical guidance from Dr Ritu Mogra
          (Royal Prince Alfred Hospital). Built to bridge my prior background
          in full-stack software engineering with applied ML in healthcare.
        </p>
        <p className="text-sm text-slate-400">
          Model training code:{" "}
          <a
            href="https://github.com/developing-vi/cl_estimation"
            className="text-teal-300 underline underline-offset-2"
          >
            github.com/developing-vi/cl_estimation
          </a>
          . Connect on{" "}
          <a
            href="https://www.linkedin.com/in/vivianlvhw/"
            className="text-teal-300 underline underline-offset-2"
          >
            LinkedIn
          </a>
          .
        </p>
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
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold text-slate-100">{title}</h2>
      {children}
    </section>
  );
}
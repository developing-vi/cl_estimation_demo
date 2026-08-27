# Automated Cervical Length Estimation — Live Demo

An interactive demo of a hybrid deep learning pipeline for automated cervical
length (CL) estimation from transvaginal ultrasound (TVUS) images, adapted
from my Master of Digital Health and Data Science capstone thesis at the
University of Sydney.

**Live demo:** https://cl-estimation-demo.vercel.app

**Capstone / model training repo:** https://github.com/developing-vi/cl_estimation

> **This is a technical feasibility demo, not a clinical tool.** Outputs are
> in pixels (no calibration data was available to convert to millimetres),
> and the underlying models were trained and evaluated on a dataset of just
> 70 annotated images. See [Limitations](#limitations) below.

---

## What this does

Cervical length — the distance between the internal and external cervical
os on ultrasound — is a well-established predictor of spontaneous preterm
birth, but manual measurement is operator-dependent. This project explores
whether that measurement can be automated.

The pipeline runs in three stages:

1. **Segmentation** — a ResUNet (residual encoder-decoder) locates the
   cervical canal in a TVUS frame and produces a binary mask.
2. **Landmark localisation** — a heatmap-based U-Net takes the image plus
   the predicted mask (2-channel input) and predicts the internal os (IO)
   and external os (EO) as coordinate heatmaps.
3. **CL estimation** — cervical length is calculated as the Euclidean
   distance between the predicted IO and EO coordinates.

This is the **ResUNet, no-ROI** configuration, which was the best-performing
pipeline in the underlying thesis (CL-MAE 28.74px, vs. 38.47px for the
U-Net baseline) — segmentation-overlap metrics alone (Dice, IoU) turned out
not to predict downstream measurement accuracy as reliably as pipeline
*robustness* did. Full methodology, evaluation, and discussion are in the
[capstone report](https://github.com/developing-vi/cl_estimation).

## Repo structure

This is a monorepo with two independently deployed halves:

```
cl_estimation_demo/
├── cl_demo_api/     # FastAPI inference service (Python / PyTorch)
└── dashboard/       # Next.js frontend (TypeScript / Tailwind)
```

### `cl_demo_api/` — inference backend

- `app/main.py` — FastAPI app, single `POST /predict` endpoint
- `app/models/` — `ResUNet` segmenter and `HeatmapLocaliser` class
  definitions, matched exactly to the training code in the capstone repo
- `app/utils/` — pre/post-processing (mask cleanup, heatmap → coordinates)
- `checkpoints/` — trained model weights (`best-resunet_segmenter.pth`,
  `best_localiser-resunet_gt_noroi.pth`), tracked via Git LFS
- Deployed on Render as a Docker container (CPU inference)

**Preprocessing note:** the segmenter and localiser expect *differently
normalised* copies of the same image — the segmenter takes `[-1, 1]`
normalised input, the localiser takes `[0, 1]`. This matches the original
`CervixDataset` / `LocalisationDataset` classes used at training time; see
`app/main.py` for details.

### `dashboard/` — frontend

- `app/page.tsx` — upload flow, prediction state, results panel
- `components/UploadForm.tsx` — file upload + bundled example images
- `components/CLOverlay.tsx` — renders the predicted mask, IO/EO landmarks,
  and CL measurement line on a canvas over the input image
- `lib/api.ts` — typed client for the `/predict` endpoint
- Deployed on Vercel

## Running locally

**Backend:**
```bash
cd cl_demo_api
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
# http://localhost:8000/docs for interactive testing
```

**Frontend:**
```bash
cd dashboard
npm install
# .env.local: NEXT_PUBLIC_API_URL=http://localhost:8000
npm run dev
```

## API

`POST /predict` — multipart form upload, field name `file` (image/jpeg or
image/png). Returns:

```json
{
  "internal_os": [x, y],
  "external_os": [x, y],
  "cl_pixels": 0.0,
  "mask": [[0, 1, ...], ...],
  "note": "Pixel units only -- no calibration data available for mm conversion."
}
```

`GET /health` — liveness check.

## Data & ethics

Images are drawn from the publicly available, de-identified [Farràs et al.
TVUS dataset](https://data.mendeley.com) (Mendeley Data) — not private
patient data. No new patient data was collected for this project. See the
[capstone report's Ethics Statement](https://github.com/developing-vi/cl_estimation)
for full details.

## Limitations

- Trained and evaluated on 70 annotated images from a single-centre,
  single-dataset source — not validated for generalisation to other
  ultrasound systems, operators, or patient populations.
- CL is reported in pixels; no millimetre conversion is available.
- This demo pipeline was not evaluated by, and is not intended for use by,
  clinicians. It exists to demonstrate technical feasibility and
  engineering implementation, not diagnostic accuracy.

## Tech stack

**Backend:** FastAPI, PyTorch, OpenCV, Docker, Render
**Frontend:** Next.js, TypeScript, Tailwind CSS, Vercel
**Model training:** PyTorch, `segmentation_models_pytorch`, Google Colab
(see [capstone repo](https://github.com/developing-vi/cl_estimation))

## Author

Vivian Loo — [linkedin.com/in/vivianlvhw](https://www.linkedin.com/in/vivianlvhw/)

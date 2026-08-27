"""
FastAPI service for the cervical length estimation demo.

Wraps the ResUNet segmenter + HeatmapLocaliser (no-ROI) pipeline --
the combination reported as best-performing in the thesis (CL-MAE 28.74px).

Preprocessing confirmed against src/datasets/seg_dataset.py and loc_dataset.py:
  - Segmenter input: image normalised to [-1, 1] -- (image/255.0 - 0.5) / 0.5
    (this is CervixDataset's no-transform branch, used at eval time)
  - Localiser input: image scaled to [0, 1] only (plain /255.0), stacked with
    a binary (0/1) mask channel -- this is LocalisationDataset's __getitem__.
  These two models were trained on differently-scaled copies of the same
  image, so preprocessing must NOT be shared between them.
"""

import io
import cv2
import numpy as np
import torch
from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from app.models.resunet import load_resunet_model
from app.models.heatmap_localiser import load_localiser
from app.utils.inference import predict_segmentation, predict_landmarks, calculate_cl_pixels

IMG_SIZE = 256
DEVICE = "cpu"  # switch to "cuda" if deployed with GPU

SEG_MODEL_PATH = "checkpoints/best-resunet_segmenter.pth"
LOC_MODEL_PATH = "checkpoints/best_localiser-resunet_gt_noroi.pth"

app = FastAPI(title="Cervical Length Estimation API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # restrict to your frontend's domain in production
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load models once at startup, not per-request
segmenter = load_resunet_model(SEG_MODEL_PATH, DEVICE)
localiser = load_localiser(LOC_MODEL_PATH, DEVICE)


class PredictionResponse(BaseModel):
    internal_os: list[float]
    external_os: list[float]
    cl_pixels: float
    mask: list[list[int]]  # binary mask, IMG_SIZE x IMG_SIZE
    note: str = "Pixel units only -- no calibration data available for mm conversion."


def load_grayscale(image_bytes: bytes):
    """Decode + resize only. Returns raw uint8 grayscale array, no scaling."""
    arr = np.frombuffer(image_bytes, dtype=np.uint8)
    image = cv2.imdecode(arr, cv2.IMREAD_GRAYSCALE)
    image = cv2.resize(image, (IMG_SIZE, IMG_SIZE))
    return image


def to_segmenter_input(image_uint8: np.ndarray):
    """[-1, 1] normalisation -- matches CervixDataset's no-transform branch."""
    image = image_uint8.astype(np.float32) / 255.0
    image = (image - 0.5) / 0.5
    tensor = torch.tensor(image).unsqueeze(0).unsqueeze(0).to(DEVICE)  # [1,1,H,W]
    return tensor


def to_localiser_image(image_uint8: np.ndarray):
    """[0, 1] scaling only -- matches LocalisationDataset's image channel."""
    return image_uint8.astype(np.float32) / 255.0


@app.post("/predict", response_model=PredictionResponse)
async def predict(file: UploadFile = File(...)):
    image_bytes = await file.read()
    raw_image = load_grayscale(image_bytes)

    seg_tensor = to_segmenter_input(raw_image)
    _, clean_mask = predict_segmentation(segmenter, seg_tensor)

    loc_image = to_localiser_image(raw_image)
    pred_coords, _ = predict_landmarks(
        model=localiser,
        image=loc_image,
        mask=clean_mask,
        device=DEVICE,
    )

    internal_os, external_os = pred_coords[0], pred_coords[1]
    cl_pixels = float(calculate_cl_pixels(internal_os, external_os))

    return PredictionResponse(
        internal_os=[float(internal_os[0]), float(internal_os[1])],
        external_os=[float(external_os[0]), float(external_os[1])],
        cl_pixels=cl_pixels,
        mask=clean_mask.astype(int).tolist(),
    )


@app.get("/health")
def health():
    return {"status": "ok"}

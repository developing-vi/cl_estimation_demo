import torch
import numpy as np
from app.utils.postprocessing import postprocess_mask, heatmaps_to_coords

@torch.no_grad()
def predict_segmentation(model, image_tensor, threshold=0.5):
  logits = model(image_tensor)
  prob_mask = torch.sigmoid(logits).squeeze().cpu().numpy()

  clean_mask = postprocess_mask(
    prob_mask,
    threshold=threshold
  )

  return prob_mask, clean_mask

@torch.no_grad()
def predict_landmarks(model, image, mask, device):
    """
    image: H x W
    mask: H x W
    """
    image_tensor = torch.tensor(image).float()
    mask_tensor = torch.tensor(mask).float()

    x = torch.stack([image_tensor, mask_tensor], dim=0)
    x = x.unsqueeze(0).to(device)  # [1, 2, H, W]

    pred_heatmaps = model(x)
    pred_coords = heatmaps_to_coords(pred_heatmaps.cpu())[0]

    return pred_coords, pred_heatmaps.cpu()

def calculate_cl_pixels(io, eo):
  return np.linalg.norm(np.array(io) - np.array(eo))

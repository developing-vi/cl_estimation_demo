import cv2
import torch
import numpy as np

def postprocess_mask(prob_mask, threshold=0.5, min_area_ratio=0.001):
  """
  prob_mask: model output after sigmoid, shape H x W
  returns clean binary mask, values 0 or 1
  """

  binary = (prob_mask > threshold).astype(np.uint8)

  min_area = int(min_area_ratio * binary.size)

  num_labels, labels, stats, _ = cv2.connectedComponentsWithStats(binary, 8)

  cleaned = np.zeros_like(binary)

  for i in range(1, num_labels):
    area = stats[i, cv2.CC_STAT_AREA]
    if area >= min_area:
      cleaned[labels == i] = 1

  num_labels, labels, stats, _ = cv2.connectedComponentsWithStats(cleaned, 8)

  if num_labels <= 1:
    return cleaned

  largest_label = 1 + np.argmax(stats[1:, cv2.CC_STAT_AREA])
  largest = (labels == largest_label).astype(np.uint8)

  return largest

def heatmap_to_point(heatmap):
  if isinstance(heatmap, torch.Tensor):
      heatmap = heatmap.detach().cpu().numpy()

  y, x = np.unravel_index(np.argmax(heatmap), heatmap.shape)
  return x, y

def heatmaps_to_coords(heatmaps):
  """
  heatmaps: Tensor [B, K, H, W]
  returns: coords [B, K, 2] as (x, y)
  """
  B, K, H, W = heatmaps.shape
  coords = []

  for b in range(B):
    sample_coords = []

    for k in range(K):
      heatmap = heatmaps[b, k]
      idx = torch.argmax(heatmap)
      y = idx // W
      x = idx % W
      sample_coords.append([x.item(), y.item()])

    coords.append(sample_coords)

  return np.array(coords)

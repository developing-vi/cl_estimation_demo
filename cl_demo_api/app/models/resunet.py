import torch
import torch.nn as nn

class ResidualBlock(nn.Module):
  def __init__(self, in_channels, out_channels):
    super().__init__()

    self.conv = nn.Sequential(
      nn.Conv2d(in_channels, out_channels, kernel_size=3, padding=1),
      nn.BatchNorm2d(out_channels),
      nn.ReLU(inplace=True),

      nn.Conv2d(out_channels, out_channels, kernel_size=3, padding=1),
      nn.BatchNorm2d(out_channels),
    )

    self.skip = nn.Sequential()
    if in_channels != out_channels:
      self.skip = nn.Sequential(
        nn.Conv2d(in_channels, out_channels, kernel_size=1),
        nn.BatchNorm2d(out_channels),
      )

    self.relu = nn.ReLU(inplace=True)

  def forward(self, x):
    return self.relu(self.conv(x) + self.skip(x))


class ResUNet(nn.Module):
  def __init__(self, in_channels=1, out_channels=1, features=(32, 64, 128, 256)):
    super().__init__()

    self.encoder_blocks = nn.ModuleList()
    self.pool = nn.MaxPool2d(kernel_size=2, stride=2)

    current_channels = in_channels

    for feature in features:
      self.encoder_blocks.append(
        ResidualBlock(current_channels, feature)
      )
      current_channels = feature

    self.bottleneck = ResidualBlock(features[-1], features[-1] * 2)

    self.upconvs = nn.ModuleList()
    self.decoder_blocks = nn.ModuleList()

    for feature in reversed(features):
      self.upconvs.append(
        nn.ConvTranspose2d(feature * 2, feature, kernel_size=2, stride=2)
      )
      self.decoder_blocks.append(
        ResidualBlock(feature * 2, feature)
      )

    self.final_conv = nn.Conv2d(features[0], out_channels, kernel_size=1)

  def forward(self, x):
    skip_connections = []

    for block in self.encoder_blocks:
      x = block(x)
      skip_connections.append(x)
      x = self.pool(x)

    x = self.bottleneck(x)

    skip_connections = skip_connections[::-1]

    for idx in range(len(self.upconvs)):
      x = self.upconvs[idx](x)
      skip = skip_connections[idx]

      if x.shape != skip.shape:
        x = nn.functional.interpolate(
          x,
          size=skip.shape[2:],
          mode="bilinear",
          align_corners=False
        )

      x = torch.cat((skip, x), dim=1)
      x = self.decoder_blocks[idx](x)

    return self.final_conv(x)


def load_resunet_model(model_path, device):
  model = ResUNet(
    in_channels=1,
    out_channels=1
  )

  state_dict = torch.load(model_path, map_location=device)
  model.load_state_dict(state_dict)
  model.to(device)
  model.eval()

  return model

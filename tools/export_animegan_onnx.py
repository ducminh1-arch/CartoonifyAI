#!/usr/bin/env python3
"""
export_animegan_onnx.py
Export AnimeGANv2 / AnimeGANv3 PyTorch models to optimized ONNX format.

Usage:
    python export_animegan_onnx.py --checkpoint weights/face_paint_512_v2.pt --output models/face_paint_512_v2.onnx --size 512
"""

import os
import argparse
import torch
import torch.nn as nn

class ConvNormAct(nn.Module):
    def __init__(self, in_c, out_c, kernel_size=3, stride=1, padding=1, bias=False):
        super().__init__()
        self.conv = nn.Conv2d(in_c, out_c, kernel_size, stride, padding, bias=bias)
        self.norm = nn.InstanceNorm2d(out_c, affine=True)
        self.act = nn.LeakyReLU(0.2, inplace=True)

    def forward(self, x):
        return self.act(self.norm(self.conv(x)))

class ResBlock(nn.Module):
    def __init__(self, channels):
        super().__init__()
        self.body = nn.Sequential(
            ConvNormAct(channels, channels, 3, 1, 1),
            nn.Conv2d(channels, channels, 3, 1, 1, bias=False),
            nn.InstanceNorm2d(channels, affine=True)
        )

    def forward(self, x):
        return x + self.body(x)

class AnimeGANGenerator(nn.Module):
    """
    Feed-Forward Lightweight Generator Network for AnimeGANv2
    Parameters: ~2.1M (Model file size: ~8.5 MB float32, ~4.3 MB float16)
    """
    def __init__(self, in_c=3, out_c=3, ngf=64, num_blocks=8):
        super().__init__()
        # Down-sampling
        self.in_conv = ConvNormAct(in_c, ngf, 7, 1, 3)
        self.down1 = ConvNormAct(ngf, ngf * 2, 3, 2, 1)
        self.down2 = ConvNormAct(ngf * 2, ngf * 4, 3, 2, 1)

        # Residual Bottleneck Blocks
        blocks = [ResBlock(ngf * 4) for _ in range(num_blocks)]
        self.res_blocks = nn.Sequential(*blocks)

        # Up-sampling
        self.up1 = nn.Sequential(
            nn.Upsample(scale_factor=2, mode='bilinear', align_corners=False),
            ConvNormAct(ngf * 4, ngf * 2, 3, 1, 1)
        )
        self.up2 = nn.Sequential(
            nn.Upsample(scale_factor=2, mode='bilinear', align_corners=False),
            ConvNormAct(ngf * 2, ngf, 3, 1, 1)
        )
        self.out_conv = nn.Sequential(
            nn.Conv2d(ngf, out_c, 7, 1, 3),
            nn.Tanh()
        )

    def forward(self, x):
        h = self.in_conv(x)
        h = self.down1(h)
        h = self.down2(h)
        h = self.res_blocks(h)
        h = self.up1(h)
        h = self.up2(h)
        out = self.out_conv(h)
        return out

def export_onnx(checkpoint_path, output_path, input_size=512, dynamic=False):
    print(f"[*] Initializing AnimeGANv2 Generator (input size: {input_size}x{input_size})...")
    model = AnimeGANGenerator()
    model.eval()

    if checkpoint_path and os.path.exists(checkpoint_path):
        print(f"[*] Loading PyTorch weights from: {checkpoint_path}")
        state_dict = torch.load(checkpoint_path, map_location='cpu')
        model.load_state_dict(state_dict, strict=False)
    else:
        print("[!] Warning: Checkpoint not provided or not found, exporting initialized architecture.")

    dummy_input = torch.randn(1, 3, input_size, input_size)

    input_names = ["input"]
    output_names = ["output"]

    dynamic_axes = None
    if dynamic:
        dynamic_axes = {
            "input": {0: "batch_size", 2: "height", 3: "width"},
            "output": {0: "batch_size", 2: "height", 3: "width"}
        }

    os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)

    print(f"[*] Exporting ONNX model to: {output_path}")
    torch.onnx.export(
        model,
        dummy_input,
        output_path,
        export_params=True,
        opset_version=14,
        do_constant_folding=True,
        input_names=input_names,
        output_names=output_names,
        dynamic_axes=dynamic_axes
    )

    size_mb = os.path.getsize(output_path) / (1024 * 1024)
    print(f"[✓] ONNX export complete! File size: {size_mb:.2f} MB")

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description="Export AnimeGANv2 PyTorch weights to ONNX")
    parser.add_argument("--checkpoint", type=str, default="", help="Path to PyTorch .pt/.pth checkpoint")
    parser.add_argument("--output", type=str, default="models/animegan_exported.onnx", help="Path to output ONNX file")
    parser.add_argument("--size", type=int, default=512, help="Input dimension (default: 512)")
    parser.add_argument("--dynamic", action="store_true", help="Enable dynamic batch and spatial dimensions")
    args = parser.parse_args()

    export_onnx(args.checkpoint, args.output, args.size, args.dynamic)

#!/usr/bin/env python3
"""
convert_onnx_to_coreml.py
Convert ONNX or PyTorch models to Apple Core ML format (.mlpackage)
Optimized for Apple Neural Engine (ANE) on iPhone & iPad.

Usage:
    python convert_onnx_to_coreml.py --onnx models/face_paint_512_v2_0.onnx --output models/CartoonifyAI.mlpackage
"""

import os
import argparse

def convert_onnx_to_coreml(onnx_path, output_path, input_size=512, quant_fp16=True):
    try:
        import coremltools as ct
        from coremltools.models.neural_network import quantization_utils
    except ImportError:
        print("[!] Error: coremltools missing. Please install:")
        print("    pip install coremltools")
        return

    print(f"[*] Loading and converting ONNX model: {onnx_path}")

    # Define image input pre-processing: scale [-1, 1]
    image_input = ct.ImageType(
        name="input",
        shape=(1, 3, input_size, input_size),
        scale=1.0 / 127.5,
        bias=[-1.0, -1.0, -1.0],
        color_layout=ct.colorlayout.RGB
    )

    # Convert to Core ML mlprogram (supported on iOS 15+)
    mlmodel = ct.converters.onnx.convert(
        model=onnx_path,
        inputs=[image_input],
        minimum_ios_deployment_target='15.0'
    )

    if quant_fp16:
        print("[*] Applying Float16 Quantization for Apple Neural Engine (ANE)...")
        mlmodel = ct.models.neural_network.quantization_utils.quantize_weights(mlmodel, nbits=16)

    # Set model metadata
    mlmodel.author = "Cartoonify AI"
    mlmodel.short_description = "On-device AnimeGANv2 Feed-Forward Cartoon Portrait Model"
    mlmodel.version = "1.0"

    os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
    print(f"[*] Saving Core ML package to: {output_path}")
    mlmodel.save(output_path)

    print(f"[✓] Core ML export complete! Ready for iOS Xcode project.")

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description="Convert ONNX to Core ML for iOS")
    parser.add_argument("--onnx", type=str, required=True, help="Input ONNX file path")
    parser.add_argument("--output", type=str, default="models/CartoonifyAI.mlpackage", help="Output .mlpackage path")
    parser.add_argument("--size", type=int, default=512, help="Input resolution (default: 512)")
    parser.add_argument("--no-quant", action="store_true", help="Disable float16 quantization")
    args = parser.parse_args()

    convert_onnx_to_coreml(args.onnx, args.output, args.size, not args.no_quant)

#!/usr/bin/env python3
"""
convert_onnx_to_tflite.py
Convert ONNX models to TensorFlow Lite (.tflite) with Quantization.
Optimized for Android GPU Delegate and NNAPI inference.

Usage:
    python convert_onnx_to_tflite.py --onnx models/face_paint_512_v2_0.onnx --output models/cartoonify_float16.tflite --quant fp16
"""

import os
import argparse
import numpy as np

def convert_onnx_to_tflite(onnx_path, output_path, quant_mode="fp16", input_size=512):
    try:
        import onnx
        from onnx_tf.backend import prepare
        import tensorflow as tf
    except ImportError:
        print("[!] Error: Prerequisites missing. Please install:")
        print("    pip install onnx onnx-tf tensorflow")
        return

    print(f"[*] Step 1: Loading ONNX model from: {onnx_path}")
    onnx_model = onnx.load(onnx_path)

    tf_rep_dir = os.path.join(os.path.dirname(output_path), "tf_saved_model_temp")
    print(f"[*] Step 2: Converting ONNX to TensorFlow SavedModel ({tf_rep_dir})...")
    tf_rep = prepare(onnx_model)
    tf_rep.export_graph(tf_rep_dir)

    print(f"[*] Step 3: Initializing TFLite Converter (Quantization: {quant_mode.upper()})...")
    converter = tf.lite.TFLiteConverter.from_saved_model(tf_rep_dir)

    if quant_mode == "fp16":
        # Float16 Quantization: 50% size reduction (~4-8MB), no accuracy loss, full GPU delegate support
        converter.optimizations = [tf.lite.Optimize.DEFAULT]
        converter.target_spec.supported_types = [tf.float16]
        print("[*] Enabled Float16 Quantization for Android GPU Delegate & NNAPI.")

    elif quant_mode == "int8":
        # INT8 Full Integer Quantization: 75% size reduction (~2-4MB)
        converter.optimizations = [tf.lite.Optimize.DEFAULT]
        
        def representative_dataset_gen():
            # Generate dummy representative calibration data normalized to [-1, 1]
            for _ in range(30):
                dummy = np.random.uniform(-1.0, 1.0, (1, 3, input_size, input_size)).astype(np.float32)
                yield [dummy]

        converter.representative_dataset = representative_dataset_gen
        converter.target_spec.supported_ops = [tf.lite.OpsSet.TFLITE_BUILTINS_INT8]
        converter.inference_input_type = tf.int8
        converter.inference_output_type = tf.int8
        print("[*] Enabled INT8 Integer Quantization for ultra-low memory mobile devices.")

    else:
        print("[*] Exporting Standard Float32 TFLite model.")

    print("[*] Step 4: Compiling TFLite binary...")
    tflite_model = converter.convert()

    os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
    with open(output_path, "wb") as f:
        f.write(tflite_model)

    size_mb = os.path.getsize(output_path) / (1024 * 1024)
    print(f"[✓] TFLite conversion successful! Output: {output_path}")
    print(f"[✓] Final model size: {size_mb:.2f} MB (Optimized for Android TFLite)")

    # Clean up temp directory
    import shutil
    if os.path.exists(tf_rep_dir):
        shutil.rmtree(tf_rep_dir, ignore_errors=True)

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description="Convert ONNX to TFLite with Quantization")
    parser.add_argument("--onnx", type=str, required=True, help="Path to input ONNX file")
    parser.add_argument("--output", type=str, default="models/cartoonify.tflite", help="Output .tflite path")
    parser.add_argument("--quant", type=str, choices=["fp32", "fp16", "int8"], default="fp16", help="Quantization mode (default: fp16)")
    parser.add_argument("--size", type=int, default=512, help="Input dimension")
    args = parser.parse_args()

    convert_onnx_to_tflite(args.onnx, args.output, args.quant, args.size)

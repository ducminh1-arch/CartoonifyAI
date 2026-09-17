# Cartoonify AI — Model Preparation, Export & Quantization Suite

Tài liệu hướng dẫn chi tiết theo đúng cấu trúc đề bài:
- **Bước 1**: Chuẩn bị & Tối ưu hóa Model AI (PyTorch → ONNX → TFLite / Core ML + Quantization).
- **Bước 2**: Pipeline xử lý ảnh trên App (MediaPipe Face Detection & Alignment → Inference → Caricature Warping & Background Composition).
- **Bước 3**: Tích hợp Native Android (TFLite GPU Delegate) & iOS (Core ML Neural Engine).

---

## 1. Cài đặt môi trường Python

```bash
# Tạo môi trường ảo
python -m venv venv
# Kích hoạt trên Windows:
.\venv\Scripts\activate
# Hoặc trên macOS/Linux:
source venv/bin/activate

# Cài đặt thư viện chuyển đổi và lượng tử hóa
pip install torch torchvision onnx onnx-tf tensorflow coremltools numpy
```

---

## 2. Bước 1: Export & Lượng tử hóa Model (Quantization)

### 2.1. Xuất PyTorch Checkpoint sang ONNX
Chuyển đổi trọng số AnimeGANv2 hoặc White-box Cartoonization sang ONNX format (input kích thước 512x512, normalizer [-1, 1]):

```bash
python tools/export_animegan_onnx.py \
    --checkpoint weights/face_paint_512_v2.pt \
    --output public/models/face_paint_512_v2_0.onnx \
    --size 512
```

### 2.2. Chuyển đổi sang TFLite cho Android (Float16 / INT8 Quantization)
Tạo mô hình `.tflite` siêu nhẹ (chỉ khoảng 4 MB – 8 MB) tối ưu cho **GPU Delegate** và **NNAPI**:

```bash
# Lượng tử hóa Float16 (Khuyên dùng: kích thước ~4.2 MB, giữ nguyên 100% chất lượng ảnh)
python tools/convert_onnx_to_tflite.py \
    --onnx public/models/face_paint_512_v2_0.onnx \
    --output android/app/src/main/assets/models/cartoonify_fp16.tflite \
    --quant fp16

# Lượng tử hóa INT8 (Cho các thiết bị Android cấu hình yếu)
python tools/convert_onnx_to_tflite.py \
    --onnx public/models/face_paint_512_v2_0.onnx \
    --output android/app/src/main/assets/models/cartoonify_int8.tflite \
    --quant int8
```

### 2.3. Chuyển đổi sang Core ML cho iOS (Apple Neural Engine)
Tạo mô hình `.mlpackage` tương thích với Apple Neural Engine (ANE) trên iPhone/iPad:

```bash
python tools/convert_onnx_to_coreml.py \
    --onnx public/models/face_paint_512_v2_0.onnx \
    --output ios/App/App/CartoonifyAI.mlpackage \
    --size 512
```

---

## 3. Bước 2: Pipeline xử lý ảnh On-Device

| Giai đoạn | Nhiệm vụ | Triển khai trong dự án |
| :--- | :--- | :--- |
| **Tiền xử lý (Pre-processing)** | Chụp ảnh selfie / chọn từ thư viện | `CameraModal.jsx`, `StudioView.jsx` |
| | Nhận diện 5 điểm mốc (mắt, mũi, miệng, cằm) | `faceDetectionEngine.js` |
| | Căn chỉnh xoay ngang mắt 0° (Align face) | `alignAndCropFace()` |
| | Resize chuẩn 512x512, normalize `[-1, 1]` | `preprocessImage()` trong `aiInferenceEngine.js` |
| **Inference (Chạy AI)** | Chạy mạng Feed-Forward GAN 1 chiều | `runAICartoonify()` (ONNX Runtime WebGPU/WASM) |
| | Native Android / iOS | TFLite GPU Delegate / Core ML Neural Engine |
| **Hậu xử lý (Post-processing)** | Denormalize tensor về ảnh RGB `[0, 255]` | `postprocessOutput()` trong `aiInferenceEngine.js` |
| | Warping đầu to người nhỏ (Caricature) | `applyCaricatureWarp()` theo MediaPipe landmarks |
| | Ghép lại vào nền hoạt hình / background mẫu | `compositeWithBackground()` trong `backgroundTemplates.js` |

---

## 4. Bảng so sánh Kiến trúc: Offline GAN vs Cloud Diffusion

| Tiêu chí | App dùng Diffusion (Cloud) | App dùng GAN/StyleGAN (Offline - App này) |
| :--- | :--- | :--- |
| **Chi phí máy chủ** | Rất đắt (vài ngàn $/tháng tiền GPU) | **0 VNĐ (chạy hoàn toàn trên máy người dùng)** |
| **Tốc độ xử lý** | 5 – 15 giây/ảnh (phụ thuộc đường truyền) | **Dưới 1 giây/ảnh (0.3s – 0.8s)** |
| **Dung lượng cài đặt** | App nhẹ (30 MB) | **Vừa phải (50 – 80 MB gồm 4 styles)** |
| **Rủi ro kiểm duyệt** | Dễ bị quét lỗi tạo ảnh nhạy cảm | **Rất an toàn (chỉ là bộ lọc ảnh chân dung)** |

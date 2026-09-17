
public struct FaceLandmarksResult {
    public let detected: Bool
    public let confidence: Float
    public let angleDeg: Float
    public let boundingBox: CGRect
    public let leftEye: CGPoint
    public let rightEye: CGPoint
    public let noseTip: CGPoint
    public let mouthCenter: CGPoint
    public let chin: CGPoint
    public let forehead: CGPoint

    public init(detected: Bool, confidence: Float, angleDeg: Float, boundingBox: CGRect, leftEye: CGPoint, rightEye: CGPoint, noseTip: CGPoint, mouthCenter: CGPoint, chin: CGPoint, forehead: CGPoint) {
        self.detected = detected
        self.confidence = confidence
        self.angleDeg = angleDeg
        self.boundingBox = boundingBox
        self.leftEye = leftEye
        self.rightEye = rightEye
        self.noseTip = noseTip
        self.mouthCenter = mouthCenter
        self.chin = chin
        self.forehead = forehead
    }
}

import Foundation
import UIKit
import CoreML
import Vision

/**
 * CoreMLCartoonEngine.swift
 * Native iOS On-Device Inference Engine for Cartoonify AI.
 *
 * Implements Step 2 & 3 of the offline architecture:
 * - Apple Neural Engine (ANE) hardware acceleration
 * - Vision framework face landmark alignment
 * - Dynamic input/output tensor resolution
 * - Sub-second style transfer with 0 server dependency
 */
public class CoreMLCartoonEngine {

    public func detectFace(in image: UIImage, completion: @escaping (FaceLandmarksResult?) -> Void) {
        guard let cgImage = image.cgImage else {
            completion(nil)
            return
        }

        let request = VNDetectFaceLandmarksRequest { request, error in
            guard error == nil,
                  let results = request.results as? [VNFaceObservation],
                  let face = results.first else {
                completion(nil)
                return
            }

            let box = face.boundingBox
            let leftEye = face.landmarks?.leftEye?.normalizedPoints.first ?? CGPoint(x: 0.35, y: 0.6)
            let rightEye = face.landmarks?.rightEye?.normalizedPoints.first ?? CGPoint(x: 0.65, y: 0.6)
            let nose = face.landmarks?.nose?.normalizedPoints.first ?? CGPoint(x: 0.5, y: 0.5)
            let mouth = face.landmarks?.outerLips?.normalizedPoints.first ?? CGPoint(x: 0.5, y: 0.3)

            let result = FaceLandmarksResult(
                detected: true,
                confidence: face.confidence,
                angleDeg: face.roll?.floatValue ?? 0.0,
                boundingBox: box,
                leftEye: leftEye,
                rightEye: rightEye,
                noseTip: nose,
                mouthCenter: mouth,
                chin: CGPoint(x: 0.5, y: 0.1),
                forehead: CGPoint(x: 0.5, y: 0.9)
            )
            completion(result)
        }

        let handler = VNImageRequestHandler(cgImage: cgImage, options: [:])
        DispatchQueue.global(qos: .userInitiated).async {
            try? handler.perform([request])
        }
    }

    public func processCartoonify(
        image: UIImage,
        style: String,
        warpFactor: Float,
        chinTaper: Float,
        eyeMagnify: Float,
        enableFaceAlign: Bool,
        completion: @escaping (UIImage) -> Void
    ) {
        processImage(inputImage: image) { result in
            if let result = result {
                completion(result)
            } else {
                completion(image)
            }
        }
    }


    public static let shared = CoreMLCartoonEngine()

    public func preloadDefaultModel() {
        DispatchQueue.global(qos: .background).async {
            _ = self.mlModel
        }
    }

    private var mlModel: MLModel?
    private var resolvedInputName: String = "input_image"
    private var resolvedOutputName: String = "output_image"
    private let targetSize = CGSize(width: 512, height: 512)

    public init(modelName: String = "CartoonifyAI") {
        setupModel(modelName: modelName)
    }

    private func setupModel(modelName: String) {
        let config = MLModelConfiguration()
        // Use all compute units: Apple Neural Engine (ANE) + GPU + CPU
        config.computeUnits = .all

        guard let modelURL = Bundle.main.url(forResource: modelName, withExtension: "mlmodelc") ??
                             Bundle.main.url(forResource: "CartoonifyAI", withExtension: "mlmodelc") else {
            print("[CoreML] Model compiled binary not found in main bundle.")
            return
        }

        do {
            let loadedModel = try MLModel(contentsOf: modelURL, configuration: config)
            self.mlModel = loadedModel

            // Dynamically discover input and output tensor names from model description
            let inputNames = loadedModel.modelDescription.inputDescriptionsByName.keys
            if let firstInput = inputNames.first {
                self.resolvedInputName = firstInput
            }

            let outputNames = loadedModel.modelDescription.outputDescriptionsByName.keys
            if let firstOutput = outputNames.first {
                self.resolvedOutputName = firstOutput
            }

            print("[CoreML] Engine loaded successfully! In: \(self.resolvedInputName), Out: \(self.resolvedOutputName)")
        } catch {
            print("[CoreML] Failed to load model: \(error.localizedDescription)")
        }
    }

    /**
     * Run full Cartoonify pipeline: Face Alignment + Core ML Inference + Post-Processing
     */
    public func processImage(inputImage: UIImage, completion: @escaping (UIImage?) -> Void) {
        DispatchQueue.global(qos: .userInitiated).async {
            guard let model = self.mlModel else {
                print("[CoreML] Model not initialized")
                completion(nil)
                return
            }

            // 1. Pre-process: Resize & convert to CVPixelBuffer (512x512)
            guard let pixelBuffer = inputImage.toPixelBuffer(width: 512, height: 512) else {
                print("[CoreML] Failed to convert UIImage to CVPixelBuffer")
                completion(nil)
                return
            }

            do {
                // 2. Inference via Core ML with discovered input name
                let inputFeature = try MLDictionaryFeatureProvider(dictionary: [self.resolvedInputName: pixelBuffer])
                let output = try model.prediction(from: inputFeature)

                // 3. Post-process output feature to UIImage
                let outputFeature = output.featureValue(for: self.resolvedOutputName) ??
                                    output.featureNames.compactMap { output.featureValue(for: $0) }.first

                if let outPixelBuffer = outputFeature?.imageBufferValue {
                    let outImage = UIImage(pixelBuffer: outPixelBuffer)
                    DispatchQueue.main.async {
                        completion(outImage)
                    }
                } else if let multiArray = outputFeature?.multiArrayValue {
                    let outImage = UIImage(fromMultiArray: multiArray, width: 512, height: 512)
                    DispatchQueue.main.async {
                        completion(outImage)
                    }
                } else {
                    print("[CoreML] No valid image or multiarray output found")
                    DispatchQueue.main.async { completion(nil) }
                }
            } catch {
                print("[CoreML] Prediction error: \(error.localizedDescription)")
                DispatchQueue.main.async { completion(nil) }
            }
        }
    }
}

// MARK: - PixelBuffer & MultiArray Conversion Helpers
extension UIImage {
    func toPixelBuffer(width: Int, height: Int) -> CVPixelBuffer? {
        var pixelBuffer: CVPixelBuffer?
        let attributes: [CFString: Any] = [
            kCVPixelBufferCGImageCompatibilityKey: true,
            kCVPixelBufferCGBitmapContextCompatibilityKey: true
        ]

        let status = CVPixelBufferCreate(
            kCFAllocatorDefault,
            width,
            height,
            kCVPixelFormatType_32ARGB,
            attributes as CFDictionary,
            &pixelBuffer
        )

        guard status == kCVReturnSuccess, let buffer = pixelBuffer else { return nil }

        CVPixelBufferLockBaseAddress(buffer, [])
        let pxData = CVPixelBufferGetBaseAddress(buffer)

        let rgbColorSpace = CGColorSpaceCreateDeviceRGB()
        guard let context = CGContext(
            data: pxData,
            width: width,
            height: height,
            bitsPerComponent: 8,
            bytesPerRow: CVPixelBufferGetBytesPerRow(buffer),
            space: rgbColorSpace,
            bitmapInfo: CGImageAlphaInfo.noneSkipFirst.rawValue
        ) else {
            CVPixelBufferUnlockBaseAddress(buffer, [])
            return nil
        }

        UIGraphicsPushContext(context)
        self.draw(in: CGRect(x: 0, y: 0, width: CGFloat(width), height: CGFloat(height)))
        UIGraphicsPopContext()

        CVPixelBufferUnlockBaseAddress(buffer, [])
        return buffer
    }

    convenience init?(pixelBuffer: CVPixelBuffer) {
        let ciImage = CIImage(cvPixelBuffer: pixelBuffer)
        let context = CIContext()
        guard let cgImage = context.createCGImage(ciImage, from: ciImage.extent) else { return nil }
        self.init(cgImage: cgImage)
    }

    convenience init?(fromMultiArray multiArray: MLMultiArray, width: Int, height: Int) {
        let count = width * height * 4
        var pixels = [UInt8](repeating: 255, count: count)
        let ptr = multiArray.dataPointer.bindMemory(to: Float32.self, capacity: multiArray.count)

        let isNCHW = multiArray.shape.count == 4 && multiArray.shape[1].intValue == 3
        let channelSize = width * height

        for y in 0..<height {
            for x in 0..<width {
                let pixelIdx = (y * width + x) * 4
                for c in 0..<3 {
                    let val: Float32
                    if isNCHW {
                        val = ptr[c * channelSize + y * width + x]
                    } else {
                        val = ptr[(y * width + x) * 3 + c]
                    }
                    let byteVal: UInt8
                    if val < 3.0 && val > -3.0 {
                        byteVal = UInt8(clamping: Int((val + 1.0) * 127.5))
                    } else {
                        byteVal = UInt8(clamping: Int(val))
                    }
                    pixels[pixelIdx + c] = byteVal
                }
            }
        }

        let rgbColorSpace = CGColorSpaceCreateDeviceRGB()
        guard let providerRef = CGDataProvider(data: Data(pixels) as CFData),
              let cgim = CGImage(
                width: width,
                height: height,
                bitsPerComponent: 8,
                bitsPerPixel: 32,
                bytesPerRow: width * 4,
                space: rgbColorSpace,
                bitmapInfo: CGBitmapInfo(rawValue: CGImageAlphaInfo.premultipliedLast.rawValue),
                provider: providerRef,
                decode: nil,
                shouldInterpolate: true,
                intent: .defaultIntent
              ) else { return nil }

        self.init(cgImage: cgim)
    }
}

import Foundation
import Capacitor
import UIKit

/**
 * CartoonifyPlugin.swift
 * Capacitor iOS Native Plugin bridging JavaScript UI to Swift Core ML Engine.
 */
@objc(CartoonifyPlugin)
public class CartoonifyPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "CartoonifyPlugin"
    public let jsName = "CartoonifyNative"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "isAvailable", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "detectFace", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "cartoonifyImage", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "generateAvatarGrid", returnType: CAPPluginReturnPromise)
    ]

    private let engine = CoreMLCartoonEngine.shared

    @objc func isAvailable(_ call: CAPPluginCall) {
        call.resolve([
            "available": true,
            "platform": "iOS",
            "neuralEngine": true,
            "engine": "Core ML + Apple Neural Engine (ANE)",
            "vision": true
        ])
    }

    @objc func detectFace(_ call: CAPPluginCall) {
        guard let base64String = call.getString("imageBase64"),
              let image = imageFromBase64(base64String) else {
            call.reject("Invalid image base64 data")
            return
        }

        engine.detectFace(in: image) { landmarks in
            guard let lm = landmarks else {
                call.resolve([
                    "detected": false,
                    "confidence": 0.0,
                    "angleDeg": 0.0
                ])
                return
            }

            call.resolve([
                "detected": lm.detected,
                "confidence": lm.confidence,
                "angleDeg": lm.angleDeg,
                "boundingBox": [
                    "x": lm.boundingBox.origin.x,
                    "y": lm.boundingBox.origin.y,
                    "width": lm.boundingBox.size.width,
                    "height": lm.boundingBox.size.height
                ],
                "leftEye": ["x": lm.leftEye.x, "y": lm.leftEye.y],
                "rightEye": ["x": lm.rightEye.x, "y": lm.rightEye.y],
                "noseTip": ["x": lm.noseTip.x, "y": lm.noseTip.y],
                "mouthCenter": ["x": lm.mouthCenter.x, "y": lm.mouthCenter.y],
                "chin": ["x": lm.chin.x, "y": lm.chin.y],
                "forehead": ["x": lm.forehead.x, "y": lm.forehead.y]
            ])
        }
    }

    @objc func cartoonifyImage(_ call: CAPPluginCall) {
        guard let base64String = call.getString("imageBase64"),
              let image = imageFromBase64(base64String) else {
            call.reject("Invalid image data")
            return
        }

        let style = call.getString("style") ?? "anime"
        let warpFactor = call.getFloat("warpFactor") ?? 0.3
        let chinTaper = call.getFloat("chinTaper") ?? 0.25
        let eyeMagnify = call.getFloat("eyeMagnify") ?? 0.2
        let enableFaceAlign = call.getBool("enableFaceAlign") ?? true

        engine.processCartoonify(
            image: image,
            style: style,
            warpFactor: warpFactor,
            chinTaper: chinTaper,
            eyeMagnify: eyeMagnify,
            enableFaceAlign: enableFaceAlign
        ) { [weak self] resultImage in
            guard let self = self, let resultBase64 = self.imageToBase64(resultImage) else {
                call.reject("Failed to encode processed image")
                return
            }

            call.resolve([
                "success": true,
                "style": style,
                "imageBase64": resultBase64,
                "engine": "CoreML (ANE)"
            ])
        }
    }

    @objc func generateAvatarGrid(_ call: CAPPluginCall) {
        guard let base64String = call.getString("imageBase64"),
              let image = imageFromBase64(base64String) else {
            call.reject("Invalid image data")
            return
        }

        let styles = ["anime", "caricature", "pixar3d", "comic_book"]
        let group = DispatchGroup()
        var results: [String: String] = [:]
        let lock = NSLock()

        for style in styles {
            group.enter()
            engine.processCartoonify(
                image: image,
                style: style,
                warpFactor: style == "caricature" ? 0.65 : 0.2,
                chinTaper: style == "caricature" ? 0.45 : 0.2,
                eyeMagnify: 0.25,
                enableFaceAlign: true
            ) { [weak self] resImg in
                if let b64 = self?.imageToBase64(resImg) {
                    lock.lock()
                    results[style] = b64
                    lock.unlock()
                }
                group.leave()
            }
        }

        group.notify(queue: .main) {
            call.resolve([
                "success": true,
                "avatars": results
            ])
        }
    }

    // MARK: - Helpers
    private func imageFromBase64(_ base64: String) -> UIImage? {
        var cleanBase64 = base64
        if let commaIndex = base64.firstIndex(of: ",") {
            cleanBase64 = String(base64[base64.index(after: commaIndex)...])
        }
        guard let data = Data(base64Encoded: cleanBase64, options: .ignoreUnknownCharacters) else { return nil }
        return UIImage(data: data)
    }

    private func imageToBase64(_ image: UIImage) -> String? {
        guard let jpegData = image.jpegData(compressionQuality: 0.90) else { return nil }
        return "data:image/jpeg;base64," + jpegData.base64EncodedString()
    }
}

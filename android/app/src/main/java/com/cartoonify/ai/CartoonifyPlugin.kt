package com.cartoonify.ai

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.util.Base64
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import java.io.ByteArrayOutputStream

/**
 * CartoonifyPlugin.kt
 * Capacitor Android Native Plugin bridging JavaScript UI to Kotlin TFLite Engine.
 */
@CapacitorPlugin(name = "CartoonifyNative")
class CartoonifyPlugin : Plugin() {

    private lateinit var engine: TFLiteCartoonEngine
    private val coroutineScope = CoroutineScope(Dispatchers.Main)

    override fun load() {
        super.load()
        engine = TFLiteCartoonEngine(context)
    }

    @PluginMethod
    fun isAvailable(call: PluginCall) {
        val status = engine.getEngineStatus()
        val ret = JSObject().apply {
            put("available", true)
            put("platform", "Android")
            put("gpuActive", status["gpuActive"])
            put("engine", status["engine"])
        }
        call.resolve(ret)
    }

    @PluginMethod
    fun detectFace(call: PluginCall) {
        val base64 = call.getString("imageBase64")
        if (base64 == null) {
            call.reject("Image base64 data is required")
            return
        }

        coroutineScope.launch {
            val bitmap = decodeBase64ToBitmap(base64)
            if (bitmap == null) {
                call.reject("Invalid image bitmap data")
                return@launch
            }

            val landmarks = engine.detectFace(bitmap)
            val ret = JSObject().apply {
                put("detected", landmarks.detected)
                put("confidence", landmarks.confidence)
                put("angleDeg", landmarks.angleDeg)

                val bbox = JSObject().apply {
                    put("x", landmarks.boundingBox.left)
                    put("y", landmarks.boundingBox.top)
                    put("width", landmarks.boundingBox.width())
                    put("height", landmarks.boundingBox.height())
                }
                put("boundingBox", bbox)

                put("leftEye", JSObject().apply {
                    put("x", landmarks.leftEye.x)
                    put("y", landmarks.leftEye.y)
                })
                put("rightEye", JSObject().apply {
                    put("x", landmarks.rightEye.x)
                    put("y", landmarks.rightEye.y)
                })
                put("noseTip", JSObject().apply {
                    put("x", landmarks.noseTip.x)
                    put("y", landmarks.noseTip.y)
                })
                put("mouthCenter", JSObject().apply {
                    put("x", landmarks.mouthCenter.x)
                    put("y", landmarks.mouthCenter.y)
                })
                put("chin", JSObject().apply {
                    put("x", landmarks.chin.x)
                    put("y", landmarks.chin.y)
                })
            }
            call.resolve(ret)
        }
    }

    @PluginMethod
    fun cartoonifyImage(call: PluginCall) {
        val base64 = call.getString("imageBase64")
        if (base64 == null) {
            call.reject("Image data missing")
            return
        }

        val style = call.getString("style") ?: "anime"
        val warpFactor = call.getFloat("warpFactor") ?: 0.3f
        val chinTaper = call.getFloat("chinTaper") ?: 0.25f
        val eyeMagnify = call.getFloat("eyeMagnify") ?: 0.2f
        val enableFaceAlign = call.getBoolean("enableFaceAlign") ?: true

        coroutineScope.launch {
            val bitmap = decodeBase64ToBitmap(base64)
            if (bitmap == null) {
                call.reject("Could not decode image")
                return@launch
            }

            val resultBitmap = engine.processCartoonify(
                bitmap = bitmap,
                style = style,
                warpFactor = warpFactor,
                chinTaper = chinTaper,
                eyeMagnify = eyeMagnify,
                enableFaceAlign = enableFaceAlign
            )

            val outBase64 = encodeBitmapToBase64(resultBitmap)
            val ret = JSObject().apply {
                put("success", true)
                put("style", style)
                put("imageBase64", outBase64)
                put("engine", "TFLite (GPU/NNAPI)")
            }
            call.resolve(ret)
        }
    }

    @PluginMethod
    fun generateAvatarGrid(call: PluginCall) {
        val base64 = call.getString("imageBase64")
        if (base64 == null) {
            call.reject("Image data missing")
            return
        }

        coroutineScope.launch {
            val bitmap = decodeBase64ToBitmap(base64)
            if (bitmap == null) {
                call.reject("Could not decode image")
                return@launch
            }

            val styles = listOf("anime", "caricature", "pixar3d", "comic_book")
            val avatarsObj = JSObject()

            for (st in styles) {
                val styledBitmap = engine.processCartoonify(
                    bitmap = bitmap,
                    style = st,
                    warpFactor = if (st == "caricature") 0.65f else 0.2f,
                    chinTaper = if (st == "caricature") 0.45f else 0.2f,
                    eyeMagnify = 0.25f,
                    enableFaceAlign = true
                )
                avatarsObj.put(st, encodeBitmapToBase64(styledBitmap))
            }

            val ret = JSObject().apply {
                put("success", true)
                put("avatars", avatarsObj)
            }
            call.resolve(ret)
        }
    }

    private fun decodeBase64ToBitmap(base64Str: String): Bitmap? {
        val clean = if (base64Str.contains(",")) base64Str.substringAfter(",") else base64Str
        val bytes = Base64.decode(clean, Base64.DEFAULT)
        return BitmapFactory.decodeByteArray(bytes, 0, bytes.size)
    }

    private fun encodeBitmapToBase64(bitmap: Bitmap): String {
        val stream = ByteArrayOutputStream()
        bitmap.compress(Bitmap.CompressFormat.JPEG, 90, stream)
        val byteArray = stream.toByteArray()
        return "data:image/jpeg;base64," + Base64.encodeToString(byteArray, Base64.NO_WRAP)
    }

    override fun handleOnDestroy() {
        engine.close()
        super.handleOnDestroy()
    }
}

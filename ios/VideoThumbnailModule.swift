import Foundation
import React
import AVFoundation
import ffmpegkit

@objc(VideoThumbnailModule)
class VideoThumbnailModule: NSObject {
  
  @objc
  static func requiresMainQueueSetup() -> Bool {
    return false
  }
  
  @objc
  func generateThumbnail(
    _ videoUri: String,
    timeInSeconds: NSNumber,
    resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    let cleanedUri = videoUri.replacingOccurrences(of: "file://", with: "")
    guard FileManager.default.fileExists(atPath: cleanedUri) else {
      reject("FILE_NOT_FOUND", "Video file does not exist", nil)
      return
    }
    
    let inputPath = "file://\(cleanedUri)"
    let outputFileName = UUID().uuidString + ".jpg"
    let outputPath = URL(fileURLWithPath: NSTemporaryDirectory()).appendingPathComponent(outputFileName).path
    let outputUri = "file://\(outputPath)"
    
    let escapedInputPath = inputPath.replacingOccurrences(of: "\"", with: "\\\"")
    let escapedOutputPath = outputPath.replacingOccurrences(of: "\"", with: "\\\"")
    let command = "-y -ss \(timeInSeconds) -i \"\(escapedInputPath)\" -vframes 1 -q:v 2 \"\(escapedOutputPath)\""
    
    FFmpegKit.executeAsync(command) { session in
      let returnCode = session?.getReturnCode()
      
      if ReturnCode.isSuccess(returnCode) {
        resolve(outputUri)
      } else {
        let failMsg = session?.getFailStackTrace() ?? "Unknown FFmpeg error"
        reject("FFMPEG_FAILED", failMsg, nil)
      }
    }
  }
}

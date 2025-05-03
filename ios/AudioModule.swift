import Foundation
import React
import ffmpegkit

@objc(AudioModule)
class AudioModule: RCTEventEmitter {
  
  private var currentSession: Session?
  
  private var supportedAudioEncoders: [String: String] = [
    "mp3": "libmp3lame",
    "wav": "pcm_s16le",
    "aac": "aac",
    "flac": "flac",
    "m4a": "aac",
    "m4r": "aac",
    "aiff": "pcm_s16be",
  ]
  
  let supportedVideoEncoders: [String: String] = [
    "a64": "a64multi",
    "a64_5": "a64multi5",
    "mxf": "vc2",
    "yuv": "vc2",
    "flv": "flv",
    "mp4": "h264_videotoolbox",
    "mov": "h264_videotoolbox",
    "mkv": "h264_videotoolbox",
    "avi": "msmpeg4",
    "roq": "roqvideo",
    "ogv": "libtheora",
    "ogg": "libtheora",
    "webm": "libvpx",
    "mkv_vp9": "libvpx-vp9",
    "webp": "libwebp",
    "webp_anim": "libwebp_anim"
  ]
  
  override static func requiresMainQueueSetup() -> Bool {
    return true
  }
  
  override func supportedEvents() -> [String] {
    return ["onAudioExtractionProgress"]
  }
  
  @objc
  func extractAudio(
    _ inputUri: String,
    outputType: String,
    quality: String,
    resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    let cleanedUri = inputUri.replacingOccurrences(of: "file://", with: "")
    let inputPath = "file://\(cleanedUri)"
    
    guard FileManager.default.fileExists(atPath: cleanedUri) else {
      reject("FILE_NOT_FOUND", "Input file does not exist", nil)
      return
    }
    
    self.getMediaDuration(filePath: inputPath) { durationSeconds in
      guard let duration = durationSeconds, duration > 0 else {
        reject("DURATION_ERROR", "Could not retrieve duration from FFmpeg", nil)
        return
      }
      
      let lowerExt = outputType.lowercased()
      guard let codec = self.supportedAudioEncoders[lowerExt] else {
        reject("UNSUPPORTED_FORMAT", "The output format \(outputType) is not supported.", nil)
        return
      }
      
      var audioBitrate = "128k"
      switch quality.lowercased() {
      case "low": audioBitrate = "64k"
      case "high": audioBitrate = "192k"
      default: break
      }
      
      let ffmpegExt = lowerExt == "m4r" ? "m4a" : lowerExt
      let outputFileName = UUID().uuidString + ".\(ffmpegExt)"
      let outputPath = URL(fileURLWithPath: NSTemporaryDirectory()).appendingPathComponent(outputFileName).path
      let outputUri = "file://\(outputPath)"
      
      let escapedInputPath = inputPath.replacingOccurrences(of: "\"", with: "\\\"")
      let escapedOutputUri = outputUri.replacingOccurrences(of: "\"", with: "\\\"")
      let ffmpegCommand = "-y -i \"\(escapedInputPath)\" -vn -acodec \(codec) -b:a \(audioBitrate) -map_metadata 0 \"\(escapedOutputUri)\""
      
      self.currentSession = FFmpegKit.executeAsync(ffmpegCommand) { session in
        self.currentSession = nil
        let returnCode = session?.getReturnCode()
        if ReturnCode.isSuccess(returnCode) {
          DispatchQueue.main.async {
            self.sendEvent(withName: "onAudioExtractionProgress", body: ["progress": 1.0])
            
            var finalOutputUri = outputUri
            if lowerExt == "m4r" {
              let m4rPath = outputPath.replacingOccurrences(of: ".m4a", with: ".m4r")
              do {
                try FileManager.default.moveItem(atPath: outputPath, toPath: m4rPath)
                finalOutputUri = "file://\(m4rPath)"
              } catch {
                reject("RENAME_FAILED", "Failed to rename file to .m4r: \(error.localizedDescription)", nil)
                return
              }
            }
            
            resolve([
              "uri": finalOutputUri,
              "duration": duration
            ])
          }
        } else if ReturnCode.isCancel(returnCode) {
          DispatchQueue.main.async {
            reject("CANCELLED", "Audio extraction was cancelled", nil)
          }
        } else {
          let failMsg = session?.getFailStackTrace() ?? "Unknown error"
          DispatchQueue.main.async {
            reject("FFMPEG_FAILED", failMsg, nil)
          }
        }
      } withLogCallback: { _ in } withStatisticsCallback: { stats in
        if let currentTime = stats?.getTime() {
          let currentSeconds = Float(currentTime) / 1000.0
          let progress = min(currentSeconds / Float(duration), 1.0)
          DispatchQueue.main.async {
            self.sendEvent(withName: "onAudioExtractionProgress", body: ["progress": progress])
          }
        }
      }
    }
  }
  
  @objc
  func cancelExtraction() {
    currentSession?.cancel()
    currentSession = nil
  }
  
  
  @objc
  func trimAudio(
    _ inputUri: String,
    start: Double,
    end: Double,
    resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    let cleanedUri = inputUri.replacingOccurrences(of: "file://", with: "")
    let inputPath = "file://\(cleanedUri)"
    
    guard FileManager.default.fileExists(atPath: cleanedUri) else {
      reject("FILE_NOT_FOUND", "Input file does not exist", nil)
      return
    }
    
    let duration = end - start
    guard duration > 0 else {
      reject("INVALID_DURATION", "End time must be greater than start time", nil)
      return
    }
    
    let fileExtension = (cleanedUri as NSString).pathExtension.lowercased()
    let isM4R = fileExtension == "m4r"
    let tempFileName = UUID().uuidString + "." + (isM4R ? "m4a" : fileExtension)
    let tempPath = URL(fileURLWithPath: NSTemporaryDirectory()).appendingPathComponent(tempFileName).path
    
    let escapedInputPath = inputPath.replacingOccurrences(of: "\"", with: "\\\"")
    let escapedTempUri = tempPath.replacingOccurrences(of: "\"", with: "\\\"")
    
    let ffmpegCommand: String
    if fileExtension == "m4a" {
      ffmpegCommand = "-y -i \"\(escapedInputPath)\" -ss \(start) -t \(duration) -c:a aac -b:a 192k \"\(escapedTempUri)\""
    } else {
      ffmpegCommand = "-y -i \"\(escapedInputPath)\" -ss \(start) -t \(duration) -c copy \"\(escapedTempUri)\""
    }
    
    FFmpegKit.executeAsync(ffmpegCommand) { session in
      let returnCode = session?.getReturnCode()
      if ReturnCode.isSuccess(returnCode) {
        do {
          try FileManager.default.removeItem(atPath: cleanedUri)
          try FileManager.default.moveItem(atPath: tempPath, toPath: cleanedUri)
          resolve([
            "uri": inputUri,
            "duration": duration
          ])
        } catch {
          reject("FILE_IO_ERROR", "Failed to replace original file: \(error.localizedDescription)", nil)
        }
      } else {
        let failMsg = session?.getFailStackTrace() ?? "Unknown error"
        reject("TRIM_FAILED", failMsg, nil)
      }
    }
  }
  
  @objc
  func editAudioMetadata(
    _ inputUri: String,
    metadata: [String: String],
    resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    let cleanedUri = inputUri.replacingOccurrences(of: "file://", with: "")
    let inputPath = "file://\(cleanedUri)"
    
    guard FileManager.default.fileExists(atPath: cleanedUri) else {
      reject("FILE_NOT_FOUND", "Input file does not exist", nil)
      return
    }
    
    let tempFileName = UUID().uuidString + "." + (cleanedUri as NSString).pathExtension
    let tempPath = URL(fileURLWithPath: NSTemporaryDirectory()).appendingPathComponent(tempFileName).path
    let tempUri = "file://\(tempPath)"
    
    var metadataArgs = ""
    for (key, value) in metadata {
      let escapedValue = value.replacingOccurrences(of: "\"", with: "\\\"")
      metadataArgs += " -metadata \(key)=\"\(escapedValue)\""
    }
    
    let escapedInputPath = inputPath.replacingOccurrences(of: "\"", with: "\\\"")
    let escapedTempUri = tempUri.replacingOccurrences(of: "\"", with: "\\\"")
    let ffmpegCommand = "-y -i \"\(escapedInputPath)\"\(metadataArgs) -c copy \"\(escapedTempUri)\""
    
    FFmpegKit.executeAsync(ffmpegCommand) { session in
      let returnCode = session?.getReturnCode()
      if ReturnCode.isSuccess(returnCode) {
        do {
          try FileManager.default.removeItem(atPath: cleanedUri)
          try FileManager.default.moveItem(atPath: tempPath, toPath: cleanedUri)
          resolve([
            "uri": inputUri,
            "metadata": metadata
          ])
        } catch {
          reject("FILE_IO_ERROR", "Failed to replace original file: \(error.localizedDescription)", nil)
        }
      } else {
        let failMsg = session?.getFailStackTrace() ?? "Unknown error"
        reject("METADATA_EDIT_FAILED", failMsg, nil)
      }
    }
  }
  
  @objc
  func getAudioMetadata(
    _ inputUri: String,
    resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    let cleanedUri = inputUri.replacingOccurrences(of: "file://", with: "")
    let inputPath = "file://\(cleanedUri)"
    
    guard FileManager.default.fileExists(atPath: cleanedUri) else {
      reject("FILE_NOT_FOUND", "Input file does not exist", nil)
      return
    }
    
    let escapedInputPath = inputPath.replacingOccurrences(of: "\"", with: "\\\"")
    let command = "-v quiet -print_format json -show_format \"\(escapedInputPath)\""
    
    FFprobeKit.executeAsync(command) { session in
      guard let output = session?.getOutput(), !output.isEmpty,
            let data = output.data(using: .utf8) else {
        reject("FFPROBE_FAILED", "Failed to get output from FFprobe", nil)
        return
      }
      
      do {
        if let json = try JSONSerialization.jsonObject(with: data, options: []) as? [String: Any],
           let format = json["format"] as? [String: Any],
           let tags = format["tags"] as? [String: String] {
          resolve(tags)
        } else {
          resolve([:]) // no metadata found
        }
      } catch {
        reject("JSON_PARSE_ERROR", "Failed to parse FFprobe JSON output", error)
      }
    }
  }
  
  @objc
  func getDuration(
    _ inputUri: String,
    resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    let cleanedUri = inputUri.replacingOccurrences(of: "file://", with: "")
    let inputPath = "file://\(cleanedUri)"
    
    guard FileManager.default.fileExists(atPath: cleanedUri) else {
      reject("FILE_NOT_FOUND", "Input file does not exist", nil)
      return
    }
    
    getMediaDuration(filePath: inputPath) { duration in
      if let duration = duration {
        resolve(duration)
      } else {
        reject("DURATION_ERROR", "Could not retrieve media duration", nil)
      }
    }
  }
  
  
  @objc
  func getSupportedEncoders(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    let command = "-hide_banner -encoders"
    
    FFmpegKit.executeAsync(command) { session in
      guard let session = session else {
        reject("NO_SESSION", "FFmpeg session could not be created.", nil)
        return
      }
      
      if let returnCode = session.getReturnCode(), !ReturnCode.isSuccess(returnCode) {
        let message = session.getAllLogsAsString() ?? "FFmpeg failed with unknown error."
        reject("FFMPEG_FAILED", message, nil)
        return
      }
      
      let output = session.getOutput()?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
      resolve(output)
    }
  }
  
  
  override func constantsToExport() -> [AnyHashable: Any]! {
    let audioFormatsArray = supportedAudioEncoders.map { (key, _) in
      ["label": key.uppercased(), "value": key]
    }
    
    let orderedAudioFormatsArray = Array(audioFormatsArray)
    
    return [
      "supportedAudioFormats": orderedAudioFormatsArray,
      "supportedVideoFormats": supportedVideoEncoders
    ]
  }
  
  private func getMediaDuration(filePath: String, completion: @escaping (Double?) -> Void) {
    let escapedFilePath = filePath.replacingOccurrences(of: "\"", with: "\\\"")
    let command = "-v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 \"\(escapedFilePath)\""
    
    FFprobeKit.executeAsync(command) { session in
      let output = session?.getOutput() ?? ""
      let trimmed = output.trimmingCharacters(in: .whitespacesAndNewlines)
      
      if let duration = Double(trimmed) {
        completion(duration)
      } else {
        completion(nil)
      }
    }
  }
}

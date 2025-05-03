#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(VideoThumbnailModule, NSObject)

RCT_EXTERN_METHOD(
  generateThumbnail:
  (NSString *)videoUri
  timeInSeconds:(nonnull NSNumber *)timeInSeconds
  resolve:(RCTPromiseResolveBlock)resolve
  reject:(RCTPromiseRejectBlock)reject
)

@end

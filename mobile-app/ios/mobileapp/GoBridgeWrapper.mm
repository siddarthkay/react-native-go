#import "GoBridgeWrapper.h"

// Define function prototypes to avoid direct import of Gobridge headers
@interface GobridgeMobileAPI : NSObject
- (long)startServer;
- (void)stopServer;
- (long)getServerPort;
@end

// Forward declare the class loading
Class GobridgeMobileAPIClass;

@implementation GoBridgeWrapper

+ (void)initialize {
  if (self == [GoBridgeWrapper class]) {
    // Load the GobridgeMobileAPI class dynamically to avoid header import conflicts
    GobridgeMobileAPIClass = NSClassFromString(@"GobridgeMobileAPI");
  }
}

+ (NSNumber *)startServer {
  @try {
    if (!GobridgeMobileAPIClass) {
      return @(0);
    }
    id api = [[GobridgeMobileAPIClass alloc] init];
    long port = [api startServer];
    return @(port);
  } @catch (NSException *exception) {
    return @(0);
  }
}

+ (NSNumber *)stopServer {
  @try {
    if (!GobridgeMobileAPIClass) {
      return @(NO);
    }
    id api = [[GobridgeMobileAPIClass alloc] init];
    [api stopServer];
    return @(YES);
  } @catch (NSException *exception) {
    return @(NO);
  }
}

+ (NSNumber *)getServerPort {
  @try {
    if (!GobridgeMobileAPIClass) {
      return @(0);
    }
    id api = [[GobridgeMobileAPIClass alloc] init];
    long port = [api getServerPort];
    return @(port);
  } @catch (NSException *exception) {
    return @(0);
  }
}

@end
#define UIColorFromRGB(rgbValue) \
[UIColor colorWithRed:((float)((rgbValue & 0xFF0000) >> 16))/255.0 \
                green:((float)((rgbValue & 0x00FF00) >>  8))/255.0 \
                 blue:((float)((rgbValue & 0x0000FF) >>  0))/255.0 \
                alpha:1.0]

#import "ViewController.h"
#import <WebKit/WKNavigationAction.h>
#import <WebKit/WKPreferences.h>
#import <WebKit/WKWebViewConfiguration.h>

@interface ViewController ()
@property (strong, nonatomic) IBOutlet WKWebView *webView;
@property (strong, nonatomic) NSURL *endpoint;
@property (strong, nonatomic) NSMutableArray<NSURL *>* urls;
@end

@implementation ViewController

- (void)viewDidLoad {
    [super viewDidLoad];
    
    _urls = [[NSMutableArray alloc] init];
    _endpoint = [NSURL URLWithString:@"http://127.0.0.1:8000"];
    
    _webView = [[WKWebView alloc] init];
    [_webView.configuration.preferences setJavaScriptCanOpenWindowsAutomatically:true];
    [_webView setUIDelegate:self];
    
    [self start];
}

- (void) start {
    NSURLSession *session = [NSURLSession sharedSession];
    NSURLSessionDataTask *dataTask = [session dataTaskWithURL:_endpoint completionHandler:^(NSData * _Nullable data, NSURLResponse * _Nullable response, NSError * _Nullable error) {
        if(error)
        {
            [self start];
            return;
        }
        
        [self launchWorkspace];
    }];
    [dataTask resume];
}

- (void) launchWorkspace {
    dispatch_async(dispatch_get_main_queue(), ^{
        [_webView setFrame:self.view.frame];
        
        [[self.view.subviews firstObject] removeFromSuperview];
        
        NSURLRequest *request = [NSURLRequest requestWithURL:[NSURL URLWithString:@"http://127.0.0.1:8000"]];
        [_webView loadRequest:request];
        
        [self.view addSubview:_webView];
    });
}

- (WKWebView *)webView:(WKWebView *)webView createWebViewWithConfiguration:(WKWebViewConfiguration *)configuration forNavigationAction:(WKNavigationAction *)navigationAction windowFeatures:(WKWindowFeatures *)windowFeatures {
    
    WKWebView *newWebView = [[WKWebView alloc] initWithFrame:self.view.frame configuration:configuration];
    [self.view addSubview:newWebView];
    [newWebView setUIDelegate:self];
    
    [newWebView loadRequest:navigationAction.request];
    
    NSURL* url = navigationAction.request.URL;
    
    [_urls addObject:url];
    
    UIWindow *window = UIApplication.sharedApplication.windows.firstObject;
    CGFloat bottomPadding = window.safeAreaInsets.bottom;
    
    UIButton *closeBtn = [[UIButton alloc] initWithFrame:CGRectMake(15, self.view.frame.size.height - bottomPadding - 25, 50, 30)];
    [closeBtn setTitle:@"Close" forState:UIControlStateNormal];
    closeBtn.backgroundColor = [UIColorFromRGB(0x1e293b) colorWithAlphaComponent:0.5];
    closeBtn.layer.borderColor = UIColorFromRGB(0x4b5361).CGColor;
    closeBtn.layer.borderWidth = 0.5f;
    closeBtn.layer.cornerRadius = 3.0f;
    closeBtn.titleLabel.font = [UIFont systemFontOfSize:12];
    [closeBtn addTarget:self action:@selector(close:) forControlEvents:UIControlEventTouchUpInside];
    [self.view addSubview:closeBtn];
    
    UIButton *safariBtn = [[UIButton alloc] initWithFrame:CGRectMake(15 + 50 + 10, self.view.frame.size.height - bottomPadding - 25, 60, 30)];
    [safariBtn setTitle:@"Safari" forState:UIControlStateNormal];
    safariBtn.backgroundColor = [UIColorFromRGB(0x1e293b) colorWithAlphaComponent:0.5];
    safariBtn.layer.borderColor = UIColorFromRGB(0x4b5361).CGColor;
    safariBtn.layer.borderWidth = 0.5f;
    safariBtn.layer.cornerRadius = 3.0f;
    safariBtn.titleLabel.font = [UIFont systemFontOfSize:12];
    [safariBtn addTarget:self action:@selector(openSafari:) forControlEvents:UIControlEventTouchUpInside];
    [self.view addSubview:safariBtn];
    
    return newWebView;
}

- (void) openSafari:(id)sender {
    NSURL* url = [_urls lastObject];
    NSLog(@"%@", url.absoluteString);
    [[UIApplication sharedApplication] openURL:url options:@{} completionHandler:^(BOOL success) {}];
}

-(void)close:(id)sender
{
    UIButton *closeBtn = sender;
    [closeBtn removeFromSuperview];
    [self.view.subviews.lastObject removeFromSuperview];
    [self.view.subviews.lastObject removeFromSuperview];
    [_urls removeLastObject];
}

- (void)didReceiveMemoryWarning {
    [super didReceiveMemoryWarning];
    // Dispose of any resources that can be recreated.
}


- (void)myButtonAction:(id)sender __attribute__((ibaction)) {
}

@end

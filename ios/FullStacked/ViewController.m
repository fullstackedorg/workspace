#import "ViewController.h"
#import <WebKit/WKNavigationAction.h>

@interface ViewController ()
@property (strong, nonatomic) IBOutlet WKWebView *webView;
@property (strong, nonatomic) NSURL *endpoint;

- (IBAction)myButtonAction:(id)sender;
@end

@implementation ViewController

- (void)viewDidLoad {
    [super viewDidLoad];
    
    _endpoint = [NSURL URLWithString:@"http://127.0.0.1:8000"];
    
    _webView = [[WKWebView alloc] init];
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
    
    [newWebView loadRequest:navigationAction.request];
    
    UIButton *closeBtn = [[UIButton alloc] initWithFrame:CGRectMake(0, self.view.frame.size.height - 70, 100, 70)];
    [closeBtn setTitle:@"Close" forState:UIControlStateNormal];
    [closeBtn addTarget:self action:@selector(event_button_click:) forControlEvents:UIControlEventTouchUpInside];
    [self.view addSubview:closeBtn];
    
    return newWebView;
}

-(void)event_button_click:(id)sender
{
    UIButton *closeBtn = sender;
    [closeBtn removeFromSuperview];
    [self.view.subviews.lastObject removeFromSuperview];
}

- (void)didReceiveMemoryWarning {
    [super didReceiveMemoryWarning];
    // Dispose of any resources that can be recreated.
}


- (void)myButtonAction:(id)sender __attribute__((ibaction)) {
}

@end

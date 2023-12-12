#import "ViewController.h"


@interface ViewController ()
@property (weak, nonatomic) IBOutlet UIButton *myButton;
@property (weak, nonatomic) IBOutlet WKWebView *webView;

- (IBAction)myButtonAction:(id)sender;
@end


@implementation ViewController

- (void)viewDidLoad {
    [super viewDidLoad];
    [_webView setUIDelegate:self];
}

- (IBAction)myButtonAction:(id)sender
{
    dispatch_async(dispatch_get_main_queue(), ^{
        NSURLRequest *request = [NSURLRequest requestWithURL:[NSURL URLWithString:@"http://127.0.0.1:8000"]];
        [_webView loadRequest:request];
        [_myButton removeFromSuperview];
    });
}

- (WKWebView *)webView:(WKWebView *)webView createWebViewWithConfiguration:(WKWebViewConfiguration *)configuration forNavigationAction:(WKNavigationAction *)navigationAction windowFeatures:(WKWindowFeatures *)windowFeatures {
    
    WKWebView *newWebView = [[WKWebView alloc] initWithFrame:self.view.frame configuration:configuration];
    [self.view addSubview:newWebView];
    
    [newWebView loadRequest:navigationAction.request];
    
    dispatch_time_t delay = dispatch_time(DISPATCH_TIME_NOW, NSEC_PER_SEC * 5);
    dispatch_after(delay, dispatch_get_main_queue(), ^(void){
        [newWebView removeFromSuperview];
    });
    
    return newWebView;
}

- (void)didReceiveMemoryWarning {
    [super didReceiveMemoryWarning];
    // Dispose of any resources that can be recreated.
}


@end

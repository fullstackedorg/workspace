#import "ViewController.h"
#import <WebKit/WKNavigationAction.h>

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


@end

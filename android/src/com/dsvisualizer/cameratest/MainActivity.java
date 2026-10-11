package com.dsvisualizer.cameratest;

import android.Manifest;
import android.app.Activity;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Bundle;
import android.webkit.PermissionRequest;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;
import android.widget.FrameLayout;
import android.view.View;
import android.view.WindowInsets;
import android.os.Build;
import java.io.IOException;

public final class MainActivity extends Activity {
    private static final String HOST = "appassets.androidplatform.net";
    private static final int CAMERA_REQUEST = 10;
    private WebView webView;
    private PermissionRequest pendingCamera;

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        getWindow().setStatusBarColor(0xff000000);
        getWindow().setNavigationBarColor(0xff000000);
        webView = new WebView(this);
        webView.setBackgroundColor(0xff000000);
        webView.getSettings().setJavaScriptEnabled(true);
        webView.getSettings().setDomStorageEnabled(true);
        webView.getSettings().setMediaPlaybackRequiresUserGesture(false);
        // Website zoom controls scale the video and AR overlay together.
        webView.getSettings().setSupportZoom(false);
        webView.getSettings().setAllowFileAccess(false);
        webView.getSettings().setAllowContentAccess(false);
        webView.setWebViewClient(new WebViewClient() {
            @Override public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                if (!HOST.equals(uri.getHost())) return null;
                String path = uri.getPath();
                if (path == null || !path.startsWith("/assets/") || path.contains("..")) {
                    return new WebResourceResponse("text/plain", "UTF-8", null);
                }
                String asset = path.substring("/assets/".length());
                String mime = asset.endsWith(".js") ? "application/javascript" :
                    asset.endsWith(".css") ? "text/css" : "text/html";
                try {
                    return new WebResourceResponse(mime, "UTF-8", getAssets().open(asset));
                } catch (IOException error) {
                    return new WebResourceResponse("text/plain", "UTF-8", null);
                }
            }
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                return !HOST.equals(request.getUrl().getHost());
            }
        });
        webView.setWebChromeClient(new WebChromeClient() {
            @Override public void onPermissionRequest(final PermissionRequest request) {
                runOnUiThread(new Runnable() {
                    @Override public void run() {
                        if (!HOST.equals(request.getOrigin().getHost()) || !requestsCamera(request)) {
                            request.deny();
                            return;
                        }
                        if (checkSelfPermission(Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED) {
                            request.grant(new String[] { PermissionRequest.RESOURCE_VIDEO_CAPTURE });
                        } else {
                            if (pendingCamera != null) pendingCamera.deny();
                            pendingCamera = request;
                            requestPermissions(new String[] { Manifest.permission.CAMERA }, CAMERA_REQUEST);
                        }
                    }
                });
            }
            @Override public void onPermissionRequestCanceled(PermissionRequest request) {
                if (pendingCamera == request) pendingCamera = null;
            }
        });
        FrameLayout root = new FrameLayout(this);
        root.setBackgroundColor(0xff000000);
        root.addView(webView, new FrameLayout.LayoutParams(-1, -1));
        root.setOnApplyWindowInsetsListener(new View.OnApplyWindowInsetsListener() {
            @Override public WindowInsets onApplyWindowInsets(View view, WindowInsets insets) {
                FrameLayout.LayoutParams layout = (FrameLayout.LayoutParams) webView.getLayoutParams();
                if (Build.VERSION.SDK_INT >= 30) {
                    android.graphics.Insets bars = insets.getInsets(WindowInsets.Type.systemBars() | WindowInsets.Type.displayCutout());
                    layout.setMargins(bars.left, bars.top, bars.right, bars.bottom);
                } else {
                    layout.setMargins(insets.getSystemWindowInsetLeft(), insets.getSystemWindowInsetTop(), insets.getSystemWindowInsetRight(), insets.getSystemWindowInsetBottom());
                }
                webView.setLayoutParams(layout);
                return insets;
            }
        });
        setContentView(root);
        webView.loadUrl("https://" + HOST + "/assets/index.html");
    }

    private boolean requestsCamera(PermissionRequest request) {
        for (String resource : request.getResources()) {
            if (PermissionRequest.RESOURCE_VIDEO_CAPTURE.equals(resource)) return true;
        }
        return false;
    }

    @Override public void onRequestPermissionsResult(int code, String[] permissions, int[] results) {
        super.onRequestPermissionsResult(code, permissions, results);
        if (code != CAMERA_REQUEST || pendingCamera == null) return;
        if (results.length > 0 && results[0] == PackageManager.PERMISSION_GRANTED) {
            pendingCamera.grant(new String[] { PermissionRequest.RESOURCE_VIDEO_CAPTURE });
        } else {
            pendingCamera.deny();
            Toast.makeText(this, "Allow Camera in app settings, then reopen the app.", Toast.LENGTH_LONG).show();
        }
        pendingCamera = null;
    }

    @Override protected void onPause() {
        if (webView != null) webView.onPause();
        super.onPause();
    }
    @Override protected void onResume() {
        super.onResume();
        if (webView != null) webView.onResume();
    }
    @Override protected void onDestroy() {
        if (pendingCamera != null) { pendingCamera.deny(); pendingCamera = null; }
        if (webView != null) { webView.stopLoading(); webView.destroy(); webView = null; }
        super.onDestroy();
    }
}

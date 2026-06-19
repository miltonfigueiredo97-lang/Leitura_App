package com.booklegacy.app;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.view.View;
import android.webkit.CookieManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

import com.google.android.gms.auth.api.signin.GoogleSignIn;
import com.google.android.gms.auth.api.signin.GoogleSignInAccount;
import com.google.android.gms.auth.api.signin.GoogleSignInClient;
import com.google.android.gms.auth.api.signin.GoogleSignInOptions;
import com.google.android.gms.common.api.ApiException;
import com.google.android.gms.tasks.Task;

import org.json.JSONObject;

public class MainActivity extends Activity {
    private static final int RC_SIGN_IN = 9001;
    private WebView webView;
    private GoogleSignInClient googleSignInClient;
    private String webClientId;

    @SuppressLint({"SetJavaScriptEnabled", "AddJavascriptInterface"})
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        getWindow().setStatusBarColor(Color.parseColor("#161c2b"));
        getWindow().setNavigationBarColor(Color.parseColor("#0b0f17"));

        webClientId = getString(R.string.booklegacy_web_client_id);
        setupGoogleSignIn();

        webView = new WebView(this);
        webView.setBackgroundColor(Color.parseColor("#0b0f17"));
        webView.setOverScrollMode(View.OVER_SCROLL_NEVER);
        setContentView(webView);

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setLoadWithOverviewMode(false);
        settings.setUseWideViewPort(false);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setBuiltInZoomControls(false);
        settings.setDisplayZoomControls(false);
        settings.setSupportZoom(false);
        settings.setJavaScriptCanOpenWindowsAutomatically(true);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE);
        settings.setUserAgentString(settings.getUserAgentString() + " BookLegacyAndroidApp/3.17");

        CookieManager cookieManager = CookieManager.getInstance();
        cookieManager.setAcceptCookie(true);
        cookieManager.setAcceptThirdPartyCookies(webView, true);

        webView.addJavascriptInterface(new NativeBridge(), "BookLegacyNative");
        webView.setWebChromeClient(new WebChromeClient());
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                String url = uri.toString();

                if (url.startsWith("https://leitura-app-theta.vercel.app")) return false;

                // Google login não deve rodar dentro da WebView. O app usa login Google nativo.
                if (url.startsWith("https://accounts.google.com") || url.contains("googleusercontent")) {
                    startGoogleSignIn();
                    return true;
                }

                try {
                    startActivity(new Intent(Intent.ACTION_VIEW, uri));
                    return true;
                } catch (Exception e) {
                    return false;
                }
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                view.evaluateJavascript("window.__BOOKLEGACY_ANDROID_APP=true;window.__BOOKLEGACY_ANDROID_VERSION='3.17';", null);
            }
        });

        webView.loadUrl(getString(R.string.booklegacy_app_url));
    }

    private void setupGoogleSignIn() {
        if (webClientId == null) webClientId = "";
        GoogleSignInOptions gso = new GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
                .requestEmail()
                .requestProfile()
                .requestIdToken(webClientId)
                .build();
        googleSignInClient = GoogleSignIn.getClient(this, gso);
    }

    private boolean isClientIdConfigured() {
        return webClientId != null
                && webClientId.endsWith(".apps.googleusercontent.com")
                && !webClientId.contains("PASTE_FIREBASE_WEB_CLIENT_ID_HERE");
    }

    private void startGoogleSignIn() {
        if (!isClientIdConfigured()) {
            String msg = "Web Client ID do Firebase não configurado no APK.";
            Toast.makeText(this, msg, Toast.LENGTH_LONG).show();
            injectLoginError(msg + " Edite android/app/src/main/res/values/booklegacy_config.xml.");
            return;
        }
        try {
            googleSignInClient.signOut().addOnCompleteListener(this, task -> {
                Intent signInIntent = googleSignInClient.getSignInIntent();
                startActivityForResult(signInIntent, RC_SIGN_IN);
            });
        } catch (Exception e) {
            injectLoginError("Erro ao abrir Google Sign-In: " + e.getMessage());
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == RC_SIGN_IN) {
            Task<GoogleSignInAccount> task = GoogleSignIn.getSignedInAccountFromIntent(data);
            try {
                GoogleSignInAccount account = task.getResult(ApiException.class);
                String idToken = account != null ? account.getIdToken() : null;
                if (idToken == null || idToken.length() == 0) {
                    injectLoginError("Google não retornou ID Token. Confira Web Client ID, package name e SHA-1 no Firebase.");
                    return;
                }
                injectGoogleToken(idToken);
            } catch (ApiException e) {
                injectLoginError("Google Sign-In falhou. Código: " + e.getStatusCode() + ". Confira Web Client ID e SHA-1 no Firebase.");
            } catch (Exception e) {
                injectLoginError("Google Sign-In falhou: " + e.getMessage());
            }
        }
    }

    private void injectGoogleToken(String idToken) {
        if (webView == null) return;
        String js = "window.bookLegacyNativeGoogleLogin && window.bookLegacyNativeGoogleLogin(" + JSONObject.quote(idToken) + ");";
        webView.post(() -> webView.evaluateJavascript(js, null));
    }

    private void injectLoginError(String message) {
        if (webView == null) return;
        String js = "window.bookLegacyNativeGoogleLoginError && window.bookLegacyNativeGoogleLoginError(" + JSONObject.quote(message) + ");";
        webView.post(() -> webView.evaluateJavascript(js, null));
    }

    public class NativeBridge {
        @JavascriptInterface
        public void signInWithGoogle() {
            runOnUiThread(() -> startGoogleSignIn());
        }

        @JavascriptInterface
        public String getVersion() {
            return "3.17";
        }
    }

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }
}

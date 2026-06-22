import { OAUTH_URLS } from "@/lib/auth-endpoints";

type OAuthProvider = "google" | "github";

interface OAuthResult {
  accessToken: string;
  refreshToken?: string;
}

/**
 * Opens OAuth provider in a popup window.
 * The backend should redirect to: /oauth2/{provider}/code?access_token=...&refresh_token=...
 * The callback page will post the tokens back via window.postMessage.
 */
export function openOAuthPopup(provider: OAuthProvider): Promise<OAuthResult> {
  return new Promise((resolve, reject) => {
    const url = OAUTH_URLS[provider];
    const width = 500;
    const height = 600;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    const popup = window.open(
      url,
      `oauth-${provider}`,
      `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no`
    );

    if (!popup) {
      reject(new Error("Popup blocked. Please allow popups for this site."));
      return;
    }

    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;

      if (event.data?.type === "oauth-callback") {
        window.removeEventListener("message", handleMessage);
        clearInterval(pollTimer);

        if (event.data.accessToken) {
          resolve({
            accessToken: event.data.accessToken,
            refreshToken: event.data.refreshToken,
          });
        } else {
          reject(new Error(event.data.error ?? "OAuth failed"));
        }
      }
    };

    window.addEventListener("message", handleMessage);

    // Poll to check if popup was closed manually
    const pollTimer = setInterval(() => {
      if (popup.closed) {
        clearInterval(pollTimer);
        window.removeEventListener("message", handleMessage);
        reject(new Error("Sign-in window was closed."));
      }
    }, 500);
  });
}

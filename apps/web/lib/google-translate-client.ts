/** Load Google Translate once and switch language via googtrans cookie (same as next-google-translate-widget). */

let scriptRequested = false;

function setCookie(name: string, value: string, domain?: string, path = "/") {
  document.cookie = `${name}=${value}${domain ? `;domain=${domain}` : ""};path=${path}`;
}

function ensureHiddenMount() {
  if (document.getElementById("google_translate_element")) return;
  const el = document.createElement("div");
  el.id = "google_translate_element";
  el.style.display = "none";
  document.body.appendChild(el);
}

export function readSavedLanguage(pageLanguage: string): string {
  if (typeof window === "undefined") return pageLanguage;
  return localStorage.getItem("ngt_lang") || pageLanguage;
}

export function applyGoogleTranslateLanguage(lang: string): void {
  document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/";
  document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; domain=${window.location.hostname}; path=/`;

  const cookieValue = `/auto/${lang}`;
  setCookie("googtrans", cookieValue);
  setCookie("googtrans", cookieValue, window.location.hostname);
  localStorage.setItem("ngt_lang", lang);
  window.location.reload();
}

export function loadGoogleTranslateScript(
  pageLanguage: string,
  onReady: () => void,
  onError?: () => void
): void {
  if (typeof window === "undefined") return;

  ensureHiddenMount();

  const init = () => {
    try {
      if (window.google?.translate?.TranslateElement) {
        new window.google.translate.TranslateElement(
          { pageLanguage, autoDisplay: false },
          "google_translate_element"
        );
      }
      onReady();
    } catch {
      onError?.();
      onReady();
    }
  };

  if (window.google?.translate?.TranslateElement) {
    init();
    return;
  }

  if (scriptRequested) {
    const poll = window.setInterval(() => {
      if (window.google?.translate?.TranslateElement) {
        window.clearInterval(poll);
        init();
      }
    }, 100);
    window.setTimeout(() => window.clearInterval(poll), 15_000);
    return;
  }

  scriptRequested = true;
  window.googleTranslateElementInit = init;

  if (document.getElementById("google-translate-script")) return;

  const script = document.createElement("script");
  script.id = "google-translate-script";
  script.src =
    "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
  script.async = true;
  script.onerror = () => {
    onError?.();
    onReady();
  };
  document.body.appendChild(script);
}

declare global {
  interface Window {
    googleTranslateElementInit?: () => void;
    google?: {
      translate?: {
        TranslateElement: new (
          options: { pageLanguage: string; autoDisplay: boolean },
          id: string
        ) => void;
      };
    };
  }
}

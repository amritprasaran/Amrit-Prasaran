export type WebShareOutcome = 'shared' | 'copied' | 'cancelled' | 'unsupported';

export interface WebSharePayload {
  title: string;
  text?: string;
  url: string;
}

export async function copyTextToClipboard(text: string): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fallback to execCommand below when Clipboard API is restricted
    }
  }

  if (typeof document !== 'undefined') {
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      textarea.style.pointerEvents = 'none';
      document.body.appendChild(textarea);
      textarea.select();
      const copied = document.execCommand('copy');
      document.body.removeChild(textarea);
      return copied;
    } catch {
      return false;
    }
  }

  return false;
}

export async function shareContentViaWebShare(
  payload: WebSharePayload
): Promise<WebShareOutcome> {
  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    let canAttemptShare = true;
    if (typeof navigator.canShare === 'function') {
      try {
        canAttemptShare = navigator.canShare(payload);
      } catch {
        canAttemptShare = true;
      }
    }

    if (canAttemptShare) {
      try {
        await navigator.share(payload);
        return 'shared';
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          return 'cancelled';
        }
        // Fall through to clipboard copy fallback when Web Share is blocked or unsupported
      }
    }
  }

  const copied = await copyTextToClipboard(payload.url);
  return copied ? 'copied' : 'unsupported';
}

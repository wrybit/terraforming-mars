// Puts the screenshot of a report into the clipboard, so the tester can paste it into the GitHub issue (the API
// cannot attach pictures). Browsers take only PNG; the JPEG of the report is converted on the way.

function pngOf(jpegDataUrl: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      canvas.getContext('2d')?.drawImage(image, 0, 0);
      canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('no PNG')), 'image/png');
    };
    image.onerror = () => reject(new Error('screenshot unreadable'));
    image.src = jpegDataUrl;
  });
}

/**
 * Must be called directly in the click (Safari allows the clipboard only there): the picture is handed over as a
 * promise and converted while the browser already holds the permission. False when the browser refuses.
 */
export async function copyScreenshot(jpegDataUrl: string): Promise<boolean> {
  if (jpegDataUrl === '' || typeof ClipboardItem === 'undefined' || navigator.clipboard?.write === undefined) {
    return false;
  }
  try {
    await navigator.clipboard.write([new ClipboardItem({'image/png': pngOf(jpegDataUrl)})]);
    return true;
  } catch {
    return false;
  }
}

export interface CompressImageOptions {
  maxDim?: number;
  quality?: number;
  maxLength?: number;
}

export function compressImageFileToDataUrl(
  file: File,
  options: CompressImageOptions = {}
): Promise<string> {
  const { maxDim = 1200, quality = 0.82, maxLength = 340000 } = options;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read selected image file.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Invalid image file.'));
      img.onload = () => {
        let currentDim = maxDim;
        let currentQuality = quality;
        let attempt = 0;

        while (attempt < 6) {
          const scale = Math.min(1, currentDim / Math.max(img.width, img.height));
          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, Math.round(img.width * scale));
          canvas.height = Math.max(1, Math.round(img.height * scale));
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(String(reader.result));
            return;
          }
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          const dataUrl = canvas.toDataURL('image/jpeg', currentQuality);
          if (dataUrl.length <= maxLength || attempt === 5) {
            resolve(dataUrl);
            return;
          }

          currentQuality = Math.max(0.45, currentQuality - 0.1);
          currentDim = Math.round(currentDim * 0.8);
          attempt += 1;
        }
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

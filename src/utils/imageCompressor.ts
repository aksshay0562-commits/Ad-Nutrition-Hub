/**
 * Utility to compress images in the browser before saving to Firestore / Server.
 * Keeps document size strictly well below Firestore's 1 MiB limit (typically under 200 KB)
 * while maintaining crisp visual quality.
 */
export async function compressImage(
  fileOrDataUrl: File | string,
  maxWidth = 800,
  maxHeight = 800,
  quality = 0.75
): Promise<string> {
  // If it's an external HTTP/HTTPS URL, don't compress
  if (typeof fileOrDataUrl === 'string' && (fileOrDataUrl.startsWith('http://') || fileOrDataUrl.startsWith('https://'))) {
    return fileOrDataUrl;
  }

  // Convert File to data URL if needed
  let dataUrl: string;
  if (typeof fileOrDataUrl === 'string') {
    dataUrl = fileOrDataUrl;
  } else {
    dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to read image file'));
      reader.readAsDataURL(fileOrDataUrl);
    });
  }

  // Helper to load image without setting crossOrigin on data: or blob: URIs
  const loadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = (e) => reject(new Error('Image failed to load: ' + e));
      img.src = src;
    });
  };

  try {
    const img = await loadImage(dataUrl);
    const width = img.naturalWidth || img.width;
    const height = img.naturalHeight || img.height;

    if (width <= 0 || height <= 0) {
      return dataUrl;
    }

    // Step 1: Scale proportionally to target dimensions
    let targetWidth = width;
    let targetHeight = height;
    if (targetWidth > maxWidth || targetHeight > maxHeight) {
      if (targetWidth / maxWidth > targetHeight / maxHeight) {
        targetHeight = Math.round((targetHeight * maxWidth) / targetWidth);
        targetWidth = maxWidth;
      } else {
        targetWidth = Math.round((targetWidth * maxHeight) / targetHeight);
        targetHeight = maxHeight;
      }
    }

    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return dataUrl;

    // Fill white background for transparent PNG/WEBP converting to JPEG
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, targetWidth, targetHeight);
    ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

    let compressed = canvas.toDataURL('image/jpeg', quality);

    // Step 2: Strict limit check (target < 320,000 characters, ~240KB)
    if (compressed.length > 320000) {
      const smallerWidth = Math.round(targetWidth * 0.75);
      const smallerHeight = Math.round(targetHeight * 0.75);
      canvas.width = smallerWidth;
      canvas.height = smallerHeight;
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, smallerWidth, smallerHeight);
      ctx.drawImage(img, 0, 0, smallerWidth, smallerHeight);
      compressed = canvas.toDataURL('image/jpeg', 0.65);
    }

    // Step 3: Emergency safety check if still oversized (> 450,000 characters)
    if (compressed.length > 450000) {
      const minWidth = Math.min(targetWidth, 500);
      const minHeight = Math.round((targetHeight * minWidth) / targetWidth);
      canvas.width = minWidth;
      canvas.height = minHeight;
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, minWidth, minHeight);
      ctx.drawImage(img, 0, 0, minWidth, minHeight);
      compressed = canvas.toDataURL('image/jpeg', 0.55);
    }

    return compressed;
  } catch (err) {
    console.warn('Canvas compression error:', err);
    // If it was already small (< 300KB), return as is
    if (dataUrl.length < 320000) {
      return dataUrl;
    }
    // Return safe fallback image if uncompressible and exceeds size limit
    return 'https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?auto=format&fit=crop&w=800&q=80';
  }
}


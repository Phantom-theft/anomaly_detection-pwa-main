/**
 * Image Optimization Utilities
 * 
 * This module provides utilities for:
 * - Image compression (JPEG/PNG)
 * - Lazy loading for images
 * - Responsive image srcset generator
 * - WebP format detection and serving
 */

/**
 * Check if the browser supports WebP format
 * @returns {boolean} - True if WebP is supported
 */
export const isWebPSupported = () => {
  const canvas = document.createElement('canvas');
  if (canvas.getContext && canvas.getContext('2d')) {
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  }
  return false;
};

/**
 * Compress an image file
 * @param {File} file - Image file to compress
 * @param {Object} options - Compression options
 * @returns {Promise<string>} - Base64 data URL of compressed image
 */
export const compressImage = async (file, options = {}) => {
  const {
    maxWidth = 1920,
    maxHeight = 1080,
    quality = 0.8,
    mimeType = 'image/jpeg'
  } = options;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;

        // Calculate new dimensions while maintaining aspect ratio
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#FFFFFF'; // White background for transparency
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        resolve(canvas.toDataURL(mimeType, quality));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * Generate responsive srcset for an image
 * @param {string} baseUrl - Base image URL
 * @param {number[]} widths - Array of widths for srcset
 * @returns {string} - srcset string
 */
export const generateSrcSet = (baseUrl, widths = [320, 640, 960, 1280, 1920]) => {
  return widths
    .map(width => `${baseUrl}?w=${width} ${width}w`)
    .join(', ');
};

/**
 * Create a lazy loading image component props
 * @param {string} src - Image source
 * @param {string} alt - Alt text
 * @param {Object} options - Additional options
 * @returns {Object} - Props for lazy loading image
 */
export const createLazyImageProps = (src, alt, options = {}) => {
  const {
    placeholder = null,
    className = '',
    sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'
  } = options;

  // Generate srcset if URL supports it
  const srcSet = src.includes('?') ? generateSrcSet(src.split('?')[0]) : '';

  return {
    src,
    alt,
    srcSet: srcSet || undefined,
    sizes,
    className,
    loading: 'lazy', // Native lazy loading
    decoding: 'async',
    onError: (e) => {
      // Fallback to placeholder on error
      if (placeholder) {
        e.target.src = placeholder;
      }
    }
  };
};

/**
 * Detect best image format for the browser
 * @returns {string} - Best mime type (webp if supported, else jpeg)
 */
export const getBestImageFormat = () => {
  return isWebPSupported() ? 'image/webp' : 'image/jpeg';
};

/**
 * Convert image to WebP format
 * @param {File} file - Image file to convert
 * @param {number} quality - Compression quality (0-1)
 * @returns {Promise<string>} - Base64 WebP data URL
 */
export const convertToWebP = (file, quality = 0.8) => {
  return compressImage(file, {
    quality,
    mimeType: 'image/webp'
  });
};

/**
 * Resize image to specific dimensions
 * @param {File} file - Image file to resize
 * @param {number} width - Target width
 * @param {number} height - Target height
 * @returns {Promise<string>} - Base64 data URL of resized image
 */
export const resizeImage = (file, width, height) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        resolve(canvas.toDataURL('image/jpeg', 0.9));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * Get image dimensions without loading the full image
 * @param {string} src - Image source URL
 * @returns {Promise<{width: number, height: number}>} - Image dimensions
 */
export const getImageDimensions = (src) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = reject;
    img.src = src;
  });
};

/**
 * Create an optimized image URL with query parameters
 * @param {string} url - Original image URL
 * @param {Object} params - Optimization parameters
 * @returns {string} - Optimized URL
 */
export const optimizeImageUrl = (url, params = {}) => {
  if (!url) return '';

  const {
    width,
    height,
    quality = 80,
    format
  } = params;

  const urlObj = new URL(url);
  
  if (width) urlObj.searchParams.set('w', width.toString());
  if (height) urlObj.searchParams.set('h', height.toString());
  if (quality) urlObj.searchParams.set('q', quality.toString());
  if (format && isWebPSupported()) urlObj.searchParams.set('fmt', format);

  return urlObj.toString();
};

/**
 * Preload images for faster display
 * @param {string[]} urls - Array of image URLs to preload
 * @returns {Promise<void>} - Promise that resolves when all images are loaded
 */
export const preloadImages = (urls) => {
  const promises = urls.map(url => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = () => resolve(); // Resolve even on error to continue
      img.src = url;
    });
  });

  return Promise.all(promises);
};

/**
 * Create a responsive image element with optimized loading
 * @param {Object} props - Image component props
 * @returns {React.Component} - Optimized image component
 */
export const createOptimizedImage = (props) => {
  const {
    src,
    alt,
    className = '',
    width,
    height,
    ...rest
  } = props;

  // Determine the best format
  const useWebP = isWebPSupported();
  
  // Build srcSet if we have a Cloudinary-like URL
  let srcSet = '';
  if (src && typeof src === 'string' && src.includes('cloudinary')) {
    const baseUrl = src.replace('/upload/', '/upload/f_auto,q_auto/');
    if (width) {
      srcSet = `${baseUrl},w_${width} ${width}w`;
    }
  }

  return (
    <img
      src={src}
      srcSet={srcSet || undefined}
      alt={alt}
      className={className}
      width={width}
      height={height}
      loading="lazy"
      decoding="async"
      {...rest}
    />
  );
};

export default {
  isWebPSupported,
  compressImage,
  generateSrcSet,
  createLazyImageProps,
  getBestImageFormat,
  convertToWebP,
  resizeImage,
  getImageDimensions,
  optimizeImageUrl,
  preloadImages,
  createOptimizedImage
};
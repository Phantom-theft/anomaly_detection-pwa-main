/**
 * Video Optimization Utilities
 * 
 * This module provides utilities for:
 * - Video thumbnail generation
 * - Video compression utility (for uploads)
 * - HLS stream quality detection
 */

/**
 * Generate a thumbnail from a video at a specific time
 * @param {string} videoUrl - URL of the video
 * @param {number} timeInSeconds - Time in seconds to capture thumbnail
 * @returns {Promise<string>} - Base64 data URL of the thumbnail
 */
export const generateVideoThumbnail = (videoUrl, timeInSeconds = 0) => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    video.crossOrigin = 'anonymous';
    video.preload = 'metadata';
    video.muted = true;

    video.onloadedmetadata = () => {
      // Seek to the specified time
      if (timeInSeconds > video.duration) {
        timeInSeconds = video.duration / 2; // Default to middle if out of bounds
      }
      video.currentTime = timeInSeconds;
    };

    video.onseeked = () => {
      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw the video frame to canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Get base64 data URL
      try {
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        resolve(dataUrl);
      } catch (e) {
        reject(e);
      }

      // Clean up
      video.src = '';
    };

    video.onerror = reject;
    video.src = videoUrl;
  });
};

/**
 * Generate multiple thumbnails at different time intervals
 * @param {string} videoUrl - URL of the video
 * @param {number} count - Number of thumbnails to generate
 * @returns {Promise<string[]>} - Array of base64 thumbnail data URLs
 */
export const generateVideoThumbnails = async (videoUrl, count = 4) => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    
    video.crossOrigin = 'anonymous';
    video.preload = 'metadata';
    video.muted = true;

    video.onloadedmetadata = () => {
      const duration = video.duration;
      const interval = duration / (count + 1);
      const thumbnails = [];
      let currentIndex = 0;

      const captureFrame = (time) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        video.currentTime = time;
        
        video.onseeked = () => {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx.drawImage(video, 0, 0);
          
          thumbnails.push(canvas.toDataURL('image/jpeg', 0.7));
          currentIndex++;

          if (currentIndex < count) {
            captureFrame((currentIndex + 1) * interval);
          } else {
            video.src = '';
            resolve(thumbnails);
          }
        };
      };

      captureFrame(interval);
    };

    video.onerror = reject;
    video.src = videoUrl;
  });
};

/**
 * Get video duration
 * @param {string} videoUrl - URL of the video
 * @returns {Promise<number>} - Duration in seconds
 */
export const getVideoDuration = (videoUrl) => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    
    video.onloadedmetadata = () => {
      resolve(video.duration);
      video.src = '';
    };
    
    video.onerror = reject;
    video.src = videoUrl;
  });
};

/**
 * Detect HLS stream quality levels
 * @param {string} hlsUrl - URL of the HLS stream
 * @returns {Promise<Object[]>} - Array of quality level objects
 */
export const detectHLSQualities = async (hlsUrl) => {
  // This would typically require hls.js library
  // For now, return a placeholder that can be enhanced
  if (typeof Hls !== 'undefined') {
    return new Promise((resolve) => {
      const hls = new Hls();
      hls.loadSource(hlsUrl);
      hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
        const qualities = data.levels.map((level, index) => ({
          index,
          height: level.height,
          width: level.width,
          bitrate: level.bitrate,
          label: `${level.height}p`
        }));
        hls.destroy();
        resolve(qualities);
      });
      hls.on(Hls.Events.ERROR, () => {
        hls.destroy();
        resolve([]);
      });
    });
  }
  
  // Fallback: Return mock data
  return [
    { index: 0, height: 240, width: 426, bitrate: 400000, label: '240p' },
    { index: 1, height: 360, width: 640, bitrate: 800000, label: '360p' },
    { index: 2, height: 480, width: 854, bitrate: 1500000, label: '480p' },
    { index: 3, height: 720, width: 1280, bitrate: 3000000, label: '720p' },
    { index: 4, height: 1080, width: 1920, bitrate: 5000000, label: '1080p' }
  ];
};

/**
 * Compress a video file for upload
 * Note: This requires a backend service or WebAssembly for actual compression
 * This is a placeholder that shows the API structure
 * @param {File} file - Video file to compress
 * @param {Object} options - Compression options
 * @returns {Promise<File>} - Compressed video file
 */
export const compressVideo = async (file, options = {}) => {
  const {
    maxWidth = 1920,
    maxHeight = 1080,
    maxDuration = 60 // seconds
  } = options;

  // This would typically use FFmpeg.wasm or a backend API
  // For now, return the original file with a warning
  console.warn('Video compression requires FFmpeg.wasm or backend processing');

  // Placeholder: Return original file
  // In production, this would call a compression API or use FFmpeg.wasm
  return file;
};

/**
 * Check if a video is HLS stream compatible
 * @param {string} videoUrl - URL to check
 * @returns {boolean} - True if URL looks like HLS stream
 */
export const isHLSStream = (videoUrl) => {
  if (!videoUrl) return false;
  return videoUrl.includes('.m3u8') || 
         videoUrl.includes('manifest.m3u8') || 
         videoUrl.includes('playlist.m3u8');
};

/**
 * Get video metadata without loading the entire video
 * @param {string} videoUrl - URL of the video
 * @returns {Promise<Object>} - Video metadata
 */
export const getVideoMetadata = (videoUrl) => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';

    video.onloadedmetadata = () => {
      resolve({
        duration: video.duration,
        width: video.videoWidth,
        height: video.videoHeight,
        hasAudio: !video.muted,
        isHLS: isHLSStream(videoUrl)
      });
      video.src = '';
    };

    video.onerror = reject;
    video.src = videoUrl;
  });
};

/**
 * Create a video poster URL for Cloudinary videos
 * @param {string} videoUrl - Cloudinary video URL
 * @param {Object} options - Poster options
 * @returns {string} - Poster image URL
 */
export const getVideoPoster = (videoUrl, options = {}) => {
  const {
    width = 640,
    time = '0'
  } = options;

  if (!videoUrl) return '';

  // Cloudinary format: /upload/videoPoster,w_640,so_0.jpg
  if (videoUrl.includes('cloudinary')) {
    return videoUrl
      .replace('/upload/', `/upload/w_${width},so_${time}/`)
      .replace('.mp4', '.jpg')
      .replace('.webm', '.jpg');
  }

  return videoUrl;
};

/**
 * Get supported video formats for the browser
 * @returns {Object} - Support status for different formats
 */
export const getVideoFormatSupport = () => {
  const video = document.createElement('video');
  
  return {
    mp4: video.canPlayType('video/mp4; codecs="avc1.42E01E, mp4a.40.2"') !== '',
    webm: video.canPlayType('video/webm; codecs="vp8, vorbis"') !== '',
    hls: video.canPlayType('application/vnd.apple.mpegurl') !== '' || typeof Hls !== 'undefined'
  };
};

/**
 * Select the best video source from multiple options
 * @param {Array} sources - Array of video source objects with url and type
 * @returns {string} - Best compatible video URL
 */
export const selectBestVideoSource = (sources) => {
  const support = getVideoFormatSupport();
  
  // Prefer HLS if available and supported
  const hlsSource = sources.find(s => s.type === 'application/vnd.apple.mpegurl' || s.url?.includes('.m3u8'));
  if (hlsSource && (support.hls || typeof Hls !== 'undefined')) {
    return hlsSource.url;
  }

  // Otherwise find supported format
  for (const source of sources) {
    if (source.type === 'video/mp4' && support.mp4) {
      return source.url;
    }
    if (source.type === 'video/webm' && support.webm) {
      return source.url;
    }
  }

  // Fallback to first source
  return sources[0]?.url || '';
};

/**
 * Create video player optimized props
 * @param {Object} props - Video element props
 * @returns {Object} - Optimized video props
 */
export const createOptimizedVideoProps = (props) => {
  const {
    src,
    poster,
    preload = 'metadata',
    playsInline = true,
    ...rest
  } = props;

  return {
    src,
    poster: poster || (src ? getVideoPoster(src) : undefined),
    preload,
    playsInline,
    muted: false, // Start unmuted for better UX
    controls: true,
    ...rest
  };
};

export default {
  generateVideoThumbnail,
  generateVideoThumbnails,
  getVideoDuration,
  detectHLSQualities,
  compressVideo,
  isHLSStream,
  getVideoMetadata,
  getVideoPoster,
  getVideoFormatSupport,
  selectBestVideoSource,
  createOptimizedVideoProps
};
export interface VideoSourceInfo {
  type: 'direct' | 'youtube' | 'vimeo' | 'googledrive' | 'canvas';
  embedUrl: string;
  isExternal: boolean;
  providerName: string;
}

/**
 * Parses any video URL (YouTube, Vimeo, Google Drive, direct MP4/WebM, S3)
 * into an optimized embed URL for zero-egress cost playback or HTML5 player.
 */
export function getVideoSourceInfo(url: string | undefined): VideoSourceInfo {
  if (!url || !url.trim()) {
    return {
      type: 'canvas',
      embedUrl: '',
      isExternal: false,
      providerName: 'Internal Canvas Engine'
    };
  }

  const cleanUrl = url.trim();

  // 1. YouTube Detection
  // Matches: youtube.com/watch?v=ID, youtu.be/ID, youtube.com/embed/ID, youtube.com/shorts/ID
  const ytMatch = cleanUrl.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
  if (ytMatch && ytMatch[1]) {
    const videoId = ytMatch[1];
    return {
      type: 'youtube',
      embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&enablejsapi=1&rel=0&modestbranding=1`,
      isExternal: true,
      providerName: 'YouTube'
    };
  }

  // 2. Vimeo Detection
  // Matches: vimeo.com/123456789, player.vimeo.com/video/123456789
  const vimeoMatch = cleanUrl.match(/(?:vimeo\.com\/|player\.vimeo\.com\/video\/)(\d+)/i);
  if (vimeoMatch && vimeoMatch[1]) {
    const vimeoId = vimeoMatch[1];
    return {
      type: 'vimeo',
      embedUrl: `https://player.vimeo.com/video/${vimeoId}?autoplay=1&title=0&byline=0&portrait=0`,
      isExternal: true,
      providerName: 'Vimeo'
    };
  }

  // 3. Google Drive Preview Link Detection
  // Matches: drive.google.com/file/d/FILE_ID/view..., drive.google.com/open?id=FILE_ID
  const gDriveMatch = cleanUrl.match(/drive\.google\.com\/(?:file\/d\/([a-zA-Z0-9_-]+)|open\?id=([a-zA-Z0-9_-]+))/i);
  if (gDriveMatch) {
    const fileId = gDriveMatch[1] || gDriveMatch[2];
    return {
      type: 'googledrive',
      embedUrl: `https://drive.google.com/file/d/${fileId}/preview`,
      isExternal: true,
      providerName: 'Google Drive'
    };
  }

  // 4. Direct video files or Cloud Storage (S3, GCS, CloudFront)
  return {
    type: 'direct',
    embedUrl: cleanUrl,
    isExternal: false,
    providerName: 'Direct Video / S3 Storage'
  };
}

const getApiBaseUrl = () => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';
  return apiUrl.replace(/\/api\/?$/, '').replace(/\/$/, '');
};

const extractDriveFileId = (url: string) => {
  try {
    const parsedUrl = new URL(url);
    if (!parsedUrl.hostname.includes('drive.google.com')) return null;

    const queryId = parsedUrl.searchParams.get('id');
    if (queryId) return queryId;

    const filePathMatch = parsedUrl.pathname.match(/\/file\/d\/([^/]+)/);
    return filePathMatch?.[1] || null;
  } catch {
    return null;
  }
};

export const getRenderableImageUrl = (url?: string | null) => {
  if (!url) return '';

  const driveFileId = extractDriveFileId(url);
  if (!driveFileId) return url;

  return `${getApiBaseUrl()}/api/file-upload/drive-file/${driveFileId}`;
};

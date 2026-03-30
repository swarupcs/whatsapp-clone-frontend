import {
  FileText, FileImage, FileVideo, FileAudio, FileArchive,
  FileSpreadsheet, FileCode, File,
} from 'lucide-react';

export type FileCategory =
  | 'IMAGE' | 'VIDEO' | 'AUDIO' | 'DOCUMENT'
  | 'SPREADSHEET' | 'PRESENTATION' | 'ARCHIVE' | 'OTHER';

interface FileTypeInfo {
  category: FileCategory;
  icon: typeof File;
  color: string;
  previewable: boolean;
}

const FILE_TYPE_MAP: Record<string, FileTypeInfo> = {
  'image/jpeg':   { category: 'IMAGE', icon: FileImage, color: 'text-blue-400', previewable: true },
  'image/png':    { category: 'IMAGE', icon: FileImage, color: 'text-blue-400', previewable: true },
  'image/gif':    { category: 'IMAGE', icon: FileImage, color: 'text-blue-400', previewable: true },
  'image/webp':   { category: 'IMAGE', icon: FileImage, color: 'text-blue-400', previewable: true },
  'image/svg+xml':{ category: 'IMAGE', icon: FileImage, color: 'text-blue-400', previewable: true },
  'video/mp4':    { category: 'VIDEO', icon: FileVideo, color: 'text-purple-400', previewable: true },
  'video/webm':   { category: 'VIDEO', icon: FileVideo, color: 'text-purple-400', previewable: true },
  'video/mpeg':   { category: 'VIDEO', icon: FileVideo, color: 'text-purple-400', previewable: true },
  'video/quicktime': { category: 'VIDEO', icon: FileVideo, color: 'text-purple-400', previewable: true },
  'audio/mpeg':   { category: 'AUDIO', icon: FileAudio, color: 'text-green-400', previewable: false },
  'audio/mp3':    { category: 'AUDIO', icon: FileAudio, color: 'text-green-400', previewable: false },
  'audio/wav':    { category: 'AUDIO', icon: FileAudio, color: 'text-green-400', previewable: false },
  'audio/ogg':    { category: 'AUDIO', icon: FileAudio, color: 'text-green-400', previewable: false },
  'audio/webm':   { category: 'AUDIO', icon: FileAudio, color: 'text-green-400', previewable: false },
  'application/pdf': { category: 'DOCUMENT', icon: FileText, color: 'text-red-400', previewable: false },
  'application/msword': { category: 'DOCUMENT', icon: FileText, color: 'text-blue-500', previewable: false },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
    { category: 'DOCUMENT', icon: FileText, color: 'text-blue-500', previewable: false },
  'text/plain':   { category: 'DOCUMENT', icon: FileText, color: 'text-gray-400', previewable: false },
  'application/vnd.ms-excel': { category: 'SPREADSHEET', icon: FileSpreadsheet, color: 'text-green-500', previewable: false },
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
    { category: 'SPREADSHEET', icon: FileSpreadsheet, color: 'text-green-500', previewable: false },
  'text/csv':     { category: 'SPREADSHEET', icon: FileSpreadsheet, color: 'text-green-500', previewable: false },
  'application/vnd.ms-powerpoint': { category: 'PRESENTATION', icon: FileCode, color: 'text-orange-400', previewable: false },
  'application/vnd.openxmlformats-officedocument.presentationml.presentation':
    { category: 'PRESENTATION', icon: FileCode, color: 'text-orange-400', previewable: false },
  'application/zip': { category: 'ARCHIVE', icon: FileArchive, color: 'text-yellow-400', previewable: false },
  'application/x-rar-compressed': { category: 'ARCHIVE', icon: FileArchive, color: 'text-yellow-400', previewable: false },
  'application/x-7z-compressed':  { category: 'ARCHIVE', icon: FileArchive, color: 'text-yellow-400', previewable: false },
};

export function getFileTypeInfo(mimeType: string): FileTypeInfo {
  return FILE_TYPE_MAP[mimeType] ?? {
    category: 'OTHER', icon: File, color: 'text-muted-foreground', previewable: false,
  };
}

export function getFileCategory(mimeType: string): FileCategory {
  return getFileTypeInfo(mimeType).category;
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function getAcceptedFileTypes(): string {
  return Object.keys(FILE_TYPE_MAP).join(',');
}

export async function generateVideoThumbnail(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    video.preload = 'metadata';
    video.src = URL.createObjectURL(file);
    video.onloadedmetadata = () => { video.currentTime = 0.5; };
    video.onseeked = () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx?.drawImage(video, 0, 0);
      URL.revokeObjectURL(video.src);
      resolve(canvas.toDataURL('image/jpeg', 0.7));
    };
    video.onerror = () => reject(new Error('Failed to generate thumbnail'));
  });
}

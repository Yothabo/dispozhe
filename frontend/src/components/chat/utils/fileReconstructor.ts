import { FileMessage } from '../types';

interface FileChunk {
  fileId: string;
  chunks: string[];
  totalChunks: number;
  fileName: string;
  fileType: string;
  timestamp: number;
}

export class FileReconstructor {
  private chunks: Map<string, FileChunk> = new Map();

  addChunk(data: any): FileMessage | null {
    if (!this.chunks.has(data.fileId)) {
      this.chunks.set(data.fileId, {
        fileId: data.fileId,
        chunks: [],
        totalChunks: data.totalChunks,
        fileName: data.fileName,
        fileType: data.fileType,
        timestamp: data.timestamp
      });
    }

    const fileData = this.chunks.get(data.fileId)!;
    fileData.chunks[data.chunkIndex] = data.chunk;

    if (fileData.chunks.length === data.totalChunks &&
        fileData.chunks.every(c => c !== undefined)) {

      const completeBase64 = fileData.chunks.join('');
      this.chunks.delete(data.fileId);

      return {
        id: data.fileId,
        name: fileData.fileName,
        type: fileData.fileType,
        size: Math.round(completeBase64.length * 0.75),
        data: completeBase64,
        viewOnce: true,
        viewed: false
      };
    }
    return null;
  }
}

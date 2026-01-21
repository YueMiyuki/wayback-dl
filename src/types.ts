export interface WaybackSnapshot {
  timestamp: string;
  original: string;
  mimetype: string;
  statuscode: string;
  digest: string;
  length: string;
}

export interface DownloadTask {
  url: string;
  timestamp: string;
  outputPath: string;
  status: "pending" | "downloading" | "completed" | "failed";
  error?: string;
  size?: number;
}

export interface DownloadProgress {
  total: number;
  completed: number;
  failed: number;
  currentSpeed: number;
  bytesDownloaded: number;
}

export interface WaybackCDXResponse {
  timestamp: string;
  original: string;
  mimetype: string;
  statuscode: string;
  digest: string;
  length: string;
}

export interface Config {
  domain: string;
  outputDir: string;
  concurrency: number;
  selectedTimestamps: string[];
  retryAttempts: number;
  timeout: number;
}

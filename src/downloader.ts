import { dirname, join } from "@std/path";
import { ensureDir } from "@std/fs";
import type { DownloadProgress, DownloadTask } from "./types.ts";
import { buildWaybackRawUrl } from "./wayback-api.ts";
import {
  formatBytes,
  formatDuration,
  printError,
  printSuccess,
  ProgressBar,
  style,
} from "./console.ts";

export class ParallelDownloader {
  private concurrency: number;
  private retryAttempts: number;
  private timeout: number;
  private outputDir: string;
  private tasks: DownloadTask[] = [];
  private progress: DownloadProgress = {
    total: 0,
    completed: 0,
    failed: 0,
    currentSpeed: 0,
    bytesDownloaded: 0,
  };

  constructor(
    outputDir: string,
    concurrency = 5,
    retryAttempts = 3,
    timeout = 30000,
  ) {
    this.outputDir = outputDir;
    this.concurrency = concurrency;
    this.retryAttempts = retryAttempts;
    this.timeout = timeout;
  }

  addTask(url: string, timestamp: string): void {
    const outputPath = this.urlToFilePath(url);
    this.tasks.push({
      url,
      timestamp,
      outputPath,
      status: "pending",
    });
  }

  addTasks(items: Array<{ url: string; timestamp: string }>): void {
    items.forEach(({ url, timestamp }) => this.addTask(url, timestamp));
  }

  private urlToFilePath(url: string): string {
    try {
      const parsed = new URL(url);
      let pathname = parsed.pathname;

      // Handle root path
      if (pathname === "/" || pathname === "") {
        pathname = "/index.html";
      }

      
      if (!pathname.includes(".") || pathname.endsWith("/")) {
        pathname = pathname.replace(/\/$/, "") + "/index.html";
      }

      
      pathname = pathname.replace(/\/+/g, "/");

      
      let filename = pathname;
      if (parsed.search) {
        const queryHash = this.hashString(parsed.search);
        const ext = pathname.includes(".") ? pathname.split(".").pop() : "html";
        const base = pathname.includes(".")
          ? pathname.slice(0, pathname.lastIndexOf("."))
          : pathname;
        filename = `${base}_${queryHash}.${ext}`;
      }

      return join(this.outputDir, parsed.hostname, filename);
    } catch {
      
      const sanitized = url
        .replace(/[^a-zA-Z0-9.-]/g, "_")
        .slice(0, 200);
      return join(this.outputDir, sanitized);
    }
  }

  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16).slice(0, 8);
  }

  private async downloadWithRetry(task: DownloadTask): Promise<boolean> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        const waybackUrl = buildWaybackRawUrl(task.url, task.timestamp);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        const response = await fetch(waybackUrl, {
          signal: controller.signal,
          headers: {
            "User-Agent": "Mozilla/5.0 (compatible; WaybackDownloader/1.0)",
          },
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.arrayBuffer();
        task.size = data.byteLength;

        
        await ensureDir(dirname(task.outputPath));

        
        await Deno.writeFile(task.outputPath, new Uint8Array(data));

        return true;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (attempt < this.retryAttempts) {
          
          await new Promise((resolve) =>
            setTimeout(resolve, Math.pow(2, attempt) * 1000)
          );
        }
      }
    }

    task.error = lastError?.message || "Unknown error";
    return false;
  }

  async download(): Promise<DownloadProgress> {
    this.progress.total = this.tasks.length;

    if (this.tasks.length === 0) {
      return this.progress;
    }

    console.log(
      `\n  ${style.cyan("📥")} Starting download of ${
        style.bold(
          this.tasks.length.toString(),
        )
      } files with ${
        style.bold(this.concurrency.toString())
      } parallel connections\n`,
    );

    const progressBar = new ProgressBar(this.tasks.length);
    const startTime = Date.now();

    // Create a queue of pending tasks
    const pendingTasks = [...this.tasks];
    const activePromises: Promise<void>[] = [];

    const processNext = async (): Promise<void> => {
      while (pendingTasks.length > 0) {
        const task = pendingTasks.shift();
        if (!task) break;

        task.status = "downloading";

        const success = await this.downloadWithRetry(task);

        if (success) {
          task.status = "completed";
          this.progress.completed++;
          this.progress.bytesDownloaded += task.size || 0;
        } else {
          task.status = "failed";
          this.progress.failed++;
        }

        progressBar.update(
          this.progress.completed + this.progress.failed,
          this.progress.bytesDownloaded,
          this.progress.failed,
        );
      }
    };

    // Start workers
    for (let i = 0; i < this.concurrency; i++) {
      activePromises.push(processNext());
    }

    await Promise.all(activePromises);

    progressBar.finish();

    const elapsed = Date.now() - startTime;
    this.progress.currentSpeed = this.progress.bytesDownloaded /
      (elapsed / 1000);

    // Print summary
    console.log();
    printSuccess(
      `Downloaded ${style.bold(this.progress.completed.toString())} files (${
        formatBytes(
          this.progress.bytesDownloaded,
        )
      }) in ${formatDuration(elapsed)}`,
    );

    if (this.progress.failed > 0) {
      printError(
        `Failed to download ${
          style.bold(this.progress.failed.toString())
        } files`,
      );

      // List failed files
      const failedTasks = this.tasks.filter((t) => t.status === "failed");
      console.log(style.dim("\n  Failed files:"));
      failedTasks.slice(0, 10).forEach((t) => {
        console.log(style.dim(`    - ${t.url}`));
        if (t.error) {
          console.log(style.dim(style.red(`      Error: ${t.error}`)));
        }
      });
      if (failedTasks.length > 10) {
        console.log(style.dim(`    ... and ${failedTasks.length - 10} more`));
      }
    }

    return this.progress;
  }

  getFailedTasks(): DownloadTask[] {
    return this.tasks.filter((t) => t.status === "failed");
  }

  getTasks(): DownloadTask[] {
    return this.tasks;
  }
}

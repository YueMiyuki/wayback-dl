

const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  underscore: "\x1b[4m",
  blink: "\x1b[5m",
  reverse: "\x1b[7m",
  hidden: "\x1b[8m",

  black: "\x1b[30m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",

  bgBlack: "\x1b[40m",
  bgRed: "\x1b[41m",
  bgGreen: "\x1b[42m",
  bgYellow: "\x1b[43m",
  bgBlue: "\x1b[44m",
  bgMagenta: "\x1b[45m",
  bgCyan: "\x1b[46m",
  bgWhite: "\x1b[47m",
};

export const style = {
  bold: (text: string) => `${colors.bright}${text}${colors.reset}`,
  dim: (text: string) => `${colors.dim}${text}${colors.reset}`,
  red: (text: string) => `${colors.red}${text}${colors.reset}`,
  green: (text: string) => `${colors.green}${text}${colors.reset}`,
  yellow: (text: string) => `${colors.yellow}${text}${colors.reset}`,
  blue: (text: string) => `${colors.blue}${text}${colors.reset}`,
  magenta: (text: string) => `${colors.magenta}${text}${colors.reset}`,
  cyan: (text: string) => `${colors.cyan}${text}${colors.reset}`,
  white: (text: string) => `${colors.white}${text}${colors.reset}`,
  bgBlue: (text: string) =>
    `${colors.bgBlue}${colors.white}${text}${colors.reset}`,
  bgGreen: (text: string) =>
    `${colors.bgGreen}${colors.black}${text}${colors.reset}`,
  bgRed: (text: string) =>
    `${colors.bgRed}${colors.white}${text}${colors.reset}`,
  bgYellow: (text: string) =>
    `${colors.bgYellow}${colors.black}${text}${colors.reset}`,
};

export const icons = {
  success: style.green("✔"),
  error: style.red("✖"),
  warning: style.yellow("⚠"),
  info: style.blue("ℹ"),
  arrow: style.cyan("➜"),
  download: style.cyan("⬇"),
  folder: style.yellow("📁"),
  file: style.blue("📄"),
  clock: style.magenta("⏱"),
  rocket: "🚀",
  globe: "🌐",
  sparkles: "✨",
  package: "📦",
};

export function printBanner(): void {
  const banner = `
${
    style.cyan(
      "╔════════════════════════════════════════════════════════════════╗",
    )
  }
${style.cyan("║")}   ${
    style.bold(
      style.magenta(
        "██╗    ██╗ █████╗ ██╗   ██╗██████╗  █████╗  ██████╗██╗  ██╗",
      ),
    )
  }   ${style.cyan("║")}
${style.cyan("║")}   ${
    style.bold(
      style.magenta(
        "██║    ██║██╔══██╗╚██╗ ██╔╝██╔══██╗██╔══██╗██╔════╝██║ ██╔╝",
      ),
    )
  }   ${style.cyan("║")}
${style.cyan("║")}   ${
    style.bold(
      style.magenta(
        "██║ █╗ ██║███████║ ╚████╔╝ ██████╔╝███████║██║     █████╔╝ ",
      ),
    )
  }   ${style.cyan("║")}
${style.cyan("║")}   ${
    style.bold(
      style.magenta(
        "██║███╗██║██╔══██║  ╚██╔╝  ██╔══██╗██╔══██║██║     ██╔═██╗ ",
      ),
    )
  }   ${style.cyan("║")}
${style.cyan("║")}   ${
    style.bold(
      style.magenta(
        "╚███╔███╔╝██║  ██║   ██║   ██████╔╝██║  ██║╚██████╗██║  ██╗",
      ),
    )
  }   ${style.cyan("║")}
${style.cyan("║")}   ${
    style.bold(
      style.magenta(
        " ╚══╝╚══╝ ╚═╝  ╚═╝   ╚═╝   ╚═════╝ ╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝",
      ),
    )
  }   ${style.cyan("║")}
${
    style.cyan("║")
  }                                                                ${
    style.cyan("║")
  }
${style.cyan("║")}      ${
    style.bold(style.white("Wayback Machine Downloader"))
  } ${style.dim("v1.0.0")}                        ${style.cyan("║")}
${style.cyan("║")}      ${
    style.dim("Download archived websites with style")
  } ${icons.sparkles}                  ${style.cyan("║")}
${
    style.cyan(
      "╚════════════════════════════════════════════════════════════════╝",
    )
  }
`;
  console.log(banner);
}

export function printSection(title: string): void {
  console.log(`\n${style.bold(style.cyan("━".repeat(60)))}`);
  console.log(`  ${icons.arrow} ${style.bold(title)}`);
  console.log(`${style.dim(style.cyan("━".repeat(60)))}\n`);
}

export function printSuccess(message: string): void {
  console.log(`  ${icons.success} ${style.green(message)}`);
}

export function printError(message: string): void {
  console.log(`  ${icons.error} ${style.red(message)}`);
}

export function printWarning(message: string): void {
  console.log(`  ${icons.warning} ${style.yellow(message)}`);
}

export function printInfo(message: string): void {
  console.log(`  ${icons.info} ${style.blue(message)}`);
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

export function formatTimestamp(timestamp: string): string {
  if (timestamp.length !== 14) return timestamp;
  const year = timestamp.slice(0, 4);
  const month = timestamp.slice(4, 6);
  const day = timestamp.slice(6, 8);
  const hour = timestamp.slice(8, 10);
  const minute = timestamp.slice(10, 12);
  const second = timestamp.slice(12, 14);
  return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
}

export class ProgressBar {
  private total: number;
  private current: number;
  private barWidth: number;
  private startTime: number;
  private lastUpdate: number;
  private bytesDownloaded: number;
  private failed: number;

  constructor(total: number, barWidth = 40) {
    this.total = total;
    this.current = 0;
    this.barWidth = barWidth;
    this.startTime = Date.now();
    this.lastUpdate = 0;
    this.bytesDownloaded = 0;
    this.failed = 0;
  }

  update(
    current: number,
    bytesDownloaded: number = 0,
    failed: number = 0,
  ): void {
    this.current = current;
    this.bytesDownloaded = bytesDownloaded;
    this.failed = failed;

    const now = Date.now();
    if (now - this.lastUpdate < 100 && current < this.total) return;
    this.lastUpdate = now;

    this.render();
  }

  private render(): void {
    const percentage = Math.min(
      100,
      Math.round((this.current / this.total) * 100),
    );
    const filledWidth = Math.round((this.current / this.total) * this.barWidth);
    const emptyWidth = this.barWidth - filledWidth;

    const filledBar = style.green("█".repeat(filledWidth));
    const emptyBar = style.dim("░".repeat(emptyWidth));

    const elapsed = Date.now() - this.startTime;
    const speed = this.bytesDownloaded / (elapsed / 1000);
    const eta = this.current > 0
      ? ((this.total - this.current) / this.current) * elapsed
      : 0;

    const statusLine = [
      `\r  ${icons.download} Progress: ${filledBar}${emptyBar}`,
      `${style.bold(percentage.toString().padStart(3))}%`,
      `${style.cyan(`[${this.current}/${this.total}]`)}`,
      `${style.magenta(`${formatBytes(speed)}/s`)}`,
      `${style.yellow(`ETA: ${formatDuration(eta)}`)}`,
      this.failed > 0 ? style.red(`[${this.failed} failed]`) : "",
    ].filter(Boolean).join(" ");

    Deno.stdout.writeSync(new TextEncoder().encode(statusLine + "  "));
  }

  finish(): void {
    this.current = this.total;
    this.render();
    console.log(); 
  }
}

export class Spinner {
  private frames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
  private currentFrame = 0;
  private intervalId: number | null = null;
  private message: string;

  constructor(message: string) {
    this.message = message;
  }

  start(): void {
    this.intervalId = setInterval(() => {
      const frame = style.cyan(this.frames[this.currentFrame]);
      Deno.stdout.writeSync(
        new TextEncoder().encode(`\r  ${frame} ${this.message}`),
      );
      this.currentFrame = (this.currentFrame + 1) % this.frames.length;
    }, 80);
  }

  stop(success = true): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    const icon = success ? icons.success : icons.error;
    console.log(`\r  ${icon} ${this.message}`);
  }

  updateMessage(message: string): void {
    this.message = message;
  }
}

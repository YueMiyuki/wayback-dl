import { Checkbox, Confirm, Input, Number } from "@cliffy/prompt";
import { join } from "@std/path";
import { ensureDir } from "@std/fs";

import {
  formatBytes,
  formatTimestamp,
  icons,
  printBanner,
  printError,
  printInfo,
  printSection,
  printSuccess,
  printWarning,
  style,
} from "./console.ts";
import { fetchAllUrls, getAvailableTimestamps } from "./wayback-api.ts";
import { ParallelDownloader } from "./downloader.ts";

async function main() {
  printBanner();

  
  printSection("Configuration");

  const domain = await Input.prompt({
    message:
      `${icons.globe} Enter the domain/URL to download (e.g., example.com or https://example.com/path/)`,
    validate: (value) => {
      if (!value.trim()) return "Domain/URL is required";
      return true;
    },
    transform: (value) => {
      
      return value.trim();
    },
  });

  
  printSection("Auto Discovery");

  const timestampInfos = await getAvailableTimestamps(domain);

  if (timestampInfos.length === 0) {
    printError(`No archived snapshots found for ${domain}`);
    printInfo("Try checking the domain spelling or try a different domain.");
    Deno.exit(1);
  }

  
  console.log(`\n  ${style.bold("Available Snapshots:")}\n`);

  const selectedTimestamps = await Checkbox.prompt({
    message: `${icons.clock} Select timestamp(s) to download`,
    options: timestampInfos.map((info, index) => ({
      name: `${style.cyan(formatTimestamp(info.timestamp))} ${
        style.dim(`| ${info.mimetype} | ${formatBytes(info.size)}`)
      }`,
      value: info.timestamp,
      checked: index === 0, 
    })),
    minOptions: 1,
  });

  printSuccess(
    `Selected ${style.bold(selectedTimestamps.length.toString())} timestamp(s)`,
  );

  
  
  printSection("Fetching Available Assets");

  const { snapshots, totalAssets } = await fetchAllUrls(domain, {});

  if (snapshots.length === 0) {
    printError("No assets found for this domain");
    Deno.exit(1);
  }

  printSuccess(
    `Found ${
      style.bold(snapshots.length.toString())
    } unique URLs (${totalAssets} total assets)`,
  );

  
  const byMimeType = snapshots.reduce((acc, s) => {
    const type = s.mimetype.split(";")[0].trim();
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  console.log(`\n  ${style.bold("Content breakdown:")}`);
  Object.entries(byMimeType)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .forEach(([type, count]) => {
      const bar = style.cyan(
        "█".repeat(Math.min(30, Math.round((count / snapshots.length) * 30))),
      );
      console.log(`    ${style.dim(type.padEnd(30))} ${bar} ${count}`);
    });

  
  const contentTypes = await Checkbox.prompt({
    message: `${icons.file} Select content types to download`,
    options: [
      { name: "HTML pages", value: "text/html", checked: true },
      { name: "CSS stylesheets", value: "text/css", checked: true },
      {
        name: "JavaScript files",
        value: "application/javascript",
        checked: true,
      },
      { name: "Images", value: "image/", checked: true },
      { name: "JSON data", value: "application/json", checked: false },
      { name: "Other files", value: "other", checked: false },
    ],
  });

  
  const filteredSnapshots = snapshots.filter((s) => {
    const mime = s.mimetype.split(";")[0].trim();
    return contentTypes.some((ct) => {
      if (ct === "other") {
        return ![
          "text/html",
          "text/css",
          "application/javascript",
          "application/json",
        ].includes(mime) &&
          !mime.startsWith("image/");
      }
      return mime.startsWith(ct) || mime === ct;
    });
  });

  if (filteredSnapshots.length === 0) {
    printWarning("No files match the selected content types");
    Deno.exit(1);
  }

  printInfo(`${filteredSnapshots.length} files selected for download`);

  
  const estimatedSize = filteredSnapshots.reduce(
    (acc, s) => acc + (parseInt(s.length) || 0),
    0,
  );
  printInfo(`Estimated download size: ${formatBytes(estimatedSize)}`);

  
  printSection("Download Settings");

  
  let domainName: string;
  try {
    const url = domain.startsWith("http") ? domain : `https://${domain}`;
    domainName = new URL(url).hostname;
  } catch {
    domainName = domain.replace(/[^a-zA-Z0-9.-]/g, "_");
  }

  const outputDir = await Input.prompt({
    message: `${icons.folder} Output directory`,
    default: join(
      Deno.cwd(),
      "wayback-downloads",
      domainName.replace(/\./g, "_"),
    ),
  });

  const concurrency = await Number.prompt({
    message: `${icons.rocket} Parallel downloads (1-20)`,
    default: 5,
    min: 1,
    max: 20,
  });

  
  const confirm = await Confirm.prompt({
    message: `Download ${
      style.bold(filteredSnapshots.length.toString())
    } files to ${style.cyan(outputDir)}?`,
    default: true,
  });

  if (!confirm) {
    printWarning("Download cancelled");
    Deno.exit(0);
  }

  
  await ensureDir(outputDir);

  
  printSection("Downloading");

  const downloader = new ParallelDownloader(outputDir, concurrency, 3, 30000);

  
  
  const downloadTimestamp = selectedTimestamps[0];
  printInfo(
    `Using timestamp: ${style.cyan(formatTimestamp(downloadTimestamp))}`,
  );

  
  downloader.addTasks(
    filteredSnapshots.map((s) => ({
      url: s.original,
      timestamp: downloadTimestamp, 
    })),
  );

  
  const result = await downloader.download();

  
  printSection("Summary");

  console.log(`
  ${style.bold("Download Complete!")} ${icons.sparkles}

  ${icons.success} ${style.green("Completed:")} ${result.completed} files
  ${
    result.failed > 0
      ? `${icons.error} ${style.red("Failed:")} ${result.failed} files`
      : ""
  }
  ${icons.download} ${style.cyan("Total size:")} ${
    formatBytes(result.bytesDownloaded)
  }
  ${icons.folder} ${style.yellow("Output:")} ${outputDir}
`);

  
  if (result.failed > 0) {
    const retryFailed = await Confirm.prompt({
      message: "Would you like to retry failed downloads?",
      default: false,
    });

    if (retryFailed) {
      const failedTasks = downloader.getFailedTasks();
      const retryDownloader = new ParallelDownloader(
        outputDir,
        concurrency,
        5,
        60000,
      );
      retryDownloader.addTasks(
        failedTasks.map((t) => ({
          url: t.url,
          timestamp: t.timestamp,
        })),
      );
      await retryDownloader.download();
    }
  }

  
  const reportPath = join(outputDir, "download-report.json");
  const report = {
    domain,
    downloadDate: new Date().toISOString(),
    totalFiles: filteredSnapshots.length,
    completed: result.completed,
    failed: result.failed,
    bytesDownloaded: result.bytesDownloaded,
    tasks: downloader.getTasks().map((t) => ({
      url: t.url,
      timestamp: t.timestamp,
      status: t.status,
      outputPath: t.outputPath,
      error: t.error,
    })),
  };

  await Deno.writeTextFile(reportPath, JSON.stringify(report, null, 2));
  printSuccess(`Download report saved to ${style.cyan(reportPath)}`);

  console.log(
    `\n  ${
      style.dim("Thank you for using Wayback Downloader!")
    } ${icons.sparkles}\n`,
  );
}


main().catch((error) => {
  printError(`Fatal error: ${error.message}`);
  Deno.exit(1);
});

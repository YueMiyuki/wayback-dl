import type { WaybackSnapshot } from "./types.ts";
import { printError, printInfo, Spinner, style } from "./console.ts";

const CDX_API_URL = "https://web.archive.org/cdx/search/cdx";

export interface FetchOptions {
  matchType?: "exact" | "prefix" | "host" | "domain";
  filter?: string[];
  collapse?: string;
  limit?: number;
  from?: string;
  to?: string;
}

// Parse CDX JSON response
// JSON format: [["urlkey","timestamp","original",...], ["data1","data2",...], ...]
function parseCDXJsonResponse(data: string[][]): WaybackSnapshot[] {
  if (!Array.isArray(data) || data.length < 2) {
    return [];
  }

  const rows = data.slice(1);
  const snapshots: WaybackSnapshot[] = [];

  for (const row of rows) {
    if (row.length >= 7) {
      snapshots.push({
        timestamp: row[1],
        original: row[2],
        mimetype: row[3],
        statuscode: row[4],
        digest: row[5],
        length: row[6],
      });
    }
  }

  return snapshots;
}

async function getNumPages(
  url: string,
  extraParams?: URLSearchParams,
): Promise<number> {
  try {
    const params = new URLSearchParams({
      url,
      showNumPages: "true",
      output: "json",
    });

    if (extraParams) {
      extraParams.forEach((value, key) => {
        if (
          key !== "url" && key !== "showNumPages" && key !== "output" &&
          key !== "page"
        ) {
          params.set(key, value);
        }
      });
    }

    const response = await fetch(`${CDX_API_URL}?${params.toString()}`);
    if (!response.ok) return 1;

    const data = await response.json();
    if (Array.isArray(data) && data.length >= 2 && Array.isArray(data[1])) {
      return parseInt(data[1][0]) || 1;
    }
    return 1;
  } catch {
    return 1;
  }
}

export interface DiscoveryResult {
  snapshots: WaybackSnapshot[];
  totalAssets: number;
}

export async function fetchSnapshots(
  url: string,
  options: FetchOptions = {},
): Promise<WaybackSnapshot[]> {
  const spinner = new Spinner(`Fetching snapshots for ${style.cyan(url)}...`);
  spinner.start();

  try {
    const params = new URLSearchParams({
      url,
      output: "json",
      collapse: options.collapse || "timestamp:8",
    });

    if (options.filter) {
      options.filter.forEach((f) => params.append("filter", f));
    }

    if (options.limit) {
      params.set("limit", options.limit.toString());
    }

    if (options.from) {
      params.set("from", options.from);
    }

    if (options.to) {
      params.set("to", options.to);
    }

    params.append("filter", "statuscode:200");

    const response = await fetch(`${CDX_API_URL}?${params.toString()}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const snapshots = parseCDXJsonResponse(data);

    spinner.stop(true);
    return snapshots;
  } catch (error) {
    spinner.stop(false);
    printError(
      `Failed to fetch snapshots: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
    return [];
  }
}

export async function fetchAllUrls(
  domain: string,
  options: FetchOptions = {},
): Promise<DiscoveryResult> {
  const spinner = new Spinner(
    `Discovering all URLs for ${style.cyan(domain)}...`,
  );
  spinner.start();

  try {
    const baseUrl = domain.replace(/\/+$/, "");
    const wildcardUrl = `${baseUrl}/*`;

    const baseParams = new URLSearchParams({
      url: wildcardUrl,
      output: "json",
    });
    baseParams.append("filter", "statuscode:200");
    if (options.from) baseParams.set("from", options.from);
    if (options.to) baseParams.set("to", options.to);
    if (options.limit) baseParams.set("limit", options.limit.toString());

    const totalPages = await getNumPages(wildcardUrl, baseParams);
    spinner.updateMessage(
      `Discovering URLs for ${
        style.cyan(domain)
      } (${totalPages} page(s) found)...`,
    );

    // Fetch all pages
    const allSnapshots: WaybackSnapshot[] = [];

    for (let page = 0; page < totalPages; page++) {
      const params = new URLSearchParams({
        url: wildcardUrl,
        output: "json",
        page: page.toString(),
      });

      params.append("filter", "statuscode:200");

      if (options.limit) {
        params.set("limit", options.limit.toString());
      }

      if (options.from) {
        params.set("from", options.from);
      }

      if (options.to) {
        params.set("to", options.to);
      }

      spinner.updateMessage(
        `Discovering URLs for ${style.cyan(domain)} (page ${
          page + 1
        }/${totalPages})...`,
      );

      const response = await fetch(`${CDX_API_URL}?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const snapshots = parseCDXJsonResponse(data);
      allSnapshots.push(...snapshots);
    }

    const urlMap = new Map<string, WaybackSnapshot>();
    for (const snapshot of allSnapshots) {
      const existing = urlMap.get(snapshot.original);
      if (!existing || snapshot.timestamp > existing.timestamp) {
        urlMap.set(snapshot.original, snapshot);
      }
    }

    const uniqueSnapshots = Array.from(urlMap.values());

    spinner.stop(true);
    return {
      snapshots: uniqueSnapshots,
      totalAssets: allSnapshots.length,
    };
  } catch (error) {
    spinner.stop(false);
    printError(
      `Failed to discover URLs: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
    return { snapshots: [], totalAssets: 0 };
  }
}

export interface TimestampInfo {
  timestamp: string;
  url: string;
  mimetype: string;
  size: number;
}

export async function getAvailableTimestamps(
  domain: string,
): Promise<TimestampInfo[]> {
  const spinner = new Spinner(
    `Finding available snapshots for ${style.cyan(domain)}...`,
  );
  spinner.start();

  try {
    const searchUrl = domain;

    const baseParams = new URLSearchParams({
      url: searchUrl,
      output: "json",
    });
    baseParams.append("filter", "statuscode:200");

    const totalPages = await getNumPages(searchUrl, baseParams);
    spinner.updateMessage(
      `Finding snapshots for ${
        style.cyan(domain)
      } (${totalPages} page(s) found)...`,
    );

    const allTimestamps: TimestampInfo[] = [];

    for (let page = 0; page < totalPages; page++) {
      const params = new URLSearchParams({
        url: searchUrl,
        output: "json",
        page: page.toString(),
      });

      params.append("filter", "statuscode:200");

      spinner.updateMessage(
        `Finding snapshots for ${style.cyan(domain)} (page ${
          page + 1
        }/${totalPages})...`,
      );

      const response = await fetch(`${CDX_API_URL}?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (Array.isArray(data) && data.length >= 2) {
        const rows = data.slice(1);
        for (const row of rows) {
          if (Array.isArray(row) && row.length >= 7) {
            allTimestamps.push({
              timestamp: row[1],
              url: row[2],
              mimetype: row[3],
              size: parseInt(row[6]) || 0,
            });
          }
        }
      }
    }

    const seen = new Set<string>();
    const uniqueTimestamps = allTimestamps.filter((t) => {
      if (seen.has(t.timestamp)) return false;
      seen.add(t.timestamp);
      return true;
    });

    uniqueTimestamps.sort((a, b) => b.timestamp.localeCompare(a.timestamp));

    spinner.stop(true);
    printInfo(
      `Found ${
        style.bold(uniqueTimestamps.length.toString())
      } unique snapshots (${allTimestamps.length} total assets)`,
    );

    return uniqueTimestamps;
  } catch (error) {
    spinner.stop(false);
    printError(
      `Failed to get available timestamps: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
    return [];
  }
}

export function buildWaybackUrl(
  originalUrl: string,
  timestamp: string,
): string {
  return `https://web.archive.org/web/${timestamp}id_/${originalUrl}`;
}

export function buildWaybackRawUrl(
  originalUrl: string,
  timestamp: string,
): string {
  return `https://web.archive.org/web/${timestamp}id_/${originalUrl}`;
}

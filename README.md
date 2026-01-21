# 🕰️ Wayback Machine Downloader

A beautiful, fast, and feature-rich Wayback Machine downloader built with Deno +
TypeScript.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Deno](https://img.shields.io/badge/deno-v1.40+-green.svg)

## ✨ Features

- **🔍 Auto Discovery** - Automatically discovers all archived URLs for a domain
- **⚡ Parallel Downloads** - Multi-threaded downloading with configurable
  concurrency
- **📊 Beautiful CLI** - Progress bars, spinners, and colorful output
- **🔄 Smart Retries** - Automatic retry with exponential backoff
- **📁 Organized Output** - Downloads are organized by domain structure
- **📋 Download Reports** - JSON reports of all downloads
- **🎯 Content Filtering** - Select specific content types (HTML, CSS, JS,
  images)
- **📅 Time Range Selection** - Download from specific years or date ranges

## 🚀 Quick Start

### Prerequisites

- [Deno](https://deno.land/) v1.40 or higher
- [pnpm](https://pnpm.io/)

### Installation

```bash
# Clone or download the repository
cd wayback-dl

# Install dependencies (optional, Deno will auto-fetch)
pnpm install
```

### Usage

```bash
# Run with Deno
deno task start

# Or with pnpm
pnpm start
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License - feel free to use this project for any purpose.

## 🙏 Acknowledgments

- [Internet Archive](https://archive.org/) for the Wayback Machine
- [Deno](https://deno.land/) for the runtime
- [Cliffy](https://cliffy.io/) for the CLI framework

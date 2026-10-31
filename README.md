# CrazeTools-V2

An offline-first, privacy-focused web interface for everyday, PDF, and image utilities. The app has no third-party runtime dependencies and contains no upload or file-processing API. Files chosen in supported tools are read by the browser on the user's device.

## Run locally

Requires Node.js 20 or later.

```sh
npm start
```

Open <http://localhost:4173>. The first page load needs the local server. After the service worker has cached the app shell, the interface can reopen offline. In production, serve these static files over HTTPS so browsers allow service workers.

## Included UI

- Responsive home, tool search, category filters, 52 tool cards, favorites, recent tools, and dashboard.
- Local storage only for favorite IDs and recent tool IDs. The dashboard includes a clear-data action.
- Static Privacy and Terms pages that describe the current app behavior and call out launch details that the operator must supply.
- Web app manifest and service worker for caching the interface.
- Browser-side text utilities, a locally generated compact QR code, adaptive chunked SHA-256 file hashing in a Web Worker, and image operations (metadata, resize, convert, compress, rotate, flip, grayscale, blur, brightness/contrast, text watermark).
- Local-only input selection and download actions; there is no upload endpoint.

## Processor availability

The catalog is the product scope, not a claim that every listed processor is finished. PDF tools, background removal, image overlay watermark, and image cropping currently show a clear not-included message. Do not connect a cloud conversion or image API: that would violate the offline-only requirement. Chunked SHA-256 selects a conservative chunk size from browser-provided device memory and CPU concurrency hints; other file processors still need their own worker and device-capability handling.

The interface uses system font fallbacks and does not fetch fonts, scripts, analytics, or other assets from third parties.

## Before public launch

- Confirm and implement a bundled offline processor for each advertised tool, then update the privacy and terms pages to match the released behavior.
- Replace generic operator/contact/jurisdiction text in the legal pages with reviewed, jurisdiction-specific details.
- Serve over HTTPS and confirm service-worker caching and updates on the selected host.

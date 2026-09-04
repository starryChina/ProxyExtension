# Proxy Switcher

A Chrome extension (Manifest V3) for quickly switching the browser proxy, with built-in WebRTC protection to prevent leaking your real IP while using a proxy.

## Purpose

- Quickly configure and switch the browser proxy, supporting HTTP, HTTPS, SOCKS4, and SOCKS5.
- Save a proxy configuration with just an IP / domain and a port.
- Runs a connectivity test before saving; the config is saved only if the test passes.
- Enable / disable the proxy with one click; disabling restores the system proxy.
- Includes a WebRTC protection toggle to prevent WebRTC from leaking your real IP around the proxy.

## Features

| Feature | Description |
| --- | --- |
| Proxy switching | Sets a fixed proxy server (`fixed_servers`) and bypasses local addresses |
| Connectivity test | Checks proxy availability via the public `generate_204` endpoint |
| WebRTC protection | Combines a browser privacy policy with injected page scripts to block WebRTC IP leaks |

## How WebRTC protection works

The WebRTC protection follows the approach of [dlinbernard/webrtc-control](https://github.com/dlinbernard/webrtc-control) and uses two layers:

### 1. Browser privacy policy

The background sets the WebRTC IP handling policy via `chrome.privacy.network.webRTCIPHandlingPolicy`:

- Protection on: `disable_non_proxied_udp`, which disables non-proxied UDP so WebRTC cannot bypass the proxy.
- Protection off: restore to `default`.

### 2. Page script injection

`data/inject.js` is injected at `document_start`, then conditionally injects the following scripts to neutralize WebRTC-related APIs:

| Script | Purpose |
| --- | --- |
| `data/media_devices.js` | Disables `navigator.mediaDevices`, preventing media device access |
| `data/support_detection.js` | Disables `getUserMedia`, `MediaStreamTrack`, `RTCPeerConnection`, `RTCSessionDescription` (including moz / webkit prefixes) |
| `data/additional_objects.js` | Disables `RTCDataChannel`, `RTCIceCandidate`, `RTCConfiguration` |

## Project structure

```
├── manifest.json
├── background.js
├── popup.html
├── popup.js
├── Starry.ico
├── lib/
│   ├── chrome.js
│   ├── common.js
│   ├── config.js
│   └── runtime.js
└── data/
    ├── inject.js
    ├── media_devices.js
    ├── support_detection.js
    └── additional_objects.js
```

## Usage

1. Open `chrome://extensions`, enable "Developer mode", click "Load unpacked", and select this project directory.
2. Click the toolbar icon, choose the protocol, and enter the proxy IP / domain and port.
3. Click "Save"; the extension runs a connectivity test and saves the config only if it passes.
4. Click "Enable proxy" to apply the proxy; click again to restore the system proxy.
5. Turn on "WebRTC protection" to enable WebRTC IP leak protection.

## Reference

- WebRTC protection logic based on: [dlinbernard/webrtc-control](https://github.com/dlinbernard/webrtc-control)

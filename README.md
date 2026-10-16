# 代理切换器（Proxy Switcher）

一个基于 Chrome 扩展（Manifest V3）的浏览器代理快速切换工具，同时内置 WebRTC 防护，避免在代理场景下泄露真实 IP。

## 插件用途

- 快速配置并切换浏览器代理，支持 HTTP、HTTPS、SOCKS4、SOCKS5 协议。
- 通过 IP / 域名 + 端口即可保存代理配置。
- 保存前自动进行连通性测试，测试通过才保存。
- 一键开启 / 关闭代理，关闭后恢复系统代理设置。
- 内置 WebRTC 防护开关，防止 WebRTC 绕过代理泄露真实 IP。

## 功能特性

| 功能 | 说明 |
| --- | --- |
| 代理切换 | 设置固定代理服务器（`fixed_servers`），并旁路本地地址 |
| 连通性测试 | 通过 `generate_204` 公网地址检测代理是否可用 |
| WebRTC 防护 | 结合浏览器隐私策略与页面注入脚本，阻断 WebRTC IP 泄露 |

## WebRTC 防护原理

WebRTC 防护参考 [dlinbernard/webrtc-control](https://github.com/dlinbernard/webrtc-control) 的实现，采用两层策略：

### 1. 浏览器隐私策略

在后台通过 `chrome.privacy.network.webRTCIPHandlingPolicy` 设置 WebRTC IP 处理策略：

- 开启防护时：`disable_non_proxied_udp`，即禁止通过非代理的 UDP 传输，避免 WebRTC 绕过代理。
- 关闭防护时：恢复为 `default`。

### 2. 页面脚本注入

在 `document_start` 阶段注入 `data/inject.js`，根据配置按需向页面注入以下脚本，将 WebRTC 相关 API 置空：

| 脚本 | 作用 |
| --- | --- |
| `data/media_devices.js` | 禁用 `navigator.mediaDevices`，阻止获取媒体设备 |
| `data/support_detection.js` | 禁用 `getUserMedia`、`MediaStreamTrack`、`RTCPeerConnection`、`RTCSessionDescription`（含 moz / webkit 前缀） |
| `data/additional_objects.js` | 禁用 `RTCDataChannel`、`RTCIceCandidate`、`RTCConfiguration` |

## 项目结构

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

## 使用方式

1. 在 Chrome 地址栏打开 `chrome://extensions`，开启「开发者模式」，选择「加载已解压的扩展程序」，选中本项目目录。
2. 点击工具栏图标，在弹窗中选择协议并填写代理 IP / 域名和端口。
3. 点击「保存」，插件会先进行连通性测试，通过后保存配置。
4. 点击「开启代理」应用代理；再次点击恢复系统代理。
5. 打开「WebRTC 防护」开关以启用 WebRTC IP 防泄露。

## 参考

- WebRTC 防护逻辑参考：[dlinbernard/webrtc-control](https://github.com/dlinbernard/webrtc-control)

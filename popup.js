document.addEventListener('DOMContentLoaded', () => {
  const schemeSelect = document.getElementById('scheme');
  const hostInput = document.getElementById('host');
  const portInput = document.getElementById('port');
  const saveBtn = document.getElementById('saveBtn');
  const toggleBtn = document.getElementById('toggleBtn');
  const statusSpan = document.getElementById('status');
  const testResultDiv = document.getElementById('testResult');
  const testStatusSpan = document.getElementById('testStatus');
  const messageBox = document.getElementById('messageBox');
  const webrtcToggle = document.getElementById('webrtcToggle');

  let isProxyOn = false;

  // 显示提示信息
  function showMessage(msg, isError = true) {
    messageBox.textContent = msg;
    messageBox.style.color = isError ? '#f44336' : '#4CAF50';
    setTimeout(() => {
      messageBox.textContent = '';
    }, 3000);
  }

  // 初始化加载保存的设置和代理状态
  chrome.storage.local.get(['scheme', 'host', 'port', 'isProxyOn'], (result) => {
    if (result.scheme) schemeSelect.value = result.scheme;
    if (result.host) hostInput.value = result.host;
    if (result.port) portInput.value = result.port;
    if (result.isProxyOn) {
      isProxyOn = result.isProxyOn;
      updateUI();
    }
  });

  // 保存按钮点击事件
  saveBtn.addEventListener('click', async () => {
    const scheme = schemeSelect.value;
    const host = hostInput.value.trim();
    const port = parseInt(portInput.value.trim(), 10);
    
    if (!host || isNaN(port)) {
      showMessage('请输入有效的 IP 和端口！');
      return;
    }

    // 先进行连通性测试
    const isTestSuccess = await testProxyConnectivity(scheme, host, port);

    if (isTestSuccess) {
      // 测试成功，保存配置
      chrome.storage.local.set({ scheme, host, port }, () => {
        showMessage('连通测试成功，配置已保存！', false);

        // 如果当前是开启状态，保存后立即应用新设置
        if (isProxyOn) {
          applyProxy(scheme, host, port);
        }
      });
    } else {
      // 测试失败，提示并不保存
      showMessage('代理连通性测试失败，未保存配置。');
    }
  });

  // 切换按钮点击事件
  toggleBtn.addEventListener('click', () => {
    const scheme = schemeSelect.value;
    const host = hostInput.value.trim();
    const port = parseInt(portInput.value.trim(), 10);

    if (!isProxyOn) {
      // 开启代理前校验
      if (!host || isNaN(port)) {
        showMessage('请先输入有效的 IP 和端口！');
        return;
      }
      applyProxy(scheme, host, port);
      isProxyOn = true;
    } else {
      // 关闭代理
      clearProxy();
      isProxyOn = false;
    }
    
    // 保存代理状态并更新UI
    chrome.storage.local.set({ isProxyOn });
    updateUI();
  });

  // 应用代理配置
  function applyProxy(scheme, host, port) {
    const config = {
      mode: "fixed_servers",
      rules: {
        singleProxy: {
          scheme: scheme,
          host: host,
          port: parseInt(port, 10)
        },
        bypassList: ["localhost", "127.0.0.1", "[::1]"]
      }
    };
    chrome.proxy.settings.set(
      { value: config, scope: "regular" },
      () => { console.log('代理已设置为:', scheme, host, port); }
    );
  }

  // 清除代理配置（恢复为系统代理）
  function clearProxy() {
    const config = {
      mode: "system"
    };
    chrome.proxy.settings.set(
      { value: config, scope: "regular" },
      () => { console.log('代理已恢复为系统设置'); }
    );
  }

  // 测试代理连通性并返回结果
  async function testProxyConnectivity(scheme, host, port) {
    testResultDiv.style.display = 'block';
    testStatusSpan.textContent = '测试中...';
    testStatusSpan.className = 'test-loading';
    saveBtn.disabled = true;

    // 记录原始代理状态
    const originalProxyOn = isProxyOn;

    // 临时应用当前配置的代理进行测试
    applyProxy(scheme, host, port);

    let isSuccess = false;
    try {
      const startTime = performance.now();
      
      // 添加 AbortController 用于设置超时
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5秒超时
      
      // 使用一个稳定的公网地址进行连通性测试 (例如产生204 No Content的地址)
      const response = await fetch('http://www.gstatic.com/generate_204', { 
        method: 'GET',
        mode: 'no-cors',
        cache: 'no-store',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      const endTime = performance.now();
      const ping = Math.round(endTime - startTime);
      
      testStatusSpan.textContent = `成功 (${ping}ms)`;
      testStatusSpan.className = 'test-success';
      isSuccess = true;
    } catch (error) {
      testStatusSpan.textContent = '失败/超时';
      testStatusSpan.className = 'test-fail';
      console.error('Proxy test failed:', error);
      isSuccess = false;
    } finally {
      saveBtn.disabled = false;
      // 恢复原始的代理状态
      if (!originalProxyOn) {
        clearProxy();
      }
      return isSuccess;
    }
  }

  // 更新按钮和状态文字UI
  function updateUI() {
    if (isProxyOn) {
      toggleBtn.textContent = '关闭代理';
      toggleBtn.classList.add('on');
      statusSpan.textContent = '已开启';
      statusSpan.className = 'text-on';
    } else {
      toggleBtn.textContent = '开启代理';
      toggleBtn.classList.remove('on');
      statusSpan.textContent = '已关闭';
      statusSpan.className = 'text-off';
    }
  }

  // 读取 WebRTC 四项功能状态，并同步滑动开关
  function loadWebrtcState() {
    chrome.storage.local.get(['inject', 'devices', 'additional', 'webrtc'], (result) => {
      const inject = result.inject !== undefined ? result.inject : true;
      const devices = result.devices === true;
      const additional = result.additional === true;
      const webrtc = result.webrtc !== undefined ? result.webrtc : 'disable_non_proxied_udp';
      const allOn = inject && devices && additional && webrtc !== 'default';
      webrtcToggle.checked = allOn;
    });
  }

  // 滑动开关：一键开启/关闭 WebRTC 四项功能
  webrtcToggle.addEventListener('change', () => {
    chrome.runtime.sendMessage({
      method: 'toggle',
      data: { enabled: webrtcToggle.checked },
      path: 'options-to-background'
    }, () => {
      // 后台 Service Worker 未就绪等情况无需处理
      void chrome.runtime.lastError;
    });
  });

  loadWebrtcState();
});
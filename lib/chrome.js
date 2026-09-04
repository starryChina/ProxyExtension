var app = {};

app.error = function () {
  return chrome.runtime.lastError;
};

app.options = {
  "message": {},
  "receive": function (id, callback) {
    if (id) {
      app.options.message[id] = callback;
    }
  },
  "send": function (id, data) {
    if (id) {
      chrome.runtime.sendMessage({"data": data, "method": id, "path": "background-to-options"}, app.error);
    }
  }
};

app.privacy = {
  "network": {
    "webrtc": {
      "set": function (options, callback) {
        if (chrome.privacy) {
          if (chrome.privacy.network) {
            if (chrome.privacy.network.webRTCIPHandlingPolicy) {
              chrome.privacy.network.webRTCIPHandlingPolicy.set(options.alpha, function () {
                chrome.privacy.network.webRTCIPHandlingPolicy.get({}, function (e) {
                  if (callback) callback(e);
                });
              });
            }
            /*  */
            if (chrome.privacy.network.webRTCMultipleRoutesEnabled) { // Deprecated since Chrome 48
              chrome.privacy.network.webRTCMultipleRoutesEnabled.set(options.beta, function () {
                chrome.privacy.network.webRTCMultipleRoutesEnabled.get({}, function (e) {
                  if (callback) callback(e);
                });
              });
            }
          }
        }
      }
    }
  }
};

app.storage = {
  "local": {},
  "read": function (id) {
    return app.storage.local[id];
  },
  "update": function (callback) {
    chrome.storage.local.get(null, function (e) {
      app.storage.local = e;
      if (callback) {
        callback("update");
      }
    });
  },
  "write": function (id, data, callback) {
    let tmp = {};
    tmp[id] = data;
    app.storage.local[id] = data;
    /*  */
    chrome.storage.local.set(tmp, function (e) {
      if (callback) {
        callback(e);
      }
    });
  },
  "load": function (callback) {
    const keys = Object.keys(app.storage.local);
    if (keys && keys.length) {
      if (callback) {
        callback("cache");
      }
    } else {
      app.storage.update(function () {
        if (callback) callback("disk");
      });
    }
  }
};

app.page = {
  "message": {},
  "receive": function (id, callback) {
    if (id) {
      app.page.message[id] = callback;
    }
  },
  "send": function (id, data, tabId, frameId) {
    if (id) {
      chrome.tabs.query({}, function (tabs) {
        let tmp = chrome.runtime.lastError;
        if (tabs && tabs.length) {
          const message = {
            "method": id,
            "data": data ? data : {},
            "path": "background-to-page"
          };
          /*  */
          tabs.forEach(function (tab) {
            if (tab) {
              message.data.tabId = message.data.tabId ? message.data.tabId : tab.id;
              message.data.top = message.data.top ? message.data.top : (tab.url ? tab.url : '');
              message.data.title = message.data.title ? message.data.title : (tab.title ? tab.title : '');
              /*  */
              if (tabId !== null && tabId !== undefined) {
                if (tabId === tab.id) {
                  if (frameId !== null && frameId !== undefined) {
                    chrome.tabs.sendMessage(tab.id, message, {"frameId": frameId}, app.error);
                  } else {
                    chrome.tabs.sendMessage(tab.id, message, app.error);
                  }
                }
              } else {
                chrome.tabs.sendMessage(tab.id, message, app.error);
              }
            }
          });
        }
      });
    }
  }
};

app.on = {
  "installed": function (callback) {
    chrome.runtime.onInstalled.addListener(function (e) {
      app.storage.load(function () {
        callback(e);
      });
    });
  },
  "startup": function (callback) {
    chrome.runtime.onStartup.addListener(function (e) {
      app.storage.load(function () {
        callback(e);
      });
    });
  },
  "message": function (callback) {
    chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
      app.storage.load(function () {
        callback(request, sender, sendResponse);
      });
      /*  */
      return true;
    });
  }
};

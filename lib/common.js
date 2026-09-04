var core = {
  "load": function () {
    core.action.update();
  },
  "action": {
    "page": {
      "load": function (e) {
        app.page.send("storage", {
          "state": config.addon.state,
          "inject": config.addon.inject,
          "devices": config.addon.devices,
          "additional": config.addon.additional
        }, e ? e.tabId : '', e ? e.frameId : '');
      }
    },
    "update": function () {
      const options = {};
      options.beta = {"scope": "regular", "value": config.addon.state === "disabled"};
      options.alpha = config.addon.state === "enabled" ? {"value": config.addon.webrtc} : {"value": "default"};
      /*  */
      app.privacy.network.webrtc.set(options, function (e) {
        if (config.log) {
          console.error("WebRTC Policy:", e.value);
        }
      });
    },
    "options": {
      "inject": function (e) {
        config.addon.inject = e.inject;
        /*  */
        core.action.update();
      },
      "devices": function (e) {
        config.addon.devices = e.devices;
        /*  */
        core.action.update();
      },
      "additional": function (e) {
        config.addon.additional = e.additional;
        /*  */
        core.action.update();
      },
      "webrtc": function (e) {
        config.addon.webrtc = e.webrtc;
        config.addon.state = config.addon.webrtc === "default" ? "disabled" : "enabled";
        /*  */
        core.action.update();
      },
      "load": function () {
        app.options.send("storage", {
          "webrtc": config.addon.webrtc,
          "inject": config.addon.inject,
          "devices": config.addon.devices,
          "additional": config.addon.additional
        });
      },
      "toggle": function (e) {
        // 一键开关：同时开启或关闭四个功能
        const enable = e && e.enabled;
        config.addon.inject = enable;
        config.addon.devices = enable;
        config.addon.additional = enable;
        config.addon.webrtc = enable ? "disable_non_proxied_udp" : "default";
        config.addon.state = enable ? "enabled" : "disabled";
        /*  */
        core.action.update();
        core.action.options.load();
      }
    }
  }
};

app.page.receive("load", core.action.page.load);

app.options.receive("load", core.action.options.load);
app.options.receive("inject", core.action.options.inject);
app.options.receive("webrtc", core.action.options.webrtc);
app.options.receive("devices", core.action.options.devices);
app.options.receive("additional", core.action.options.additional);
app.options.receive("toggle", core.action.options.toggle);

app.on.installed(core.load);
app.on.startup(core.load);

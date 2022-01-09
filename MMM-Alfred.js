// Module : MMM-Alfred

Module.register("MMM-Alfred", {
    defaults: {
        keywordSensitivity: 0.8,
        contextSensitivity: 0.5
    },

    start: function() {
        this.sendSocketNotification('INIT', this.config)
    },

    notificationReceived: function(notification, payload, sender) {
      switch (notification) {
          case "ALL_MODULES_STARTED":
              this.sendSocketNotification("START_ALFRED");
              break;
      }
    },

    // Send Notification to other modules when a voice command is recognized in node_helper
    socketNotificationReceived: function(notification, payload) {
        switch (notification) {
            case "START_SPOTIFY":
                // Show MMM-Spotify if hidden
                MM.getModules().withClass("MMM-Spotify").enumerate(function (module) {
                    module.show(1000)
                })
                this.sendNotification("SPOTIFY_PLAY")
                break

            case "CLOSE_SPOTIFY":
                this.sendNotification("SPOTIFY_PAUSE")

                // Hide MMM-Spotify
                MM.getModules().withClass("MMM-Spotify").enumerate(function (module) {
                    module.hide(1000)
                })
        }
    }
})
const NodeHelper = require("node_helper")
const Picovoice = require("@picovoice/picovoice-node")
const PvRecorder = require("@picovoice/pvrecorder-node")
const Gpio = require("onoff").Gpio

// Wrapper for inference callback
let self = null;

module.exports = NodeHelper.create({
    // Node_Helper Entry Point
    start: function() {
        self = this
        self.config = {}
        self.isListening = false
        self.picovoice = null
        self.recorder = null
        self.button = null
    },

    socketNotificationReceived: function(notification, payload) {
        switch(notification) {
            case "INIT":
                // set the internal config to the payload received in socket notification
                self.config = payload
                this.initialize()
                break

            case "START_ALFRED":
                this.startListening()
                break

            case "STOP_ALFRED":
                this.stopListening()
                break
        }
    },

    initialize: function () {
        console.log("[Alfred] Starting...")
        console.log("[Alfred] Available audio devices: " + JSON.stringify(PvRecorder.getAudioDevices()));

        const keywordFilePath = `${this.path}/custom/keyword_alfred.ppn`;
        const contextFilePath = `${this.path}/custom/context_spotify.rhn`;

        const porcupineLanguageFilePath = `${this.path}/language/porcupine_params_de.pv`;
        const rhinoLanguageFilePath = `${this.path}/language/rhino_params_de.pv`;

        const keywordCallback = function (keyword) {
            console.log("Ja, Master Chloe");
        }

        //Create a new picovoice instance
        self.picovoice = new Picovoice(
            self.config.accessKey,
            keywordFilePath,
            keywordCallback,
            contextFilePath,
            self.inference,
            self.config.keywordSensitivity,
            self.config.contextSensitivity,
            false,
            porcupineLanguageFilePath,
            rhinoLanguageFilePath
        );

        self.recorder = new PvRecorder(self.config.audioDeviceIndex, self.picovoice.frameLength)
        console.log("[Alfred] Using audio device: " + self.recorder.getSelectedDevice())

        console.log("[Alfred] Initialize buttons")
        self.button = new Gpio(4, "in", "both", {debounceTimeout: 10});

        self.button.watch((err, value) => {
            if (err) {
                throw err;
            }

            console.log("Button pressed")
        });
        console.log("[Alfred] Successfully initialized buttons")
    },

    startListening: async function() {
        console.log("[Alfred] Start listening now ...")

        self.isListening = true;
        self.recorder.start();

        while (self.isListening) {
            const pcm = await self.recorder.read();
            self.picovoice.process(pcm);
        }
    },

    stopListening: function() {
        self.isListening = false
        self.recorder.release();

        console.log("[Alfred] Stopped listening.");
    },

    inference: function(inference) {
        if (inference.isUnderstood) {
            switch (inference.intent) {
                case "openSpotify":
                    console.log("Start Spotify")
                    self.sendSocketNotification("START_SPOTIFY")
                    break

                case "closeSpotify":
                    console.log("Stop Spotify")
                    self.sendSocketNotification("CLOSE_SPOTIFY")
                    break
            }
        }
        console.log("Inference:");
        console.log(JSON.stringify(inference, null, 4));
    }
});
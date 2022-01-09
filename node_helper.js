const NodeHelper = require("node_helper");
const Picovoice = require("@picovoice/picovoice-node");
const PvRecorder = require("@picovoice/pvrecorder-node")

module.exports = NodeHelper.create({
    // Node_Helper Entry Point
    start: function() {
        this.config = {}
        this.isListening = false
        this.picovoice = null
        this.recorder = null
    },

    socketNotificationReceived: function(notification, payload) {
        switch(notification) {
            case "INIT":
                // set the internal config to the payload received in socket notification
                this.config = payload
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
        this.picovoice = new Picovoice(
            this.config.accessKey,
            keywordFilePath,
            keywordCallback,
            contextFilePath,
            this.inference,
             this.config.keywordSensitivity,
             this.config.contextSensitivity,
             false,
            porcupineLanguageFilePath,
            rhinoLanguageFilePath
        );

        this.recorder = new PvRecorder(this.config.audioDeviceIndex, this.picovoice.frameLength);
        console.log("[Alfred] Using device: " + this.recorder.getSelectedDevice());
    },

    startListening: async function() {
        console.log("[Alfred] Start listening now ...");

        this.isListening = true;
        this.recorder.start();

        while (this.isListening) {
            const pcm = await this.recorder.read();
            this.picovoice.process(pcm);
        }
    },

    stopListening: function() {
        this.isListening = false
        this.recorder.release();

        console.log("[Alfred] Stopped listening.");
    },

    inference: function(inference) {
        if (inference.isUnderstood) {
            switch (inference.intent) {
                case "openSpotify":
                    console.log("Start Spotify")
                    // this.sendSocketNotification("START_SPOTIFY")
                    break

                case "closeSpotify":
                    console.log("Stop Spotify")
                    //this.sendSocketNotification("CLOSE_SPOTIFY")
                    break
            }
        }
        console.log("Inference:");
        console.log(JSON.stringify(inference, null, 4));
    }
});
const { Client } = require("./Client.js");

class Main {
    constructor() {
        this._client = new Client();
    }

    async launch() {
        await this._client.launchBrowser();
        await this.startPlaying();
    }

    async startPlaying() {
        while (true) {
            console.log("waiting for turn");
            await this._client.wait_for_turn();
            this._client._cursor.toggleRandomMove(false);

            await this._client.updatePlayerColour();
            await this._client.playMove();

            this._client._cursor.toggleRandomMove(true);
            await this._client.wait_for_opponents_turn();
            console.log("finshed waiting for opponent");
        }
    }
}

const main = new Main();
main.launch();
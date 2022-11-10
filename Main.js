const { Client } = require("./Client.js");

class Main {
    constructor() {
        this._client = new Client();
    }

    async launch() {
        await this._client.launchBrowser();
        await this._client.wait_for_turn();

        await this._client.initialise_new_game();

        await this._client.move("d2d4");

    }
}

const main = new Main();
main.launch();
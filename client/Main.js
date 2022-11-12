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
        await this._client.block_until_turn();
        while (true) {
            console.log("waiting for turn");

            let is_my_turn = false;
            while (!is_my_turn) {
                console.log("trying to press next game");
                await this._client.next_game();
                is_my_turn = await this._client.wait_for_turn();
                await this._client.sleep(100);
            }

            await this._client.updatePlayerColour();
            await this._client.playMove();

            await this._client.wait_for_opponents_turn();
            console.log("finshed waiting for opponent");
        }
    }
}

const main = new Main();
main.launch();
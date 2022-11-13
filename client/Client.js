"use strict"

const axios = require('axios');
const credentials = require('./credentials.js');
const ghostCursor = require("ghost-cursor");
const { installMouseHelper } = require('./install-mouse-helper');


class Client {
    constructor() {
        this._page = null;
        this._castling_rights = "KQkq";
        this._player_colour = "w";
        this._cursor = null;
    }

    async launchBrowser() {
        // puppeteer-extra is a drop-in replacement for puppeteer,
        // it augments the installed puppeteer with plugin functionality
        const puppeteer = require('puppeteer-extra')
        // const puppeteer = require('puppeteer');
        // // add stealth plugin and use defaults (all evasion techniques)
        const StealthPlugin = require('puppeteer-extra-plugin-stealth')
        puppeteer.use(StealthPlugin())

        // puppeteer usage as normal
        const browser = await puppeteer.launch({
            headless: false,
        });
        this._page = await browser.newPage();
        await installMouseHelper(this._page);
        this._cursor = ghostCursor.createCursor(this._page);

        await this._page.goto('https://www.chess.com/login_and_go?returnUrl=https://www.chess.com/play/online/new')

        await this.login();
        // await this._page.click("#login");
        this._cursor.click("#login");

    }

    async login() {
        await this._page.focus('#username')
        await this._page.keyboard.type(credentials.username);
        await this._page.focus('#password')
        await this._page.keyboard.type(credentials.password);
    }

    async _getClassName(dom_object) {
        let className = await dom_object.getProperty("className");
        return await className.jsonValue();
    }

    async wait_for_turn() {
        let your_turn_selector = ".board-layout-bottom .clock-player-turn";
        try {
            await this._page.waitForSelector(your_turn_selector, { timeout: 5000 });
            return true;
        }
        catch {
            return false;
        }
    }

    async block_until_turn() {
        await this._page.waitForSelector(".board-layout-bottom .clock-player-turn", { timeout: 0 });
    }

    async wait_for_opponents_turn() {
        try {
            let their_turn_selector = ".board-layout-top .clock-player-turn";
            await this._page.waitForSelector(their_turn_selector, { timeout: 100 });
            return true;
        }
        catch {
            return false;
        }
    }

    async updatePlayerColour() {

        const board = await this._page.$(".board");
        let boardClass = await this._getClassName(board);

        this._player_colour = boardClass.includes("flipped") ? "b" : "w";

    }

    async get_time_remaining() {
        const clock = await this._page.$(".player-bottom .clock-component");
        let ms;
        let time_in_ms = 0
        let time_remaining = await clock.getProperty("textContent");
        time_remaining = await time_remaining.jsonValue();

        let [minutes, seconds] = time_remaining.split(":");

        time_in_ms += parseInt(minutes) * 1000 * 60

        if (seconds.includes(".")) {
            [seconds, ms] = seconds.split(".")
            time_in_ms += parseInt(ms) * 100
        }
        time_in_ms += parseInt(seconds) * 1000
        return time_in_ms
    }

    async get_fen() {
        var blank_squares_counter, fen, i, letter, piece_list;
        piece_list = await this._get_piece_list();
        // piece_list = [{ 'type': 'r', 'colour': 'b', 'location': '18' }, { 'type': 'n', 'colour': 'b', 'location': '28' }, { 'type': 'b', 'colour': 'b', 'location': '38' }, { 'type': 'q', 'colour': 'b', 'location': '48' }, { 'type': 'k', 'colour': 'b', 'location': '58' }, { 'type': 'b', 'colour': 'b', 'location': '68' }, { 'type': 'n', 'colour': 'b', 'location': '78' }, { 'type': 'r', 'colour': 'b', 'location': '88' }, { 'type': 'p', 'colour': 'b', 'location': '17' }, { 'type': 'p', 'colour': 'b', 'location': '27' }, { 'type': 'p', 'colour': 'b', 'location': '37' }, { 'type': 'p', 'colour': 'b', 'location': '47' }, { 'type': 'p', 'colour': 'b', 'location': '67' }, { 'type': 'p', 'colour': 'b', 'location': '77' }, { 'type': 'p', 'colour': 'b', 'location': '55' }, { 'type': 'p', 'colour': 'b', 'location': '85' }, { 'type': 'p', 'colour': 'w', 'location': '54' }, { 'type': 'p', 'colour': 'w', 'location': '84' }, { 'type': 'r', 'colour': 'w', 'location': '83' }, { 'type': 'p', 'colour': 'w', 'location': '12' }, { 'type': 'p', 'colour': 'w', 'location': '22' }, { 'type': 'p', 'colour': 'w', 'location': '32' }, { 'type': 'p', 'colour': 'w', 'location': '42' }, { 'type': 'p', 'colour': 'w', 'location': '62' }, { 'type': 'p', 'colour': 'w', 'location': '72' }, { 'type': 'r', 'colour': 'w', 'location': '11' }, { 'type': 'n', 'colour': 'w', 'location': '21' }, { 'type': 'b', 'colour': 'w', 'location': '31' }, { 'type': 'q', 'colour': 'w', 'location': '41' }, { 'type': 'k', 'colour': 'w', 'location': '51' }, { 'type': 'b', 'colour': 'w', 'location': '61' }, { 'type': 'n', 'colour': 'w', 'location': '71' }]

        piece_list.push({
            "type": "",
            "colour": "",
            "location": ""
        });
        fen = "";
        blank_squares_counter = 0;
        i = 0;

        for (var rank = 8, _pj_a = 0; rank > _pj_a; rank += -1) {
            for (var file = 1, _pj_b = 9; file < _pj_b; file += 1) {


                // if (piece_list[i]["type"] === "k") {
                //     if (piece_list[i]["colour"] === "w" && piece_list[i]["location"] !== "51") {
                //         this._castling_rights = this._castling_rights.split("KQ").join("");
                //     } else {
                //         if (piece_list[i]["colour"] === "b" && piece_list[i]["location"] !== "58") {
                //             this._castling_rights = this._castling_rights.split("kq").join("");
                //         }
                //     }
                // }

                // if (piece_list[i]["type"] !== "r" || piece_list[i]["location"] !== file.toString() + rank.toString()) {
                //     if (rank === 1) {
                //         if (file === 1) {
                //             this._castling_rights = this._castling_rights.split("Q").join("");
                //         } else {
                //             if (file === 8) {
                //                 this._castling_rights = this._castling_rights.split("K").join("");

                //             }
                //         }
                //     }

                //     if (rank === 8) {
                //         if (file === 1) {
                //             this._castling_rights = this._castling_rights.split("q").join("");
                //         } else {
                //             if (file === 8) {
                //                 this._castling_rights = this._castling_rights.split("k").join("");

                //             }
                //         }
                //     }
                // }

                if (piece_list[i]["location"] === file.toString() + rank.toString()) {
                    if (blank_squares_counter > 0) {
                        fen += blank_squares_counter.toString();
                    }

                    blank_squares_counter = 0;
                    letter = piece_list[i]["type"];

                    if (piece_list[i]["colour"] === "w") {
                        letter = letter.toUpperCase();
                    }

                    fen += letter;
                    i += 1;
                } else {
                    blank_squares_counter += 1;
                }
            }

            if (blank_squares_counter > 0) {
                fen += blank_squares_counter.toString();
            }

            blank_squares_counter = 0;

            if (rank !== 1) {
                fen += "/";
            }
        }

        if (fen.includes("rnbqkbnr/pppppppp")) { // if the black pieces have not moved that means its a new game
            this._castling_rights = "KQkq";
        }

        fen += " ";
        fen += this._player_colour;

        const response = await axios.get(`http://127.0.0.1:8000/castlingRights`, {
            params: {
                fen: fen + ` ${this._castling_rights}` + " - 0 1",
            }
        });

        this._castling_rights = response.data.castling_rights

        if (this._castling_rights) {
            fen += ` ${this._castling_rights}`;
        } else {
            fen += " -";
        }

        fen += " - 0 1";

        return fen;
    }

    async _get_piece_list() {
        var class_names, location, piece_colour, piece_info, piece_list, piece_type, pieces_DOM_elements;
        pieces_DOM_elements = await this._page.$$(".board .piece");
        piece_list = [];

        for (var piece, _pj_c = 0, _pj_a = pieces_DOM_elements, _pj_b = _pj_a.length; _pj_c < _pj_b; _pj_c += 1) {
            piece = _pj_a[_pj_c];
            class_names = (await this._getClassName(piece)).split(" ");
            if (class_names.length !== 3) {
                return await this._get_piece_list();
            }

            for (var class_name, _pj_f = 0, _pj_d = class_names, _pj_e = _pj_d.length; _pj_f < _pj_e; _pj_f += 1) {
                class_name = _pj_d[_pj_f];

                if (class_name.length === 2) {
                    piece_type = class_name[1];
                    piece_colour = class_name[0];
                } else {
                    if (class_name.startsWith("square-")) {
                        location = class_name.slice(-2);
                    }
                }
            }

            piece_info = {
                "type": piece_type,
                "colour": piece_colour,
                "location": location
            };
            piece_list.push(piece_info);
        }

        piece_list.sort((piece1, piece2) => Number.parseInt(piece1["location"][0] - Number.parseInt(piece2["location"][0])));
        piece_list.sort((piece1, piece2) => Number.parseInt(piece2["location"][1] - Number.parseInt(piece1["location"][1])));

        return piece_list;
    }

    async move(stockfish_reccomendation) {
        // convert notation from g2c1 into pure numbers
        stockfish_reccomendation = this.setCharAt(stockfish_reccomendation, 0, stockfish_reccomendation.charCodeAt(0) - 96)
        stockfish_reccomendation = this.setCharAt(stockfish_reccomendation, 2, stockfish_reccomendation.charCodeAt(2) - 96)

        let start = stockfish_reccomendation.slice(0, 2);
        let end = stockfish_reccomendation.slice(2, 4);

        // if you're black - reverse the board aka 9 - square number
        if (this._player_colour == "b") {
            start = this.setCharAt(start, 0, 9 - Number(start[0]));
            start = this.setCharAt(start, 1, 9 - Number(start[1]));
            end = this.setCharAt(end, 0, 9 - Number(end[0]));
            end = this.setCharAt(end, 1, 9 - Number(end[1]));
        }

        const piece = await this._page.waitForSelector(".piece");
        const board = await this._page.waitForSelector(".board");

        const boardRect = await this._page.evaluate(el => {
            const { x, y, width, height } = el.getBoundingClientRect();
            return { x, y, width, height };
        }, board);

        const pieceRect = await this._page.evaluate(el => {
            const { x, y, width, height } = el.getBoundingClientRect();
            return { x, y, width, height };
        }, piece);

        const square_width = pieceRect["width"];
        const x_offset = boardRect["x"];
        const y_offset = boardRect["y"] + boardRect["height"];

        let client_x_start = square_width * (Number(start[0]) - 1 + 0.5) + x_offset;
        let client_y_start = - square_width * (Number(start[1]) - 1 + 0.5) + y_offset;
        let client_x_end = square_width * (Number(end[0]) - 1 + 0.5) + x_offset;
        let client_y_end = - square_width * (Number(end[1]) - 1 + 0.5) + y_offset;

        const height = pieceRect["height"];
        // randomise click position
        client_x_start += this.randomIntFromInterval(-height / 3, height / 3);
        client_x_end += this.randomIntFromInterval(-height / 3, height / 3);
        client_y_start += this.randomIntFromInterval(-height / 3, height / 3);
        client_y_end += this.randomIntFromInterval(-height / 3, height / 3);

        await this._page.mouse.click(client_x_start, client_y_start);
        await this._page.mouse.click(client_x_end, client_y_end);
    }

    randomIntFromInterval(min, max) { // min and max included 
        return Math.floor(Math.random() * (max - min + 1) + min)
    }

    async next_game() {
        const next_game_button = await this._page.$(".game-over-arena-button");
        const new_live_game_buttons = await this._page.$$(".live-game-buttons-game-over button");

        if (next_game_button) {
            this._page.click(".game-over-arena-button");
            return true;
        }
        else if (new_live_game_buttons.length !== 0) {
            await this._page.$$eval(".live-game-buttons-game-over button", buttons => buttons.map(button => {
                const span = button.querySelector("span");
                if (span && (span.className.includes("plus") || span.className.includes("checkmark"))) { // check that it hasn't been pressed
                    button.click();
                }
            }));
            return true;
        }
        return false;
    }

    sleep(ms) {
        return new Promise((resolve) => {
            setTimeout(resolve, ms);
        });
    }

    async playMove(attempts_remaining = 5) {
        if (attempts_remaining === 0) {
            return;
        }
        const fen = await this.get_fen();
        const time_remaining = await this.get_time_remaining();

        const is_premoves = await this._page.$$eval('.highlight', highlights => {
            for (let highlight in highlights) {
                if (highlight.style?.backgroundColor === "rgb(244, 42, 50)") {
                    return true;
                }
            }
            return false;
        });

        if (is_premoves) { // premoves in place
            return
        }

        const PREMOVE_TIME_ACTIVATE = 3000;
        const PREMOVES_IN_ADVANCE = 5
        if (time_remaining < PREMOVE_TIME_ACTIVATE) { // try premoving
            const response = await axios.get(`http://127.0.0.1:8000/premove`, {
                params: {
                    fen: fen,
                    moves_in_advance: PREMOVES_IN_ADVANCE
                }
            });

            const best_line = response.data.premoves;
            if (best_line == null) {
                this.sleep(3000);
                return this.playMove(attempts_remaining - 1);
            }

            for (let i = 0; i < best_line.length; i++) {
                const bestMove = best_line[i];
                await this.move(bestMove);
            }
        }
        else {
            // const fen = "rnbqkbnr/ppp4p/3p1p2/6P1/4Pp2/2N2N2/PPPP2P1/R1BQKB1R b KQkq - 0 6";

            const response = await axios.get(`http://127.0.0.1:8000`, {
                params: {
                    fen: fen,
                    time_remaining: time_remaining,
                }
            });
            const bestMove = response.data.recommended_move;
            console.log(bestMove);
            if (bestMove == null) {
                this.sleep(3000);
                return this.playMove(attempts_remaining - 1);
            }
            await this.move(bestMove);
        }
    }


    setCharAt(str, index, chr) {
        if (index > str.length - 1) return str;
        return str.substring(0, index) + chr + str.substring(index + 1);
    }

}

module.exports = { Client };
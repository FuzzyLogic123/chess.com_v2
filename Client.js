"use strict"

const credentials = require('./credentials.js');

class Client {
    constructor() {
        this._gameStarted = false;
        this._waitingForNewGame = true;
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
        const page = await browser.newPage()
        await page.goto('https://www.chess.com/login_and_go?returnUrl=https://www.chess.com/play/online/new')

        await this.login(page);
        await page.click("#login");
        await page.waitForTimeout(1000000);
        await browser.close();
    }

    async login(page) {
        await page.focus('#username')
        await page.keyboard.type(credentials.username);
        await page.focus('#password')
        await page.keyboard.type(credentials.password);
    }

}

const client = new Client();
client.launchBrowser();
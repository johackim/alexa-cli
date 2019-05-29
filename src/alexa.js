#!/usr/bin/env node

import 'babel-polyfill';
import puppeteer from 'puppeteer';
import program from 'commander';
import { isFQDN, isURL } from 'validator';
import ora from 'ora';
import { version } from '../package.json';

const alexaRank = async (domain) => {
    const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    await page.goto(`https://www.alexa.com/siteinfo/${domain}?ver=classic`);
    const rank = await page.$eval('.globleRank .metrics-data', el => el.innerText).catch(() => {
        throw new Error(`Error: "${domain}" is not a valid domain`);
    });

    await browser.close();

    return rank.trim();
};

const action = async (arg) => {
    if (typeof arg !== 'string' || (!isFQDN(arg) && !isURL(arg))) {
        program.outputHelp();
        process.exit(1);
    }

    const domain = arg.replace('http://', '').replace('https://', '').split(/[/?#]/)[0];
    const spinner = ora(`Fetching page rank for ${domain}`).start();
    const rank = await alexaRank(domain).catch(({ message }) => spinner.fail(message) && process.exit(2));

    spinner.stopAndPersist({ symbol: '✔' });

    if (rank !== '-') {
        spinner.succeed(`${domain} is ranked ${rank}`);
    } else {
        spinner.succeed(`${domain} is not ranked with Alexa`);
    }
};

program
    .version(version, '-v, --version')
    .action(action)
    .usage('<domain>')
    .parse(process.argv);

if (!process.argv.slice(2).length) {
    program.outputHelp();
}

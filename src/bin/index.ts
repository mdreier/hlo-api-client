/* eslint-disable @typescript-eslint/require-await */
import yargs from 'yargs'
import fs from 'fs-extra';
import inquirer from 'inquirer';
import HLOCli, { getAccessFilePath, getUserFilePath } from './cli.js';

type Options = {
    userToken: string,
    accessToken: string,
    saveAccessToken: boolean
}

const cliOptions = yargs(process.argv)
    .usage("Usage: [--user-token <user token>] [--access-token <access token>]")
    .epilog("If an access token is provided, it will be user. If a user token is provided, it will be used to request an access token. If neither is provided, it will be prompted for")
    .option("u", {
        alias: "user-token",
        describe: "HeroLab Online API User Token",
        type: "string",
        demandOption: false
    })
    .option("a", {
        alias: "access-token",
        describe: "HeroLab Online API Access Token",
        type: "string",
        demandOption: false
    })
    .argv;

if (!cliOptions.accessToken) {
    try {
        cliOptions.accessToken = fs.readFileSync(getAccessFilePath(), {encoding: 'utf-8'}).trim();
    } catch {
        // Error occurs if file does not exist
    }
}

if (!cliOptions.userToken) {
    try {
        cliOptions.userToken = fs.readFileSync(getUserFilePath(), {encoding: 'utf-8'}).trim();
    } catch {
        // Error occurs if file does not exist
    }
}

inquirer.prompt([
    {
        name: 'accessToken',
        type: 'password',
        message: 'Access Token',
        when: async () => !cliOptions.accessToken && !cliOptions.userToken
    },
    {
        name: 'userToken',
        type: 'password',
        message: 'User Token',
        when: async (answers: Options) => !answers.accessToken && !cliOptions.accessToken && !cliOptions.userToken
    }
])
.then(answers => Object.assign(cliOptions, answers))
.then(({userToken, accessToken}) => {
    const cli = new HLOCli(userToken, accessToken);
    void cli.mainLoop();
})
// eslint-disable-next-line @typescript-eslint/restrict-template-expressions
.catch(e => process.stderr.write(`${e}\n`));
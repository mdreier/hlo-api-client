/* eslint-disable @typescript-eslint/require-await */
import yargs from 'yargs'
import HLOApi from '../api.js';
import fs from 'fs-extra';
import inquirer from 'inquirer';
import HLOCli, { TOOLNAME, getAccessFilePath, getUserFilePath } from './cli.js';

type Options = {
    userToken: string,
    accessToken: string,
    saveAccessToken: boolean
}

/**
 * Determine the access token. Calls the HeroLab Online API if required.
 *
 * @param options Options
 * @returns The access token, or undefined if the access token could not be read.
 */
 const getTokens = async (options: Options): Promise<any> => {
    // If access token is already provided, save the access token
    let accessToken = options.accessToken;

    // Try to get access token from API
    if (!accessToken && options.userToken) {
        accessToken = await HLOApi.getAccessToken(options.userToken, TOOLNAME);
    }

    // If no access token can be determined, fail
    if (!accessToken) {
        throw Error("User token or access token required. Pass as command-line argument or store in <user home>/.hlo-api/access_token\n");
    }

    // Save access token if requested
    if (accessToken && options.saveAccessToken) {
        void fs.writeFile(getAccessFilePath(), accessToken, {encoding: 'utf-8'});
    }

    return {userToken: options.userToken, accessToken};
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
    },
    {
        name: 'saveAccessToken',
        type: 'checkbox',
        message: 'Store access token',
        when: async (answers: Options) => answers.accessToken || answers.userToken
    }
])
.then(answers => Object.assign(cliOptions, answers))
.then(getTokens)
.then(({userToken, accessToken}) => {
    const cli = new HLOCli(userToken, accessToken);
    void cli.mainLoop();
})
// eslint-disable-next-line @typescript-eslint/restrict-template-expressions
.catch(e => process.stderr.write(`${e}\n`));
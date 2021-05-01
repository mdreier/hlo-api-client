import yargs from 'yargs'
import HLOApi from '../api/api.js';
import fs from 'fs-extra';
import os from 'os';
import inquirer from 'inquirer';
import HLOCli from './cli.js';

type Options = {
    userToken: string,
    accessToken: string,
    saveAccessToken: boolean
}

const TOOLNAME = "HeroLab Online CLI";

const options = yargs(process.argv)
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

if (!options.accessToken) {
    try {
        options.accessToken = fs.readFileSync(getAccessFilePath(), {encoding: 'utf-8'});
    } catch {
        //Error occurs if file does not exist
    }
}

inquirer.prompt([
    {
        name: 'accessToken',
        type: 'password',
        message: 'Access Token',
        when: async () => !options.accessToken && !options.userToken
    },
    {
        name: 'userToken',
        type: 'password',
        message: 'User Token',
        when: async answers => !answers.accessToken && !options.accessToken && !options.userToken
    },
    {
        name: 'saveAccessToken',
        type: 'checkbox',
        message: 'Store access token',
        when: async answers => answers.accessToken || answers.userToken
    }
])
.then(answers => Object.assign(options, answers))
.then(getAccessToken)
.then(accessToken => {
    const cli = new HLOCli(accessToken);
    cli.mainLoop();
})
.catch(e => process.stderr.write(`${e}`));

/**
 * Determine the access token. Calls the HeroLab Online API if required.
 * 
 * @param options Options 
 * @returns The access token, or undefined if the access token could not be read.
 */
async function getAccessToken(options: Options): Promise<string> {
    //If access token is already provided, save the access token
    let accessToken = options.accessToken;

    //Try to get access token from API
    if (!accessToken && options.userToken) {
        accessToken = await HLOApi.getAccessToken(options.userToken, TOOLNAME);
    }

    //If no access token can be determined, fail
    if (!accessToken) {
        throw Error("User token or access token required. Pass as command-line argument or store in <user home>/.hlo-api/access_token");
    }

    //Save access token if requested
    if (accessToken && options.saveAccessToken) {
        fs.writeFile(getAccessFilePath(), accessToken, {encoding: 'utf-8'});
    }

    return accessToken;
}

/**
 * Get the path to the file which stores the access token.
 * @returns File path.
 */
function getAccessFilePath(): string {
    return os.homedir() + "/.hlo-api/access_token";
}
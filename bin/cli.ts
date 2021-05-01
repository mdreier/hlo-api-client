import inquirer from 'inquirer';
import fs from 'fs';
import os from 'os';
import HLOApi, { CharacterChangeStatus, ResultCode, Severity } from '../api/api.js';

/**
 * Actions available in the CLI.
 */
const Actions = {
    /** Exit the CLI */
    EXIT: 'Exit',
    VERIFY: 'Verify Acccess Token',
    GET_CHARACTER: 'Get Character'
}

const TOOLNAME = "HeroLab Online CLI";

export default class HLOCli {

    /**
     * API instance used by the CLI.
     */
    private api: HLOApi;

    /**
     * Cache the user token.
     */
    private userToken: string;

    /**
     * Create a new CLI instance.
     * @param accessToken Access token for the HeroLabl Online API.
     */
    constructor(userToken: string, accessToken: string) {
        this.userToken = userToken;
        this.api = new HLOApi(accessToken);
    }

    /**
     * Start the main loop for the CLI.
     */
    async mainLoop() {
        while(true) {
            let response = await inquirer.prompt([{
                name: 'action',
                message: 'Action',
                type: 'list',
                choices: [
                    Actions.GET_CHARACTER,
                    Actions.VERIFY,
                    Actions.EXIT
                ]
            }]);

            switch (response.action) {
                case Actions.EXIT:
                    process.exit(0);
                case Actions.VERIFY:
                    await this.validate();
                    break;
                case Actions.GET_CHARACTER:
                    await this.getCharacter();
                    break;
            }
        }
    }

    async validate() {
        let response = await this.api.verifyAccessToken({});
        if (response.severity === Severity.Success) {
            process.stdout.write("Access token is valid\n");
        } else {
            process.stdout.write("Access token is not valid\n");
        }
        let input = await inquirer.prompt([
            {
                name: 'refreshAccessToken',
                message: 'Refresh access token?',
                type: 'confirm'
            },
            {
                name: 'storeAccessToken',
                message: 'Store new access token?',
                type: 'confirm',
                when: answers => answers.refreshAccessToken
            }
        ]);
        if (input.refreshAccessToken) {
            let response = await this.api.acquireAccessToken({refreshToken: this.userToken, toolName: TOOLNAME});
            if (input.storeAccessToken) {
                fs.writeFileSync(getAccessFilePath(), response.accessToken, {encoding: 'utf-8'});
            }
        }
    }

    async getCharacter() {
        let input = await inquirer.prompt([
            {
                name: 'elementToken',
                message: 'Element Token'
            }
        ]);

        let response = await this.api.getCharacter({elementToken: input.elementToken});
        if (response.status === CharacterChangeStatus.Missing) {
            process.stdout.write("Character not found");
        } else if (response.status === CharacterChangeStatus.Unchanged) {
            process.stdout.write("Character unchanged");
        } else if (response.export) {
            process.stdout.write(`${response.export}`);
        } else {
            process.stdout.write("No character data received");
        }
    }
};

/**
 * Get the path to the file which stores the access token.
 * @returns File path.
 */
 function getAccessFilePath(): string {
    return os.homedir() + "/.hlo-api/access_token";
}

/**
 * Get the path to the file which stores the user token.
 * @returns File path.
 */
 function getUserFilePath(): string {
    return os.homedir() + "/.hlo-api/user_token";
}

export { TOOLNAME, getAccessFilePath, getUserFilePath };
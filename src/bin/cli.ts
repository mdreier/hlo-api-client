/* eslint-disable @typescript-eslint/naming-convention */
import inquirer from 'inquirer';
import fs from 'fs';
import os from 'os';
import HLOApi from '../api.js';
import { CharacterChangeStatus, Severity } from '../constants.js'

type MainLoopResponse = {
    action: string
}

type ValidateResponse = {
    refreshAccessToken: boolean,
    storeAccessToken: boolean
}

type GetCharacterInput = {
    elementToken: string
}

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
     *
     * @param accessToken Access token for the HeroLabl Online API.
     */
    constructor(userToken: string, accessToken: string) {
        this.userToken = userToken;
        this.api = new HLOApi(accessToken);
    }

    /**
     * Start the main loop for the CLI.
     */
    async mainLoop(): Promise<void> {
        // eslint-disable-next-line no-constant-condition
        while(true) {
            const response = await inquirer.prompt([{
                name: 'action',
                message: 'Action',
                type: 'list',
                choices: [
                    Actions.GET_CHARACTER,
                    Actions.VERIFY,
                    Actions.EXIT
                ]
            }]) as MainLoopResponse;

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

    async validate(): Promise<void> {
        const response = await this.api.verifyAccessToken({});
        if (response.severity === Severity.Success) {
            process.stdout.write("Access token is valid\n");
        } else {
            process.stdout.write("Access token is not valid\n");
        }
        const input = await inquirer.prompt([
            {
                name: 'refreshAccessToken',
                message: 'Refresh access token?',
                type: 'confirm'
            },
            {
                name: 'storeAccessToken',
                message: 'Store new access token?',
                type: 'confirm',
                when: (answers: ValidateResponse) => answers.refreshAccessToken
            }
        ]);
        if (input.refreshAccessToken) {
            const tokenResponse = await this.api.acquireAccessToken({refreshToken: this.userToken, toolName: TOOLNAME});
            if (input.storeAccessToken) {
                fs.writeFileSync(getAccessFilePath(), tokenResponse.accessToken, {encoding: 'utf-8'});
            }
        }
    }

    async getCharacter(): Promise<void> {
        const input = await inquirer.prompt([
            {
                name: 'elementToken',
                message: 'Element Token'
            }
        ]) as GetCharacterInput;

        const response = await this.api.getCharacter({elementToken: input.elementToken});
        if (response.status === CharacterChangeStatus.Missing) {
            process.stdout.write("Character not found");
        } else if (response.status === CharacterChangeStatus.Unchanged) {
            process.stdout.write("Character unchanged");
        } else if (response.export) {
            process.stdout.write(`${JSON.stringify(response.export)}`);
        } else {
            process.stdout.write("No character data received");
        }
    }
};

/**
 * Get the path to the file which stores the access token.
 *
 * @returns File path.
 */
 const getAccessFilePath = (): string => {
    return os.homedir() + "/.hlo-api/access_token";
}

/**
 * Get the path to the file which stores the user token.
 *
 * @returns File path.
 */
 const getUserFilePath = (): string => {
    return os.homedir() + "/.hlo-api/user_token";
}

export { TOOLNAME, getAccessFilePath, getUserFilePath };
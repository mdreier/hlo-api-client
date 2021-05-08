/* eslint-disable @typescript-eslint/naming-convention */
import inquirer from 'inquirer';
import fs from 'fs';
import os from 'os';
import { HLOApiClient } from '../api.js';
import { CharacterChangeStatus, Severity } from '../constants.js'

type MainLoopResponse = {
    action: string
}

type ValidateResponse = {
    refreshAccessToken: boolean,
    storeAccessToken: boolean
}

type GetCharacterInput = {
    elementToken: string,
    castId: string
}

type GetCharacterBulkInput = {
    elementTokens: string
}

type GetCastListInput = {
    campaignToken: string,
    onlyPlayerCharacters: boolean
}

/**
 * Actions available in the CLI.
 */
const Actions = {
    /** Exit the CLI */
    EXIT: 'Exit',
    VERIFY: 'Verify Acccess Token',
    GET_CHARACTER: 'Get Character',
    GET_BULK: 'Get multiple characters',
    GET_CAST_LIST: 'Get cast list'
}

const TOOLNAME = "HeroLab Online CLI";

export default class HLOCli {

    /**
     * API instance used by the CLI.
     */
    private api: HLOApiClient;

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
        this.api = new HLOApiClient({userToken, accessToken, autoTokenHandling: true, toolName: TOOLNAME});
        if (!accessToken) {
            void this.api.acquireAccessToken();
        }
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
                    Actions.GET_BULK,
                    Actions.GET_CAST_LIST,
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
                case Actions.GET_BULK:
                    await this.getCharacterBulk();
                    break;
                case Actions.GET_CAST_LIST:
                    await this.getCastList();
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
            },
            {
                name: 'castId',
                message: 'Cast ID (only for campaigns)'
            }
        ]) as GetCharacterInput;

        let characterData;
        if (input.castId) {
            const response = await(this.api.getCharacters({characters: [{elementToken: input.elementToken, castId: input.castId}]}));
            characterData = response.characters[0];
        } else {
            characterData = await this.api.getCharacter({elementToken: input.elementToken});
        }
        if (characterData.status === CharacterChangeStatus.Missing) {
            process.stdout.write("Character not found\n");
        } else if (characterData.status === CharacterChangeStatus.Unchanged) {
            process.stdout.write("Character unchanged\n");
        } else if (characterData.export) {
            process.stdout.write(`${JSON.stringify(characterData.export)}\n`);
        } else {
            process.stdout.write("No character data received\n");
        }
    }

    async getCharacterBulk(): Promise<void> {
        const input = await inquirer.prompt([
            {
                name: 'elementTokens',
                message: 'Element Tokens (separated by comma)',
            }
        ]) as GetCharacterBulkInput;

        const response = await this.api.getCharacters(input.elementTokens.split(/\s*,\s*/));
        for (const character of response.characters) {
            if (character.status === CharacterChangeStatus.Missing) {
                process.stdout.write(`Character ${character.elementToken} not found\n`);
            } else if (character.status === CharacterChangeStatus.Unchanged) {
                process.stdout.write(`Character ${character.elementToken} unchanged\n`);
            } else if (character.export) {
                process.stdout.write(`${character.elementToken}: ${JSON.stringify(character.export)}\n`);
            } else {
                process.stdout.write(`No character data received for ${character.elementToken}\n`);
            }
        }
    }

    async getCastList(): Promise<void> {
        const input = await inquirer.prompt([
            {
                name: 'campaignToken',
                message: 'Campaign Token'
            },
            {
                name: 'onlyPlayerCharacters',
                message: 'Only player characters?',
                type: 'confirm'
            }
        ]) as GetCastListInput;

        let response;
        if (input.onlyPlayerCharacters) {
            response = await this.api.getPlayerCharacters(input.campaignToken);
        } else {
            response = await this.api.getStage(input.campaignToken);
        }
        process.stdout.write(`${JSON.stringify(response.castList)}\n`);
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
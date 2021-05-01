import inquirer from 'inquirer';
import HLOApi, { ResultCode, Severity } from '../api/api.js';

/**
 * Actions available in the CLI.
 */
const Actions = {
    /** Exit the CLI */
    EXIT: 'Exit',
    VERIFY: 'Verify Acccess Token'
}

export default class HLOCli {

    /**
     * API instance used by the CLI.
     */
    private api: HLOApi;

    /**
     * Create a new CLI instance.
     * @param accessToken Access token for the HeroLabl Online API.
     */
    constructor(accessToken: string) {
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
                    Actions.EXIT,
                    Actions.VERIFY
                ]
            }]);

            switch (response.action) {
                case Actions.EXIT:
                    process.exit(0);
                case Actions.VERIFY:
                    await this.validate();
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
    }
};
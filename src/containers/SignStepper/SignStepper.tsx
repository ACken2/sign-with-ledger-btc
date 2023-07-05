// Import libraries
import * as React from 'react';
import Box from '@mui/material/Box';
import Stepper from '@mui/material/Stepper';
import { LedgerAPI } from '../../bitcoin';
import { 
    ErrorAlert, SignStepperStepOne, SignStepperStepTwo,
    SignStepperStepThree, SignStepperStepFour, SignStepperStepFinal 
} from '../../components';

// Setup typings for props and state
type SignStepperProps = {
    // Empty props
}
type SignStepperState = {
    activeStep: number; // Store the current step
    address: string; // Store the signing address
    message: string; // Store the message to be signed
    searchSpace: { account: number, address: number }; // Search space currently employed
    searchProgress: number; // Progress for the current search for deviation path (ranges from 0 to 100 during a search), -1 by default
    signature: string; // Store the signed signature
    errorMessage: string | undefined; // Store the error message to be displayed (if any)
}

// Define the SignStepper container
export default class SignStepper extends React.Component<SignStepperProps, SignStepperState> {

    // Store the Ledger API instance
    private ledgerAPI: LedgerAPI | undefined;
    // Error message when Ledger API fails to connect to the device
    public readonly ERROR_LEDGER_FAIL_CONNECTION = 
        'Unable to connect to the Bitcoin app on the Ledger device. \n' + 
        "Make sure your Ledger device is unlocked with the Bitcoin app showing the text 'Bitcoin is ready', " + 
        'and you have allowed the browser to connect with your Ledger device. \n' +
        'Click Continue when your device is ready. \n' +
        'If the problem persists, try reloading the page.'
    // Error message when user rejected a transaction
    public readonly ERROR_USER_REJECT_TX = 
        'Transaction rejected by the user.'
    // Error message for unknown error
    public readonly ERROR_UNKNOWN = 'Unknown error occured. \n';

    constructor(props: SignStepperProps) {
        // Initialize the page
		super(props);
		// Set initial state
		this.state = {
			activeStep: 0,
            address: '',
            message: '',
            searchSpace: {
                account: 10,
                address: 50
            },
            searchProgress: -1,
            signature: '',
            errorMessage: undefined
		};
    }

    /**
     * Shows an error message in the UI.
     * @param message Error message to be shown
     */
    showErrorMessage(message: string) {
        // Push the message into the state
        this.setState({
            errorMessage: message
        });
    }

    /**
     * Check whether the existing LedgerAPI instance have an active connection with Ledger device.
     * If not, it will also create an ErrorAlert and change the activeStep back to 0.
     * @returns Return true if an active connection can be made with the Ledger device, false if otherwise.
     */
    checkLedgerAPIConnection = async () => {
        try {
            if (this.ledgerAPI && await this.ledgerAPI.checkConnection()) {
                // Successful connection
                return true;
            }
            // Something wrong with the connection
            throw new Error();
        } catch (err) {
            this.setState({
                activeStep: 0
            });
            this.showErrorMessage(this.ERROR_LEDGER_FAIL_CONNECTION);
            return false;
        }
    }

    /**
     * Handler for clicking the 'Continue' button in SignStepperStepOne
     */
    handleStepOneContinue = async () => {
        try {
            // Initialize LedgerAPI
            this.ledgerAPI = await LedgerAPI.constructorAsync();
            // Check connection to the Ledger device
            if (await this.checkLedgerAPIConnection()) {
                // If successfully connected, advance to the next step
                this.setState({
                    activeStep: this.state.activeStep + 1,
                    errorMessage: undefined
                });
            }
        }
        catch (err) {
            this.showErrorMessage(this.ERROR_LEDGER_FAIL_CONNECTION);
        }
    };

    /**
     * Handler for clicking the 'Continue' button in SignStepperStepTwo.
     * @param address Valid Bitcoin address inputted by the user
     * @param message Message to be signed, as inputted by the user
     */
    handleStepTwoContinue = async (address: string, message: string) => {
        try {
            // Check connection to the Ledger device
            if (await this.checkLedgerAPIConnection()) {
                // If successfully connected, advance to the next step and search for the address
                this.setState({
                    activeStep: this.state.activeStep + 1,
                    address: address,
                    message: message,
                    searchSpace: {
                        account: 10,
                        address: 50
                    },
                    searchProgress: 0,
                    errorMessage: undefined
                }, () => {
                    // Call handleSearch to do the actual search after state update
                    this.handleSearch();
                });
            }
        }
        catch (err) {
            this.showErrorMessage(this.ERROR_UNKNOWN + err);
        }
    };

    /**
     * Handler for clicking the 'Back' button in SignStepperStepTwo.
     */
    handleStepTwoBack = () => {
        this.setState({
            activeStep: this.state.activeStep - 1
        });
    };

    /**
     * Handler for the progressCallback from LedgerAPI during the search for devation path.
     * @param progress Progress of the search (ranges from 0 to 1)
     */
    handleSearchProgressUpdate = (progress: number) => {
        this.setState({
            searchProgress: progress * 100
        });
    }

    /**
     * Perform the deviation path search via LedgerAPI.
     * If succeed, it will propose transaction to be signed and move the activeStep to the next step.
     * If not, it will set progress to -1, and ask the user for follow up action.
     */
    handleSearch = async () => {
        try {
            if (this.ledgerAPI && await this.checkLedgerAPIConnection()) {
                // Perform deviation path search
                const result = await this.ledgerAPI.findAddressPathAndKey(this.state.address, this.state.searchSpace.account, this.state.searchSpace.address, this.handleSearchProgressUpdate);
                if (result) {
                    // Deviation path found, move on to the next step
                    this.setState({
                        activeStep: this.state.activeStep + 1,
                        errorMessage: undefined
                    }, () => {
                        // Propose transaction to be signed after state update
                        this.handleSign(result.path, result.publicKey);
                    });
                }
                else {
                    // Set progress to -1 and ask user for follow up action
                    this.setState({
                        searchProgress: -1
                    });
                }
            }
        }
        catch (err) {
            // Show error message
            this.showErrorMessage(this.ERROR_UNKNOWN + err);
            // Set activeStep back to step 2
            this.setState({
                activeStep: 1
            });
        }
    }

    /**
     * Handler for clicking the 'Continue' button in SignStepperStepThree.
     * If the user agrees to expand search space, we will double the search space and try again.
     */
    handleStepThreeContinue = () => {
        this.setState({
            searchProgress: 0,
            searchSpace: {
                account: this.state.searchSpace.account * 2,
                address: this.state.searchSpace.address * 2
            },
            errorMessage: undefined
        }, () => {
            // Call handleSearch to do the actual search after state update
            this.handleSearch();
        });
    };

    /**
     * Handler for clicking the 'Back' button in SignStepperStepThree.
     * If the user clicks Back, then we move back to step 2 to allow user to re-enter their address and message.
     */
    handleStepThreeBack = () => {
        this.setState({
            activeStep: 1
        });
    };

    /**
     * Sign a BIP-322 signature via LedgerAPI.
     * If succeed, it will push the signature into the state and move the activeStep to the next step.
     * If failed, it will reset the activeStep back to step 2 with an error message.
	 * @param deviationPath The full deviation path to derive the address to be signing the toSignTx (e.g., m/86'/0'/0'/0/0)
	 * @param pubKey The public key (for segwit or native segwit) or internal key (for taproot) of the address to be signing the toSignTx
     */
    handleSign = async (deviationPath: string, pubKey: Buffer) => {
        try {
            if (this.ledgerAPI && await this.checkLedgerAPIConnection()) {
                // If successfully connected, propose transaction to be signed on the Ledger device
                const signature = await this.ledgerAPI.signBIP322(this.state.message, deviationPath, this.state.address, pubKey);
                // Proceed to the next step if a signature is returned successfully
                this.setState({
                    activeStep: this.state.activeStep + 1,
                    signature: signature,
                    errorMessage: undefined
                });
            }
        }
        catch (err) {
            // Handler for user-rejected transaction
            if (err instanceof Error && err.message.includes(LedgerAPI.USER_REJECT_TX_ERROR)) {
                // User have rejected the transaction
                this.showErrorMessage(this.ERROR_USER_REJECT_TX);
            }
            else {
                // For other error, show a generic error message
                this.showErrorMessage(this.ERROR_UNKNOWN + err);
            }
            // Set activeStep back to step 2
            this.setState({
                activeStep: 1
            });
        }
    }

    // Handler for clicking the 'Reset' button after signing
    handleReset = () => {
        this.setState({
			activeStep: 1,
            address: '',
            message: '',
            searchSpace: {
                account: 10,
                address: 50
            },
            searchProgress: -1,
            signature: '',
            errorMessage: undefined
		});
    };

    render() {
        return (
            <Box sx={{ maxWidth: 800 }}>
                <Stepper activeStep={this.state.activeStep} orientation="vertical">
                    <SignStepperStepOne onContinue={this.handleStepOneContinue} />
                    <SignStepperStepTwo onContinue={this.handleStepTwoContinue} onBack={this.handleStepTwoBack} />
                    <SignStepperStepThree 
                        address={this.state.address} progress={this.state.searchProgress} seachSpace={this.state.searchSpace} 
                        onExpandSearchSpace={this.handleStepThreeContinue} onBack={this.handleStepThreeBack}
                    />
                    <SignStepperStepFour address={this.state.address} message={this.state.message} />
                </Stepper>
                {this.state.activeStep === 4 && (
                    <SignStepperStepFinal signature={this.state.signature} onReset={this.handleReset}></SignStepperStepFinal>
                )}
                {this.state.errorMessage !== undefined && (
                    <ErrorAlert message={this.state.errorMessage} />
                )}
            </Box>
        );
    }

}
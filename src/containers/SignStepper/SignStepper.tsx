// Import libraries
import * as React from 'react';
import Box from '@mui/material/Box';
import Stepper from '@mui/material/Stepper';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import { LedgerAPI } from '../../bitcoin';
import { ErrorAlert, SignStepperStepsText, SignStepperStepFour, SignStepperStepOne, SignStepperStepThree, SignStepperStepTwo } from '../../components';

// Setup typings for props and state
type SignStepperProps = {
    // Empty props
}
type SignStepperState = {
    activeStep: number; // Store the current step
    address: string; // Store the signing address
    message: string; // Store the message to be signed
    searchSpace: { account: number, address: number }; // Search space currently employed
    signature: string; // Store the signed signature
    errorMessage: string | undefined; // Store the error message to be displayed (if any)
}

// Define the SignStepper container
export default class SignStepper extends React.Component<SignStepperProps, SignStepperState> {

    // Store the Ledger API instance
    private ledgerAPI: LedgerAPI | undefined;
    // Warning message when Ledger API fails to connect to the device
    public readonly LEDGER_FAIL_CONNECTION = 
        'Unable to connect to the Bitcoin app on the Ledger device. ' + 
        "Make sure your Ledger device is unlocked with the Bitcoin app showing the text 'Bitcoin is ready', " + 
        'and you have allowed the browser to connect with your Ledger device.'

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
            // Something wrong with the 
            throw new Error();
        } catch (err) {
            this.setState({
                activeStep: 0
            });
            this.showErrorMessage(this.LEDGER_FAIL_CONNECTION);
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
                    activeStep: this.state.activeStep + 1
                });
            }
        }
        catch (err) {
            this.showErrorMessage(this.LEDGER_FAIL_CONNECTION);
        }
    };

    // Handler for clicking the 'Continue' button in SignStepperStepTwo
    handleStepTwoContinue = (address: string, message: string) => {
        this.setState({
            activeStep: this.state.activeStep + 1,
            address: address,
            message: message,
            searchSpace: {
                account: 10,
                address: 50
            }
        });
    };

    // Handler for clicking the 'Back' button in SignStepperStepTwo
    handleStepTwoBack = () => {
        this.setState({
            activeStep: this.state.activeStep - 1
        });
    };

    // Handler for clicking the 'Continue' button in SignStepperStepThree
    handleStepThreeContinue = () => {
        this.setState({
            searchSpace: {
                account: this.state.searchSpace.account * 2,
                address: this.state.searchSpace.address * 2
            }
        });
    };

    // Handler for clicking the 'Back' button in SignStepperStepThree
    handleStepThreeBack = () => {
        this.setState({
            activeStep: 1,
            address: '',
            message: ''
        });
    };

    // Handler for clicking the 'Back' button in SignStepperStepFour
    handleStepFourBack = () => {
        this.setState({
            activeStep: 1,
            address: '',
            message: ''
        });
    };

    // Handler for clicking the 'Reset' button after signing
    handleReset = () => {
        this.setState({
			activeStep: 0,
            address: '',
            message: '',
            searchSpace: {
                account: 10,
                address: 50
            },
            signature: ''
		});
    };

    render() {
        return (
            <Box sx={{ maxWidth: 800 }}>
                <Stepper activeStep={this.state.activeStep} orientation="vertical">
                    <SignStepperStepOne onContinue={this.handleStepOneContinue} />
                    <SignStepperStepTwo onContinue={this.handleStepTwoContinue} onBack={this.handleStepTwoBack} />
                    <SignStepperStepThree 
                        address={this.state.address} progress={25} seachSpace={this.state.searchSpace} 
                        onExpandSearchSpace={this.handleStepThreeContinue} onBack={this.handleStepThreeBack}
                    />
                    <SignStepperStepFour address={this.state.address} message={this.state.message} onBack={this.handleStepFourBack} />
                </Stepper>
                {this.state.activeStep === 4 && (
                    <Paper square elevation={0} sx={{ p: 3 }}>
                        <SignStepperStepsText>All steps completed.</SignStepperStepsText>
                        <SignStepperStepsText>{`BIP-322 Signature: ${this.state.signature}`}</SignStepperStepsText>
                        <Button onClick={this.handleReset} sx={{ mt: 1, mr: 1 }}>
                            Reset
                        </Button>
                    </Paper>
                )}
                {this.state.errorMessage !== undefined && (
                    <ErrorAlert message={this.state.errorMessage} />
                )}
            </Box>
        );
    }

}
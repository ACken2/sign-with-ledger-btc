// Import libraries
import * as React from 'react';
import Box from '@mui/material/Box';
import Stepper from '@mui/material/Stepper';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import { SignStepperStepsText, SignStepperStepFour, SignStepperStepOne, SignStepperStepThree, SignStepperStepTwo } from '../../components/SignStepperSteps';

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
}

// Define the SignStepper container
export default class SignStepper extends React.Component<SignStepperProps, SignStepperState> {

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
            signature: ''
		};
    }

    // Handler for clicking the 'Continue' button in SignStepperStepOne
    handleStepOneContinue = () => {
        this.setState({
            activeStep: this.state.activeStep + 1
        });
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
            </Box>
        );
    }

}
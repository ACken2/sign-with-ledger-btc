// Import libraries
import React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import StepContent from '@mui/material/StepContent';
import SignStepperStepsText from './SignStepperStepsText';

// Import images
import ApproveImage from './resources/Approve.png';

// Define props that should be passed into this component
type SignStepperStepFourProps = {
    address: string; // Bitcoin address currently being searched
	message: string; // Message to be signed
    onBack: () => void; // Callback method whenever the user click 'Back'
}

// Define the SignStepperStepFour component
const SignStepperStepFour: React.FC<SignStepperStepFourProps> = ({ address, message, onBack }) => {

	// Render step 4 for the signing process
	return (
		<Step index={3}>
            <StepLabel>{
                address === '' ?
                'Sign the message using your address on the Ledger Device' :
                `Sign '${message}' using ${address} on the Ledger device`
            }</StepLabel>
            <StepContent>
                <SignStepperStepsText>Carefully verify all transaction details on your device by pressing the right or left button to view all transaction details.</SignStepperStepsText>
                <SignStepperStepsText variant="h6">You should be signing a transaction that spends 0 BTC to OP_RETURN with 0 BTC in fee.</SignStepperStepsText>
                <SignStepperStepsText>Press both buttons to Accept and send the transaction if everything is correct.</SignStepperStepsText>
                <SignStepperStepsText mb={2}>Choose Reject to cancel the transaction if the transaction shown on the device did not match the above description.</SignStepperStepsText>
                <img src={ApproveImage} alt='Approve transaction on Ledger device' />
                <Box sx={{ mb: 2 }}>
                    <div>
                        <Button
                            onClick={onBack}
                            sx={{ mt: 1, mr: 1 }}
                        >
                            Back
                        </Button>
                    </div>
                </Box>
            </StepContent>
        </Step>
	);
	
};
  
export default SignStepperStepFour;
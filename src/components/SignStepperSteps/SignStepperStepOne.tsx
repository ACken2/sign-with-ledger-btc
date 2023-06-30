// Import libraries
import React from 'react';
import Box from '@mui/material/Box';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import StepContent from '@mui/material/StepContent';
import Button from '@mui/material/Button';
import SignStepperStepsText from './SignStepperStepsText';

// Import images
import UnlockImage from './resources/Unlock.png';
import OpenAppImage from './resources/Open-App.png';

// Define props that should be passed into this component
type SignStepperStepOneProps = {
	// Callback method whenever the user click 'Continue'
	onContinue: () => void;
}

// Define the SignStepperStepOne component
const SignStepperStepOne: React.FC<SignStepperStepOneProps> = ({ onContinue }) => {

	// Render step 1 for the signing process
	return (
		<Step index={0}>
            <StepLabel>Connect and unlock your Ledger device</StepLabel>
            <StepContent>
                <SignStepperStepsText>
                    Connect and unlock your Ledger device.
                </SignStepperStepsText>
                <img src={UnlockImage} alt='Unlock Ledger device' />
                <SignStepperStepsText>
                    Open the Bitcoin app on your unlocked device.
                </SignStepperStepsText>
                <img src={OpenAppImage} alt='Open Bitcoin app' />
                <SignStepperStepsText>
                    Click Continue when the Ledger device shows the text 'Bitcoin is ready'.
                </SignStepperStepsText>
                <Box sx={{ mb: 2 }}>
                    <div>
                        <Button
                            variant="contained"
                            onClick={onContinue}
                            sx={{ mt: 1, mr: 1 }}
                        >
                            Continue
                        </Button>
                    </div>
                </Box>
            </StepContent>
        </Step>
	);
	
};
  
export default SignStepperStepOne;
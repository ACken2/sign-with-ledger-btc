// Import libraries
import React from 'react';
import { Line } from 'rc-progress';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import StepContent from '@mui/material/StepContent';
import { useTheme } from '@mui/material/styles';
import SignStepperStepsText from './SignStepperStepsText';

// Define props that should be passed into this component
type SignStepperStepThreeProps = {
    address: string; // Bitcoin address currently being searched
	progress: number; // Progress of the seach, pass a value beyond 0 or 100 to display the 'Expand Search' dialog instead
    seachSpace: { account: number, address: number }; // Search space currently employed
    onExpandSearchSpace: () => void; // Callback method whenever the user click 'Continue'
    onBack: () => void; // Callback method whenever the user click 'Back'
}

// Define the SignStepperStepThree component
const SignStepperStepThree: React.FC<SignStepperStepThreeProps> = ({ address, progress, seachSpace, onExpandSearchSpace, onBack }) => {

    // Get theme
    const theme = useTheme();

	// Render step 3 for the signing process
	return (
		<Step index={2}>
            <StepLabel>{`Searching ${address} on your Ledger device`}</StepLabel>
            <StepContent>
                {
                    (progress >= 0 && progress <= 100) ?
                        // Render progress bar if progess it is between 0 to 100
                        <>
                            <SignStepperStepsText>Please wait patiently while we are searching your address on your Ledger device.</SignStepperStepsText>
                            <Line 
                                style={{ marginTop: '1em', width: '80%' }} percent={10} strokeWidth={4} trailWidth={4} 
                                strokeColor={theme.palette.primary.dark} trailColor={theme.palette.action.disabledBackground} 
                            />
                        </>
                    :
                        // Otherwise, render a dialog to ask whether the user want to continue searching
                        <>
                            <SignStepperStepsText>{`We are unable to locate ${address} after searching through ${seachSpace.account * seachSpace.address} addresses.`}</SignStepperStepsText>
                            <SignStepperStepsText>Click Continue to expand the search space, or click Back to modify the Bitcoin address if necessary.</SignStepperStepsText>
                            <Box sx={{ mb: 2 }}>
                                <div>
                                    <Button
                                        variant="contained"
                                        onClick={onExpandSearchSpace}
                                        sx={{ mt: 1, mr: 1 }}
                                    >
                                        Continue
                                    </Button>
                                    <Button
                                        onClick={onBack}
                                        sx={{ mt: 1, mr: 1 }}
                                    >
                                        Back
                                    </Button>
                                </div>
                            </Box>
                        </>
                }
            </StepContent>
        </Step>
	);
	
};
  
export default SignStepperStepThree;
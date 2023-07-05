// Import libraries
import React from 'react';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import { useTheme } from '@mui/material/styles';
import SignStepperStepsText from './SignStepperStepsText';

// Define props that should be passed into this component
type SignStepperStepFinalProps = {
    signature: string; // Signed BIP-322 signature
    onReset: () => void; // Callback method whenever the user click 'Reset'
}

// Define the SignStepperStepFinal component
const SignStepperStepFinal: React.FC<SignStepperStepFinalProps> = ({ signature, onReset }) => {
    // Get theme
    const theme = useTheme();
	// Render the signed signature to the user
	return (
		<Paper square elevation={0} sx={{ p: 3 }}>
            <SignStepperStepsText>All steps completed.</SignStepperStepsText>
            <SignStepperStepsText 
                variant='subtitle1' color={theme.palette.text.primary} 
                sx={{ 'width': '80%', 'overflowWrap': 'break-word' }}
            >
                {`Signature: ${signature}`}
            </SignStepperStepsText>
            <Button onClick={onReset} sx={{ mt: 1, mr: 1 }}>
                Reset
            </Button>
        </Paper>
	);
	
};
  
export default SignStepperStepFinal;
// Import libraries
import { Address } from 'bip322-js';
import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import StepContent from '@mui/material/StepContent';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';

// Define props that should be passed into this component
type SignStepperStepTwoProps = {
	// Callback method whenever the user click 'Continue'
	onContinue: (address: string, message: string) => void;
    // Callback method whenever the user click 'Back'
    onBack: () => void;
}

// Define the SignStepperStepTwo component
const SignStepperStepTwo: React.FC<SignStepperStepTwoProps> = ({ onContinue, onBack }) => {

    // State to control the text field for inputting the Bitcoin address
	const [address, setAddress] = useState('');
    // State to control the text field for inputting the Bitcoin address
	const [addressValidity, setAddressValidity] = useState(false);
    // State to control the text field for inputting the message to be signed
	const [message, setMessage] = useState('');

    // Function to be called whenever the user change the address textfield
	const handleAddressInput = (event: React.ChangeEvent<HTMLInputElement>) => {
		setAddress(event.target.value.trim());
	};
    // Function to be called whenever the user change the message textfield
	const handleMessgeInput = (event: React.ChangeEvent<HTMLInputElement>) => {
		setMessage(event.target.value);
	};
    // Function to validate an input address
    const isValidAddress = (address: string) => {
        try {
            Address.convertAdressToScriptPubkey(address);
            return true;
        }
        catch (err) {
            return false;
        }
    }
    // Function to be called whenever the address textfield lose focus
    const handleAddressLoseFocus = () => {
        // Validate whether the address inputted is valid or not
        setAddressValidity(isValidAddress(address));
    }
    // Function to be called when the user click the 'Continue' button
    const handleContinue = () => {
        // Continue only if addressValidity is true
        if (addressValidity) {
            onContinue(address, message);
        }
    }

	// Render step 2 for the signing process
	return (
		<Step index={1}>
            <StepLabel>Enter the Bitcoin signing address and the message to be signed</StepLabel>
            <StepContent>
                <TextField
                    required
                    fullWidth
                    error={!addressValidity}
                    value={address}
                    onChange={handleAddressInput}
                    onBlur={handleAddressLoseFocus}
                    label='Address'
                    margin='normal'
                    helperText='Please input a valid P2PKH, P2SH-P2WPKH, P2WPKH, or P2TR Bitcoin address.'
                />
                <br />
                <TextField
                    required
                    fullWidth
                    value={message}
                    onChange={handleMessgeInput}
                    label='Message'
                    margin='normal'
                    helperText='Please input the message to be signed by the address above.'
                />
                <Box sx={{ mb: 2 }}>
                    <div>
                        <Button
                            variant="contained"
                            onClick={handleContinue}
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
            </StepContent>
        </Step>
	);
	
};
  
export default SignStepperStepTwo;
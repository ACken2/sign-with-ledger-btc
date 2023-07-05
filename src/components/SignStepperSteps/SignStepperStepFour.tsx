// Import libraries
import React from 'react';
import sha256 from "fast-sha256";
import { Address } from 'bip322-js';
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
}

// Define the SignStepperStepFour component
const SignStepperStepFour: React.FC<SignStepperStepFourProps> = ({ address, message }) => {

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
                {
                    Address.isP2PKH(address) ?
                    <>
                        <SignStepperStepsText variant="h6">You should be signing a message with the SHA256 hash {Buffer.from(sha256(Buffer.from(message))).toString('hex').toUpperCase()}.</SignStepperStepsText>
                        <SignStepperStepsText>Press both buttons to Accept and sign the message if everything is correct.</SignStepperStepsText>
                    </> :
                    <>
                        <SignStepperStepsText variant="h6">You should be signing a transaction that spends 0 BTC to OP_RETURN with 0 BTC in fee.</SignStepperStepsText>
                        <SignStepperStepsText>Press both buttons to Accept and send the transaction if everything is correct.</SignStepperStepsText>
                    </>
                }
                <SignStepperStepsText variant="h6" mb={2}>Choose Reject to cancel the signing process if the transaction shown on the device did not match the above description.</SignStepperStepsText>
                <img src={ApproveImage} alt='Approve transaction on Ledger device' />
            </StepContent>
        </Step>
	);
	
};
  
export default SignStepperStepFour;
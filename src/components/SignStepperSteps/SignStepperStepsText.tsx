// Import libraries
import React from 'react';
import { useTheme } from '@mui/material/styles';
import Typography, { TypographyProps } from '@mui/material/Typography';

// Define props that should be passed into this component
type SignStepperStepsTextProps = {
    // Empty props
} & TypographyProps;

// Define the SignStepperStepsText component - text used within SignStepperSteps
const SignStepperStepsText: React.FC<SignStepperStepsTextProps> = ({ children, ...props }) => {
    // Get theme
    const theme = useTheme();
    // Render
    return (
        <Typography variant='body2' mt={1} color={theme.palette.text.secondary} {...props}>
            {children}
        </Typography>
    )
}

export default SignStepperStepsText;
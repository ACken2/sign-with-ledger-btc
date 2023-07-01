// Import libraries
import React from 'react';
import Fade from '@mui/material/Fade';
import Alert from '@mui/material/Alert';
import Paper from '@mui/material/Paper';

// Define props that should be passed into this component
type ErrorAlertProps = {
	message: string; // Error message to be displayed
}

// Define the ErrorAlert component
const ErrorAlert: React.FC<ErrorAlertProps> = ({ message }) => {

    return (
        <Fade timeout={200} in={true}>
            <Paper square elevation={3} sx={{ width: '90%', maxWidth: 720, bottom: '20px', position: 'fixed', whiteSpace: 'pre-line', zIndex: 1 }}>
                <Alert severity='error'>{message}</Alert>
            </Paper>
        </Fade>
    );

};

export default ErrorAlert;
// Import libraries
import React from 'react';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';

// Import package.json for version number
import packageJson from '../../../package.json';

const AppFooter: React.FC = () => {
    return (
        <Typography variant='overline' color='text.disabled'>
            {
                "MIT License | " +
                "Version " + packageJson.version + " | " +
                "Build " + process.env.REACT_APP_VERSION?.substring(0, 7) + " | "
            }
            <Link href='https://github.com/ACken2/sign-with-ledger-btc' underline='none'>
                <Typography variant='overline' color='text.disabled'>
                    Source code available on GitHub
                </Typography>
            </Link>
        </Typography>
    )
}

export default AppFooter;
// Import dependencies
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider, createTheme } from '@mui/material/styles';

// Import containers/components to be rendered
import { SignStepper } from '../SignStepper';
import { AppHeader, AppFooter } from '../../components';

// Import CSS
import './App.css';

function App() {
	const darkTheme = createTheme({
		palette: {
		  	mode: 'dark',
		},
		components: {
			MuiStepLabel: {
				styleOverrides: {
					label: {
						fontSize: '1.1rem'
					}
				}
			}
		}
	});
	return (
		<ThemeProvider theme={darkTheme}>
			<CssBaseline />
			<Stack 
				className='App' 
				spacing={2} 
				justifyContent="center" 
				alignItems="center" 
				divider={<Divider orientation="horizontal" flexItem />}
			>
				<AppHeader />
				<SignStepper />
				<AppFooter />
			</Stack>
		</ThemeProvider>
	);
}

export default App;

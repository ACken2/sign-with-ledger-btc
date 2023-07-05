// Import dependencies
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider, createTheme } from '@mui/material/styles';

// Import containers to be rendered
import { SignStepper } from '../SignStepper';

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
			<div className='App'>
				<SignStepper />
			</div>
		</ThemeProvider>
	);
}

export default App;

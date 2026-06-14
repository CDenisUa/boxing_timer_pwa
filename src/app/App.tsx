// App
import { SessionsProvider } from '@/app/SessionsProvider';

// Navigation
import { RootNavigator } from '@/navigation/RootNavigator';

// Theme
import { ThemeProvider } from '@/theme/ThemeProvider';

const App = () => (
  <ThemeProvider>
    <SessionsProvider>
      <RootNavigator />
    </SessionsProvider>
  </ThemeProvider>
);

export default App;

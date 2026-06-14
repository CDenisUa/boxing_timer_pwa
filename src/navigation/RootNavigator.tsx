// Core
import { createContext, useCallback, useContext, useMemo, useState } from 'react';

// Screens
import { SessionEditorScreen } from '@/screens/SessionEditorScreen';
import { SessionRunScreen } from '@/screens/SessionRunScreen';
import { SessionsListScreen } from '@/screens/SessionsListScreen';
import { SettingsScreen } from '@/screens/SettingsScreen';

export type RootStackParamList = {
  SessionsList: undefined;
  SessionEditor: { sessionId?: string } | undefined;
  SessionRun: { sessionId: string };
  Settings: undefined;
};

export type RouteName = keyof RootStackParamList;

type StackEntry = {
  name: RouteName;
  params?: RootStackParamList[RouteName];
};

type Navigation = {
  navigate: <T extends RouteName>(name: T, params?: RootStackParamList[T]) => void;
  goBack: () => void;
};

type Route<T extends RouteName> = {
  name: T;
  params: RootStackParamList[T];
};

const NavigationContext = createContext<{ navigation: Navigation; current: StackEntry } | undefined>(
  undefined,
);

export const useNavigation = (): Navigation => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within RootNavigator');
  }
  return context.navigation;
};

export const useIsFocused = (forName: RouteName): boolean => {
  const context = useContext(NavigationContext);
  return context?.current.name === forName;
};

// Mirrors the prop shape the screens expect from React Navigation.
export type ScreenProps<T extends RouteName> = {
  navigation: Navigation;
  route: Route<T>;
};

export const RootNavigator = () => {
  const [stack, setStack] = useState<StackEntry[]>([{ name: 'SessionsList' }]);

  const navigate = useCallback<Navigation['navigate']>((name, params) => {
    setStack((prev) => [...prev, { name, params }]);
    if (typeof window !== 'undefined') {
      window.scrollTo(0, 0);
    }
  }, []);

  const goBack = useCallback(() => {
    setStack((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev));
  }, []);

  const navigation = useMemo<Navigation>(() => ({ navigate, goBack }), [navigate, goBack]);

  const current = stack[stack.length - 1];

  const contextValue = useMemo(() => ({ navigation, current }), [navigation, current]);

  const renderScreen = () => {
    switch (current.name) {
      case 'SessionEditor':
        return (
          <SessionEditorScreen
            navigation={navigation}
            route={{ name: 'SessionEditor', params: current.params as RootStackParamList['SessionEditor'] }}
          />
        );
      case 'SessionRun':
        return (
          <SessionRunScreen
            navigation={navigation}
            route={{ name: 'SessionRun', params: current.params as RootStackParamList['SessionRun'] }}
          />
        );
      case 'Settings':
        return (
          <SettingsScreen navigation={navigation} route={{ name: 'Settings', params: undefined }} />
        );
      case 'SessionsList':
      default:
        return (
          <SessionsListScreen
            navigation={navigation}
            route={{ name: 'SessionsList', params: undefined }}
          />
        );
    }
  };

  return (
    <NavigationContext.Provider value={contextValue}>{renderScreen()}</NavigationContext.Provider>
  );
};

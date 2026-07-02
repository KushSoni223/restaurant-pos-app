import * as SplashScreen from 'expo-splash-screen';
import type { ReactNode } from 'react';
import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '@/hooks/useAuth';

import { AnimatedSplash } from './AnimatedSplash';

SplashScreen.preventAutoHideAsync().catch(() => {});

const MIN_SPLASH_MS = 2400;

interface SplashGateProps {
  children: ReactNode;
}

export function SplashGate({ children }: SplashGateProps) {
  const { isLoading } = useAuth();
  const [authReady, setAuthReady] = useState(false);
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);
  const [splashVisible, setSplashVisible] = useState(true);

  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setMinTimeElapsed(true), MIN_SPLASH_MS);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isLoading) {
      setAuthReady(true);
    }
  }, [isLoading]);

  const handleFinish = useCallback(() => {
    setSplashVisible(false);
  }, []);

  const shouldExit = authReady && minTimeElapsed;

  return (
    <>
      {children}
      {splashVisible ? <AnimatedSplash exiting={shouldExit} onFinish={handleFinish} /> : null}
    </>
  );
}

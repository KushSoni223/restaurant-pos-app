import { Redirect } from 'expo-router';

import { useAuth } from '@/hooks/useAuth';
import { getHomeRouteForRole } from '@/navigation/roleNavigation';

export default function Index() {
  const { user, isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return null;
  }

  if (!isAuthenticated || !user) {
    return <Redirect href="/(auth)/login" />;
  }

  return <Redirect href={getHomeRouteForRole(user.role)} />;
}

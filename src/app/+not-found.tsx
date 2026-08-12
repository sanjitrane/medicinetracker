import { Stack, useRouter } from 'expo-router';

import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';

export default function NotFoundScreen() {
  const router = useRouter();

  return (
    <>
      <Stack.Screen options={{ title: 'Not Found' }} />
      <Screen>
        <EmptyState
          icon="🧭"
          title="Page not found"
          message="That screen does not exist."
          actionLabel="Go to Dashboard"
          onAction={() => router.replace('/')}
        />
      </Screen>
    </>
  );
}

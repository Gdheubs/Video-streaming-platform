import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // Data stays "fresh" for 5 minutes (no refetching)
      refetchOnWindowFocus: false, // Don't reload if user tabs away and back
      retry: 1,
    },
  },
});

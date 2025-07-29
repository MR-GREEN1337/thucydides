import useSWR, { SWRConfiguration } from 'swr';
import { useSession } from 'next-auth/react';

// The fetcher function that will be used by SWR
const authedFetcher = async (url: string, accessToken: string | undefined) => {
  if (!accessToken) {
    throw new Error('Not authenticated');
  }

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    const errorInfo = await res.json();
    const error = new Error(errorInfo.detail || 'An error occurred while fetching the data.');
    // You can attach more info to the error object if needed
    // error.info = errorInfo;
    // error.status = res.status;
    throw error;
  }

  return res.json();
};

// The custom hook
export function useAuthedSWR<Data = any, Error = any>(
  path: string | null,
  config?: SWRConfiguration<Data, Error>
) {
  const { data: session, status } = useSession();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  const accessToken = session?.accessToken;
  const fullUrl = path ? `${apiUrl}${path}` : null;

  // Only fetch if the session is authenticated and the path is not null
  const shouldFetch = status === 'authenticated' && fullUrl;

  const { data, error, isLoading, mutate, isValidating } = useSWR<Data, Error>(
    shouldFetch ? fullUrl : null,
    (url) => authedFetcher(url, accessToken),
    {
      ...config,
      // Revalidate on focus by default, which is good for dynamic data
    }
  );

  return {
    data,
    error,
    isLoading: (status === 'loading' && !data && !error) || isLoading,
    mutate,
    isValidating,
  };
}

import {
  ApolloClient,
  InMemoryCache,
  createHttpLink,
  ApolloLink,
} from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';

const httpLink = createHttpLink({
  uri: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/graphql',
});

let cachedToken: string | null = null;
let tokenExpiry = 0;

const authLink = setContext(async (_, { headers }) => {
  if (cachedToken && Date.now() < tokenExpiry) {
    return {
      headers: { ...headers, authorization: `Bearer ${cachedToken}` },
    };
  }

  try {
    const res = await fetch('/api/auth/token', { credentials: 'include' });
    if (res.ok) {
      const { accessToken } = await res.json();
      if (accessToken) {
        cachedToken = accessToken;
        tokenExpiry = Date.now() + 5 * 60 * 1000;
      }
      return {
        headers: {
          ...headers,
          authorization: accessToken ? `Bearer ${accessToken}` : '',
        },
      };
    }
  } catch {
    // Fall through with no auth header
  }

  return { headers };
});

const errorLink = onError(({ graphQLErrors, networkError }) => {
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message }) => {
      console.error(`[GraphQL error]: ${message}`);
    });
  }
  if (networkError) {
    console.error(`[Network error]: ${networkError}`);
  }
});

export const client = new ApolloClient({
  link: ApolloLink.from([errorLink, authLink, httpLink]),
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: { fetchPolicy: 'cache-and-network' },
  },
});

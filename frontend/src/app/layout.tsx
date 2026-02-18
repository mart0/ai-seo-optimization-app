import type { Metadata } from 'next';
import { UserProvider } from '@auth0/nextjs-auth0/client';
import { ApolloWrapper } from '@/components/ApolloWrapper';
import './globals.css';

export const metadata: Metadata = {
  title: 'SEO Optimizer - AI-Powered Content SEO',
  description: 'Analyze and optimize your website SEO with AI assistance',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <UserProvider>
          <ApolloWrapper>{children}</ApolloWrapper>
        </UserProvider>
      </body>
    </html>
  );
}

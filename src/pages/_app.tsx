import "@/styles/tailwind.css";
import "@/styles/global.css";
import type { AppProps } from "next/app";
import { ReplayParserProvider } from "@/features/worker";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SessionProvider } from "next-auth/react";

const queryClient = new QueryClient();

function MyApp({ Component, pageProps: { session, ...pageProps } }: AppProps) {
  return (
    <SessionProvider session={session}>
      <QueryClientProvider client={queryClient}>
        <ReplayParserProvider>
          <Component {...pageProps} />
        </ReplayParserProvider>
      </QueryClientProvider>
    </SessionProvider>
  );
}

export default MyApp;

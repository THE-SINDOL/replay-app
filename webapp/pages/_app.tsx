import React from "react";
import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { trpc } from "../utils/trpc";
import Script from "next/script";
function App({ Component, pageProps }: AppProps) {
  return (
    <>
      {/* <!-- Google tag (gtag.js) --> */}
      <Script src="https://www.googletagmanager.com/gtag/js?id=G-N80PL405WL" />
      <Script>
        {`window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());

          gtag('config', 'G-N80PL405WL');
        `}
      </Script>
      <Component {...pageProps} />
    </>
  );
}

export default trpc.withTRPC(App);

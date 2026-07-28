import React from "react";
import Providers from "../app/providers";
import "../app/globals.css";

export default function App({ Component, pageProps }) {
  return (
    <Providers>
      <Component {...pageProps} />
    </Providers>
  );
}

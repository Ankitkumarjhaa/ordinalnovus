"use client";
import "./globals.css";
import { WalletProvider } from "bitcoin-wallet-adapter";

//carousel
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

import Head from "next/head";
import Footer from "@/components/Layout/Footer";

import { Provider } from "react-redux";
import { store } from "@/stores";
import Header from "@/components/Layout/Header";
import Script from "next/script";
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <WalletProvider>
      <Provider store={store}>
        <html lang="en">
          <Script src="https://www.googletagmanager.com/gtag/js?id=G-7KWT77M049" />
          <Script id="google-analytics">
            {`                
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                 gtag('js', new Date());

                   gtag('config', 'G-7KWT77M049');
                `}
          </Script>
          <Head key="head-main">
            <link rel="icon" href="/favicon.ico" sizes="any" />
          </Head>
          <body className=" bg-primary text-light_gray relative small-scrollbar">
            <main className=" py-52 lg:py-24 px-6 max-w-screen-2xl mx-auto relative">
              {/* <main className=" py-52 lg:py-24 px-6 lg:px-24 max-w-7xl mx-auto relative"> */}
              <Header />
              <div className="w-full my-2 text-xs py-2 uppercase font-bold text-white text-center">
                <p
                  className={`text-bitcoin bg-secondary  py-2 w-full border-accent border rounded tracking-widest font-bold`}
                >
                  Zero Fee Trading*
                </p>
              </div>
              {children}
            </main>
            <div className="bg-secondary">
              <Footer />
            </div>
          </body>
        </html>
      </Provider>
    </WalletProvider>
  );
}

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
import initMixpanel from "@/lib/mixpanelConfig";
import { Suspense, useEffect } from "react";
import { NavigationEvents } from "@/components/Layout/NavigationEvents";
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    initMixpanel();
  }, []);

  return (
    <Provider store={store}>
      <WalletProvider>
        <html lang="en">
          {process.env.NEXT_PUBLIC_URL === "https://ordinalnovus.com" && (
            <>
              <Script src="https://www.googletagmanager.com/gtag/js?id=G-7KWT77M049" />
              <Script id="google-analytics">
                {`                
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                 gtag('js', new Date());

                   gtag('config', 'G-7KWT77M049');
                `}
              </Script>
            </>
          )}
          <Head key="head-main">
            <link rel="icon" href="/favicon.ico" sizes="any" />
          </Head>
          <body className=" bg-primary text-light_gray relative small-scrollbar">
            <Suspense fallback={null}>
              <NavigationEvents />
            </Suspense>
            <main className=" py-52 lg:py-24 px-6 max-w-screen-2xl mx-auto relative">
              {/* <main className=" py-52 lg:py-24 px-6 lg:px-24 max-w-7xl mx-auto relative"> */}
              <Header />
              {/* <div className="pt-2 pb-4">
                <div className="w-full  text-xs  uppercase font-bold text-white text-center">
                  <p
                    className={`text-bitcoin bg-bitcoin bg-opacity-20  py-2 w-ful rounded tracking-widest font-bold`}
                  >
                    1% Fee applied on all sales
                  </p>
                </div>
                <div className="w-full  text-xs pt-2 uppercase font-bold text-white text-center">
                  <p
                    className={`text-bitcoin bg-bitcoin bg-opacity-20  py-2 w-ful rounded tracking-widest font-bold`}
                  >
                    SITE IN BETA MODE
                  </p>
                </div>
              </div> */}
              {children}
            </main>
            <div className="bg-secondary">
              <Footer />
            </div>
          </body>
        </html>
      </WalletProvider>
    </Provider>
  );
}

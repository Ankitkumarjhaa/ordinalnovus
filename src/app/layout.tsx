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
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <WalletProvider>
      <Provider store={store}>
        <html lang="en">
          <Head key="head-main">
            <link rel="icon" href="/favicon.ico" sizes="any" />
          </Head>
          <body className=" bg-primary text-light_gray relative small-scrollbar">
            <main className="py-36 lg:py-12 px-6 lg:px-24 max-w-7xl mx-auto relative">
              <Header />
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

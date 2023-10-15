"use client";
import "./globals.css";
import { WalletProvider } from "bitcoin-wallet-adapter";
import Header from "@/components/Header";
import { Provider } from "react-redux";
import { store } from "@/stores";
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <WalletProvider>
      <Provider store={store}>
        <html lang="en">
          <body className=" bg-primary text-light_gray relative small-scrollbar">
            <main className="py-36 lg:py-12 px-6 lg:px-24 max-w-7xl mx-auto relative">
              <Header />
              {children}
            </main>
          </body>
        </html>
      </Provider>
    </WalletProvider>
  );
}

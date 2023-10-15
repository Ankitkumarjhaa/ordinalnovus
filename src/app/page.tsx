import HomePage from "@/views/Homepage";
import StatusPage from "@/views/StatusPage";

export default async function Home() {
  return (
    <main className="">
      <HomePage />
      <StatusPage />
    </main>
  );
}

export const dynamic = "force-dynamic";

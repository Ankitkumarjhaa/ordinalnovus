// import HomePage from "@/Views/Homepage";
import StatusPage from "@/Views/StatusPage";

export default async function Home() {
  return (
    <main className="">
      {/* <HomePage /> */}
      <StatusPage />
    </main>
  );
}

export const dynamic = "force-dynamic";

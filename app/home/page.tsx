import HomeFirst from "../../components/home/HomeFirst";

async function getHomepage() {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/api/homepage`,
    {
      cache: "no-store",
    }
  );

  return res.json();
}

export default async function HomePage() {
  const { settings } = await getHomepage();

  return <HomeFirst settings={settings} />;
}
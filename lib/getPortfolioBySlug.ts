import connectDB from "./db";
import PortfolioItem from "../models/Portfolio";

export async function getPortfolioBySlug(slug: string) {
  await connectDB();

  const item = await PortfolioItem.findOne({
    slug,
    published: true,
  });

  return item;
}
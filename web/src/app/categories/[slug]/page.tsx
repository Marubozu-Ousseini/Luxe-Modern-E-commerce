import { notFound } from "next/navigation";
import { CategoryClient, type CategoryConfig } from "./CategoryClient";

const categories: Record<string, CategoryConfig> = {
  vetements: {
    slug: "vetements",
    title: "Vêtements",
    eyebrow: "La garde-robe calme",
    intro: "Des silhouettes nettes et silencieuses — pensées pour la matière, la coupe et une élégance sans effort.",
    noteTitle: "Une note choisie",
    noteQuote: "« La coupe est stable. La texture respire. Le style se pose, sans insister. »",
    noteByline: "— Atelier Malafaareh",
    heroAccent: { from: "#0F3D3E", to: "#1C1C1C" },
  },
  "parfums-et-cosmetiques": {
    slug: "parfums-et-cosmetiques",
    title: "Parfums et Cosmétiques",
    eyebrow: "Le rituel discret",
    intro: "Une sélection de soins et de sillages à la présence douce — conçus pour accompagner, jamais couvrir.",
    noteTitle: "Une note choisie",
    noteQuote: "« Un geste simple, une trace fine. La qualité se sent, plus qu’elle ne se voit. »",
    noteByline: "— Édition Maison",
    heroAccent: { from: "#8A6D3B", to: "#0F3D3E" },
  },
  chaussures: {
    slug: "chaussures",
    title: "Chaussures",
    eyebrow: "L’ancrage précis",
    intro: "Des formes essentielles, un confort maîtrisé. Chaque paire est pensée pour marcher longtemps, avec calme.",
    noteTitle: "Une note choisie",
    noteQuote: "« L’équilibre se joue au sol : stabilité, ligne, silence. »",
    noteByline: "— Studio Atelier",
    heroAccent: { from: "#1C1C1C", to: "#8A6D3B" },
  },
  montres: {
    slug: "montres",
    title: "Montres",
    eyebrow: "Le temps édité",
    intro: "Des cadrans clairs, des finitions justes. Une présence au poignet qui parle bas, et dure.",
    noteTitle: "Une note choisie",
    noteQuote: "« La précision n’est pas un bruit : c’est une discipline tranquille. »",
    noteByline: "— Horlogerie curatée",
    heroAccent: { from: "#0F3D3E", to: "#8A6D3B" },
  },
  accessoires: {
    slug: "accessoires",
    title: "Accessoires",
    eyebrow: "Les détails qui comptent",
    intro: "Foulards, sacs et pièces de finition : des essentiels de caractère, conçus pour simplifier et élever.",
    noteTitle: "Une note choisie",
    noteQuote: "« Un bon accessoire ne décore pas : il conclut. »",
    noteByline: "— Éditeur Atelier",
    heroAccent: { from: "#8A6D3B", to: "#1C1C1C" },
  },
};

export function generateStaticParams() {
  return Object.keys(categories).map((slug) => ({ slug }));
}

export const dynamicParams = false;

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const config = categories[slug];
  if (!config) return notFound();

  return <CategoryClient slug={slug} config={config} />;
}

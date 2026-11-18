import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Brand Assets",
  description: "Official Oatle Technologies logos for press, partners, and directories.",
  alternates: { canonical: "/brand-assets" },
  openGraph: {
    title: "Oatle Technologies Brand Assets",
    description: "Download the official Oatle Technologies logo and brand mark.",
    url: "/brand-assets",
    images: [{ url: "/oatle-technologies-transparent-logo.png", width: 1774, height: 887 }],
  },
};

const assets = [
  {
    name: "Primary logo",
    description: "Transparent PNG for light backgrounds.",
    src: "/oatle-technologies-transparent-logo.png",
    width: 1774,
    height: 887,
  },
  {
    name: "Logo on black",
    description: "Square PNG with a black background.",
    src: "/oatle-logo.png",
    width: 700,
    height: 700,
  },
  {
    name: "Brand mark",
    description: "The gold O symbol as a transparent PNG.",
    src: "/oatle-brand-o.png",
    width: 265,
    height: 263,
  },
];

export default function BrandAssetsPage() {
  return (
    <main className={styles.page}>
      <Link className={styles.back} href="/">← Oatle Technologies home</Link>

      <header className={styles.intro}>
        <h1>Oatle Technologies Brand Assets</h1>
        <p>Download official logos for press, partnerships, and brand directories.</p>
      </header>

      <ul className={styles.assets}>
        {assets.map((asset) => (
          <li className={styles.card} key={asset.src}>
            <div className={styles.preview} data-dark={asset.name === "Logo on black"}>
              <Image src={asset.src} alt={`Oatle Technologies ${asset.name.toLowerCase()}`} width={asset.width} height={asset.height} unoptimized />
            </div>
            <div className={styles.info}>
              <h2>{asset.name}</h2>
              <p>{asset.description}</p>
              <p className={styles.dimensions}>{asset.width} × {asset.height} px</p>
              <a className={styles.download} href={asset.src} download aria-label={`Download ${asset.name.toLowerCase()} PNG`}>Download PNG</a>
            </div>
          </li>
        ))}
      </ul>

      <section className={styles.creator} aria-labelledby="creator-assets">
        <div>
          <h2 id="creator-assets">For creators</h2>
          <p>Working with Oatle Technologies? Save either PNG to your phone and add it over a photo, Story, or video in your editor.</p>
          <div className={styles.creatorDownloads}>
            <a className={styles.download} href="/oatle-technologies-transparent-logo.png" download="oatle-technologies-logo-sticker.png">Download logo-only sticker</a>
            <a className={styles.download} href="/oatle-technologies-creator-sticker.png" download>Download sticker with website</a>
          </div>
        </div>
        <Image src="/oatle-technologies-creator-sticker.png" alt="Oatle Technologies creator sticker preview" width={1080} height={520} unoptimized />
      </section>

      <section className={styles.usage} aria-labelledby="brand-usage">
        <h2 id="brand-usage">Using our logo</h2>
        <p>Use the original colours and proportions. For other formats or brand enquiries, email <a href="mailto:info@oatle-technologies.co.za">info@oatle-technologies.co.za</a>.</p>
      </section>
    </main>
  );
}

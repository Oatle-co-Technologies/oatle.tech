"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";

const demos = [
  { category: "Beauty & Wellness", name: "Mobile Beauty Studio", image: "/demos/beauty.png", url: "https://oatle-co-technologies.github.io/demo-beauty-studio/", description: "An elegant home for beauty services, with treatment browsing and a home-visit enquiry flow.", details: ["Treatment showcase", "Service pricing", "Booking enquiries"] },
  { category: "Cleaning Services", name: "City Cleaners", image: "/demos/cleaners-hero-fixed.jpg", url: "https://city-cleaners-oatle-demo.netlify.app/", description: "A fresh, friendly website that makes it easy to explore cleaning services and request a quote.", details: ["Interactive service gallery", "Clear pricing", "Quote requests"] },
  { category: "Daycare & Education", name: "Little Explorers", image: "/demos/daycare.png", url: "https://little-explorers-oatle-demo.netlify.app/", description: "A playful introduction to a daycare, bringing programmes, fees, and family enquiries together.", details: ["Age-based programmes", "Fees and meal information", "Application flow"] },
  { category: "Events & Celebrations", name: "Special Events", image: "/demos/events.png", url: "https://demo-events-planning.netlify.app/", description: "A visual celebration of event planning, with occasion browsing, an image gallery, and an enquiry flow.", details: ["Occasion selector", "Photo gallery", "Event enquiries"] },
];

export default function DemoShowcase() {
  const [selected, setSelected] = useState(0);
  const dialog = useRef<HTMLDialogElement>(null);
  const demo = demos[selected];

  return (
    <section id="demos" className="demo-showcase" aria-labelledby="demo-heading">
      <div className="container">
        <div className="demo-intro">
          <div><span className="section-tag">EXPLORE THE POSSIBILITIES</span>
            <h2 id="demo-heading">Different businesses.<br />Distinct personalities.</h2></div>
          <p>See what your next website could feel like. Choose a business type and explore a working demo.</p>
        </div>
        <div className="demo-choices" role="group" aria-label="Choose a business demo">
          {demos.map((item, index) => (
            <button key={item.name} type="button" aria-pressed={index === selected}
              onClick={() => setSelected(index)} aria-controls="demo-detail">
              <span className="demo-number">0{index + 1}</span>{item.category}
            </button>
          ))}
        </div>
        <div id="demo-detail" className="demo-stage" key={demo.name}>
          <button type="button" className="demo-preview" onClick={() => dialog.current?.showModal()}
            aria-label={`Enlarge ${demo.name} preview`}>
            <span className="demo-browser-bar"><span aria-hidden="true">● ● ●</span><span>{demo.name}</span><span>DEMO</span></span>
            <Image src={demo.image} alt={`${demo.name} website preview`} width={1440} height={810} sizes="(max-width: 900px) 100vw, 65vw" />
            <span className="demo-enlarge">Enlarge preview</span>
          </button>
          <div className="demo-story" aria-live="polite">
            <span className="section-tag">CONCEPT WEBSITE · 0{selected + 1} / 04</span>
            <h3>{demo.name}</h3>
            <p>{demo.description}</p>
            <ul>{demo.details.map(detail => <li key={detail}>{detail}</li>)}</ul>
            <a className="primary-button demo-live" href={demo.url} target="_blank" rel="noopener noreferrer">View Live Demo <span aria-hidden="true">↗</span></a>
            <Link href="/contact" className="demo-enquire">Let&apos;s create yours</Link>
          </div>
        </div>
        <p className="demo-caption">Concept projects by Oatle Technologies. Demo businesses, content, and prices are illustrative.</p>
      </div>
      <dialog ref={dialog} className="demo-dialog" aria-labelledby="demo-dialog-title" onClick={e => {if(e.target === e.currentTarget) dialog.current?.close();}}>
        <div className="demo-dialog-top"><h2 id="demo-dialog-title">{demo.name}</h2><button type="button" onClick={() => dialog.current?.close()}>Close preview</button></div>
        <Image src={demo.image} alt={`Enlarged ${demo.name} website preview`} width={1440} height={810} sizes="95vw" />
        <a href={demo.url} target="_blank" rel="noopener noreferrer">Explore the live demo ↗</a>
      </dialog>
    </section>
  );
}

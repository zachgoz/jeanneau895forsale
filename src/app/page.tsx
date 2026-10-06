import Header, { ContactLink } from "@/components/Header";
import Gallery from "@/components/Gallery";
import ContactForm from "@/components/ContactForm";
import PerformanceCalculator from "@/components/PerformanceCalculator";
import CabinStagedPhoto from "@/components/CabinStagedPhoto";
import { boat, priceFormatted, siteUrl, faqs } from "@/data/boat";
import { referencePerformance } from "@/data/performance";
import { photos, type BoatPhoto } from "@/data/photos";

function Photo({
  photo,
  className = "",
  sizes = "(max-width: 768px) 100vw, 50vw",
}: {
  photo: BoatPhoto;
  className?: string;
  sizes?: string;
}) {
  return (
    <img
      className={className}
      src={photo.src}
      srcSet={photo.srcSet}
      sizes={sizes}
      width={photo.width}
      height={photo.height}
      alt={photo.alt}
      loading="lazy"
    />
  );
}
function SectionIntro({
  number,
  eyebrow,
  title,
  children,
}: {
  number: string;
  eyebrow: string;
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="section-heading">
      <div>
        <p className="eyebrow">
          <span>{number}</span>
          {eyebrow}
        </p>
        <h2>{title.replace(/\\n/g, "\n")}</h2>
      </div>
      {children && <p className="section-description">{children}</p>}
    </div>
  );
}
export default function Home() {
  const cruisingTestPoint = referencePerformance.find(point => point.rpm === 4500)!;
  const unstagedCabin = photos.find((p) => p.id === "forward-cabin")!;
  const specs = [
    ["Year / model", `${boat.year} ${boat.make} ${boat.model}`],
    ["Vessel name", boat.vesselName],
    ["Documentation", boat.documentation],
    ["Asking price", priceFormatted],
    ["Location", boat.location],
    ["Length overall", boat.lengthOverall],
    ["Beam", boat.beam],
    ["Hull draft", boat.hullDraft],
    ["Dry weight", `${boat.dryWeightLbs.toLocaleString()} lbs`],
    ["Engines", boat.engines.description],
    ["Total power", `${boat.engines.totalHp} HP`],
    ["Engine hours", `Approximately ${boat.engineHours}`],
    ["Fuel capacity", `${boat.fuelCapacityGallons} gallons`],
    ["Fresh water", `${boat.freshWaterGallons} gallons`],
    ["Generator", boat.generator],
    ["Climate control", boat.climate],
    [
      "Accommodations",
      `${boat.cabins} cabins · sleeps up to approximately ${boat.sleeps}`,
    ],
    ["Trailer", "Not included"],
  ];
  const product = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `${boat.year} ${boat.make} ${boat.model} “${boat.vesselName}”`,
    alternateName: "Jeanneau Merry Fisher 895",
    description: `Private owner sale of ${boat.vesselName} in ${boat.location}. ${boat.engines.description}, approximately ${boat.engineHours} hours, ${boat.generator} and ${boat.climate}.`,
    brand: { "@type": "Brand", name: boat.make },
    model: boat.model,
    category: "Powerboat",
    image: boat.gallery.slice(0, 7).map((photo) => siteUrl + photo.src),
    offers: {
      "@type": "Offer",
      price: boat.price,
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
      itemCondition: "https://schema.org/UsedCondition",
      url: siteUrl + "/",
      hasMerchantReturnPolicy: {
        "@type": "MerchantReturnPolicy",
        applicableCountry: "US",
        returnPolicyCategory:
          "https://schema.org/MerchantReturnNotPermitted",
      },
      shippingDetails: {
        "@type": "OfferShippingDetails",
        shippingRate: {
          "@type": "MonetaryAmount",
          value: "0",
          currency: "USD",
        },
        shippingDestination: {
          "@type": "DefinedRegion",
          addressCountry: "US",
        },
        deliveryTime: {
          "@type": "ShippingDeliveryTime",
          handlingTime: {
            "@type": "QuantitativeValue",
            minValue: 0,
            maxValue: 1,
            unitCode: "DAY",
          },
          transitTime: {
            "@type": "QuantitativeValue",
            minValue: 0,
            maxValue: 0,
            unitCode: "DAY",
          },
        },
      },
    },
    additionalProperty: [
      ["Year", String(boat.year)],
      ["Documentation", boat.documentation],
      ["Beam", boat.beam],
      ["Engine hours", `Approximately ${boat.engineHours}`],
      ["Engine configuration", boat.engines.description],
      ["Generator", boat.generator],
      ["Air conditioning", boat.climate],
      ["Location", boat.location],
    ].map(([name, value]) => ({ "@type": "PropertyValue", name, value })),
  };
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
  const videoSchema = boat.youtubeId
    ? {
        "@context": "https://schema.org",
        "@type": "VideoObject",
        name: `${boat.year} ${boat.make} ${boat.model} “${boat.vesselName}” Underway Video`,
        description: `Video of privately offered ${boat.year} ${boat.make} ${boat.model} with ${boat.engines.description} in ${boat.location}.`,
        thumbnailUrl: [
          `https://img.youtube.com/vi/${boat.youtubeId}/hqdefault.jpg`,
          `https://img.youtube.com/vi/${boat.youtubeId}/maxresdefault.jpg`,
        ],
        uploadDate: "2026-10-04T00:00:00Z",
        contentUrl: boat.videoUrl,
        embedUrl: `https://www.youtube-nocookie.com/embed/${boat.youtubeId}`,
      }
    : null;
  return (
    <>
      <Header />
      <main id="main-content">
        <section id="overview" className="hero section-wrap">
          <div className="hero-topline">
            <p className="eyebrow">
              <span className="status-dot" />
              Private sale by owner · USCG Documented Vessel
            </p>
            <p className="location-label">{boat.shortLocation}</p>
          </div>
          <div className="hero-title">
            <div>
              <h1>
                {boat.year} {boat.make} <span>NC 895 for Sale</span>
              </h1>
              <p className="hero-subtitle">
                Meet <em>{boat.vesselName}.</em> A well-equipped Offshore, made
                for time aboard.
              </p>
            </div>
            <div className="hero-price">
              <small>ASKING PRICE</small>
              <strong>{priceFormatted}</strong>
              <span>Offered directly by the owner</span>
            </div>
          </div>
          <div className="hero-image">
            <img
              src={boat.heroImage.src}
              srcSet={boat.heroImage.srcSet}
              sizes="(max-width: 1440px) 100vw, 1380px"
              width={boat.heroImage.width}
              height={boat.heroImage.height}
              alt={boat.heroImage.alt}
              fetchPriority="high"
            />
            <div className="photo-badges">
              <a href="#gallery" className="photo-badge">
                <span aria-hidden="true">▦</span> {boat.gallery.length} photos ↗
              </a>
              {boat.youtubeId && (
                <a href="#video" className="photo-badge video-badge">
                  <span aria-hidden="true">▶</span> Watch video ↗
                </a>
              )}
            </div>
            <div className="hero-image-caption">
              <span>EZ LIVIN</span>
              <span>2018 NC 895 OFFSHORE</span>
            </div>
          </div>
          <div className="hero-bottom">
            <p>
              A day on the water. A weekend at anchor.
              <br />
              <span>A little more room to get away.</span>
            </p>
            <div className="hero-ctas">
              <ContactLink location="hero" />
              <a className="text-link" href="#gallery">
                Explore the boat <span aria-hidden="true">↓</span>
              </a>
            </div>
          </div>
          <div className="quick-facts">
            <div>
              <strong>~{boat.engineHours}</strong>
              <span>ENGINE HOURS</span>
            </div>
            <div>
              <strong>2 × {boat.engines.hpEach} HP</strong>
              <span>YAMAHA DIGITAL POWER</span>
            </div>
            <div>
              <strong>{boat.cabins} cabins</strong>
              <span>SLEEPS UP TO ~{boat.sleeps}</span>
            </div>
            <div>
              <strong>{boat.generatorKw} kW</strong>
              <span>WESTERBEKE GENERATOR</span>
            </div>
            <div>
              <strong>{boat.climateBtu.toLocaleString()} BTU</strong>
              <span>MARINE AIR CONDITIONING</span>
            </div>
            <div>
              <strong>Bow thruster</strong>
              <span>CONFIDENT DOCKING</span>
            </div>
          </div>
        </section>
        <section id="why-this-boat" className="section-wrap section-space">
          <SectionIntro
            number="01"
            eyebrow="WHY THIS 895"
            title="Small enough to manage.\nEquipped to go further."
          >
            The practicality of a day boat, with the cabins, climate control and
            cruising systems to stay aboard.
          </SectionIntro>
          <div className="why-layout">
            <div className="why-main">
              <p className="large-copy">
                A thoughtful combination of twin outboard power, two private
                cabins, a generator and air conditioning makes this NC 895 a
                particularly capable family cruiser.
              </p>
              <p>
                Known internationally as the Merry Fisher 895, the NC 895
                Offshore pairs a {boat.beam} beam and dual-stepped hull with
                practical coastal versatility. EZ Livin is an official USCG
                Documented Vessel that has been lift-kept for the majority of
                her life, is smoke-free and pet-free, and has been carefully
                maintained according to the owner. At approximately {boat.engineHours}{" "}
                engine hours, she is offered with recent service and a useful
                collection of cruising equipment.
              </p>
              <a className="text-link" href="#service">
                See recent service & updates <span aria-hidden="true">↗</span>
              </a>
            </div>
            <div className="why-points">
              {[
                [
                  "01",
                  "Digital power. Easier handling.",
                  "Twin Yamaha 200s, digital controls and a bow thruster help make close-quarters maneuvering manageable.",
                ],
                [
                  "02",
                  "Comfort away from the dock.",
                  "The Westerbeke generator and 16,000 BTU A/C support nights at anchor as well as marina stays.",
                ],
                [
                  "03",
                  "A layout that lives larger.",
                  "Two private cabins, a convertible dinette, an enclosed head and a proper galley make weekends aboard practical.",
                ],
                [
                  "04",
                  "Experience beyond the day trip.",
                  "The owner’s family spent nearly two weeks aboard bringing EZ Livin south along the ICW.",
                ],
              ].map(([n, title, text]) => (
                <article key={n}>
                  <span className="point-number">{n}</span>
                  <div>
                    <h3>{title}</h3>
                    <p>{text}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
        <section
          id="gallery"
          className="section-wrap section-space gallery-section"
        >
          <SectionIntro
            number="02"
            eyebrow="TAKE A CLOSER LOOK"
            title="Welcome aboard."
          >
            Real photographs of EZ Livin. From the waterline to the spaces
            you’ll spend time in.
          </SectionIntro>
          <Gallery />
          {boat.youtubeId && (
            <div id="video" className="video-feature-wrap">
              <div className="video-feature-header">
                <div>
                  <p className="eyebrow">VIDEO WALKAROUND</p>
                  <h3>Watch EZ Livin on the water</h3>
                </div>
                <a
                  href={boat.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-link"
                >
                  Open on YouTube <span aria-hidden="true">↗</span>
                </a>
              </div>
              <div className="video-frame-container">
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${boat.youtubeId}?rel=0`}
                  title={`${boat.year} ${boat.make} ${boat.model} “${boat.vesselName}” underway video`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  loading="lazy"
                />
              </div>
            </div>
          )}
        </section>
        <section id="owner-story" className="owner-section">
          <div className="owner-image">
            <Photo photo={boat.editorialPhotos.owner} />
            <span>EZ Livin · photographed by the owner</span>
          </div>
          <div className="owner-copy">
            <p className="eyebrow">FROM THE OWNER</p>
            <h2>
              More than
              <br />a day boat.
            </h2>
            <blockquote>
              “We spent almost two weeks bringing her south along the
              Intracoastal Waterway.”
            </blockquote>
            <p>
              We bought EZ Livin near Annapolis, Maryland. On the trip south, we
              stayed in marinas and spent nights at anchor. Having the generator
              and air conditioning made a real difference while traveling with
              the family.
            </p>
            <p>
              That trip showed us what the NC 895 does well. She’s manageable
              for a day out, with the cabins, galley and cruising systems to
              spend multiple days aboard.
            </p>
            <p>
              Yamaha’s NC 895 test recorded {cruisingTestPoint.speedMph.toFixed(1)} mph
              and {cruisingTestPoint.publishedMpg?.toFixed(2)} mpg at{" "}
              {cruisingTestPoint.rpm.toLocaleString("en-US")} RPM. The digital controls and bow
              thruster are also helpful around docks.
            </p>
            <a className="text-link" href="#performance">
              Explore Yamaha’s test results{" "}
              <span aria-hidden="true">↗</span>
            </a>
          </div>
        </section>
        <section id="accommodations" className="section-wrap section-space">
          <SectionIntro
            number="03"
            eyebrow="LIFE ABOARD"
            title="Room for the weekend.\nLight in every direction."
          >
            An enclosed pilothouse, two private cabins, and comfortable places
            to gather, inside and out.
          </SectionIntro>
          <div className="accommodation-grid">
            <figure className="interior-main">
              <Photo photo={boat.editorialPhotos.interior} />
              <figcaption>
                Panoramic windows, a convertible dinette and a galley within
                easy reach.
              </figcaption>
            </figure>
            <div className="accommodation-copy">
              <h3>Everything has a place.</h3>
              <p>
                The bright salon opens to the cockpit through a sliding glass
                door. A helm-side door gives the skipper direct access to the
                starboard deck.
              </p>
              <dl className="accommodation-facts">
                <div>
                  <dt>Two private cabins</dt>
                  <dd>
                    Double / queen sleeping accommodations, plus a convertible
                    salon berth for up to approximately six.
                  </dd>
                </div>
                <div>
                  <dt>A practical galley</dt>
                  <dd>
                    Sink, two-burner cooktop, refrigerator, microwave, hot water
                    and storage.
                  </dd>
                </div>
                <div>
                  <dt>A private head & shower</dt>
                  <dd>
                    Enclosed facilities and hot water make overnight stays more
                    comfortable.
                  </dd>
                </div>
              </dl>
              <ContactLink location="accommodations" className="text-link">
                Arrange a look aboard
              </ContactLink>
            </div>
          </div>
          <div className="detail-photo-row">
            <CabinStagedPhoto
              stagedPhoto={boat.editorialPhotos.cabin}
              unstagedPhoto={unstagedCabin}
            />
            <figure>
              <Photo photo={boat.editorialPhotos.helm} />
              <figcaption>
                Lowrance navigation and digital Yamaha controls
              </figcaption>
            </figure>
            <figure>
              <Photo photo={boat.editorialPhotos.cockpit} />
              <figcaption>
                Cockpit, swim platforms and twin Yamaha power
              </figcaption>
            </figure>
          </div>
        </section>
        <PerformanceCalculator />
        <section id="features" className="section-wrap section-space">
          <SectionIntro
            number="05"
            eyebrow="THE EQUIPMENT"
            title="A considered cruising setup."
          >
            Useful systems for family outings, nights at anchor, and
            marina-to-marina travel.
          </SectionIntro>
          <div className="equipment-grid">
            {boat.equipment.map((group) => (
              <article key={group.title}>
                <h3>{group.title}</h3>
                <ul>
                  {group.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
          <div className="extras-band">
            <div>
              <p className="eyebrow">INCLUDED WITH THE BOAT</p>
              <h3>A few useful extras.</h3>
            </div>
            <ul>
              {boat.includedExtras.map((item) => (
                <li key={item.name}>
                  {item.name}
                  <span>{item.status}</span>
                </li>
              ))}
            </ul>
            <p className="trailer-note">
              <strong>Trailer not included.</strong> The boat can be trailered;
              transport arrangements and requirements should be independently
              confirmed.
            </p>
          </div>
        </section>
        <section id="specifications" className="spec-section">
          <div className="section-wrap section-space">
            <SectionIntro
              number="06"
              eyebrow="THE DETAILS"
              title="Specifications."
            >
              Current owner-provided listing figures for this 2018
              original-generation NC 895 Offshore.
            </SectionIntro>
            <dl className="spec-grid">
              {specs.map(([label, value]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
            <p className="fine-print">
              Specifications and capacities are seller-provided and should be
              independently verified by prospective buyers. Fuel calculations
              use {boat.fuelCapacityGallons} gallons; historical specifications
              may differ by configuration or measurement method.
            </p>
          </div>
        </section>
        <section id="service" className="section-wrap section-space">
          <SectionIntro
            number="07"
            eyebrow="CARE & MAINTENANCE"
            title="Recent service & updates."
          >
            Owner-reported work, with service information available to serious
            buyers upon request.
          </SectionIntro>
          <div className="service-layout">
            <div className="service-note">
              <h3>
                Lift-kept.
                <br />
                Carefully maintained.
              </h3>
              <p>
                Lift-kept for the majority of her life. Smoke-free and pet-free,
                with a full detail and fresh wax at the end of summer.
              </p>
              <p>
                Historical marine survey documentation can be discussed with
                serious buyers. A past survey describes the boat at its
                inspection date.
              </p>
              <a className="text-link" href="#contact-survey">
                Request marine survey &amp; service records ↗
              </a>
            </div>
            <div className="service-timeline">
              {boat.serviceHistory.map((record) => (
                <article key={record.period}>
                  <h3>{record.period}</h3>
                  <ul>
                    {record.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </div>
        </section>
        <section id="faq" className="faq-section">
          <div className="section-wrap section-space">
            <SectionIntro
              number="08"
              eyebrow="GOOD TO KNOW"
              title="A few common questions."
            />
            <div className="faq-list">
              {faqs.map((faq) => (
                <details key={faq.question}>
                  <summary>
                    {faq.question}
                    <span aria-hidden="true">+</span>
                  </summary>
                  <p>{faq.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
        <section
          id="contact"
          className="section-wrap section-space contact-section"
        >
          <div className="contact-intro">
            <p className="eyebrow">YOUR NEXT CHAPTER</p>
            <h2>
              Interested in
              <br />
              <em>{boat.vesselName}?</em>
            </h2>
            <p>
              Have a question, want additional photos, or interested in
              scheduling a showing? Send a message directly to the owner.
            </p>
            <div className="contact-listing">
              <strong>{priceFormatted}</strong>
              <span>{boat.shortLocation}</span>
              <small>
                Private sale by owner · USCG Documented Vessel · Approximately {boat.engineHours} engine
                hours
              </small>
            </div>
            <div className="survey-callout-card">
              <div className="survey-badge">
                <span className="survey-badge-dot" />
                DOCUMENTATION AVAILABLE
              </div>
              <h3>Marine Survey &amp; Service Records</h3>
              <p>
                Historical marine survey documentation, recent 100-hour service invoices, and maintenance logs are available for review by serious prospective buyers.
              </p>
              <a href="#contact-survey" className="survey-callout-btn">
                Request Survey &amp; Records ↓
              </a>
            </div>
            <p className="contact-note">
              Showings by arrangement.
              <br />
              Sea trials can be discussed with serious prospective buyers.
            </p>
          </div>
          <div id="contact-survey" className="contact-form-wrapper">
            <ContactForm />
          </div>
        </section>
      </main>
      <footer className="site-footer">
        <div className="footer-top">
          <a className="wordmark" href="#overview">
            EZ <em>Livin</em>
            <span>{boat.year} JEANNEAU NC 895 OFFSHORE</span>
          </a>
          <p>
            {boat.shortLocation}
            <br />
            Private sale by owner
          </p>
          <a href={siteUrl}>
            895ForSale.com <span aria-hidden="true">↗</span>
          </a>
        </div>
        <div className="footer-bottom">
          <p>
            This is a private-party listing and is not affiliated with or
            endorsed by Jeanneau or Groupe Beneteau. Specifications, equipment
            and performance information are believed to be accurate but should
            be independently verified by prospective buyers.
          </p>
          <a href="/privacy/">Privacy</a>
        </div>
      </footer>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(product).replace(/</g, "\\u003c"),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqSchema).replace(/</g, "\\u003c"),
        }}
      />
      {videoSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(videoSchema).replace(/</g, "\\u003c"),
          }}
        />
      )}
    </>
  );
}

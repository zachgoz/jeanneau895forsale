import { photos, heroPhoto, editorialPhotos } from "./photos.ts";

export type BoatListing = {
  year: number;
  make: string;
  model: string;
  vesselName: string;
  price: number;
  location: string;
  shortLocation: string;
  saleType: string;
  engineHours: number;
  engines: {
    description: string;
    count: number;
    hpEach: number;
    totalHp: number;
    portModel: string;
    starboardModel: string;
  };
  fuelCapacityGallons: number;
  freshWaterGallons: number;
  lengthOverall: string;
  hullDraft: string;
  dryWeightLbs: number;
  generator: string;
  generatorKw: number;
  climate: string;
  climateBtu: number;
  cabins: number;
  sleeps: number;
  equipment: { title: string; items: string[] }[];
  serviceHistory: { period: string; items: string[] }[];
  includedExtras: { name: string; status: string }[];
  excludedItems: string[];
  heroImage: typeof heroPhoto;
  gallery: typeof photos;
  editorialPhotos: typeof editorialPhotos;
};

export const boat: BoatListing = {
  year: 2018,
  make: "Jeanneau",
  model: "NC 895 Offshore",
  vesselName: "EZ Livin",
  price: 160000,
  location: "Carolina Beach, North Carolina",
  shortLocation: "Carolina Beach, NC",
  saleType: "Private sale by owner",
  engineHours: 400,
  engines: {
    description: "Twin Yamaha 200 HP XCA outboards with digital controls",
    count: 2,
    hpEach: 200,
    totalHp: 400,
    portModel: "LF200XCA",
    starboardModel: "F200XCA",
  },
  fuelCapacityGallons: 158,
  freshWaterGallons: 42,
  lengthOverall: "29′ 4″",
  hullDraft: "2′",
  dryWeightLbs: 9252,
  generator: "Westerbeke 3.5 kW gasoline generator",
  generatorKw: 3.5,
  climateBtu: 16000,
  climate: "16,000 BTU marine air conditioning",
  cabins: 2,
  sleeps: 6,
  equipment: [
    {
      title: "Power & handling",
      items: [
        "Twin Yamaha 200 HP XCA four-stroke outboards",
        "Electronic throttle and shift",
        "Hydraulic steering",
        "Bow thruster",
        "Trim tabs",
      ],
    },
    {
      title: "Navigation & electronics",
      items: [
        "Lowrance HDS9 chartplotter",
        "Lowrance Link-8 VHF with AIS capability",
        "Depth / sonar",
        "Side-scan sonar added in 2025",
        "Ritchie compass",
        "Yamaha digital gauges",
        "Fusion marine stereo",
        "Searchlight",
      ],
    },
    {
      title: "Comfort & cruising systems",
      items: [
        "Westerbeke 3.5 kW gasoline generator",
        "16,000 BTU marine A/C with heat mode documented historically",
        "Shore power and battery charging",
        "Hot water heater",
        "Freshwater system and holding tank",
        "Enclosed head with shower",
        "Cockpit shower",
      ],
    },
    {
      title: "Galley & living space",
      items: [
        "Sink and two-burner cooktop",
        "Refrigerator and microwave",
        "Hot water and galley storage",
        "Modular salon seating",
        "Convertible dinette berth",
        "Sliding aft glass door",
        "Starboard helm-side sliding door",
      ],
    },
    {
      title: "Deck & cockpit",
      items: [
        "Sliding aft bench and cockpit storage",
        "Swim platforms and boarding ladder",
        "Transom door",
        "Recessed side deck and bow access",
        "Electric anchor windlass",
        "Opening hardtop panels",
        "Bow and aft daybed cushions",
      ],
    },
  ],
  serviceHistory: [
    {
      period: "Fall 2025 / Spring 2026",
      items: [
        "100-hour engine service",
        "Engine and lower-unit oil changes",
        "Spark plugs, water pumps and fuel filters",
        "Generator water pump and belt",
        "Two new batteries",
      ],
    },
    { period: "2025", items: ["Side-scan sonar added"] },
    {
      period: "End of summer · owner reported",
      items: ["Full detail and fresh wax"],
    },
  ],
  includedExtras: [
    {
      name: "Brand-new SANIFLO / Sanimarin 31 electric toilet",
      status: "Uninstalled",
    },
    { name: "Factory roof rack", status: "Uninstalled" },
    { name: "Extra bow seating cushions", status: "Included" },
    { name: "Extra aft daybed cushions", status: "Included" },
  ],
  excludedItems: ["Trailer is not included"],
  heroImage: heroPhoto,
  gallery: [
    heroPhoto,
    editorialPhotos.interior,
    editorialPhotos.cabin,
    editorialPhotos.helm,
    editorialPhotos.cockpit,
    ...photos.filter(
      (photo) =>
        ![
          heroPhoto.id,
          editorialPhotos.interior.id,
          editorialPhotos.cabin.id,
          editorialPhotos.helm.id,
          editorialPhotos.cockpit.id,
        ].includes(photo.id),
    ),
  ],
  editorialPhotos,
};

export const priceFormatted = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
}).format(boat.price);
export const siteUrl = "https://895forsale.com";

export const faqs = [
  {
    question: "Is the trailer included?",
    answer:
      "No. EZ Livin can be trailered, but a trailer is not included in the sale. Confirm the tow vehicle, transport requirements and applicable permits with your transporter.",
  },
  {
    question: "Where is the boat located?",
    answer: boat.location + ". Contact the owner to arrange a showing.",
  },
  {
    question: "How many hours are on the engines?",
    answer: `Approximately ${boat.engineHours} hours, as reported by the current owner. Hours may increase with use.`,
  },
  {
    question: "What engines does it have?",
    answer:
      boat.engines.description +
      ". They are four-stroke outboards, with 400 HP in total.",
  },
  {
    question: "Does it have a generator and air conditioning?",
    answer: `Yes. ${boat.generator} and ${boat.climate}. The family used both during their ICW trip.`,
  },
  {
    question: "Does it have a bow thruster?",
    answer:
      "Yes. The bow thruster, digital Yamaha controls and hydraulic steering help with close-quarters maneuvering.",
  },
  {
    question: "How many people can sleep aboard?",
    answer: `Two private cabins and the convertible dinette accommodate up to approximately ${boat.sleeps}.`,
  },
  {
    question: "Is this being sold by a broker?",
    answer:
      "No. This is a private sale by the owner, with inquiries going directly to the owner.",
  },
  {
    question: "Can I schedule a showing or discuss a sea trial?",
    answer:
      "Yes. Send an inquiry below to arrange a showing. Serious prospective buyers can discuss sea-trial arrangements with the owner.",
  },
  {
    question: "Are service records and survey documentation available?",
    answer:
      "Service information and historical marine survey documentation can be discussed with serious buyers upon request. Historical surveys describe condition at their inspection dates and do not guarantee present condition.",
  },
];

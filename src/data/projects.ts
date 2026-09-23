export const projects = [
  {
    id: "maa-kundwasini-nagar",
    name: "Maa Kundwasini Nagar",
    location: "Robertsganj, Sonbhadra",
    developer: "K.H.U. Developers Private Limited",
    type: "Mixed Use (Residential & Commercial)",
    description: "Thoughtfully planned spaces for living, investing, and building what comes next.",
    coverImage: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80",
    offer: {
      price: "₹899 / SQ.FT",
      details: "ONE PLOT + ONE PLOT FREE",
      terms: "Terms and conditions apply."
    },
    distances: [
      { location: "Ghorawal Market", distance: "800 m" },
      { location: "Ghorawal Kotwali", distance: "900 m" },
      { location: "Ghorawal Bus Stand", distance: "1 km" },
      { location: "Law College", distance: "700 m" },
      { location: "Ghorawal Tehsil", distance: "700 m" },
      { location: "Ghorawal Hospital", distance: "1.5 km" },
    ],
    amenities: [
      "20 ft / 25 ft roads",
      "Park",
      "Colony Gate",
      "Drainage",
      "Electricity facilities"
    ]
  }
];

// Sample based on provided plot dimensions and areas
export const plots = [
  { id: "P1", projectId: "maa-kundwasini-nagar", dimensions: "32x60", area: 1920, type: "Residential", status: "AVAILABLE" },
  { id: "P2", projectId: "maa-kundwasini-nagar", dimensions: "33x60", area: 1980, type: "Residential", status: "AVAILABLE" },
  { id: "P3", projectId: "maa-kundwasini-nagar", dimensions: "50x60", area: 3000, type: "Commercial", status: "AVAILABLE" },
  { id: "P4", projectId: "maa-kundwasini-nagar", dimensions: "30x60", area: 1800, type: "Residential", status: "RESERVED" },
  { id: "P5", projectId: "maa-kundwasini-nagar", dimensions: "25x55", area: 1375, type: "Residential", status: "AVAILABLE" },
  { id: "P6", projectId: "maa-kundwasini-nagar", dimensions: "25x60", area: 1500, type: "Residential", status: "SOLD" },
  { id: "P7", projectId: "maa-kundwasini-nagar", dimensions: "21x55", area: 1155, type: "Residential", status: "AVAILABLE" },
  { id: "P8", projectId: "maa-kundwasini-nagar", dimensions: "50x40", area: 2000, type: "Commercial", status: "AVAILABLE" },
  { id: "P9", projectId: "maa-kundwasini-nagar", dimensions: "45x40", area: 1800, type: "Commercial", status: "BOOKED" },
  { id: "P10", projectId: "maa-kundwasini-nagar", dimensions: "30x45", area: 1350, type: "Residential", status: "AVAILABLE" },
  { id: "P11", projectId: "maa-kundwasini-nagar", dimensions: "35x40", area: 1400, type: "Residential", status: "AVAILABLE" },
  { id: "P12", projectId: "maa-kundwasini-nagar", dimensions: "50x45", area: 2250, type: "Commercial", status: "AVAILABLE" },
  { id: "P13", projectId: "maa-kundwasini-nagar", dimensions: "28x50", area: 1400, type: "Residential", status: "AVAILABLE" },
  { id: "P14", projectId: "maa-kundwasini-nagar", dimensions: "30x50", area: 1500, type: "Residential", status: "RESERVED" },
  { id: "P15", projectId: "maa-kundwasini-nagar", dimensions: "35x50", area: 1750, type: "Residential", status: "AVAILABLE" },
  { id: "P16", projectId: "maa-kundwasini-nagar", dimensions: "40x50", area: 2000, type: "Residential", status: "SOLD" },
  { id: "P17", projectId: "maa-kundwasini-nagar", dimensions: "25x50", area: 1250, type: "Residential", status: "AVAILABLE" },
  { id: "P18", projectId: "maa-kundwasini-nagar", dimensions: "20x60", area: 1200, type: "Residential", status: "AVAILABLE" },
  { id: "P19", projectId: "maa-kundwasini-nagar", dimensions: "27x55", area: 1485, type: "Residential", status: "AVAILABLE" },
  { id: "P20", projectId: "maa-kundwasini-nagar", dimensions: "32x55", area: 1760, type: "Residential", status: "AVAILABLE" }
];

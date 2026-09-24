export interface Project {
  id: string;
  name: string;
  location: string;
  developer: string;
  type: string;
  description: string;
  coverImage: string;
  offer?: {
    price?: string;
    details?: string;
    terms?: string;
  };
  distances?: { location: string; distance: string }[];
  amenities?: string[];
}

export const projects: Project[] = [
  {
    id: "happy-home",
    name: "Happy Home",
    location: "Near Urmaura, F.C.I. Godam, Robertsganj-Sonbhadra",
    developer: "K.H.U. Developers Private Limited",
    type: "Premium Plotted Development",
    description: "A meticulously planned residential community offering a serene lifestyle with close proximity to essential facilities and Robertsganj center.",
    coverImage: "/images/projects/project_happy_home.jpg",
    amenities: ["30 ft Wide Roads", "Community Hall", "Park & Walking Area", "24x7 Security"]
  },
  {
    id: "nature-city",
    name: "Nature City",
    location: "Near Urmaura, Sant Keenaram Mahavidyalaya Road, Robertsganj",
    developer: "K.H.U. Developers Private Limited",
    type: "Residential & Commercial Plots",
    description: "Set against a peaceful landscape, Nature City provides an ideal environment for families and businesses looking for accessible and developing land.",
    coverImage: "/images/projects/project_nature_city.jpg",
    amenities: ["Temple", "Jogging Track", "Drainage Facility", "Shopping Complex"]
  },
  {
    id: "laxmi-nagar",
    name: "Laxmi Nagar",
    location: "Near Chhapka Power House, Robertsganj-Sonbhadra",
    developer: "K.H.U. Developers Private Limited",
    type: "Residential Plots",
    description: "Strategic investment plots located in a rapidly developing sector of Robertsganj, offering excellent connectivity and future valuation.",
    coverImage: "/images/projects/project_highway.jpg",
    amenities: ["30 ft Wide Roads", "Drainage Facility", "Park", "24x7 Security"]
  },
  {
    id: "vikas-nagar",
    name: "Vikas Nagar",
    location: "Ward No. 22, Pusauli, Robertsganj-Sonbhadra",
    developer: "K.H.U. Developers Private Limited",
    type: "Residential Plots",
    description: "Well-structured urban plots located in the heart of Ward No. 22, perfect for constructing your dream home in an established neighborhood.",
    coverImage: "/images/projects/project_residential.jpg",
    amenities: ["Community Hall", "Temple", "Drainage Facility", "Jogging Track"]
  },
  {
    id: "kailashpuri",
    name: "Kailashpuri (Phases 1 & 2)",
    location: "Dharamshala Chowk, Ghorawal Road, Near Barela Mandir",
    developer: "K.H.U. Developers Private Limited",
    type: "Premium Plotted Development",
    description: "Spanning multiple phases, Kailashpuri offers expansive plots in a highly sought-after location near the prominent Barela Mandir.",
    coverImage: "/images/projects/project_nature_city.jpg",
    amenities: ["30 ft Wide Roads", "Park & Walking Area", "Shopping Complex", "24x7 Security"]
  },
  {
    id: "adarsh-nagar",
    name: "Adarsh Nagar",
    location: "Near Ghorawal Tehsil, Ghorawal-Sonbhadra",
    developer: "K.H.U. Developers Private Limited",
    type: "Residential & Commercial Plots",
    description: "Located near key governmental infrastructure in Ghorawal, Adarsh Nagar is perfect for both immediate settlement and commercial utilization.",
    coverImage: "/images/projects/project_highway.jpg",
    amenities: ["30 ft Wide Roads", "Drainage Facility", "Temple", "Community Hall"]
  },
  {
    id: "magleshwar-colony",
    name: "Magleshwar Colony",
    location: "Salkhan, Varanasi Shaktinagar Marg, Chopan-Sonbhadra",
    developer: "K.H.U. Developers Private Limited",
    type: "Highway Adjacent Plots",
    description: "Prime highway-adjacent plots located on the Varanasi-Shaktinagar Marg, ensuring unparalleled visibility and long-term commercial potential.",
    coverImage: "/images/projects/project_happy_home.jpg",
    amenities: ["Shopping Complex", "24x7 Security", "Drainage Facility", "Park"]
  },
  {
    id: "maa-kundwasini-nagar",
    name: "Maa Kundwasini Nagar",
    location: "Robertsganj, Sonbhadra",
    developer: "K.H.U. Developers Private Limited",
    type: "Mixed Use (Residential & Commercial)",
    description: "Thoughtfully planned spaces for living, investing, and building what comes next with our signature ONE PLOT + ONE PLOT FREE offer.",
    coverImage: "/images/projects/project_residential.jpg",
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

// Keep plots data
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

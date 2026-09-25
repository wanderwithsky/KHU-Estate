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
    location: "Robertsganj",
    developer: "K.H.U Developers Pvt. Ltd.",
    type: "Premium Plotted Development",
    description: "A meticulously planned residential community offering a serene lifestyle with close proximity to essential facilities and Robertsganj center.",
    coverImage: "/images/projects/proj1_happy_home_1790312983584.jpg",
    amenities: ["30 ft Wide Roads", "Community Hall", "Park & Walking Area", "24x7 Security"]
  },
  {
    id: "nature-city",
    name: "Nature City",
    location: "Robertsganj",
    developer: "K.H.U Developers Pvt. Ltd.",
    type: "Residential & Commercial Plots",
    description: "Set against a peaceful landscape, Nature City provides an ideal environment for families and businesses looking for accessible and developing land.",
    coverImage: "/images/projects/proj2_nature_city_1790312995384.jpg",
    amenities: ["Temple", "Jogging Track", "Drainage Facility", "Shopping Complex"]
  },
  {
    id: "laxmi-nagar",
    name: "Laxmi Nagar",
    location: "Robertsganj",
    developer: "K.H.U Developers Pvt. Ltd.",
    type: "Residential Plots",
    description: "Strategic investment plots located in a rapidly developing sector of Robertsganj, offering excellent connectivity and future valuation.",
    coverImage: "/images/projects/proj3_laxmi_nagar_1790313007853.jpg",
    amenities: ["30 ft Wide Roads", "Drainage Facility", "Park", "24x7 Security"]
  },
  {
    id: "vikas-nagar",
    name: "Vikas Nagar",
    location: "Robertsganj",
    developer: "K.H.U Developers Pvt. Ltd.",
    type: "Residential Plots",
    description: "Well-structured urban plots perfect for constructing your dream home in an established neighborhood.",
    coverImage: "/images/projects/proj4_vikas_nagar_1790313019947.jpg",
    amenities: ["Community Hall", "Temple", "Drainage Facility", "Jogging Track"]
  },
  {
    id: "kailashpuri",
    name: "Kailashpuri",
    location: "Robertsganj",
    developer: "K.H.U Developers Pvt. Ltd.",
    type: "Premium Plotted Development",
    description: "Kailashpuri offers expansive plots in a highly sought-after location.",
    coverImage: "/images/projects/proj5_kailashpuri_1790313033333.jpg",
    amenities: ["30 ft Wide Roads", "Park & Walking Area", "Shopping Complex", "24x7 Security"]
  },
  {
    id: "mangleshwar",
    name: "Mangleshwar",
    location: "Salkhan Varanasi Road",
    developer: "K.H.U Developers Pvt. Ltd.",
    type: "Highway Adjacent Plots",
    description: "Prime highway-adjacent plots located on the Varanasi-Shaktinagar Marg, ensuring unparalleled visibility and long-term commercial potential.",
    coverImage: "/images/projects/proj6_mangleshwar_1790313070072.jpg",
    amenities: ["Shopping Complex", "24x7 Security", "Drainage Facility", "Park"]
  },
  {
    id: "adarsh-nagar",
    name: "Adarsh Nagar",
    location: "Ghorawal",
    developer: "K.H.U Developers Pvt. Ltd.",
    type: "Residential & Commercial Plots",
    description: "Located near key governmental infrastructure in Ghorawal, Adarsh Nagar is perfect for both immediate settlement and commercial utilization.",
    coverImage: "/images/projects/proj7_adarsh_nagar_1790313083586.jpg",
    amenities: ["30 ft Wide Roads", "Drainage Facility", "Temple", "Community Hall"]
  },
  {
    id: "maa-kundvasini-nagar",
    name: "Maa Kundvasini Nagar",
    location: "Ghorawal",
    developer: "K.H.U Developers Pvt. Ltd.",
    type: "Mixed Use (Residential & Commercial)",
    description: "Thoughtfully planned spaces for living, investing, and building what comes next with our signature ONE PLOT + ONE PLOT FREE offer.",
    coverImage: "/images/projects/proj8_maa_kundvasini_1790313095169.jpg",
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
  },
  {
    id: "trivedi-nagar",
    name: "Trivedi Nagar",
    location: "Robertsganj",
    developer: "K.H.U Developers Pvt. Ltd.",
    type: "Modern Residential Plots",
    description: "A modern planned plotted development providing exceptional amenities in Robertsganj.",
    coverImage: "/images/projects/proj9_trivedi_nagar_1790313108442.jpg",
    amenities: ["Park", "Colony Gate", "Drainage"]
  }
];

export const plots = [
  { id: "P1", projectId: "maa-kundvasini-nagar", dimensions: "32x60", area: 1920, type: "Residential", status: "AVAILABLE" },
  { id: "P2", projectId: "maa-kundvasini-nagar", dimensions: "33x60", area: 1980, type: "Residential", status: "AVAILABLE" },
  { id: "P3", projectId: "maa-kundvasini-nagar", dimensions: "50x60", area: 3000, type: "Commercial", status: "AVAILABLE" },
  { id: "P4", projectId: "maa-kundvasini-nagar", dimensions: "30x60", area: 1800, type: "Residential", status: "RESERVED" },
  { id: "P5", projectId: "maa-kundvasini-nagar", dimensions: "25x55", area: 1375, type: "Residential", status: "AVAILABLE" },
  { id: "P6", projectId: "maa-kundvasini-nagar", dimensions: "25x60", area: 1500, type: "Residential", status: "SOLD" },
  { id: "P7", projectId: "maa-kundvasini-nagar", dimensions: "21x55", area: 1155, type: "Residential", status: "AVAILABLE" },
  { id: "P8", projectId: "maa-kundvasini-nagar", dimensions: "50x40", area: 2000, type: "Commercial", status: "AVAILABLE" },
  { id: "P9", projectId: "maa-kundvasini-nagar", dimensions: "45x40", area: 1800, type: "Commercial", status: "BOOKED" },
  { id: "P10", projectId: "maa-kundvasini-nagar", dimensions: "30x45", area: 1350, type: "Residential", status: "AVAILABLE" },
  { id: "P11", projectId: "maa-kundvasini-nagar", dimensions: "35x40", area: 1400, type: "Residential", status: "AVAILABLE" },
  { id: "P12", projectId: "maa-kundvasini-nagar", dimensions: "50x45", area: 2250, type: "Commercial", status: "AVAILABLE" },
  { id: "P13", projectId: "maa-kundvasini-nagar", dimensions: "28x50", area: 1400, type: "Residential", status: "AVAILABLE" },
  { id: "P14", projectId: "maa-kundvasini-nagar", dimensions: "30x50", area: 1500, type: "Residential", status: "RESERVED" },
  { id: "P15", projectId: "maa-kundvasini-nagar", dimensions: "35x50", area: 1750, type: "Residential", status: "AVAILABLE" },
  { id: "P16", projectId: "maa-kundvasini-nagar", dimensions: "40x50", area: 2000, type: "Residential", status: "SOLD" },
  { id: "P17", projectId: "maa-kundvasini-nagar", dimensions: "25x50", area: 1250, type: "Residential", status: "AVAILABLE" },
  { id: "P18", projectId: "maa-kundvasini-nagar", dimensions: "20x60", area: 1200, type: "Residential", status: "AVAILABLE" },
  { id: "P19", projectId: "maa-kundvasini-nagar", dimensions: "27x55", area: 1485, type: "Residential", status: "AVAILABLE" },
  { id: "P20", projectId: "maa-kundvasini-nagar", dimensions: "32x55", area: 1760, type: "Residential", status: "AVAILABLE" }
];

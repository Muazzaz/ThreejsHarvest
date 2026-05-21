export type FruitType = "guava" | "mango" | "papaya" | "jujube" | "lemon";

export interface Product {
  id: FruitType;
  name: string;
  nameBn: string;
  pricePerKg: number; // BDT
  emoji: string;
  description: string;
  canopyColor: string;
  trunkColor: string;
  fruitColor: string;
  special?: boolean;
}

export const PRODUCTS: Record<FruitType, Product> = {
  guava: {
    id: "guava",
    name: "Khagrachari Guava",
    nameBn: "খাগড়াছড়ি পেয়ারা",
    pricePerKg: 80,
    emoji: "🍈",
    description:
      "Exceptionally sweet & aromatic hill guavas — the crown jewel of Khagrachari.",
    canopyColor: "#4ade80",
    trunkColor: "#78350f",
    fruitColor: "#fef08a",
    special: true,
  },
  mango: {
    id: "mango",
    name: "Hill Mango",
    nameBn: "পাহাড়ি আম",
    pricePerKg: 120,
    emoji: "🥭",
    description: "Juicy, golden mangoes ripened under the Khagrachari sun.",
    canopyColor: "#16a34a",
    trunkColor: "#92400e",
    fruitColor: "#fbbf24",
  },
  papaya: {
    id: "papaya",
    name: "Fresh Papaya",
    nameBn: "পেঁপে",
    pricePerKg: 50,
    emoji: "🧡",
    description: "Naturally sweet papayas grown on terraced hill farms.",
    canopyColor: "#15803d",
    trunkColor: "#a3a3a3",
    fruitColor: "#f97316",
  },
  jujube: {
    id: "jujube",
    name: "Hill Jujube (Boroi)",
    nameBn: "পাহাড়ি বরই",
    pricePerKg: 60,
    emoji: "🍒",
    description: "Crisp, tangy jujube berries harvested from wild hill trees.",
    canopyColor: "#166534",
    trunkColor: "#713f12",
    fruitColor: "#dc2626",
  },
  lemon: {
    id: "lemon",
    name: "Hill Lemon",
    nameBn: "পাহাড়ি লেবু",
    pricePerKg: 70,
    emoji: "🍋",
    description: "Fragrant, zesty lemons with intense citrus aroma.",
    canopyColor: "#4d7c0f",
    trunkColor: "#854d0e",
    fruitColor: "#fde047",
  },
};

// Tree placement across the 200x200 map
export interface TreeNode {
  type: FruitType;
  x: number;
  z: number;
}

export const TREE_PLACEMENTS: TreeNode[] = [
  // Guava grove — East, multiple clusters (special zone)
  { type: "guava", x: 60, z: -20 },
  { type: "guava", x: 65, z: 10 },
  { type: "guava", x: 70, z: -5 },
  { type: "guava", x: 55, z: 25 },
  { type: "guava", x: 75, z: 30 },
  { type: "guava", x: 58, z: -40 },
  // Mango grove — North
  { type: "mango", x: -10, z: -65 },
  { type: "mango", x: 15, z: -70 },
  { type: "mango", x: 30, z: -60 },
  { type: "mango", x: -25, z: -75 },
  // Papaya — South
  { type: "papaya", x: 5, z: 60 },
  { type: "papaya", x: -15, z: 65 },
  { type: "papaya", x: 20, z: 70 },
  // Jujube — West
  { type: "jujube", x: -60, z: -10 },
  { type: "jujube", x: -70, z: 20 },
  { type: "jujube", x: -55, z: 35 },
  // Lemon — Center cluster
  { type: "lemon", x: -20, z: 10 },
  { type: "lemon", x: 10, z: -15 },
  { type: "lemon", x: 25, z: 15 },
];

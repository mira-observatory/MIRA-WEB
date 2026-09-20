import {
  BookOpen,
  Building2,
  ClipboardList,
  HardHat,
  Leaf,
  Monitor,
  Package,
  Pill,
  Truck,
  Utensils,
  type LucideIcon,
} from "lucide-react";
import type { ExampleCategory } from "./catalog";

export const EXAMPLE_ICONS: Record<ExampleCategory, LucideIcon> = {
  health: Pill,
  technology: Monitor,
  infrastructure: HardHat,
  education: BookOpen,
  transport: Truck,
  supplies: Package,
  services: Building2,
  food: Utensils,
  environment: Leaf,
  procurement: ClipboardList,
};

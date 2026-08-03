import { BedDouble, Building2, BusFront, MapPin, Mountain, Route, ShoppingBag, Store, Utensils } from 'lucide-react';
import type { GuideCategory, MapCategory, MapCategoryId } from '../types/app';

export const LOCAL_CATEGORIES: GuideCategory[] = [
  {
    id: 'food',
    title: 'Food & Drinks',
    description: 'Carinderias, cafés, bakeries, and local favorites',
    emptyTitle: 'No food listings yet',
    emptyMessage: 'Local eateries, cafés, bakeries, and food stalls will appear here.',
    icon: Utensils,
    tone: 'border-[#E8D4B2] bg-[#FFF4DF] text-[#A45118]',
  },
  {
    id: 'services',
    title: 'Shops & Services',
    description: 'Stores, repairs, salons, and everyday services',
    emptyTitle: 'No service listings yet',
    emptyMessage: 'Stores, repair shops, salons, and other useful services will appear here.',
    icon: Store,
    tone: 'border-[#DDD1DF] bg-[#F6EFF6] text-[#6E4F73]',
  },
  {
    id: 'transport',
    title: 'Transport',
    description: 'Terminals, routes, stops, and fare information',
    emptyTitle: 'No transport listings yet',
    emptyMessage: 'Terminals, local routes, stops, and travel information will appear here.',
    icon: BusFront,
    tone: 'border-[#C7DAD5] bg-[#EDF6F2] text-[#276B60]',
  },
  {
    id: 'visit',
    title: 'Places to Visit',
    description: 'Viewpoints, nature spots, landmarks, and hidden gems',
    emptyTitle: 'No places added yet',
    emptyMessage: 'Viewpoints, nature spots, landmarks, and hidden local gems will appear here.',
    icon: Mountain,
    tone: 'border-[#CADCC8] bg-[#EFF7EA] text-[#326B3D]',
  },
  {
    id: 'government',
    title: 'Government & Public Services',
    description: 'Schools, barangay offices, emergency services, and public facilities',
    emptyTitle: 'No public service listings yet',
    emptyMessage: 'Schools, government offices, emergency services, and public facilities will appear here.',
    icon: Building2,
    tone: 'border-[#C8DBD1] bg-[#EEF7F1] text-[#2B6A4E]',
  },
];

export const VISITOR_CATEGORIES: GuideCategory[] = [
  {
    id: 'must-see',
    title: 'Places to Visit',
    description: 'Scenic stops, landmarks, and places worth the detour',
    emptyTitle: 'Visitor spots are coming soon',
    emptyMessage: 'Curated sights and notable stops around Villaverde will appear here.',
    icon: Mountain,
    tone: 'border-[#E1D0D7] bg-[#F8EFF1] text-[#86546A]',
  },
  {
    id: 'local-eats',
    title: 'Food to Try',
    description: 'Local meals, snacks, bakeries, and roadside favorites',
    emptyTitle: 'Food recommendations are coming soon',
    emptyMessage: 'Local dishes, bakeries, cafés, and worthwhile food stops will appear here.',
    icon: Utensils,
    tone: 'border-[#E8D4B2] bg-[#FFF4DF] text-[#A45118]',
  },
  {
    id: 'getting-around',
    title: 'Getting Around',
    description: 'Routes, transport options, stops, and practical travel help',
    emptyTitle: 'Travel information is coming soon',
    emptyMessage: 'Routes, transport options, stops, and practical visitor information will appear here.',
    icon: Route,
    tone: 'border-[#C7DAD5] bg-[#EDF6F2] text-[#276B60]',
  },
  {
    id: 'stay',
    title: 'Stay & Rest',
    description: 'Places to stay, pause, or freshen up during the trip',
    emptyTitle: 'Stay options are coming soon',
    emptyMessage: 'Useful lodging and rest stops for visitors will appear here.',
    icon: BedDouble,
    tone: 'border-[#D3D2DF] bg-[#F1F1F7] text-[#55566F]',
  },
  {
    id: 'local-finds',
    title: 'Local Finds',
    description: 'Shops, products, pasalubong, and small discoveries',
    emptyTitle: 'Local finds are coming soon',
    emptyMessage: 'Shops, handmade goods, local products, and pasalubong ideas will appear here.',
    icon: ShoppingBag,
    tone: 'border-[#C8DBD1] bg-[#EEF7F1] text-[#2D6C55]',
  },
];

export const MAP_CATEGORIES: MapCategory[] = [
  { id: 'all', label: 'All places', icon: MapPin },
  { id: 'food', label: 'Food & Drinks', icon: Utensils },
  { id: 'services', label: 'Shops & Services', icon: Store },
  { id: 'transport', label: 'Transport', icon: BusFront },
  { id: 'visit', label: 'Places to Visit', icon: Mountain },
  { id: 'government', label: 'Government', icon: Building2 },
];

export const CATEGORY_MARKER_COLORS: Record<Exclude<MapCategoryId, 'all'>, string> = {
  food: '#A45118',
  services: '#6E4F73',
  transport: '#276B60',
  visit: '#326B3D',
  government: '#2B6A4E',
};

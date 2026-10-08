import type { Metadata } from 'next';
import GlassOrbs from '@/components/GlassOrbs';

export const metadata: Metadata = {
  title: 'Glass orbs — Cherry Hu',
  robots: { index: false },
};

export default function OrbsPage() {
  return <GlassOrbs />;
}

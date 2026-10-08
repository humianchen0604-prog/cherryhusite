import type { Metadata } from 'next';
import '../casestudy.css';
import './loom.css';
import '../casestudy-dark.css';
import LoomBody from '@/components/casestudy/LoomBody';
import ScrollReveal from '@/components/casestudy/ScrollReveal';

export const metadata: Metadata = {
  title: 'Loom — keeping creative teams aligned while the work happens',
  description:
    'A shared canvas where the brief, the references, and a team’s decisions stay in sync — designed, evaluated against a written rubric, and vibe-coded into a live web prototype.',
};

export default function LoomPage() {
  return (
    <div className="casestudy-root" id="main">
      <ScrollReveal />
      <LoomBody />
    </div>
  );
}

import type { Metadata } from 'next';
import '../casestudy.css';
import '../casestudy-dark.css';
import CaseStudyBody from '@/components/casestudy/CaseStudyBody';
import ScrollReveal from '@/components/casestudy/ScrollReveal';

export const metadata: Metadata = {
  title: 'Lemon8 — Notes Tab Optimization',
  description:
    'Redesigning notes feed content to improve lift in impressions, reads, and account follow rate.',
};

export default function NotesTabOptimizationPage() {
  return (
    <div className="casestudy-root" id="main">
      <ScrollReveal />
      <CaseStudyBody />
    </div>
  );
}

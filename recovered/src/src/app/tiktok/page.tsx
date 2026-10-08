import type { Metadata } from 'next';
import '../casestudy.css';
import './tiktok.css';
import '../casestudy-dark.css';
import TikTokBody from '@/components/casestudy/TikTokBody';
import ScrollReveal from '@/components/casestudy/ScrollReveal';

export const metadata: Metadata = {
  title: 'Designing account experiences at scale — TikTok',
  description:
    'Product design internship on TikTok Account: unifying login/signup, SDK login, multi-account switching, web login prototyping, and profile explorations for global events.',
};

export default function TikTokPage() {
  return (
    <div className="casestudy-root" id="main">
      <ScrollReveal />
      <TikTokBody />
    </div>
  );
}

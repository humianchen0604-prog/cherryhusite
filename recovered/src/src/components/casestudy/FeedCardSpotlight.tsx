'use client';

import { useEffect, useRef, useState } from 'react';

type FeedCardSpotlightProps = {
  src: string;
  width: number;
  height: number;
};

export default function FeedCardSpotlight({ src, width, height }: FeedCardSpotlightProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => setActive(entry.isIntersecting),
      { threshold: 0.45 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const image = (
    <img
      decoding="async"
      loading="lazy"
      width={width}
      height={height}
      srcSet={`${src} ${width}w`}
      src={src}
      alt=""
      draggable={false}
    />
  );

  return (
    <div
      ref={ref}
      className="feed-spotlight"
      data-active={active ? '' : undefined}
    >
      <div className="feed-spotlight-dim">
        {image}
        <div className="feed-spotlight-veil" aria-hidden="true" />
      </div>
      <div className="feed-spotlight-cut" aria-hidden="true">
        {image}
      </div>
    </div>
  );
}

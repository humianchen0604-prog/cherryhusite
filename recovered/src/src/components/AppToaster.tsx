'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Toaster } from 'sonner';

export default function AppToaster() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <Toaster
      className="site-toaster"
      position="bottom-center"
      duration={1200}
      visibleToasts={1}
      gap={0}
      expand={false}
      offset={24}
      toastOptions={{
        className: 'site-toast',
        unstyled: false,
      }}
    />,
    document.body
  );
}

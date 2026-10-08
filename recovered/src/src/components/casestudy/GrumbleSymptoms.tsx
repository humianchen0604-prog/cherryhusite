'use client';

import { useRef, type ReactNode, type RefObject } from 'react';
import { useReducedMotion } from 'motion/react';
import { BrainIcon, type BrainIconHandle } from '@/components/icons/BrainIcon';
import { BatteryLowIcon, type BatteryLowIconHandle } from '@/components/icons/BatteryLowIcon';
import { FocusIcon, type FocusIconHandle } from '@/components/icons/FocusIcon';

type IconHandle = {
  startAnimation: () => void;
  stopAnimation: () => void;
};

function Symptom({
  icon,
  iconRef,
  label,
  reduced,
}: {
  icon: ReactNode;
  iconRef: RefObject<IconHandle | null>;
  label: string;
  reduced: boolean | null;
}) {
  const hover = reduced
    ? undefined
    : {
        onMouseEnter: () => iconRef.current?.startAnimation(),
        onMouseLeave: () => iconRef.current?.stopAnimation(),
      };

  return (
    <li className="grumble-symptom" {...hover}>
      <div className="grumble-symptom__icon" aria-hidden="true">
        {icon}
      </div>
      <span className="grumble-symptom__label">{label}</span>
    </li>
  );
}

export default function GrumbleSymptoms() {
  const brainRef = useRef<BrainIconHandle>(null);
  const batteryRef = useRef<BatteryLowIconHandle>(null);
  const focusRef = useRef<FocusIconHandle>(null);
  const reduced = useReducedMotion();

  return (
    <ul className="grumble-symptoms" aria-label="What skipping meals felt like">
      <Symptom
        iconRef={brainRef}
        label="Foggy Brain"
        reduced={reduced}
        icon={<BrainIcon ref={brainRef} size={26} />}
      />
      <Symptom
        iconRef={batteryRef}
        label="Draining Energy"
        reduced={reduced}
        icon={<BatteryLowIcon ref={batteryRef} size={32} />}
      />
      <Symptom
        iconRef={focusRef}
        label="Losing Focus"
        reduced={reduced}
        icon={<FocusIcon ref={focusRef} size={32} />}
      />
    </ul>
  );
}

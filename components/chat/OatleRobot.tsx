import styles from "./OatleRobot.module.css";

function Mitten() {
  return <>
          <path d="M70.5 34c-1.5-1.4-2.2-3-2.4-5l-1.9-2.1c-.7-.9-.6-1.8.1-2.2.8-.5 1.5-.1 2.2.7l1.1 1.3-.3-3.5c-.1-1.5.6-2.3 1.8-2.3h2.2c1.3 0 2.1 1 2.2 2.4l.2 5.1c.1 2-.7 3.6-1.8 4.7l-.1 1.4h-3.1Z" fill="#CEAD4A" stroke="#8F7737" strokeWidth=".6" strokeLinejoin="round" />
          <path d="m70.2 27.5 1 1.2" stroke="#A0873D" strokeWidth=".55" strokeLinecap="round" />
  </>;
}

/** Clean O-shaped assistant, with quiet details that scale to the chat launcher. */
export default function OatleRobot({ className, greet = false }: { className?: string; greet?: boolean }) {
  return (
    <svg className={`${className ?? ""} ${greet ? styles.greeting : ""}`} viewBox="0 0 80 88" fill="none" aria-hidden="true" focusable="false">
      <ellipse cx="40" cy="82" rx="18" ry="2" fill="#29251B" opacity=".07" />
      <g className={styles.body}>
      {/* Slightly splayed antennae, with small polished caps. */}
      <path d="m29 19-3-10m25 10 3-10" stroke="#84703A" strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="25.5" cy="6.5" r="2.8" fill="#CEAD4A" />
      <circle cx="54.5" cy="6.5" r="2.8" fill="#CEAD4A" />
      <path d="m24.3 5.5.8-.4m28.2.4.8-.4" stroke="#F8E6AC" strokeWidth="1" strokeLinecap="round" />
      {/* Slender limbs and compact, gently rounded feet. */}
      <path d="m31 67-1 11m19-11 1 11" stroke="#514B3D" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M30 77h-3c-3 0-5 2-5 4h11v-1c0-1.7-1.1-3-3-3Zm20 0h3c3 0 5 2 5 4H47v-1c0-1.7 1.1-3 3-3Z" fill="#BD9B37" />
      <path d="M23 81h10m14 0h10" stroke="#75612A" strokeWidth=".8" strokeLinecap="round" />
      {/* Both hands share one artwork; the resting arm mirrors the raised arm. */}
      <g transform="translate(80 0) scale(-1 1)">
        <g transform="rotate(140 64 39)">
          <path d="M64 39Q73 47 72 34" stroke="#514B3D" strokeWidth="1.5" strokeLinecap="round" />
          <Mitten />
        </g>
      </g>
      {/* Bent elbow and upright open mitten: the thumb stays above the palm. */}
      <g className={styles.wavingArm}>
        <path d="M64 39Q73 47 72 34" stroke="#514B3D" strokeWidth="1.5" strokeLinecap="round" />
        <g className={styles.wavingHand}>
          <Mitten />
        </g>
      </g>
      {/* A simple, smooth gold O; no raster logo or speckled texture. */}
      <ellipse cx="40" cy="43" rx="25" ry="28" fill="#C8A640" />
      <path d="M22 26c5-7 12-9 18-9" stroke="#EBD184" strokeWidth="1.3" strokeLinecap="round" />
      <ellipse cx="40" cy="42.5" rx="17.5" ry="21.5" fill="#FFFDF7" />
      <path d="M53 28c3 4 4.5 9 4.5 14.5" stroke="#A98A2E" strokeWidth=".8" opacity=".5" strokeLinecap="round" />
      {/* Fine spectacles: temples, hinge points, bridge and restrained highlights. */}
      <g stroke="#48463F" strokeWidth="1.05" strokeLinecap="round" strokeLinejoin="round">
        <rect x="25.5" y="33.5" width="12.7" height="10.3" rx="3" fill="#FFFFFF" fillOpacity=".45" />
        <rect x="41.8" y="33.5" width="12.7" height="10.3" rx="3" fill="#FFFFFF" fillOpacity=".45" />
        <path d="M38.2 37.5q1.8-1.5 3.6 0m-19-2.8 2.7 1.4m29 0 2.7-1.4" />
      </g>
      <path d="m27.8 36 2-1m14.3 1 2-1" stroke="white" strokeWidth=".9" strokeLinecap="round" />
      <circle cx="32.3" cy="38.8" r="1.35" fill="#34332E" />
      <circle cx="47.7" cy="38.8" r="1.35" fill="#34332E" />
      <circle cx="32.7" cy="38.3" r=".35" fill="white" />
      <circle cx="48.1" cy="38.3" r=".35" fill="white" />
      {/* An easy closed-mouth smile, without an angular or exaggerated grin. */}
      <path d="M32.5 51q7.5 7 15 0" stroke="#514B3D" strokeWidth="1.5" strokeLinecap="round" />
      <path d="m31.5 50.8.8-.5m15.4 0 .8.5" stroke="#9F8B61" strokeWidth=".7" strokeLinecap="round" />
      </g>
    </svg>
  );
}

import type { SVGProps } from "react";

export const MiraLogo = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 334 346" role="img" aria-labelledby="mira-logo-title mira-logo-desc" {...props}>
    <title id="mira-logo-title">Logotipo MIRA</title>
    <desc id="mira-logo-desc">
      Logotipo circular con una M azul y figuras de puntos azules, turquesa y verdes.
    </desc>
    <defs>
      <linearGradient
        id="mira-ring-gradient"
        x1="85"
        y1="40"
        x2="278"
        y2="305"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset="0" stopColor="#061f57" />
        <stop offset="0.58" stopColor="#07336f" />
        <stop offset="0.78" stopColor="#087a91" />
        <stop offset="1" stopColor="#08a77f" />
      </linearGradient>
      <linearGradient
        id="mira-dot-gradient"
        x1="135"
        y1="78"
        x2="303"
        y2="242"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset="0" stopColor="#06246a" />
        <stop offset="0.42" stopColor="#0a3978" />
        <stop offset="0.68" stopColor="#08a476" />
        <stop offset="1" stopColor="#12ad32" />
      </linearGradient>
      <pattern id="mira-dots" width="7" height="7" patternUnits="userSpaceOnUse">
        <circle cx="2.6" cy="2.6" r="2.05" fill="#fff" />
      </pattern>
      <mask id="mira-dot-mask">
        <rect width="334" height="346" fill="url(#mira-dots)" />
      </mask>
      <clipPath id="mira-top-mark">
        <path d="M137 75h43v10h-9v15h-6v17h-8v13h-21v-10h-7v-15h8V93h-7V82h7z" />
        <path d="M146 88l-16 16 9 8 17-17z" />
      </clipPath>
      <clipPath id="mira-right-mark">
        <path d="M204 118h23c9 0 16 7 16 16v46c0 11 5 19 14 25 9 6 19 9 31 9h14v18h-18c-19 0-35-5-48-15-15-11-23-26-23-45v-38h-9z" />
        <path d="M285 207h18v39h-12v-24h-13z" />
      </clipPath>
    </defs>
    <path
      d="M308 199 A142 142 0 1 0 274 265"
      fill="none"
      stroke="url(#mira-ring-gradient)"
      strokeWidth="12"
    />
    <path
      d="M79 231V133L129 201L179 133V231"
      fill="none"
      stroke="#082761"
      strokeWidth="19"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <g clipPath="url(#mira-top-mark)" mask="url(#mira-dot-mask)">
      <rect x="126" y="70" width="60" height="66" fill="url(#mira-dot-gradient)" />
    </g>
    <g clipPath="url(#mira-right-mark)" mask="url(#mira-dot-mask)">
      <rect x="198" y="112" width="110" height="140" fill="url(#mira-dot-gradient)" />
    </g>
  </svg>
);

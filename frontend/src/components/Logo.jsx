export default function Logo({ textWhite = false, className = 'h-20 w-auto' }) {
  // Over the dark hero (transparent navbar) the hat and wordmark turn white;
  // the yellow accent stays fixed because it reads on both backgrounds.
  const hat = textWhite ? '#ffffff' : '#448834'
  const brand = textWhite ? '#ffffff' : '#448834'
  const text = textWhite ? '#ffffff' : '#1f140d'

  return (
    <svg
      viewBox="0 0 600 200"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Pulse Recipe"
    >
      <g transform="translate(0 -6) scale(0.8333)">
        {/* Chef hat */}
        <g fill={hat}>
          <circle cx="120" cy="70" r="42" />
          <circle cx="66" cy="100" r="36" />
          <circle cx="174" cy="100" r="36" />
          <rect x="60" y="94" width="120" height="80" rx="12" />
        </g>
        {/* Fork */}
        <g fill="#f5ce31">
          <rect x="105" y="66" width="6" height="30" rx="3" />
          <rect x="117" y="66" width="6" height="30" rx="3" />
          <rect x="129" y="66" width="6" height="30" rx="3" />
          <rect x="104" y="94" width="32" height="12" rx="6" />
          <rect x="114" y="104" width="12" height="42" rx="6" />
        </g>
        {/* Hat band */}
        <rect x="62" y="182" width="116" height="34" rx="12" fill="#f5ce31" />
      </g>
      <text
        x="216"
        y="94"
        fontFamily="Georgia, 'Times New Roman', serif"
        fontSize="72"
        fontWeight="700"
        fill={brand}
      >
        Pulse
      </text>
      <text
        x="216"
        y="166"
        fontFamily="Georgia, 'Times New Roman', serif"
        fontSize="60"
        letterSpacing="6"
        fill={text}
      >
        RECIPE
      </text>
    </svg>
  )
}

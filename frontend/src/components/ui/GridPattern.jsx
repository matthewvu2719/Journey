export function GridPattern({ className = '', size = 40, opacity = 0.2 }) {
  return (
    <div className={`absolute inset-0 -z-10 ${className}`}>
      <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern
            id="grid-pattern"
            x="0"
            y="0"
            width={size}
            height={size}
            patternUnits="userSpaceOnUse"
          >
            <path
              d={`M ${size} 0 L 0 0 0 ${size}`}
              fill="none"
              stroke="var(--color-foreground)"
              strokeWidth="0.5"
              opacity={opacity}
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid-pattern)" />
      </svg>
    </div>
  )
}

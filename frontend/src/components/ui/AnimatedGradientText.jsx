export function AnimatedGradientText({ children, className = '' }) {
  return (
    <span
      className={`inline-block bg-gradient-to-r from-[var(--color-accent)] via-[var(--color-foreground)] to-[var(--color-accent)] bg-[length:200%_auto] bg-clip-text text-transparent animate-gradient ${className}`}
      style={{
        animation: 'gradient 3s linear infinite',
      }}
    >
      {children}
      <style jsx>{`
        @keyframes gradient {
          0%, 100% {
            background-position: 0% center;
          }
          50% {
            background-position: 100% center;
          }
        }
        .animate-gradient {
          animation: gradient 3s linear infinite;
        }
      `}</style>
    </span>
  )
}

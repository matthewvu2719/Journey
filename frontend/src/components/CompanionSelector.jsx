import { useState } from 'react'
import sunkun from '../img/sunkun.jpg'
import mrrobot from '../img/mrrobot.jpg'

const companions = {
  sunkun: {
    name: 'Sunkun',
    title: 'The Cheerleader',
    description: 'Compassionate, heart-driven, emotional support',
    image: sunkun,
  },
  mrrobot: {
    name: 'Mr Robot',
    title: 'The Professional',
    description: 'Logical, data-driven, analytical',
    image: mrrobot,
  },
  sirwiz: {
    name: 'Sir Wiz',
    title: 'The Sage',
    description: 'Wisdom-driven, philosophical guidance',
    image: null, // Image will be added later
  },
}

export default function CompanionSelector() {
  const [activeCompanion, setActiveCompanion] = useState('sunkun')
  const companion = companions[activeCompanion]

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <h2 className="text-3xl font-bold text-center mb-8">Choose Your Companion</h2>
      
      {/* Navigation Bar */}
      <div className="flex gap-4 justify-center mb-8">
        {Object.entries(companions).map(([key, comp]) => (
          <button
            key={key}
            onClick={() => setActiveCompanion(key)}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              activeCompanion === key
                ? 'bg-[var(--color-accent)] text-[var(--color-background)]'
                : 'bg-[var(--color-glass)] text-[var(--color-foreground)] hover:bg-[var(--color-border)]'
            }`}
          >
            {comp.name}
          </button>
        ))}
      </div>

      {/* Companion Panel */}
      <div className="flex gap-8 items-center bg-[var(--color-glass)] backdrop-blur-sm rounded-2xl p-8 border border-[var(--color-border)]">
        {/* Left: Image */}
        <div className="flex-shrink-0 w-64 h-64 rounded-xl overflow-hidden bg-[var(--color-background-darker)] flex items-center justify-center">
          {companion.image ? (
            <img
              src={companion.image}
              alt={companion.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-[var(--color-foreground-secondary)] text-sm">
              Image coming soon
            </span>
          )}
        </div>

        {/* Right: Description */}
        <div className="flex-1">
          <h3 className="text-2xl font-bold mb-2">{companion.name}</h3>
          <p className="text-xl text-[var(--color-accent)] mb-4">{companion.title}</p>
          <p className="text-lg text-[var(--color-foreground-secondary)]">
            {companion.description}
          </p>
        </div>
      </div>
    </div>
  )
}

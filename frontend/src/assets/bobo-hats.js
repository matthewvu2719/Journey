// 20 Different Hats for Bobo
export const boboHats = {
  // 1. Pirate Hat
  pirate: `
    <g transform="translate(50, 10)">
      <path d="M 10 60 Q 10 45 25 40 L 95 40 Q 110 45 110 60 L 110 70 Q 110 75 105 75 L 15 75 Q 10 75 10 70 Z" 
            fill="#2C1810" stroke="#1A0F08" stroke-width="2" transform="scale(0.4) translate(-60, -40)"/>
      <path d="M 25 40 Q 30 20 45 15 Q 60 10 75 15 Q 90 20 95 40" 
            fill="#2C1810" stroke="#1A0F08" stroke-width="2" transform="scale(0.4) translate(-60, -40)"/>
      <g transform="scale(0.3) translate(-100, -60)">
        <circle cx="60" cy="30" r="8" fill="#F5F5DC"/>
        <circle cx="57" cy="28" r="2" fill="#000"/>
        <circle cx="63" cy="28" r="2" fill="#000"/>
        <path d="M 60 31 L 59 34 L 61 34 Z" fill="#000"/>
      </g>
    </g>
  `,

  // 2. Wizard Hat
  wizard: `
    <g transform="translate(50, 5)">
      <path d="M 0 15 Q -5 -20 5 -25 Q 15 -20 10 15 Z" fill="#4A148C" stroke="#6A1B9A" stroke-width="1"/>
      <circle cx="0" cy="15" r="12" fill="#4A148C" stroke="#6A1B9A" stroke-width="1"/>
      <circle cx="8" cy="-18" r="3" fill="#FFD700"/>
      <g transform="translate(0, -10)">
        <circle cx="-3" cy="0" r="1" fill="#FFD700" opacity="0.8"/>
        <circle cx="2" cy="-5" r="1" fill="#FFD700" opacity="0.6"/>
        <circle cx="5" cy="3" r="1" fill="#FFD700" opacity="0.7"/>
      </g>
    </g>
  `,

  // 3. Chef Hat
  chef: `
    <g transform="translate(50, 8)">
      <ellipse cx="0" cy="12" rx="18" ry="4" fill="#FFFFFF" stroke="#E0E0E0" stroke-width="1"/>
      <rect x="-15" y="0" width="30" height="15" fill="#FFFFFF" stroke="#E0E0E0" stroke-width="1" rx="2"/>
      <circle cx="-8" cy="-5" r="6" fill="#FFFFFF" stroke="#E0E0E0" stroke-width="1"/>
      <circle cx="0" cy="-8" r="7" fill="#FFFFFF" stroke="#E0E0E0" stroke-width="1"/>
      <circle cx="8" cy="-5" r="6" fill="#FFFFFF" stroke="#E0E0E0" stroke-width="1"/>
    </g>
  `,

  // 4. Top Hat
  tophat: `
    <g transform="translate(50, 5)">
      <ellipse cx="0" cy="20" rx="20" ry="5" fill="#1A1A1A" stroke="#333" stroke-width="1"/>
      <rect x="-12" y="-10" width="24" height="30" fill="#1A1A1A" stroke="#333" stroke-width="1" rx="2"/>
      <rect x="-10" y="15" width="20" height="3" fill="#C62828" stroke="#B71C1C" stroke-width="1"/>
    </g>
  `,

  // 5. Baseball Cap
  baseball: `
    <g transform="translate(50, 12)">
      <ellipse cx="0" cy="8" rx="18" ry="6" fill="#1976D2" stroke="#1565C0" stroke-width="1"/>
      <ellipse cx="0" cy="0" rx="15" ry="8" fill="#1976D2" stroke="#1565C0" stroke-width="1"/>
      <ellipse cx="15" cy="5" rx="8" ry="3" fill="#1976D2" stroke="#1565C0" stroke-width="1"/>
      <circle cx="0" cy="-2" r="2" fill="#FFD700"/>
    </g>
  `,

  // 6. Cowboy Hat
  cowboy: `
    <g transform="translate(50, 10)">
      <ellipse cx="0" cy="15" rx="25" ry="6" fill="#8D6E63" stroke="#6D4C41" stroke-width="1"/>
      <path d="M -20 15 Q -15 0 0 -5 Q 15 0 20 15" fill="#8D6E63" stroke="#6D4C41" stroke-width="1"/>
      <path d="M -22 15 Q -25 12 -20 15" fill="#8D6E63" stroke="#6D4C41" stroke-width="1"/>
      <path d="M 22 15 Q 25 12 20 15" fill="#8D6E63" stroke="#6D4C41" stroke-width="1"/>
    </g>
  `,

  // 7. Viking Helmet
  viking: `
    <g transform="translate(50, 8)">
      <path d="M -15 15 Q -15 0 0 -5 Q 15 0 15 15 Z" fill="#757575" stroke="#424242" stroke-width="1"/>
      <circle cx="0" cy="15" r="15" fill="#757575" stroke="#424242" stroke-width="1"/>
      <path d="M -20 5 Q -25 0 -22 -5 Q -18 -3 -15 5" fill="#FFD700" stroke="#FFA000" stroke-width="1"/>
      <path d="M 20 5 Q 25 0 22 -5 Q 18 -3 15 5" fill="#FFD700" stroke="#FFA000" stroke-width="1"/>
    </g>
  `,

  // 8. Beret
  beret: `
    <g transform="translate(50, 10)">
      <circle cx="0" cy="5" r="18" fill="#C62828" stroke="#B71C1C" stroke-width="1"/>
      <ellipse cx="0" cy="15" rx="15" ry="4" fill="#C62828" stroke="#B71C1C" stroke-width="1"/>
      <circle cx="0" cy="0" r="2" fill="#FFD700"/>
    </g>
  `,

  // 9. Santa Hat
  santa: `
    <g transform="translate(50, 8)">
      <path d="M 0 15 Q -10 -5 5 -15 Q 20 -10 15 15" fill="#C62828" stroke="#B71C1C" stroke-width="1"/>
      <circle cx="0" cy="15" r="12" fill="#C62828" stroke="#B71C1C" stroke-width="1"/>
      <circle cx="12" cy="-10" r="4" fill="#FFFFFF"/>
      <rect x="-12" y="12" width="24" height="4" fill="#FFFFFF" rx="2"/>
    </g>
  `,

  // 10. Graduation Cap
  graduation: `
    <g transform="translate(50, 10)">
      <rect x="-15" y="5" width="30" height="8" fill="#1A1A1A" stroke="#333" stroke-width="1" rx="1"/>
      <circle cx="0" cy="9" r="12" fill="#1A1A1A" stroke="#333" stroke-width="1"/>
      <circle cx="15" cy="5" r="2" fill="#FFD700"/>
      <line x1="15" y1="5" x2="20" y2="0" stroke="#FFD700" stroke-width="1"/>
    </g>
  `,

  // 11. Crown
  crown: `
    <g transform="translate(50, 12)">
      <rect x="-15" y="8" width="30" height="6" fill="#FFD700" stroke="#FFA000" stroke-width="1"/>
      <path d="M -15 8 L -12 -2 L -6 8 M -3 8 L 0 -5 L 3 8 M 6 8 L 12 -2 L 15 8" fill="#FFD700" stroke="#FFA000" stroke-width="1"/>
      <circle cx="-9" cy="-1" r="2" fill="#E91E63"/>
      <circle cx="0" cy="-3" r="2" fill="#2196F3"/>
      <circle cx="9" cy="-1" r="2" fill="#4CAF50"/>
    </g>
  `,

  // 12. Sombrero
  sombrero: `
    <g transform="translate(50, 12)">
      <ellipse cx="0" cy="15" rx="30" ry="8" fill="#8D6E63" stroke="#6D4C41" stroke-width="1"/>
      <path d="M -25 15 Q -20 10 -15 15" fill="#8D6E63" stroke="#6D4C41" stroke-width="1"/>
      <path d="M 25 15 Q 20 10 15 15" fill="#8D6E63" stroke="#6D4C41" stroke-width="1"/>
      <circle cx="0" cy="5" r="12" fill="#8D6E63" stroke="#6D4C41" stroke-width="1"/>
      <path d="M -8 0 Q 0 -5 8 0" fill="#C62828" stroke="#B71C1C" stroke-width="1"/>
    </g>
  `,

  // 13. Fedora
  fedora: `
    <g transform="translate(50, 10)">
      <ellipse cx="0" cy="15" rx="20" ry="5" fill="#424242" stroke="#212121" stroke-width="1"/>
      <ellipse cx="0" cy="5" rx="15" ry="8" fill="#424242" stroke="#212121" stroke-width="1"/>
      <rect x="-12" y="10" width="24" height="3" fill="#8D6E63" stroke="#6D4C41" stroke-width="1"/>
      <path d="M -18 15 Q -20 12 -18 15" fill="#424242" stroke="#212121" stroke-width="1"/>
    </g>
  `,

  // 14. Beanie
  beanie: `
    <g transform="translate(50, 10)">
      <path d="M -15 15 Q -15 -5 0 -10 Q 15 -5 15 15" fill="#2196F3" stroke="#1976D2" stroke-width="1"/>
      <circle cx="0" cy="15" r="15" fill="#2196F3" stroke="#1976D2" stroke-width="1"/>
      <circle cx="0" cy="-8" r="3" fill="#FFD700"/>
    </g>
  `,

  // 15. Police Hat
  police: `
    <g transform="translate(50, 10)">
      <ellipse cx="0" cy="12" rx="18" ry="5" fill="#1565C0" stroke="#0D47A1" stroke-width="1"/>
      <ellipse cx="0" cy="5" rx="15" ry="8" fill="#1565C0" stroke="#0D47A1" stroke-width="1"/>
      <rect x="-12" y="8" width="24" height="3" fill="#1A1A1A"/>
      <circle cx="0" cy="2" r="4" fill="#FFD700" stroke="#FFA000" stroke-width="1"/>
      <path d="M -2 2 L 2 2 M 0 0 L 0 4" stroke="#1565C0" stroke-width="1"/>
    </g>
  `,

  // 16. Jester Hat
  jester: `
    <g transform="translate(50, 8)">
      <path d="M 0 15 Q -8 0 -15 -10 Q -12 -15 -8 -10 Q -5 5 0 15" fill="#9C27B0" stroke="#7B1FA2" stroke-width="1"/>
      <path d="M 0 15 Q 8 0 15 -10 Q 12 -15 8 -10 Q 5 5 0 15" fill="#FF5722" stroke="#E64A19" stroke-width="1"/>
      <path d="M 0 15 Q 0 -5 0 -15 Q 3 -18 0 -15 Q -3 -18 0 -15" fill="#4CAF50" stroke="#388E3C" stroke-width="1"/>
      <circle cx="-8" cy="-10" r="2" fill="#FFD700"/>
      <circle cx="8" cy="-10" r="2" fill="#FFD700"/>
      <circle cx="0" cy="-15" r="2" fill="#FFD700"/>
    </g>
  `,

  // 17. Bucket Hat
  bucket: `
    <g transform="translate(50, 12)">
      <ellipse cx="0" cy="12" rx="22" ry="6" fill="#8BC34A" stroke="#689F38" stroke-width="1"/>
      <path d="M -20 12 Q -15 5 0 0 Q 15 5 20 12" fill="#8BC34A" stroke="#689F38" stroke-width="1"/>
      <circle cx="0" cy="6" r="15" fill="#8BC34A" stroke="#689F38" stroke-width="1"/>
    </g>
  `,

  // 18. Helmet (Space)
  space_helmet: `
    <g transform="translate(50, 8)">
      <circle cx="0" cy="8" r="20" fill="rgba(255,255,255,0.3)" stroke="#E0E0E0" stroke-width="2"/>
      <circle cx="0" cy="8" r="18" fill="rgba(255,255,255,0.1)" stroke="#BDBDBD" stroke-width="1"/>
      <rect x="-15" y="20" width="30" height="6" fill="#757575" stroke="#424242" stroke-width="1" rx="3"/>
      <circle cx="-8" cy="23" r="2" fill="#4CAF50"/>
      <circle cx="8" cy="23" r="2" fill="#F44336"/>
    </g>
  `,

  // 19. Turban
  turban: `
    <g transform="translate(50, 10)">
      <ellipse cx="0" cy="12" rx="18" ry="6" fill="#FF9800" stroke="#F57C00" stroke-width="1"/>
      <path d="M -15 12 Q -10 0 0 -5 Q 10 0 15 12" fill="#FF9800" stroke="#F57C00" stroke-width="1"/>
      <path d="M -12 8 Q 0 5 12 8" fill="#FFB74D" stroke="#FF9800" stroke-width="1"/>
      <circle cx="0" cy="2" r="4" fill="#FFD700" stroke="#FFA000" stroke-width="1"/>
      <circle cx="0" cy="2" r="2" fill="#E91E63"/>
    </g>
  `,

  // 20. Propeller Hat
  propeller: `
    <g transform="translate(50, 10)">
      <circle cx="0" cy="8" r="15" fill="#2196F3" stroke="#1976D2" stroke-width="1"/>
      <ellipse cx="0" cy="15" rx="12" ry="3" fill="#2196F3" stroke="#1976D2" stroke-width="1"/>
      <circle cx="0" cy="-5" r="2" fill="#424242"/>
      <g transform="rotate(0 0 -5)" className="animate-spin">
        <ellipse cx="-15" cy="-5" rx="12" ry="2" fill="#FFD700" stroke="#FFA000" stroke-width="1"/>
        <ellipse cx="15" cy="-5" rx="12" ry="2" fill="#FFD700" stroke="#FFA000" stroke-width="1"/>
      </g>
    </g>
  `
};
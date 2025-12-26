// 20 Cute Costumes for Bobo
export const boboCostumes = {
  // 1. Superhero Cape
  superhero: {
    layer: 'behind',
    svg: `
      <g transform="translate(50, 55)">
        <path d="M -10 0 Q -18 15 -15 35 Q -12 45 -8 50 L -6 50 Q -8 35 -8 20 Q -6 5 -8 0 Z" fill="#F44336" opacity="0.9"/>
        <path d="M 10 0 Q 18 15 15 35 Q 12 45 8 50 L 6 50 Q 8 35 8 20 Q 6 5 8 0 Z" fill="#D32F2F" opacity="0.9"/>
        <line x1="-8" y1="0" x2="8" y2="0" stroke="#C62828" stroke-width="2"/>
        <circle cx="-5" cy="25" r="2" fill="#FFD700" opacity="0.8"/>
        <circle cx="5" cy="30" r="1.5" fill="#FFD700" opacity="0.8"/>
      </g>
    `
  },

  // 2. Angel Wings
  angel: {
    layer: 'behind',
    svg: `
      <g transform="translate(50, 65)">
        <ellipse cx="-18" cy="0" rx="15" ry="25" fill="#FFFFFF" stroke="#E0E0E0" stroke-width="1" opacity="0.9" transform="rotate(-15 -18 0)"/>
        <ellipse cx="18" cy="0" rx="15" ry="25" fill="#FFFFFF" stroke="#E0E0E0" stroke-width="1" opacity="0.9" transform="rotate(15 18 0)"/>
        <ellipse cx="-15" cy="-5" rx="8" ry="15" fill="#F5F5F5" stroke="#BDBDBD" stroke-width="0.5" opacity="0.7" transform="rotate(-15 -15 -5)"/>
        <ellipse cx="15" cy="-5" rx="8" ry="15" fill="#F5F5F5" stroke="#BDBDBD" stroke-width="0.5" opacity="0.7" transform="rotate(15 15 -5)"/>
        <circle cx="-12" cy="10" r="1" fill="#FFD700" opacity="0.6"/>
        <circle cx="12" cy="8" r="1" fill="#FFD700" opacity="0.6"/>
      </g>
    `
  },

  // 3. Bow Tie (Formal)
  bowtie: {
    layer: 'front',
    svg: `
      <g transform="translate(50, 56)">
        <path d="M -12 0 Q -18 -4 -18 0 Q -18 4 -12 0 Z" fill="#1976D2"/>
        <path d="M 12 0 Q 18 -4 18 0 Q 18 4 12 0 Z" fill="#1976D2"/>
        <rect x="-4" y="-3" width="8" height="6" fill="#0D47A1" rx="1"/>
        <circle cx="-15" cy="0" r="1" fill="#FFD700" opacity="0.8"/>
        <circle cx="15" cy="0" r="1" fill="#FFD700" opacity="0.8"/>
      </g>
    `
  },

  // 4. Cozy Scarf
  scarf: {
    layer: 'front',
    svg: `
      <g transform="translate(50, 54)">
        <ellipse cx="0" cy="0" rx="14" ry="5" fill="#FF9800" stroke="#F57C00" stroke-width="1"/>
        <rect x="-16" y="3" width="5" height="18" fill="#FF9800" rx="2"/>
        <rect x="11" y="3" width="5" height="15" fill="#FF9800" rx="2"/>
        <rect x="-15" y="18" width="3" height="4" fill="#FFB74D" rx="1"/>
        <rect x="-13" y="20" width="3" height="4" fill="#FFB74D" rx="1"/>
        <rect x="12" y="15" width="3" height="4" fill="#FFB74D" rx="1"/>
        <rect x="14" y="17" width="3" height="4" fill="#FFB74D" rx="1"/>
      </g>
    `
  },

  // 5. Fairy Wings
  fairy: {
    layer: 'behind',
    svg: `
      <g transform="translate(50, 70)">
        <ellipse cx="-15" cy="-5" rx="12" ry="20" fill="#E1F5FE" stroke="#81D4FA" stroke-width="1" opacity="0.8" transform="rotate(-20 -15 -5)"/>
        <ellipse cx="15" cy="-5" rx="12" ry="20" fill="#FCE4EC" stroke="#F8BBD9" stroke-width="1" opacity="0.8" transform="rotate(20 15 -5)"/>
        <ellipse cx="-12" cy="0" rx="6" ry="12" fill="#B3E5FC" stroke="#4FC3F7" stroke-width="0.5" opacity="0.6" transform="rotate(-20 -12 0)"/>
        <ellipse cx="12" cy="0" rx="6" ry="12" fill="#F8BBD9" stroke="#EC407A" stroke-width="0.5" opacity="0.6" transform="rotate(20 12 0)"/>
        <circle cx="-10" cy="-8" r="1" fill="#FFD700" opacity="0.9"/>
        <circle cx="10" cy="-8" r="1" fill="#FFD700" opacity="0.9"/>
        <circle cx="-8" cy="5" r="0.5" fill="#E91E63" opacity="0.7"/>
        <circle cx="8" cy="5" r="0.5" fill="#2196F3" opacity="0.7"/>
      </g>
    `
  },

  // 6. Cute Apron
  apron: {
    layer: 'front',
    svg: `
      <g transform="translate(50, 65)">
        <path d="M -15 -10 Q -12 -15 0 -15 Q 12 -15 15 -10 L 15 25 Q 12 30 0 30 Q -12 30 -15 25 Z" fill="#FFE0E6" stroke="#F8BBD9" stroke-width="1"/>
        <rect x="-10" y="-5" width="20" height="3" fill="#E91E63" rx="1"/>
        <circle cx="-8" cy="5" r="2" fill="#FF69B4" opacity="0.7"/>
        <circle cx="8" cy="10" r="2" fill="#FF69B4" opacity="0.7"/>
        <circle cx="0" cy="15" r="2" fill="#FF69B4" opacity="0.7"/>
        <path d="M -5 20 Q 0 22 5 20" stroke="#E91E63" stroke-width="1" fill="none"/>
      </g>
    `
  },

  // 7. Wizard Robe
  wizard_robe: {
    layer: 'front',
    svg: `
      <g transform="translate(50, 60)">
        <path d="M -18 -5 Q -15 -10 0 -10 Q 15 -10 18 -5 L 20 30 Q 15 35 0 35 Q -15 35 -20 30 Z" fill="#4A148C" stroke="#6A1B9A" stroke-width="1" opacity="0.9"/>
        <circle cx="-10" cy="5" r="2" fill="#FFD700" opacity="0.8"/>
        <circle cx="0" cy="10" r="2" fill="#FFD700" opacity="0.8"/>
        <circle cx="10" cy="15" r="2" fill="#FFD700" opacity="0.8"/>
        <path d="M -8 20 Q 0 18 8 20" stroke="#9C27B0" stroke-width="1" fill="none"/>
        <circle cx="-5" cy="25" r="1" fill="#E1BEE7" opacity="0.7"/>
        <circle cx="5" cy="28" r="1" fill="#E1BEE7" opacity="0.7"/>
      </g>
    `
  },

  // 8. Flower Crown (as costume accessory)
  flower_crown: {
    layer: 'front',
    svg: `
      <g transform="translate(50, 20)">
        <circle cx="-12" cy="0" r="3" fill="#E91E63" opacity="0.8"/>
        <circle cx="-6" cy="-2" r="3" fill="#FF9800" opacity="0.8"/>
        <circle cx="0" cy="-3" r="3" fill="#4CAF50" opacity="0.8"/>
        <circle cx="6" cy="-2" r="3" fill="#2196F3" opacity="0.8"/>
        <circle cx="12" cy="0" r="3" fill="#9C27B0" opacity="0.8"/>
        <circle cx="-12" cy="0" r="1" fill="#FFD700"/>
        <circle cx="-6" cy="-2" r="1" fill="#FFD700"/>
        <circle cx="0" cy="-3" r="1" fill="#FFD700"/>
        <circle cx="6" cy="-2" r="1" fill="#FFD700"/>
        <circle cx="12" cy="0" r="1" fill="#FFD700"/>
      </g>
    `
  },

  // 9. Cute Vest
  vest: {
    layer: 'front',
    svg: `
      <g transform="translate(50, 58)">
        <path d="M -12 -3 Q -8 -8 0 -8 Q 8 -8 12 -3 L 15 20 Q 12 25 8 25 L 8 15 Q 5 12 0 12 Q -5 12 -8 15 L -8 25 Q -12 25 -15 20 Z" fill="#8BC34A" stroke="#689F38" stroke-width="1"/>
        <circle cx="-6" cy="5" r="2" fill="#4CAF50"/>
        <circle cx="6" cy="10" r="2" fill="#4CAF50"/>
        <circle cx="0" cy="15" r="2" fill="#4CAF50"/>
        <rect x="-3" y="18" width="6" height="2" fill="#689F38" rx="1"/>
      </g>
    `
  },

  // 10. Rainbow Cape
  rainbow_cape: {
    layer: 'behind',
    svg: `
      <g transform="translate(50, 55)">
        <path d="M -10 0 Q -18 15 -15 40 L -8 45 Q -10 30 -8 15 Q -6 5 -8 0 Z" fill="#F44336" opacity="0.8"/>
        <path d="M -8 0 Q -16 15 -13 40 L -6 45 Q -8 30 -6 15 Q -4 5 -6 0 Z" fill="#FF9800" opacity="0.8"/>
        <path d="M -6 0 Q -14 15 -11 40 L -4 45 Q -6 30 -4 15 Q -2 5 -4 0 Z" fill="#FFEB3B" opacity="0.8"/>
        <path d="M -4 0 Q -12 15 -9 40 L -2 45 Q -4 30 -2 15 Q 0 5 -2 0 Z" fill="#4CAF50" opacity="0.8"/>
        <path d="M -2 0 Q -10 15 -7 40 L 0 45 Q -2 30 0 15 Q 2 5 0 0 Z" fill="#2196F3" opacity="0.8"/>
        <path d="M 0 0 Q -8 15 -5 40 L 2 45 Q 0 30 2 15 Q 4 5 2 0 Z" fill="#9C27B0" opacity="0.8"/>
        <path d="M 2 0 Q 10 15 7 40 L 4 45 Q 2 30 4 15 Q 6 5 4 0 Z" fill="#E91E63" opacity="0.8"/>
        <path d="M 10 0 Q 18 15 15 40 L 8 45 Q 10 30 8 15 Q 6 5 8 0 Z" fill="#F44336" opacity="0.8"/>
      </g>
    `
  },

  // 11. Cute Overalls
  overalls: {
    layer: 'front',
    svg: `
      <g transform="translate(50, 65)">
        <rect x="-12" y="-10" width="24" height="35" fill="#1976D2" stroke="#1565C0" stroke-width="1" rx="3"/>
        <rect x="-8" y="-5" width="16" height="25" fill="#42A5F5" opacity="0.3" rx="2"/>
        <circle cx="-6" cy="-2" r="2" fill="#FFD700"/>
        <circle cx="6" cy="-2" r="2" fill="#FFD700"/>
        <rect x="-2" y="5" width="4" height="8" fill="#1565C0" rx="1"/>
        <rect x="-10" y="-8" width="3" height="15" fill="#1976D2" rx="1"/>
        <rect x="7" y="-8" width="3" height="15" fill="#1976D2" rx="1"/>
      </g>
    `
  },

  // 12. Cute Tutu
  tutu: {
    layer: 'front',
    svg: `
      <g transform="translate(50, 75)">
        <ellipse cx="0" cy="0" rx="20" ry="8" fill="#FFE0E6" stroke="#F8BBD9" stroke-width="1" opacity="0.9"/>
        <ellipse cx="0" cy="-2" rx="18" ry="6" fill="#FCE4EC" stroke="#F48FB1" stroke-width="1" opacity="0.8"/>
        <ellipse cx="0" cy="-4" rx="16" ry="4" fill="#F8BBD9" stroke="#EC407A" stroke-width="1" opacity="0.7"/>
        <circle cx="-12" cy="-2" r="1" fill="#E91E63" opacity="0.8"/>
        <circle cx="-6" cy="2" r="1" fill="#E91E63" opacity="0.8"/>
        <circle cx="6" cy="-1" r="1" fill="#E91E63" opacity="0.8"/>
        <circle cx="12" cy="1" r="1" fill="#E91E63" opacity="0.8"/>
      </g>
    `
  },

  // 13. Pirate Vest
  pirate_vest: {
    layer: 'front',
    svg: `
      <g transform="translate(50, 58)">
        <path d="M -12 -3 Q -8 -8 0 -8 Q 8 -8 12 -3 L 15 22 Q 12 27 0 27 Q -12 27 -15 22 Z" fill="#8D6E63" stroke="#6D4C41" stroke-width="1"/>
        <rect x="-10" y="0" width="20" height="20" fill="#A1887F" opacity="0.3" rx="2"/>
        <circle cx="-6" cy="5" r="1.5" fill="#FFD700"/>
        <circle cx="6" cy="10" r="1.5" fill="#FFD700"/>
        <circle cx="0" cy="15" r="1.5" fill="#FFD700"/>
        <path d="M -8 20 Q 0 18 8 20" stroke="#5D4037" stroke-width="1" fill="none"/>
      </g>
    `
  },

  // 14. Cute Bandana
  bandana: {
    layer: 'front',
    svg: `
      <g transform="translate(50, 25)">
        <path d="M -15 5 Q -12 0 0 0 Q 12 0 15 5 L 12 15 Q 8 18 0 18 Q -8 18 -12 15 Z" fill="#F44336" stroke="#D32F2F" stroke-width="1"/>
        <circle cx="-8" cy="8" r="2" fill="#FFFFFF" opacity="0.8"/>
        <circle cx="0" cy="6" r="2" fill="#FFFFFF" opacity="0.8"/>
        <circle cx="8" cy="8" r="2" fill="#FFFFFF" opacity="0.8"/>
        <circle cx="-4" cy="12" r="1" fill="#FFFFFF" opacity="0.6"/>
        <circle cx="4" cy="12" r="1" fill="#FFFFFF" opacity="0.6"/>
      </g>
    `
  },

  // 15. Lab Coat
  lab_coat: {
    layer: 'front',
    svg: `
      <g transform="translate(50, 60)">
        <path d="M -15 -8 Q -12 -12 0 -12 Q 12 -12 15 -8 L 18 30 Q 15 35 0 35 Q -15 35 -18 30 Z" fill="#FFFFFF" stroke="#E0E0E0" stroke-width="1"/>
        <rect x="-12" y="-5" width="24" height="3" fill="#E0E0E0" rx="1"/>
        <circle cx="-8" cy="2" r="1.5" fill="#424242"/>
        <circle cx="8" cy="8" r="1.5" fill="#424242"/>
        <circle cx="0" cy="14" r="1.5" fill="#424242"/>
        <rect x="-6" y="20" width="12" height="8" fill="#F5F5F5" stroke="#BDBDBD" stroke-width="0.5" rx="1"/>
      </g>
    `
  },

  // 16. Cute Poncho
  poncho: {
    layer: 'front',
    svg: `
      <g transform="translate(50, 55)">
        <ellipse cx="0" cy="5" rx="22" ry="15" fill="#FF9800" stroke="#F57C00" stroke-width="1" opacity="0.9"/>
        <ellipse cx="0" cy="0" rx="8" ry="6" fill="#FF9800" stroke="#F57C00" stroke-width="1"/>
        <path d="M -15 10 Q 0 8 15 10" stroke="#FFB74D" stroke-width="2" fill="none"/>
        <path d="M -12 15 Q 0 13 12 15" stroke="#FFB74D" stroke-width="2" fill="none"/>
        <circle cx="-8" cy="12" r="1" fill="#4CAF50"/>
        <circle cx="8" cy="12" r="1" fill="#E91E63"/>
        <circle cx="0" cy="8" r="1" fill="#2196F3"/>
      </g>
    `
  },

  // 17. Cute Suspenders
  suspenders: {
    layer: 'front',
    svg: `
      <g transform="translate(50, 60)">
        <rect x="-8" y="-5" width="3" height="25" fill="#8D6E63" rx="1"/>
        <rect x="5" y="-5" width="3" height="25" fill="#8D6E63" rx="1"/>
        <circle cx="-6.5" cy="0" r="2" fill="#FFD700"/>
        <circle cx="6.5" cy="0" r="2" fill="#FFD700"/>
        <rect x="-10" y="18" width="20" height="8" fill="#1976D2" stroke="#1565C0" stroke-width="1" rx="2"/>
        <circle cx="-4" cy="22" r="1" fill="#FFD700"/>
        <circle cx="4" cy="22" r="1" fill="#FFD700"/>
      </g>
    `
  },

  // 18. Cute Kimono
  kimono: {
    layer: 'front',
    svg: `
      <g transform="translate(50, 58)">
        <path d="M -15 -5 Q -12 -10 0 -10 Q 12 -10 15 -5 L 18 25 Q 15 30 0 30 Q -15 30 -18 25 Z" fill="#E91E63" stroke="#C2185B" stroke-width="1" opacity="0.9"/>
        <path d="M -12 0 Q 0 -2 12 0 L 15 20 Q 12 22 0 22 Q -12 22 -15 20 Z" fill="#F8BBD9" stroke="#EC407A" stroke-width="1" opacity="0.8"/>
        <circle cx="-8" cy="8" r="2" fill="#FFD700" opacity="0.8"/>
        <circle cx="8" cy="12" r="2" fill="#FFD700" opacity="0.8"/>
        <path d="M -6 16 Q 0 14 6 16" stroke="#AD1457" stroke-width="1" fill="none"/>
        <rect x="-3" y="20" width="6" height="6" fill="#C2185B" rx="1"/>
      </g>
    `
  },

  // 19. Cute Hoodie
  hoodie: {
    layer: 'front',
    svg: `
      <g transform="translate(50, 55)">
        <path d="M -15 -5 Q -18 -10 -15 -15 Q -10 -18 0 -18 Q 10 -18 15 -15 Q 18 -10 15 -5 L 18 25 Q 15 30 0 30 Q -15 30 -18 25 Z" fill="#2196F3" stroke="#1976D2" stroke-width="1"/>
        <ellipse cx="0" cy="-12" rx="12" ry="8" fill="#1976D2" opacity="0.7"/>
        <circle cx="0" cy="5" r="3" fill="#FFD700"/>
        <rect x="-2" y="10" width="4" height="8" fill="#1565C0" rx="1"/>
        <rect x="-8" y="15" width="16" height="3" fill="#42A5F5" opacity="0.5" rx="1"/>
      </g>
    `
  },

  // 20. Cute Princess Dress
  princess: {
    layer: 'front',
    svg: `
      <g transform="translate(50, 65)">
        <path d="M -18 -8 Q -15 -12 0 -12 Q 15 -12 18 -8 L 25 25 Q 20 35 0 35 Q -20 35 -25 25 Z" fill="#E1BEE7" stroke="#BA68C8" stroke-width="1" opacity="0.9"/>
        <ellipse cx="0" cy="20" rx="22" ry="12" fill="#F3E5F5" stroke="#CE93D8" stroke-width="1" opacity="0.8"/>
        <circle cx="-10" cy="5" r="2" fill="#FFD700" opacity="0.8"/>
        <circle cx="0" cy="0" r="2" fill="#FFD700" opacity="0.8"/>
        <circle cx="10" cy="5" r="2" fill="#FFD700" opacity="0.8"/>
        <path d="M -8 15 Q 0 12 8 15" stroke="#9C27B0" stroke-width="1" fill="none"/>
        <circle cx="-6" cy="25" r="1" fill="#E91E63" opacity="0.7"/>
        <circle cx="6" cy="25" r="1" fill="#E91E63" opacity="0.7"/>
        <circle cx="0" cy="28" r="1" fill="#E91E63" opacity="0.7"/>
      </g>
    `
  }
};
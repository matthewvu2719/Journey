"""
Bobo SVG Data - Python version of the frontend asset files
This stores the actual SVG data for emotions, hats, and costumes
"""
import json

# Emotions (from bobo-emojis.js)
BOBO_EMOTIONS = {
    'sparkly_happy': {
        'eyes': '''
      <g>
        <circle cx="40" cy="32" r="4" fill="#000"/>
        <circle cx="60" cy="32" r="4" fill="#000"/>
        <circle cx="41" cy="30" r="2" fill="white"/>
        <circle cx="61" cy="30" r="2" fill="white"/>
        <circle cx="38" cy="29" r="1" fill="#FFD700" opacity="0.8"/>
        <circle cx="42" cy="34" r="1" fill="#FFD700" opacity="0.8"/>
        <circle cx="58" cy="29" r="1" fill="#FFD700" opacity="0.8"/>
        <circle cx="62" cy="34" r="1" fill="#FFD700" opacity="0.8"/>
      </g>
    ''',
        'mouth': '''<path d="M 38 42 Q 50 50 62 42" stroke="#000" stroke-width="2.5" fill="none" stroke-linecap="round"/>'''
    },
    'sleepy': {
        'eyes': '''
      <g>
        <path d="M 35 32 Q 40 29 45 32" stroke="#000" stroke-width="2" fill="none" stroke-linecap="round"/>
        <path d="M 55 32 Q 60 29 65 32" stroke="#000" stroke-width="2" fill="none" stroke-linecap="round"/>
        <circle cx="42" cy="35" r="1" fill="white" opacity="0.6"/>
        <circle cx="58" cy="35" r="1" fill="white" opacity="0.6"/>
      </g>
    ''',
        'mouth': '''<ellipse cx="50" cy="44" rx="3" ry="2" fill="#000" opacity="0.7"/>'''
    },
    'heart_eyes': {
        'eyes': '''
      <g>
        <path d="M 37 29 Q 35 27 37 30 Q 40 27 42 30 Q 40 33 37 29" fill="#000"/>
        <path d="M 57 29 Q 55 27 57 30 Q 60 27 62 30 Q 60 33 57 29" fill="#000"/>
        <circle cx="39" cy="30" r="1" fill="white" opacity="0.8"/>
        <circle cx="59" cy="30" r="1" fill="white" opacity="0.8"/>
      </g>
    ''',
        'mouth': '''<path d="M 40 42 Q 50 48 60 42" stroke="#000" stroke-width="2" fill="none" stroke-linecap="round"/>'''
    },
    'blushing': {
        'eyes': '''
      <g>
        <path d="M 36 32 Q 40 29 44 32" stroke="#000" stroke-width="2" fill="none" stroke-linecap="round"/>
        <path d="M 56 32 Q 60 29 64 32" stroke="#000" stroke-width="2" fill="none" stroke-linecap="round"/>
        <circle cx="30" cy="38" r="4" fill="#FF8A80" opacity="0.7"/>
        <circle cx="70" cy="38" r="4" fill="#FF8A80" opacity="0.7"/>
      </g>
    ''',
        'mouth': '''<path d="M 42 42 Q 50 47 58 42" stroke="#000" stroke-width="2" fill="none" stroke-linecap="round"/>'''
    },
    'winking': {
        'eyes': '''
      <g>
        <circle cx="40" cy="32" r="5" fill="#000"/>
        <circle cx="41" cy="30" r="2" fill="white"/>
        <circle cx="42" cy="29" r="1" fill="white" opacity="0.8"/>
        <path d="M 56 32 Q 60 29 64 32" stroke="#000" stroke-width="2.5" fill="none" stroke-linecap="round"/>
      </g>
    ''',
        'mouth': '''<path d="M 40 42 Q 50 48 60 42" stroke="#000" stroke-width="2" fill="none" stroke-linecap="round"/>'''
    },
    'star_eyes': {
        'eyes': '''
      <g>
        <g transform="translate(40, 32)">
          <path d="M 0 -4 L 1 -1 L 4 0 L 1 1 L 0 4 L -1 1 L -4 0 L -1 -1 Z" fill="#000"/>
          <circle cx="0" cy="0" r="1" fill="white" opacity="0.8"/>
        </g>
        <g transform="translate(60, 32)">
          <path d="M 0 -4 L 1 -1 L 4 0 L 1 1 L 0 4 L -1 1 L -4 0 L -1 -1 Z" fill="#000"/>
          <circle cx="0" cy="0" r="1" fill="white" opacity="0.8"/>
        </g>
      </g>
    ''',
        'mouth': '''<path d="M 38 42 Q 50 50 62 42" stroke="#000" stroke-width="2.5" fill="none" stroke-linecap="round"/>'''
    },
    'surprised': {
        'eyes': '''
      <g>
        <circle cx="40" cy="32" r="7" fill="#000"/>
        <circle cx="60" cy="32" r="7" fill="#000"/>
        <circle cx="40" cy="32" r="5" fill="white"/>
        <circle cx="60" cy="32" r="5" fill="white"/>
        <circle cx="40" cy="30" r="2" fill="#000"/>
        <circle cx="60" cy="30" r="2" fill="#000"/>
        <circle cx="41" cy="29" r="1" fill="white"/>
        <circle cx="61" cy="29" r="1" fill="white"/>
      </g>
    ''',
        'mouth': '''<ellipse cx="50" cy="44" rx="5" ry="7" fill="#000"/>'''
    },
    'giggly': {
        'eyes': '''
      <g>
        <path d="M 36 30 Q 40 27 44 30" stroke="#000" stroke-width="2" fill="none" stroke-linecap="round"/>
        <path d="M 56 30 Q 60 27 64 30" stroke="#000" stroke-width="2" fill="none" stroke-linecap="round"/>
      </g>
    ''',
        'mouth': '''<path d="M 35 40 Q 50 52 65 40" stroke="#000" stroke-width="2.5" fill="none" stroke-linecap="round"/>'''
    },
    'kawaii_shy': {
        'eyes': '''
      <g>
        <path d="M 36 32 Q 40 29 44 32" stroke="#000" stroke-width="2" fill="none" stroke-linecap="round"/>
        <path d="M 56 32 Q 60 29 64 32" stroke="#000" stroke-width="2" fill="none" stroke-linecap="round"/>
        <circle cx="32" cy="38" r="5" fill="#FFB6C1" opacity="0.8"/>
        <circle cx="68" cy="38" r="5" fill="#FFB6C1" opacity="0.8"/>
      </g>
    ''',
        'mouth': '''<path d="M 45 42 Q 50 44 55 42" stroke="#000" stroke-width="2" fill="none" stroke-linecap="round"/>'''
    },
    'excited': {
        'eyes': '''
      <g>
        <circle cx="40" cy="30" r="6" fill="#000"/>
        <circle cx="60" cy="30" r="6" fill="#000"/>
        <circle cx="41" cy="28" r="2" fill="white"/>
        <circle cx="61" cy="28" r="2" fill="white"/>
      </g>
    ''',
        'mouth': '''<path d="M 35 40 Q 50 55 65 40" stroke="#000" stroke-width="3" fill="none" stroke-linecap="round"/>'''
    },
    'dreamy': {
        'eyes': '''
      <g>
        <path d="M 35 32 Q 40 29 45 32" stroke="#000" stroke-width="2" fill="none" stroke-linecap="round"/>
        <path d="M 55 32 Q 60 29 65 32" stroke="#000" stroke-width="2" fill="none" stroke-linecap="round"/>
        <circle cx="35" cy="25" r="1" fill="#FFD700" opacity="0.6"/>
        <circle cx="65" cy="25" r="1" fill="#FFD700" opacity="0.6"/>
      </g>
    ''',
        'mouth': '''<path d="M 42 42 Q 50 46 58 42" stroke="#000" stroke-width="2" fill="none" stroke-linecap="round"/>'''
    },
    'playful': {
        'eyes': '''
      <g>
        <circle cx="40" cy="32" r="4" fill="#000"/>
        <circle cx="41" cy="30" r="1.5" fill="white"/>
        <path d="M 56 32 Q 60 29 64 32" stroke="#000" stroke-width="2.5" fill="none" stroke-linecap="round"/>
      </g>
    ''',
        'mouth': '''<path d="M 38 40 Q 45 48 52 40 Q 58 48 65 40" stroke="#000" stroke-width="2" fill="none" stroke-linecap="round"/>'''
    },
    'loving': {
        'eyes': '''
      <g>
        <path d="M 37 29 Q 35 27 37 30 Q 40 27 42 30 Q 40 33 37 29" fill="#FF1744"/>
        <path d="M 57 29 Q 55 27 57 30 Q 60 27 62 30 Q 60 33 57 29" fill="#FF1744"/>
        <circle cx="39" cy="30" r="1" fill="white" opacity="0.8"/>
        <circle cx="59" cy="30" r="1" fill="white" opacity="0.8"/>
      </g>
    ''',
        'mouth': '''<path d="M 40 42 Q 50 50 60 42" stroke="#000" stroke-width="2.5" fill="none" stroke-linecap="round"/>'''
    },
    'cheeky': {
        'eyes': '''
      <g>
        <circle cx="40" cy="32" r="4" fill="#000"/>
        <circle cx="41" cy="30" r="1.5" fill="white"/>
        <circle cx="60" cy="32" r="4" fill="#000"/>
        <circle cx="61" cy="30" r="1.5" fill="white"/>
      </g>
    ''',
        'mouth': '''<path d="M 38 40 Q 45 48 50 40 Q 55 48 62 40" stroke="#000" stroke-width="2" fill="none" stroke-linecap="round"/>'''
    },
    'innocent': {
        'eyes': '''
      <g>
        <circle cx="40" cy="32" r="5" fill="#000"/>
        <circle cx="60" cy="32" r="5" fill="#000"/>
        <circle cx="40" cy="32" r="3" fill="white"/>
        <circle cx="60" cy="32" r="3" fill="white"/>
        <circle cx="40" cy="30" r="1.5" fill="#000"/>
        <circle cx="60" cy="30" r="1.5" fill="#000"/>
      </g>
    ''',
        'mouth': '''<ellipse cx="50" cy="44" rx="4" ry="3" fill="#000" opacity="0.6"/>'''
    },
    'cheerful': {
        'eyes': '''
      <g>
        <path d="M 36 30 Q 40 27 44 30" stroke="#000" stroke-width="2" fill="none" stroke-linecap="round"/>
        <path d="M 56 30 Q 60 27 64 30" stroke="#000" stroke-width="2" fill="none" stroke-linecap="round"/>
      </g>
    ''',
        'mouth': '''<path d="M 38 42 Q 50 50 62 42" stroke="#000" stroke-width="2.5" fill="none" stroke-linecap="round"/>'''
    },
    'mischievous': {
        'eyes': '''
      <g>
        <circle cx="40" cy="32" r="4" fill="#000"/>
        <circle cx="41" cy="30" r="1.5" fill="white"/>
        <circle cx="60" cy="32" r="4" fill="#000"/>
        <circle cx="61" cy="30" r="1.5" fill="white"/>
        <path d="M 35 28 Q 37 26 39 28" stroke="#000" stroke-width="1.5" fill="none"/>
        <path d="M 61 28 Q 63 26 65 28" stroke="#000" stroke-width="1.5" fill="none"/>
      </g>
    ''',
        'mouth': '''<path d="M 38 42 Q 45 38 50 42 Q 55 38 62 42" stroke="#000" stroke-width="2" fill="none" stroke-linecap="round"/>'''
    },
    'confused': {
        'eyes': '''
      <g>
        <circle cx="40" cy="32" r="4" fill="#000"/>
        <circle cx="41" cy="30" r="1.5" fill="white"/>
        <circle cx="60" cy="32" r="4" fill="#000"/>
        <circle cx="61" cy="30" r="1.5" fill="white"/>
      </g>
    ''',
        'mouth': '''<path d="M 38 42 Q 45 40 50 42 Q 55 44 62 42" stroke="#000" stroke-width="2" fill="none" stroke-linecap="round"/>'''
    },
    'sleepy_smile': {
        'eyes': '''
      <g>
        <path d="M 35 32 Q 40 29 45 32" stroke="#000" stroke-width="2" fill="none" stroke-linecap="round"/>
        <path d="M 55 32 Q 60 29 65 32" stroke="#000" stroke-width="2" fill="none" stroke-linecap="round"/>
      </g>
    ''',
        'mouth': '''<path d="M 40 42 Q 50 47 60 42" stroke="#000" stroke-width="2" fill="none" stroke-linecap="round"/>'''
    },
    'super_happy': {
        'eyes': '''
      <g>
        <circle cx="40" cy="30" r="6" fill="#000"/>
        <circle cx="60" cy="30" r="6" fill="#000"/>
        <circle cx="41" cy="28" r="2.5" fill="white"/>
        <circle cx="61" cy="28" r="2.5" fill="white"/>
        <circle cx="38" cy="27" r="1" fill="#FFD700"/>
        <circle cx="42" cy="32" r="1" fill="#FFD700"/>
        <circle cx="58" cy="27" r="1" fill="#FFD700"/>
        <circle cx="62" cy="32" r="1" fill="#FFD700"/>
      </g>
    ''',
        'mouth': '''<path d="M 32 38 Q 50 58 68 38" stroke="#000" stroke-width="3" fill="none" stroke-linecap="round"/>'''
    }
}

# Note: For hats and costumes, we'll need to add them here too
# For now, this is a placeholder - you'll need to copy the full SVG strings from the JS files
BOBO_HATS = {
    # TODO: Add all hat SVG data from bobo-hats.js
}

BOBO_COSTUMES = {
    # TODO: Add all costume SVG data from bobo-costumes.js
}


def get_emotion_svg(key: str) -> str:
    """Get emotion SVG data as JSON string with eyes and mouth"""
    emotion = BOBO_EMOTIONS.get(key)
    if not emotion:
        return json.dumps({'key': key, 'type': 'emotion'})  # Fallback
    
    return json.dumps({
        'eyes': emotion['eyes'].strip(),
        'mouth': emotion['mouth'].strip()
    })


def get_hat_svg(key: str) -> str:
    """Get hat SVG data"""
    return BOBO_HATS.get(key, '')


def get_costume_svg(key: str) -> str:
    """Get costume SVG data"""
    return BOBO_COSTUMES.get(key, '')

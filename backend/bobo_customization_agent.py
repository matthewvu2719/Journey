"""
Bobo Customization Agent - Generates SVG items using Groq API
"""
import os
import json
import random
from typing import Dict, Any
from groq import Groq
from dotenv import load_dotenv

load_dotenv()


class BoboCustomizationAgent:
    """Agent that generates creative SVG customizations for Bobo using Groq AI"""
    
    def __init__(self):
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            print("⚠️  Warning: GROQ_API_KEY not found. Using fallback generation.")
            self.client = None
        else:
            self.client = Groq(api_key=api_key)
            print("✓ Groq API initialized for Bobo customization")
    
    def generate_hat(self) -> Dict[str, Any]:
        """Generate a unique hat design using AI"""
        
        hat_themes = [
            "wizard", "pirate", "chef", "astronaut", "detective",
            "cowboy", "viking", "samurai", "pharaoh", "jester",
            "knight", "ninja", "pilot", "sailor", "explorer"
        ]
        
        theme = random.choice(hat_themes)
        
        prompt = f"""Generate a creative SVG code for a {theme}-themed hat for a cute robot mascot. The hat needs to be cute.

Requirements:
- The hat will be positioned at translate(50, 10) - this is already handled, so use coordinates relative to (0, 0)
- Center the hat horizontally around x=0 (it will be translated to x=50)
- Position the hat above y=0 (negative y values) so it sits on top of the head
- Use simple, clean shapes (paths, circles, rectangles, polygons)
- Use vibrant, appealing colors with hex codes
- Keep it small and proportional (width: -20 to 20, height: -15 to 5)
- Make it whimsical and fun
- Include 2-3 decorative elements

Return ONLY the SVG elements (paths, circles, etc.) WITHOUT any <g> wrapper tags.
Example format:
<path d="M -10 0 L 0 -15 L 10 0 Z" fill="#FF6B9D"/>
<circle cx="0" cy="-17" r="3" fill="#FFD700"/>

Do not include any explanations, markdown, or wrapper tags - just the raw SVG elements."""

        if self.client:
            try:
                response = self.client.chat.completions.create(
                    model="llama-3.3-70b-versatile",
                    messages=[{"role": "user", "content": prompt}],
                    temperature=1.2,
                    max_tokens=500
                )
                
                svg_code = response.choices[0].message.content.strip()
                # Clean up the response
                svg_code = svg_code.replace('```svg', '').replace('```', '').strip()
                
                return {
                    'id': f'{theme}_hat_{random.randint(1000, 9999)}',
                    'name': f'{theme.title()} Hat',
                    'description': f'A stylish {theme} hat',
                    'svg': f'<g transform="translate(50, 10)">{svg_code}</g>'
                }
            except Exception as e:
                print(f"Error generating hat with Groq: {e}")
                return self._fallback_hat(theme)
        else:
            return self._fallback_hat(theme)
    
    def generate_costume(self) -> Dict[str, Any]:
        """Generate a unique costume design using AI"""
        
        costume_themes = [
            "superhero", "wizard", "knight", "ninja", "pirate",
            "astronaut", "doctor", "scientist", "artist", "musician",
            "chef", "detective", "explorer", "athlete", "royal"
        ]
        
        theme = random.choice(costume_themes)
        
        prompt = f"""Generate creative SVG code for a {theme}-themed costume accessory for a cute robot mascot. costume must be cute.

Requirements:
- The costume will be positioned at translate(50, 55) - this is already handled, so use coordinates relative to (0, 0)
- Center the costume horizontally around x=0 (it will be translated to x=50)
- Position elements starting from y=0 and going downward (positive y)
- Can be a cape, badge, emblem, scarf, wings, or accessory
- Use simple, clean shapes
- Use vibrant colors with hex codes
- Keep it proportional (width: -25 to 25, height: 0 to 40)
- Make it recognizable and fun

Return ONLY the SVG elements (paths, rects, etc.) WITHOUT any <g> wrapper tags.
Example format:
<path d="M -8 0 Q -15 20 -12 40 L -8 40 Z" fill="#F44336"/>
<rect x="-3" y="-2" width="6" height="4" fill="#1976D2" rx="1"/>

Do not include any explanations, markdown, or wrapper tags - just the raw SVG elements."""

        if self.client:
            try:
                response = self.client.chat.completions.create(
                    model="llama-3.3-70b-versatile",
                    messages=[{"role": "user", "content": prompt}],
                    temperature=1.2,
                    max_tokens=500
                )
                
                svg_code = response.choices[0].message.content.strip()
                svg_code = svg_code.replace('```svg', '').replace('```', '').strip()
                
                return {
                    'id': f'{theme}_costume_{random.randint(1000, 9999)}',
                    'name': f'{theme.title()} Outfit',
                    'description': f'A cool {theme} costume',
                    'svg': f'<g transform="translate(50, 55)">{svg_code}</g>'
                }
            except Exception as e:
                print(f"Error generating costume with Groq: {e}")
                return self._fallback_costume(theme)
        else:
            return self._fallback_costume(theme)
    
    def generate_dance(self) -> Dict[str, Any]:
        """Generate a unique dance animation using AI"""
        
        dance_styles = [
            "energetic bounce", "smooth wave", "spinning twirl", "happy wiggle",
            "robot shuffle", "victory pump", "groovy sway", "excited jump",
            "cool slide", "funky shake", "rhythmic bob", "playful hop"
        ]
        
        style = random.choice(dance_styles)
        
        prompt = f"""Create a fun dance animation for a robot mascot with a {style} style.

Generate JSON with these exact fields:
{{
  "id": "unique_dance_id",
  "name": "Dance Name",
  "description": "Brief description",
  "keyframes": {{
    "0%": "transform: rotate(0deg) translateY(0px);",
    "25%": "transform: rotate(-5deg) translateY(-5px);",
    "50%": "transform: rotate(0deg) translateY(-10px);",
    "75%": "transform: rotate(5deg) translateY(-5px);",
    "100%": "transform: rotate(0deg) translateY(0px);"
  }},
  "duration": 800,
  "timing": "ease-in-out",
  "movements": {{
    "arms": {{"speed": 50, "amplitude": 20, "pattern": "wave"}},
    "head": {{"speed": 100, "amplitude": 5, "pattern": "nod"}},
    "hands": {{"speed": 80, "amplitude": 15, "pattern": "wiggle"}}
  }}
}}

Pattern options: wave, pump, swing, still, nod, shake, tilt, bob, wiggle, clap, point
Make it creative and fun! Return ONLY valid JSON."""

        if self.client:
            try:
                response = self.client.chat.completions.create(
                    model="llama-3.3-70b-versatile",
                    messages=[{"role": "user", "content": prompt}],
                    temperature=1.1,
                    max_tokens=600
                )
                
                json_str = response.choices[0].message.content.strip()
                # Clean up markdown code blocks
                json_str = json_str.replace('```json', '').replace('```', '').strip()
                
                dance_data = json.loads(json_str)
                return dance_data
            except Exception as e:
                print(f"Error generating dance with Groq: {e}")
                return self._fallback_dance(style)
        else:
            return self._fallback_dance(style)
    
    # Fallback methods for when API is unavailable
    def _fallback_hat(self, theme: str) -> Dict[str, Any]:
        """Fallback hat generation"""
        colors = ['#FF6B9D', '#FFD700', '#2196F3', '#9C27B0', '#FF5722']
        color = random.choice(colors)
        
        return {
            'id': f'{theme}_hat_{random.randint(1000, 9999)}',
            'name': f'{theme.title()} Hat',
            'description': f'A stylish {theme} hat',
            'svg': f'''<g transform="translate(50, 10)">
                <path d="M -15 0 L 0 -15 L 15 0 Z" fill="{color}" stroke="#000" stroke-width="1"/>
                <circle cx="0" cy="-17" r="3" fill="#FFD700"/>
            </g>'''
        }
    
    def _fallback_costume(self, theme: str) -> Dict[str, Any]:
        """Fallback costume generation"""
        colors = ['#F44336', '#2196F3', '#4CAF50', '#FF9800', '#9C27B0']
        color = random.choice(colors)
        
        return {
            'id': f'{theme}_costume_{random.randint(1000, 9999)}',
            'name': f'{theme.title()} Outfit',
            'description': f'A cool {theme} costume',
            'svg': f'''<g transform="translate(50, 55)">
                <rect x="-8" y="0" width="16" height="4" fill="{color}" rx="2"/>
                <path d="M -6 4 L -10 20 L -6 20 Z" fill="{color}" opacity="0.8"/>
                <path d="M 6 4 L 10 20 L 6 20 Z" fill="{color}" opacity="0.8"/>
            </g>'''
        }
    
    def _fallback_dance(self, style: str) -> Dict[str, Any]:
        """Fallback dance generation"""
        patterns = ['wave', 'pump', 'swing', 'wiggle', 'nod', 'shake']
        
        return {
            'id': f'{style.replace(" ", "_")}_dance_{random.randint(1000, 9999)}',
            'name': f'{style.title()} Dance',
            'description': f'A fun {style} dance move',
            'keyframes': {
                '0%': 'transform: rotate(0deg) translateY(0px);',
                '25%': 'transform: rotate(-8deg) translateY(-8px);',
                '50%': 'transform: rotate(0deg) translateY(-12px);',
                '75%': 'transform: rotate(8deg) translateY(-8px);',
                '100%': 'transform: rotate(0deg) translateY(0px);'
            },
            'duration': random.randint(600, 1000),
            'timing': random.choice(['ease-in-out', 'ease-out', 'linear']),
            'movements': {
                'arms': {
                    'speed': random.randint(40, 80),
                    'amplitude': random.randint(15, 30),
                    'pattern': random.choice(patterns)
                },
                'head': {
                    'speed': random.randint(80, 120),
                    'amplitude': random.randint(3, 8),
                    'pattern': random.choice(['nod', 'shake', 'tilt', 'bob'])
                },
                'hands': {
                    'speed': random.randint(60, 100),
                    'amplitude': random.randint(10, 20),
                    'pattern': random.choice(patterns)
                }
            }
        }


# Global instance
customization_agent = BoboCustomizationAgent()

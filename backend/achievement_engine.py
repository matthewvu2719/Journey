"""
Achievement Engine - Tracks user achievements and unlocks rewards
"""
from datetime import datetime, timedelta
from typing import List, Dict, Optional
import random

class AchievementEngine:
    """Manages achievement tracking and reward unlocking"""
    
    # Achievement Types
    ACHIEVEMENT_TYPES = {
        'any_completion': {
            'name': 'Habit Completed',
            'description': 'Complete any habit',
            'reward_type': 'motivational_sentence',
            'check_frequency': 'immediate'
        },
        'daily_perfect': {
            'name': 'Perfect Day',
            'description': 'Complete 100% of today\'s habits',
            'reward_type': 'dance',
            'check_frequency': 'daily'
        },
        'weekly_perfect': {
            'name': 'Perfect Week',
            'description': 'Complete 100% of this week\'s habits',
            'reward_type': 'hat_costume_color',
            'check_frequency': 'weekly'
        },
        'monthly_perfect': {
            'name': 'Perfect Month',
            'description': 'Complete 100% of this month\'s habits',
            'reward_type': 'theme',
            'check_frequency': 'monthly'
        }
    }
    
    # Reward Libraries
    MOTIVATIONAL_SENTENCES = [
        "You're crushing it! Keep going! 💪",
        "One step closer to your goals! 🎯",
        "Consistency is your superpower! ⚡",
        "You're building something amazing! 🌟",
        "Small wins lead to big victories! 🏆",
        "You showed up today - that's what matters! 👏",
        "Progress over perfection! 📈",
        "You're stronger than you think! 💎",
        "Every habit completed is a win! 🎉",
        "You're making it happen! 🚀",
        "Believe in the process! 🌱",
        "You're unstoppable! 🔥",
        "Keep that momentum going! 🌊",
        "You're writing your success story! 📖",
        "Excellence is a habit, and you're building it! ✨"
    ]
    
    DANCES = [
        {'id': 'wiggle', 'name': 'Wiggle Dance', 'description': 'Side to side wiggle'},
        {'id': 'spin', 'name': 'Spin Move', 'description': 'Full body rotation'},
        {'id': 'wave', 'name': 'Wave Arms', 'description': 'Enthusiastic arm waving'},
        {'id': 'bounce', 'name': 'Happy Bounce', 'description': 'Bouncy celebration'},
        {'id': 'shimmy', 'name': 'Shimmy Shake', 'description': 'Quick shimmy motion'},
        {'id': 'victory', 'name': 'Victory Pose', 'description': 'Arms raised in triumph'},
        {'id': 'moonwalk', 'name': 'Moonwalk', 'description': 'Smooth backward slide'},
        {'id': 'robot', 'name': 'Robot Dance', 'description': 'Classic robot moves'}
    ]
    

    
    HATS = [
        {'id': 'party_hat', 'name': 'Party Hat', 'description': 'Colorful party cone'},
        {'id': 'crown', 'name': 'Crown', 'description': 'Royal golden crown'},
        {'id': 'cap', 'name': 'Baseball Cap', 'description': 'Sporty cap'},
        {'id': 'wizard_hat', 'name': 'Wizard Hat', 'description': 'Magical pointy hat'},
        {'id': 'top_hat', 'name': 'Top Hat', 'description': 'Classy top hat'},
        {'id': 'halo', 'name': 'Halo', 'description': 'Angelic halo'}
    ]
    
    COSTUMES = [
        {'id': 'cape', 'name': 'Superhero Cape', 'description': 'Red flowing cape'},
        {'id': 'bow_tie', 'name': 'Bow Tie', 'description': 'Fancy bow tie'},
        {'id': 'scarf', 'name': 'Scarf', 'description': 'Cozy winter scarf'},
        {'id': 'wings', 'name': 'Wings', 'description': 'Angel or fairy wings'}
    ]
    
    # 200 Colors for rewards
    COLORS = [
        # Reds
        {'id': 'crimson', 'name': 'Crimson', 'description': 'Deep red', 'hex': '#DC143C'},
        {'id': 'scarlet', 'name': 'Scarlet', 'description': 'Bright red', 'hex': '#FF2400'},
        {'id': 'ruby', 'name': 'Ruby', 'description': 'Precious red', 'hex': '#E0115F'},
        {'id': 'cherry', 'name': 'Cherry', 'description': 'Sweet red', 'hex': '#DE3163'},
        {'id': 'rose', 'name': 'Rose', 'description': 'Romantic red', 'hex': '#FF007F'},
        {'id': 'burgundy', 'name': 'Burgundy', 'description': 'Wine red', 'hex': '#800020'},
        {'id': 'maroon', 'name': 'Maroon', 'description': 'Dark red', 'hex': '#800000'},
        {'id': 'coral', 'name': 'Coral', 'description': 'Orange red', 'hex': '#FF7F50'},
        {'id': 'salmon', 'name': 'Salmon', 'description': 'Pink red', 'hex': '#FA8072'},
        {'id': 'brick', 'name': 'Brick Red', 'description': 'Earthy red', 'hex': '#CB4154'},
        
        # Oranges
        {'id': 'tangerine', 'name': 'Tangerine', 'description': 'Citrus orange', 'hex': '#FF8C00'},
        {'id': 'peach', 'name': 'Peach', 'description': 'Soft orange', 'hex': '#FFCBA4'},
        {'id': 'apricot', 'name': 'Apricot', 'description': 'Warm orange', 'hex': '#FBCEB1'},
        {'id': 'amber', 'name': 'Amber', 'description': 'Golden orange', 'hex': '#FFBF00'},
        {'id': 'pumpkin', 'name': 'Pumpkin', 'description': 'Autumn orange', 'hex': '#FF7518'},
        {'id': 'rust', 'name': 'Rust', 'description': 'Earthy orange', 'hex': '#B7410E'},
        {'id': 'copper', 'name': 'Copper', 'description': 'Metallic orange', 'hex': '#B87333'},
        {'id': 'bronze', 'name': 'Bronze', 'description': 'Dark orange', 'hex': '#CD7F32'},
        {'id': 'papaya', 'name': 'Papaya', 'description': 'Tropical orange', 'hex': '#FFEFD5'},
        {'id': 'cantaloupe', 'name': 'Cantaloupe', 'description': 'Melon orange', 'hex': '#FFA366'},
        
        # Yellows
        {'id': 'sunshine', 'name': 'Sunshine', 'description': 'Bright yellow', 'hex': '#FFD700'},
        {'id': 'lemon', 'name': 'Lemon', 'description': 'Citrus yellow', 'hex': '#FFF700'},
        {'id': 'banana', 'name': 'Banana', 'description': 'Fruit yellow', 'hex': '#FFE135'},
        {'id': 'canary', 'name': 'Canary', 'description': 'Bird yellow', 'hex': '#FFFF99'},
        {'id': 'butter', 'name': 'Butter', 'description': 'Creamy yellow', 'hex': '#FFDB58'},
        {'id': 'cream', 'name': 'Cream', 'description': 'Pale yellow', 'hex': '#FFFDD0'},
        {'id': 'vanilla', 'name': 'Vanilla', 'description': 'Sweet yellow', 'hex': '#F3E5AB'},
        {'id': 'honey', 'name': 'Honey', 'description': 'Golden yellow', 'hex': '#FFC30B'},
        {'id': 'mustard', 'name': 'Mustard', 'description': 'Spicy yellow', 'hex': '#FFDB58'},
        {'id': 'saffron', 'name': 'Saffron', 'description': 'Exotic yellow', 'hex': '#F4C430'},
        
        # Greens
        {'id': 'emerald', 'name': 'Emerald', 'description': 'Precious green', 'hex': '#50C878'},
        {'id': 'jade', 'name': 'Jade', 'description': 'Stone green', 'hex': '#00A86B'},
        {'id': 'mint', 'name': 'Mint', 'description': 'Fresh green', 'hex': '#98FB98'},
        {'id': 'lime', 'name': 'Lime', 'description': 'Citrus green', 'hex': '#32CD32'},
        {'id': 'forest', 'name': 'Forest', 'description': 'Deep green', 'hex': '#228B22'},
        {'id': 'olive', 'name': 'Olive', 'description': 'Earthy green', 'hex': '#808000'},
        {'id': 'sage', 'name': 'Sage', 'description': 'Herb green', 'hex': '#9CAF88'},
        {'id': 'seafoam', 'name': 'Seafoam', 'description': 'Ocean green', 'hex': '#93E9BE'},
        {'id': 'pine', 'name': 'Pine', 'description': 'Tree green', 'hex': '#01796F'},
        {'id': 'moss', 'name': 'Moss', 'description': 'Nature green', 'hex': '#ADDFAD'},
        
        # Blues
        {'id': 'azure', 'name': 'Azure', 'description': 'Sky blue', 'hex': '#007FFF'},
        {'id': 'cerulean', 'name': 'Cerulean', 'description': 'Deep blue', 'hex': '#007BA7'},
        {'id': 'cobalt', 'name': 'Cobalt', 'description': 'Metallic blue', 'hex': '#0047AB'},
        {'id': 'navy', 'name': 'Navy', 'description': 'Dark blue', 'hex': '#000080'},
        {'id': 'royal', 'name': 'Royal Blue', 'description': 'Regal blue', 'hex': '#4169E1'},
        {'id': 'sapphire', 'name': 'Sapphire', 'description': 'Gem blue', 'hex': '#0F52BA'},
        {'id': 'turquoise', 'name': 'Turquoise', 'description': 'Tropical blue', 'hex': '#40E0D0'},
        {'id': 'teal', 'name': 'Teal', 'description': 'Blue green', 'hex': '#008080'},
        {'id': 'aqua', 'name': 'Aqua', 'description': 'Water blue', 'hex': '#00FFFF'},
        {'id': 'powder', 'name': 'Powder Blue', 'description': 'Soft blue', 'hex': '#B0E0E6'},
        
        # Purples
        {'id': 'amethyst', 'name': 'Amethyst', 'description': 'Crystal purple', 'hex': '#9966CC'},
        {'id': 'lavender', 'name': 'Lavender', 'description': 'Floral purple', 'hex': '#E6E6FA'},
        {'id': 'violet', 'name': 'Violet', 'description': 'Flower purple', 'hex': '#8A2BE2'},
        {'id': 'plum', 'name': 'Plum', 'description': 'Fruit purple', 'hex': '#DDA0DD'},
        {'id': 'orchid', 'name': 'Orchid', 'description': 'Exotic purple', 'hex': '#DA70D6'},
        {'id': 'magenta', 'name': 'Magenta', 'description': 'Bright purple', 'hex': '#FF00FF'},
        {'id': 'indigo', 'name': 'Indigo', 'description': 'Deep purple', 'hex': '#4B0082'},
        {'id': 'grape', 'name': 'Grape', 'description': 'Wine purple', 'hex': '#6F2DA8'},
        {'id': 'lilac', 'name': 'Lilac', 'description': 'Light purple', 'hex': '#C8A2C8'},
        {'id': 'mauve', 'name': 'Mauve', 'description': 'Dusty purple', 'hex': '#E0B0FF'},
        
        # Pinks
        {'id': 'rose_pink', 'name': 'Rose Pink', 'description': 'Romantic pink', 'hex': '#FF66CC'},
        {'id': 'blush', 'name': 'Blush', 'description': 'Soft pink', 'hex': '#DE5D83'},
        {'id': 'fuchsia', 'name': 'Fuchsia', 'description': 'Bright pink', 'hex': '#FF1493'},
        {'id': 'bubblegum', 'name': 'Bubblegum', 'description': 'Sweet pink', 'hex': '#FFC1CC'},
        {'id': 'cotton_candy', 'name': 'Cotton Candy', 'description': 'Fluffy pink', 'hex': '#FFBCD9'},
        {'id': 'flamingo', 'name': 'Flamingo', 'description': 'Bird pink', 'hex': '#FC8EAC'},
        {'id': 'carnation', 'name': 'Carnation', 'description': 'Flower pink', 'hex': '#FFA6C9'},
        {'id': 'cherry_blossom', 'name': 'Cherry Blossom', 'description': 'Spring pink', 'hex': '#FFB7C5'},
        {'id': 'watermelon', 'name': 'Watermelon', 'description': 'Fruit pink', 'hex': '#FF91A4'},
        {'id': 'strawberry', 'name': 'Strawberry', 'description': 'Berry pink', 'hex': '#FC5A8D'},
        
        # Browns
        {'id': 'chocolate', 'name': 'Chocolate', 'description': 'Sweet brown', 'hex': '#7B3F00'},
        {'id': 'coffee', 'name': 'Coffee', 'description': 'Rich brown', 'hex': '#6F4E37'},
        {'id': 'caramel', 'name': 'Caramel', 'description': 'Golden brown', 'hex': '#AF6E4D'},
        {'id': 'cinnamon', 'name': 'Cinnamon', 'description': 'Spice brown', 'hex': '#D2691E'},
        {'id': 'mahogany', 'name': 'Mahogany', 'description': 'Wood brown', 'hex': '#C04000'},
        {'id': 'chestnut', 'name': 'Chestnut', 'description': 'Nut brown', 'hex': '#954535'},
        {'id': 'walnut', 'name': 'Walnut', 'description': 'Dark brown', 'hex': '#773F1A'},
        {'id': 'cocoa', 'name': 'Cocoa', 'description': 'Warm brown', 'hex': '#875F42'},
        {'id': 'espresso', 'name': 'Espresso', 'description': 'Deep brown', 'hex': '#362D1D'},
        {'id': 'mocha', 'name': 'Mocha', 'description': 'Coffee brown', 'hex': '#967117'},
        
        # Grays
        {'id': 'silver', 'name': 'Silver', 'description': 'Metallic gray', 'hex': '#C0C0C0'},
        {'id': 'platinum', 'name': 'Platinum', 'description': 'Precious gray', 'hex': '#E5E4E2'},
        {'id': 'charcoal', 'name': 'Charcoal', 'description': 'Dark gray', 'hex': '#36454F'},
        {'id': 'slate', 'name': 'Slate', 'description': 'Stone gray', 'hex': '#708090'},
        {'id': 'ash', 'name': 'Ash', 'description': 'Light gray', 'hex': '#B2BEB5'},
        {'id': 'pearl', 'name': 'Pearl', 'description': 'Lustrous gray', 'hex': '#EAE0C8'},
        {'id': 'smoke', 'name': 'Smoke', 'description': 'Misty gray', 'hex': '#738276'},
        {'id': 'steel', 'name': 'Steel', 'description': 'Metal gray', 'hex': '#71797E'},
        {'id': 'graphite', 'name': 'Graphite', 'description': 'Pencil gray', 'hex': '#41424C'},
        {'id': 'pewter', 'name': 'Pewter', 'description': 'Antique gray', 'hex': '#96A8A1'},
        
        # Pastels
        {'id': 'baby_blue', 'name': 'Baby Blue', 'description': 'Soft blue', 'hex': '#89CFF0'},
        {'id': 'baby_pink', 'name': 'Baby Pink', 'description': 'Gentle pink', 'hex': '#F4C2C2'},
        {'id': 'mint_cream', 'name': 'Mint Cream', 'description': 'Pale green', 'hex': '#F5FFFA'},
        {'id': 'lemon_chiffon', 'name': 'Lemon Chiffon', 'description': 'Light yellow', 'hex': '#FFFACD'},
        {'id': 'peach_puff', 'name': 'Peach Puff', 'description': 'Soft orange', 'hex': '#FFDAB9'},
        {'id': 'misty_rose', 'name': 'Misty Rose', 'description': 'Pale pink', 'hex': '#FFE4E1'},
        {'id': 'alice_blue', 'name': 'Alice Blue', 'description': 'Fairy blue', 'hex': '#F0F8FF'},
        {'id': 'honeydew', 'name': 'Honeydew', 'description': 'Melon green', 'hex': '#F0FFF0'},
        {'id': 'seashell', 'name': 'Seashell', 'description': 'Beach pink', 'hex': '#FFF5EE'},
        {'id': 'ivory', 'name': 'Ivory', 'description': 'Elegant white', 'hex': '#FFFFF0'},
        
        # Neons
        {'id': 'neon_green', 'name': 'Neon Green', 'description': 'Electric green', 'hex': '#39FF14'},
        {'id': 'neon_pink', 'name': 'Neon Pink', 'description': 'Electric pink', 'hex': '#FF10F0'},
        {'id': 'neon_blue', 'name': 'Neon Blue', 'description': 'Electric blue', 'hex': '#1B03A3'},
        {'id': 'neon_yellow', 'name': 'Neon Yellow', 'description': 'Electric yellow', 'hex': '#FFFF00'},
        {'id': 'neon_orange', 'name': 'Neon Orange', 'description': 'Electric orange', 'hex': '#FF6600'},
        {'id': 'neon_purple', 'name': 'Neon Purple', 'description': 'Electric purple', 'hex': '#BC13FE'},
        {'id': 'electric_lime', 'name': 'Electric Lime', 'description': 'Bright lime', 'hex': '#CCFF00'},
        {'id': 'hot_pink', 'name': 'Hot Pink', 'description': 'Vibrant pink', 'hex': '#FF69B4'},
        {'id': 'cyber_yellow', 'name': 'Cyber Yellow', 'description': 'Digital yellow', 'hex': '#FFD300'},
        {'id': 'laser_lemon', 'name': 'Laser Lemon', 'description': 'Intense yellow', 'hex': '#FEFE22'},
        
        # Metallics
        {'id': 'gold', 'name': 'Gold', 'description': 'Precious gold', 'hex': '#FFD700'},
        {'id': 'rose_gold', 'name': 'Rose Gold', 'description': 'Pink gold', 'hex': '#E8B4B8'},
        {'id': 'white_gold', 'name': 'White Gold', 'description': 'Pale gold', 'hex': '#F4F4DC'},
        {'id': 'titanium', 'name': 'Titanium', 'description': 'Strong metal', 'hex': '#878681'},
        {'id': 'chrome', 'name': 'Chrome', 'description': 'Shiny metal', 'hex': '#C0C0C0'},
        {'id': 'brass', 'name': 'Brass', 'description': 'Yellow metal', 'hex': '#B5A642'},
        {'id': 'iron', 'name': 'Iron', 'description': 'Dark metal', 'hex': '#A19D94'},
        {'id': 'nickel', 'name': 'Nickel', 'description': 'Silver metal', 'hex': '#727472'},
        {'id': 'aluminum', 'name': 'Aluminum', 'description': 'Light metal', 'hex': '#A8A8A8'},
        {'id': 'zinc', 'name': 'Zinc', 'description': 'Blue metal', 'hex': '#7A7A7A'},
        
        # Jewel Tones
        {'id': 'ruby_red', 'name': 'Ruby Red', 'description': 'Deep gem red', 'hex': '#9B111E'},
        {'id': 'emerald_green', 'name': 'Emerald Green', 'description': 'Rich gem green', 'hex': '#046307'},
        {'id': 'sapphire_blue', 'name': 'Sapphire Blue', 'description': 'Royal gem blue', 'hex': '#082567'},
        {'id': 'topaz_yellow', 'name': 'Topaz Yellow', 'description': 'Golden gem', 'hex': '#FFC87C'},
        {'id': 'garnet_red', 'name': 'Garnet Red', 'description': 'Dark gem red', 'hex': '#733635'},
        {'id': 'opal_white', 'name': 'Opal White', 'description': 'Iridescent white', 'hex': '#A8C3BC'},
        {'id': 'onyx_black', 'name': 'Onyx Black', 'description': 'Deep gem black', 'hex': '#353839'},
        {'id': 'citrine_yellow', 'name': 'Citrine Yellow', 'description': 'Bright gem yellow', 'hex': '#E4D00A'},
        {'id': 'peridot_green', 'name': 'Peridot Green', 'description': 'Lime gem green', 'hex': '#E6E200'},
        {'id': 'aquamarine_blue', 'name': 'Aquamarine Blue', 'description': 'Sea gem blue', 'hex': '#7FFFD4'},
        
        # Earth Tones
        {'id': 'terracotta', 'name': 'Terracotta', 'description': 'Clay orange', 'hex': '#E2725B'},
        {'id': 'sienna', 'name': 'Sienna', 'description': 'Earth brown', 'hex': '#A0522D'},
        {'id': 'umber', 'name': 'Umber', 'description': 'Dark earth', 'hex': '#635147'},
        {'id': 'ochre', 'name': 'Ochre', 'description': 'Yellow earth', 'hex': '#CC7722'},
        {'id': 'sand', 'name': 'Sand', 'description': 'Beach beige', 'hex': '#C2B280'},
        {'id': 'clay', 'name': 'Clay', 'description': 'Pottery brown', 'hex': '#8B4513'},
        {'id': 'mud', 'name': 'Mud', 'description': 'Rich brown', 'hex': '#70543E'},
        {'id': 'stone', 'name': 'Stone', 'description': 'Rock gray', 'hex': '#928E85'},
        {'id': 'pebble', 'name': 'Pebble', 'description': 'Smooth gray', 'hex': '#C8C8C8'},
        {'id': 'driftwood', 'name': 'Driftwood', 'description': 'Weathered brown', 'hex': '#AF8751'},
        
        # Sunset Colors
        {'id': 'sunset_orange', 'name': 'Sunset Orange', 'description': 'Evening orange', 'hex': '#FF8C69'},
        {'id': 'sunset_pink', 'name': 'Sunset Pink', 'description': 'Twilight pink', 'hex': '#FF91A4'},
        {'id': 'sunset_purple', 'name': 'Sunset Purple', 'description': 'Dusk purple', 'hex': '#CC8899'},
        {'id': 'sunset_gold', 'name': 'Sunset Gold', 'description': 'Golden hour', 'hex': '#FFCC5C'},
        {'id': 'dawn_blue', 'name': 'Dawn Blue', 'description': 'Morning blue', 'hex': '#87CEEB'},
        {'id': 'twilight_indigo', 'name': 'Twilight Indigo', 'description': 'Evening indigo', 'hex': '#4B0082'},
        {'id': 'aurora_green', 'name': 'Aurora Green', 'description': 'Northern lights', 'hex': '#00FF7F'},
        {'id': 'moonbeam_silver', 'name': 'Moonbeam Silver', 'description': 'Night silver', 'hex': '#E6E8FA'},
        {'id': 'starlight_white', 'name': 'Starlight White', 'description': 'Cosmic white', 'hex': '#F8F8FF'},
        {'id': 'midnight_blue', 'name': 'Midnight Blue', 'description': 'Deep night', 'hex': '#191970'}
    ]
    
    # Theme reward list based on themes.js
    THEME_REWARDS = [
        {'id': 'dark', 'name': 'Dark', 'description': 'Classic dark mode'},
        {'id': 'light', 'name': 'Light', 'description': 'Clean and bright'},
        {'id': 'blue', 'name': 'Ocean Blue', 'description': 'Cool ocean vibes'},
        {'id': 'purple', 'name': 'Purple Haze', 'description': 'Mystical purple'},
        {'id': 'green', 'name': 'Forest Green', 'description': 'Natural forest'},
        {'id': 'warm', 'name': 'Warm Sunset', 'description': 'Cozy sunset tones'},
        {'id': 'pink', 'name': 'Cute Pink', 'description': 'Sweet pink theme'},
        {'id': 'light2', 'name': 'Light 2', 'description': 'Vibrant pastels'},
        {'id': 'dark2', 'name': 'Dark 2', 'description': 'Dark with neon'},
        {'id': 'amethyst', 'name': 'Amethyst Haze', 'description': 'Soft purple & pink'},
        {'id': 'amethystDark', 'name': 'Amethyst Haze Dark', 'description': 'Dark purple & pink'},
        {'id': 'candyland', 'name': 'CandyLand', 'description': 'Sweet & playful'},
        {'id': 'candylandDark', 'name': 'CandyLand Dark', 'description': 'Dark candy colors'},
        {'id': 'kodama', 'name': 'Kodama Grove', 'description': 'Earthy forest tones'},
        {'id': 'kodamaDark', 'name': 'Kodama Grove Dark', 'description': 'Dark forest spirits'},
        {'id': 'notebook', 'name': 'Notebook', 'description': 'Clean grayscale'},
        {'id': 'notebookDark', 'name': 'Notebook Dark', 'description': 'Dark grayscale'},
        {'id': 'mocha', 'name': 'Mocha Mouse', 'description': 'Warm coffee tones'},
        {'id': 'mochaDark', 'name': 'Mocha Mouse Dark', 'description': 'Dark coffee & cream'},
        {'id': 'vintage', 'name': 'Vintage Paper', 'description': 'Aged paper & sepia'},
        {'id': 'vintageDark', 'name': 'Vintage Paper Dark', 'description': 'Dark vintage tones'},
        {'id': 'haven', 'name': 'Haven', 'description': 'Calm & sophisticated'},
        {'id': 'havenDark', 'name': 'Haven Dark', 'description': 'Dark haven'},
        {'id': 'bubblegum', 'name': 'Bubblegum', 'description': 'Sweet pink & blue'},
        {'id': 'bubblegumDark', 'name': 'Bubblegum Dark', 'description': 'Dark bubblegum'},
        {'id': 'retroArcade', 'name': 'Retro Arcade', 'description': 'Vibrant retro colors'},
        {'id': 'retroArcadeDark', 'name': 'Retro Arcade Dark', 'description': 'Dark arcade vibes'}
    ]
    
    def __init__(self, db):
        self.db = db  # SupabaseClient instance
        
    def _get_available_colors(self, user_id: str) -> List[Dict]:
        """Get list of colors not yet unlocked by user"""
        try:
            # Get already unlocked colors for this user
            unlocked_colors = self.db.get_unlocked_bobo_items(user_id, 'color')
            unlocked_color_ids = {item.get('item_id') for item in unlocked_colors}
            
            # Return colors not yet unlocked
            available = [color for color in self.COLORS if color['id'] not in unlocked_color_ids]
            return available
        except Exception as e:
            print(f"Error getting available colors: {e}")
            return self.COLORS  # Fallback to all colors
    
    def _get_available_themes(self, user_id: str) -> List[Dict]:
        """Get list of themes not yet unlocked by user"""
        try:
            # Get already unlocked themes for this user
            unlocked_themes = self.db.get_unlocked_bobo_items(user_id, 'theme')
            unlocked_theme_ids = {item.get('item_id') for item in unlocked_themes}
            
            # Return themes not yet unlocked
            available = [theme for theme in self.THEME_REWARDS if theme['id'] not in unlocked_theme_ids]
            return available
        except Exception as e:
            print(f"Error getting available themes: {e}")
            return self.THEME_REWARDS  # Fallback to all themes
    
    def check_achievements(self, user_id: str, completion_date: str = None) -> List[Dict]:
        """
        Check all achievements for a user and return newly unlocked rewards
        
        Args:
            user_id: User ID
            completion_date: Date to check (defaults to today)
        
        Returns:
            List of unlocked achievements with rewards
        """
        if not completion_date:
            completion_date = datetime.now().date().isoformat()
        
        unlocked = []
        
        # Check each achievement type
        if self._check_any_completion(user_id, completion_date):
            unlocked.append(self._unlock_motivational_sentence(user_id))
        
        if self._check_daily_perfect(user_id, completion_date):
            unlocked.append(self._unlock_dance(user_id))
        
        if self._check_weekly_perfect(user_id, completion_date):
            unlocked.append(self._unlock_hat_costume(user_id))
        
        if self._check_monthly_perfect(user_id, completion_date):
            unlocked.append(self._unlock_theme(user_id))
        
        return [u for u in unlocked if u]  # Filter out None values
    
    def _check_any_completion(self, user_id: str, date: str) -> bool:
        """Check if user completed any habit today"""
        try:
            completions = self.db.get_completions(user_id, start_date=date, end_date=date)
            return len(completions) > 0
        except:
            return False
    
    def _check_daily_perfect(self, user_id: str, date: str) -> bool:
        """Check if user completed 100% of today's habits using daily_success_rates"""
        try:
            # Convert string date to date object
            date_obj = datetime.fromisoformat(date).date()
            success_rate_data = self.db.get_daily_success_rate(user_id, date_obj)
            return success_rate_data is not None and success_rate_data.get('success_rate', 0) == 100.0
        except:
            return False
    
    def _check_weekly_perfect(self, user_id: str, date: str) -> bool:
        """Check if user completed 100% of this week's habits using daily_success_rates"""
        try:
            date_obj = datetime.fromisoformat(date)
            # Get Monday of current week
            monday = date_obj - timedelta(days=date_obj.weekday())
            sunday = monday + timedelta(days=6)
            
            # Get daily success rates for the entire week
            current_day = monday
            while current_day <= sunday:
                success_rate_data = self.db.get_daily_success_rate(user_id, current_day.date())
                
                # If any day is missing or not 100%, week is not perfect
                if success_rate_data is None or success_rate_data.get('success_rate', 0) != 100.0:
                    return False
                    
                current_day += timedelta(days=1)
            
            return True
        except:
            return False
    
    def _check_monthly_perfect(self, user_id: str, date: str) -> bool:
        """Check if user completed 100% of this month's habits using daily_success_rates"""
        try:
            date_obj = datetime.fromisoformat(date)
            # Get first and last day of month
            first_day = date_obj.replace(day=1)
            if date_obj.month == 12:
                last_day = date_obj.replace(year=date_obj.year + 1, month=1, day=1) - timedelta(days=1)
            else:
                last_day = date_obj.replace(month=date_obj.month + 1, day=1) - timedelta(days=1)
            
            # Get daily success rates for the entire month
            current_day = first_day
            while current_day <= last_day:
                success_rate_data = self.db.get_daily_success_rate(user_id, current_day.date())
                
                # If any day is missing or not 100%, month is not perfect
                if success_rate_data is None or success_rate_data.get('success_rate', 0) != 100.0:
                    return False
                    
                current_day += timedelta(days=1)
            
            return True
        except:
            return False
    
    def _unlock_motivational_sentence(self, user_id: str) -> Optional[Dict]:
        """Unlock a random motivational sentence"""
        sentence = random.choice(self.MOTIVATIONAL_SENTENCES)
        reward_data = {
            'achievement_type': 'any_completion',
            'achievement_name': 'Habit Completed',
            'reward_type': 'motivational_sentence',
            'reward': sentence,
            'message': f'🎯 Achievement Unlocked! New motivational message: "{sentence}"'
        }
        
        # Save to database
        self._save_reward(user_id, reward_data)
        return reward_data
    
    def _unlock_dance(self, user_id: str) -> Optional[Dict]:
        """Unlock an AI-generated dance"""
        from bobo_customization_agent import customization_agent
        
        # Generate COMPLETELY NEW dance using AI!
        dance = customization_agent.generate_dance()
        
        # Save individual item to bobo_items table
        self._save_bobo_item(user_id, 'dance', dance, 'daily_perfect')
        
        reward_data = {
            'achievement_type': 'daily_perfect',
            'achievement_name': 'Perfect Day',
            'reward_type': 'dance',
            'reward': dance,
            'message': f'⭐ Perfect Day! Bobo learned "{dance["name"]}"!'
        }
        
        # Also save to unlocked_rewards for history
        self._save_reward(user_id, reward_data)
        return reward_data
    
    def _unlock_hat_costume(self, user_id: str) -> Optional[Dict]:
        """Unlock an AI-generated hat and costume"""
        from bobo_customization_agent import customization_agent
        
        # Generate COMPLETELY NEW hat and costume using AI!
        hat = customization_agent.generate_hat()
        costume = customization_agent.generate_costume()
        
        # Save individual items to bobo_items table
        self._save_bobo_item(user_id, 'hat', hat, 'weekly_perfect')
        self._save_bobo_item(user_id, 'costume', costume, 'weekly_perfect')
        
        reward_data = {
            'achievement_type': 'weekly_perfect',
            'achievement_name': 'Perfect Week',
            'reward_type': 'hat_costume',
            'reward': {
                'hat': hat,
                'costume': costume
            },
            'message': f'🏆 Perfect Week! Bobo got a {hat["name"]} and {costume["name"]}!'
        }
        
        # Also save to unlocked_rewards for history
        self._save_reward(user_id, reward_data)
        return reward_data
    
    def _unlock_theme(self, user_id: str) -> Optional[Dict]:
        """Unlock a random color and theme (popped from available lists)"""
        import random
        
        # Get available colors and themes (not yet unlocked)
        available_colors = self._get_available_colors(user_id)
        available_themes = self._get_available_themes(user_id)
        
        # Check if any rewards are available
        if not available_colors and not available_themes:
            return {
                'achievement_type': 'monthly_perfect',
                'achievement_name': 'Perfect Month',
                'reward_type': 'color_theme',
                'reward': None,
                'message': '👑 Perfect Month! You\'ve unlocked all available colors and themes!'
            }
        
        color = None
        theme = None
        
        # Pick a random color if available
        if available_colors:
            color = random.choice(available_colors)
            # Save color to bobo_items table (this "pops" it from available list)
            self._save_bobo_item(user_id, 'color', color, 'monthly_perfect')
        
        # Pick a random theme if available
        if available_themes:
            theme = random.choice(available_themes)
            # Save theme to bobo_items table (this "pops" it from available list)
            self._save_bobo_item(user_id, 'theme', theme, 'monthly_perfect')
        
        # Create reward message
        if color and theme:
            message = f'👑 Perfect Month! New color "{color["name"]}" and theme "{theme["name"]}" unlocked!'
        elif color:
            message = f'👑 Perfect Month! New color "{color["name"]}" unlocked! (All themes already unlocked)'
        elif theme:
            message = f'👑 Perfect Month! New theme "{theme["name"]}" unlocked! (All colors already unlocked)'
        else:
            message = '👑 Perfect Month! All rewards already unlocked!'
        
        reward_data = {
            'achievement_type': 'monthly_perfect',
            'achievement_name': 'Perfect Month',
            'reward_type': 'color_theme',
            'reward': {
                'color': color,
                'theme': theme
            },
            'message': message
        }
        
        # Save to database
        self._save_reward(user_id, reward_data)
        return reward_data
    
    def _save_reward(self, user_id: str, reward_data: Dict):
        """Save unlocked reward to database (for history)"""
        try:
            self.db.save_unlocked_reward({
                'user_id': user_id,
                'reward_type': reward_data['reward_type'],
                'reward_data': reward_data['reward'],
                'achievement_type': reward_data['achievement_type']
            })
        except Exception as e:
            print(f"Error saving reward: {e}")
    
    def _save_bobo_item(self, user_id: str, item_type: str, item_data: Dict, achievement_type: str):
        """Save individual Bobo item to bobo_items table"""
        try:
            # For colors, store hex value in svg_data field
            svg_data = item_data.get('hex', '') if item_type == 'color' else item_data.get('svg', '')
            
            self.db.save_bobo_item({
                'user_id': user_id,
                'item_type': item_type,
                'item_id': item_data['id'],
                'item_name': item_data['name'],
                'item_description': item_data.get('description', ''),
                'svg_data': svg_data,
                'animation_data': {
                    'keyframes': item_data.get('keyframes', {}),
                    'duration': item_data.get('duration', 800),
                    'timing': item_data.get('timing', 'ease-in-out'),
                    'movements': item_data.get('movements', {
                        'arms': {'speed': 50, 'amplitude': 20, 'pattern': 'wave'},
                        'head': {'speed': 100, 'amplitude': 5, 'pattern': 'nod'},
                        'hands': {'speed': 80, 'amplitude': 15, 'pattern': 'wiggle'}
                    })
                } if item_type == 'dance' else item_data.get('keyframes', {}),
                'achievement_type': achievement_type
            })
        except Exception as e:
            print(f"Error saving bobo item: {e}")
    
    def get_user_progress(self, user_id: str) -> Dict:
        """Get user's current achievement progress"""
        today = datetime.now().date().isoformat()
        
        return {
            'daily_progress': self._get_daily_progress(user_id, today),
            'weekly_progress': self._get_weekly_progress(user_id, today),
            'monthly_progress': self._get_monthly_progress(user_id, today),
            'total_completions': self._get_total_completions(user_id)
        }
    
    def unlock_daily_achievement(self, user_id: str) -> Optional[Dict]:
        """Unlock daily achievement if conditions are met and not already claimed today"""
        today = datetime.now().date().isoformat()
        
        # Check if already claimed today
        if self.db.check_reward_claimed_for_period(user_id, 'daily_perfect'):
            return None
        
        # Check if conditions are met
        if self._check_daily_perfect(user_id, today):
            # Record the claim
            if self.db.record_reward_claim(user_id, 'daily_perfect'):
                return self._unlock_dance(user_id)
        return None
    
    def unlock_weekly_achievement(self, user_id: str) -> Optional[Dict]:
        """Unlock weekly achievement if conditions are met and not already claimed this week"""
        today = datetime.now().date().isoformat()
        
        # Check if already claimed this week
        if self.db.check_reward_claimed_for_period(user_id, 'weekly_perfect'):
            return None
        
        # Check if conditions are met
        if self._check_weekly_perfect(user_id, today):
            # Record the claim
            if self.db.record_reward_claim(user_id, 'weekly_perfect'):
                return self._unlock_hat_costume(user_id)
        return None
    
    def unlock_monthly_achievement(self, user_id: str) -> Optional[Dict]:
        """Unlock monthly achievement if conditions are met and not already claimed this month"""
        today = datetime.now().date().isoformat()
        
        # Check if already claimed this month
        if self.db.check_reward_claimed_for_period(user_id, 'monthly_perfect'):
            return None
        
        # Check if conditions are met
        if self._check_monthly_perfect(user_id, today):
            # Record the claim
            if self.db.record_reward_claim(user_id, 'monthly_perfect'):
                return self._unlock_theme(user_id)
        return None
    
    def _get_daily_progress(self, user_id: str, date: str) -> Dict:
        """Get daily completion progress using daily_success_rates"""
        try:
            date_obj = datetime.fromisoformat(date).date()
            success_rate_data = self.db.get_daily_success_rate(user_id, date_obj)
            if success_rate_data:
                return {
                    'completed': success_rate_data.get('completed_instances', 0),
                    'total': success_rate_data.get('total_habit_instances', 0),
                    'percentage': success_rate_data.get('success_rate', 0)
                }
            else:
                return {'completed': 0, 'total': 0, 'percentage': 0}
        except:
            return {'completed': 0, 'total': 0, 'percentage': 0}
    
    def _get_weekly_progress(self, user_id: str, date: str) -> Dict:
        """Get weekly completion progress using daily_success_rates batch query"""
        try:
            date_obj = datetime.fromisoformat(date)
            monday = date_obj - timedelta(days=date_obj.weekday())
            sunday = monday + timedelta(days=6)
            
            # Get all weekly data in one batch query
            weekly_data = self.db.get_daily_success_rates_batch(
                user_id, 
                monday.date(), 
                sunday.date()
            )
            
            # Sum up all success rates and divide by 7 (days in week)
            total_success_rate = sum(day.get('success_rate', 0) for day in weekly_data)
            week_success_rate = total_success_rate / 7 if len(weekly_data) > 0 else 0
            
            # Also calculate totals for display
            total_completed = sum(day.get('completed_instances', 0) for day in weekly_data)
            total_required = sum(day.get('total_habit_instances', 0) for day in weekly_data)
            
            return {
                'completed': total_completed,
                'total': total_required,
                'percentage': week_success_rate,
                'days_with_data': len(weekly_data)
            }
        except:
            return {'completed': 0, 'total': 0, 'percentage': 0, 'days_with_data': 0}
    
    def _get_monthly_progress(self, user_id: str, date: str) -> Dict:
        """Get monthly completion progress using daily_success_rates batch query"""
        try:
            date_obj = datetime.fromisoformat(date)
            first_day = date_obj.replace(day=1)
            if date_obj.month == 12:
                last_day = date_obj.replace(year=date_obj.year + 1, month=1, day=1) - timedelta(days=1)
            else:
                last_day = date_obj.replace(month=date_obj.month + 1, day=1) - timedelta(days=1)
            
            # Calculate days in month
            days_in_month = (last_day - first_day).days + 1
            
            # Get all monthly data in one batch query
            monthly_data = self.db.get_daily_success_rates_batch(
                user_id, 
                first_day, 
                last_day
            )
            
            # Sum up all success rates and divide by days in month
            total_success_rate = sum(day.get('success_rate', 0) for day in monthly_data)
            month_success_rate = total_success_rate / days_in_month if len(monthly_data) > 0 else 0
            
            # Also calculate totals for display
            total_completed = sum(day.get('completed_instances', 0) for day in monthly_data)
            total_required = sum(day.get('total_habit_instances', 0) for day in monthly_data)
            
            return {
                'completed': total_completed,
                'total': total_required,
                'percentage': month_success_rate,
                'days_with_data': len(monthly_data)
            }
        except:
            return {'completed': 0, 'total': 0, 'percentage': 0, 'days_with_data': 0}
    
    def _get_total_completions(self, user_id: str) -> int:
        """Get total all-time completions (optimized count query)"""
        try:
            # Use count query instead of fetching all records
            if hasattr(self.db, 'get_completions_count'):
                return self.db.get_completions_count(user_id)
            else:
                # Fallback to existing method if count method doesn't exist
                completions = self.db.get_completions(user_id)
                return len(completions)
        except:
            return 0

import { useState } from 'react'
import RobotMascot from './RobotMascot'

export default function RobotEmotionDemo() {
  const [selectedEmotion, setSelectedEmotion] = useState('happy')
  const [isDancing, setIsDancing] = useState(false)

  const emotions = [
    { name: 'happy', label: '😊 Happy', description: 'Default cheerful state' },
    { name: 'excited', label: '🤩 Excited', description: 'Wide eyes, big smile' },
    { name: 'celebrating', label: '🎉 Celebrating', description: 'Party mode with hearts!' },
    { name: 'curious', label: '🤔 Curious', description: 'Slightly tilted expression' },
    { name: 'thinking', label: '💭 Thinking', description: 'Processing with thought bubble' },
    { name: 'surprised', label: '😲 Surprised', description: 'Wide eyes and mouth' },
    { name: 'sad', label: '😢 Sad', description: 'Downturned mouth' },
    { name: 'sleepy', label: '😴 Sleepy', description: 'Half-closed eyes with Zzz' }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-5xl font-bold text-white text-center mb-4">
          Meet Journey! 🤖
        </h1>
        <p className="text-xl text-white/80 text-center mb-12">
          Your adorable WALL-E inspired companion with emotions
        </p>

        {/* Main Display */}
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-12 mb-8 flex flex-col items-center">
          <div className="mb-8">
            <RobotMascot 
              size="xl" 
              emotion={selectedEmotion} 
              animate={true}
              dance={isDancing}
            />
          </div>
          
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold text-white mb-2">
              {emotions.find(e => e.name === selectedEmotion)?.label}
            </h2>
            <p className="text-white/70">
              {emotions.find(e => e.name === selectedEmotion)?.description}
            </p>
          </div>

          <button
            onClick={() => setIsDancing(!isDancing)}
            className={`px-8 py-3 rounded-full font-bold text-lg transition-all ${
              isDancing 
                ? 'bg-red-500 hover:bg-red-600 text-white' 
                : 'bg-green-500 hover:bg-green-600 text-white'
            }`}
          >
            {isDancing ? '⏸️ Stop Dancing' : '💃 Make Journey Dance!'}
          </button>
        </div>

        {/* Emotion Selector */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {emotions.map((emotion) => (
            <button
              key={emotion.name}
              onClick={() => setSelectedEmotion(emotion.name)}
              className={`p-6 rounded-2xl transition-all ${
                selectedEmotion === emotion.name
                  ? 'bg-white/30 border-4 border-white scale-105'
                  : 'bg-white/10 border-2 border-white/20 hover:bg-white/20'
              }`}
            >
              <div className="flex flex-col items-center gap-3">
                <RobotMascot 
                  size="md" 
                  emotion={emotion.name} 
                  animate={selectedEmotion === emotion.name}
                />
                <div className="text-center">
                  <div className="text-white font-bold">{emotion.label}</div>
                  <div className="text-white/60 text-xs mt-1">{emotion.description}</div>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Technical Info */}
        <div className="mt-12 bg-white/10 backdrop-blur-lg rounded-2xl p-6">
          <h3 className="text-2xl font-bold text-white mb-4">How Journey Works 🛠️</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-white/80">
            <div>
              <h4 className="font-bold text-white mb-2">🎨 Built with SVG</h4>
              <p className="text-sm">
                Journey is drawn using SVG shapes - circles, rectangles, and paths. 
                This makes him scalable and theme-adaptive!
              </p>
            </div>
            <div>
              <h4 className="font-bold text-white mb-2">✨ Animations</h4>
              <p className="text-sm">
                Blinking every 3-5 seconds, bouncing every 5 seconds, and dancing with arm rotations!
              </p>
            </div>
            <div>
              <h4 className="font-bold text-white mb-2">😊 8 Emotions</h4>
              <p className="text-sm">
                Different eye shapes, mouth curves, and accessories (hearts, thought bubbles, Zzz)
              </p>
            </div>
            <div>
              <h4 className="font-bold text-white mb-2">🎨 Theme Colors</h4>
              <p className="text-sm">
                Uses CSS variables so Journey changes colors with your theme!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

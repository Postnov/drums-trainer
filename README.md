# Drums Training App

A modern web application for practicing drum rhythms and coordination exercises, built with Vue.js and Web Audio API.

## Features

### Drum Trainer
- Interactive rhythm visualization with a moving playhead
- Adjustable tempo (40-200 BPM)
- Volume control for metronome
- Multiple instrument tracks:
  - Kick drum
  - Snare drum
  - Hi-hat
  - Ride cymbal
- Three rhythm modes:
  1. Basic patterns (Rock, Funk, Jazz)
  2. Random rhythm generation (changes every 4 bars)
  3. Popular patterns from different music styles:
     - Basic Rock
     - Rock Variation
     - Disco
     - Hip-Hop
     - Reggae
     - Blues

### Coordination Trainer
- Four-limb coordination exercises
- Visual representation for each limb:
  - Right Hand
  - Left Hand
  - Right Foot
  - Left Foot
- Independent pattern generation for each limb
- Customizable difficulty levels
- Real-time visual feedback

## Technical Stack

- Vue.js 3 (Composition API)
- Tailwind CSS for styling
- Web Audio API for sound generation
- Vite as build tool

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/drums-trainings.git
cd drums-trainings
```

2. Install dependencies:
```bash
npm install
```

3. Run development server:
```bash
npm run dev
```

4. Build for production:
```bash
npm run build
```

## Project Structure

```
drums-trainings/
├── src/
│   ├── assets/
│   │   ├── audio.js         # Audio context and sound management
│   │   ├── sounds/          # Drum samples
│   │   └── legs-hands-icons/ # Limb icons for coordination trainer
│   ├── components/
│   │   ├── DrumTrainer.vue  # Main drum pattern trainer
│   │   └── trainers/
│   │       └── CoordinationTrainer.vue # Limb coordination trainer
│   ├── App.vue
│   └── main.js
├── public/
├── index.html
└── package.json
```

## Features in Detail

### Drum Pattern Generation
The application uses sophisticated algorithms to generate rhythmic patterns:
- Basic patterns follow common music styles
- Random patterns maintain musical coherence while providing variety
- Popular patterns are carefully crafted to represent different genres

### Audio Engine
- Uses Web Audio API for precise timing
- Low-latency sound playback
- High-quality drum samples
- Adjustable metronome volume
- Scheduling system for accurate rhythm playback

### Visual Interface
- Clean and intuitive design
- Real-time visual feedback
- Responsive layout
- Dark mode support
- Interactive controls

## Usage Tips

1. Start with slower tempos (60-80 BPM) when learning new patterns
2. Use the metronome to maintain steady timing
3. Practice with different rhythm modes to improve versatility
4. For coordination training:
   - Begin with simpler patterns
   - Add limbs gradually
   - Focus on accuracy before speed

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Drum samples from [source]
- Icons from [source]
- Special thanks to contributors and testers 
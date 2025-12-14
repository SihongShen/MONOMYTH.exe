'use client';

import React, { use, useState } from 'react'
import OpeningPage from './pages/opening/opening.jsx';
import InputPage from './pages/input/input.jsx';
import TestStoryPage from './pages/story/story.jsx';
// import FullscreenStart from './components/fullScreen.jsx';

function App() {
    const [stage, setStage] = useState('opening');

    const [gameData, setGameData] = useState({
        seed: '',
        name: '',
    });

    // opening - input
    const handleStartInput = () => {
      // enable fullscreen after initialization
      const elem = document.documentElement;
      
      if (elem.requestFullscreen) {
        elem.requestFullscreen().catch((err) => {
           console.log("全屏请求失败或被拦截:", err);
        });
      } else if (elem.webkitRequestFullscreen) {
        elem.webkitRequestFullscreen();
      }

      // 2. change stage after fullscreen
      setStage('input');
    };

    // input - story
    const handleInputComplete = (seed, name) => {
      setGameData({ seed, name });
      setStage('story');
    }

    return (
      <>
        {stage === 'opening' && (
          <OpeningPage onStart={handleStartInput} />
        
        )}

        {stage === 'input' && (
          <InputPage onComplete={handleInputComplete} />
        )}

        {stage === 'story' && (
          <TestStoryPage seed={gameData.seed} name={gameData.name} />
        )}
      </>
    )
}

export default App
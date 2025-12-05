import React, { useEffect, useState, useRef }from 'react';

export default function ProgressiveBackground({ iconsUrl, currentStep }) {
    if (!iconsUrl) return null;

    // save all icons
    const [randomizedIcons, setRandomizedIcons] = useState([]);
    const prevStepRef = useRef(0);

    // define Sprite Slicing and Screen Position for the six icons
    const iconsConfig = [
        { bgPos: '0% 0%' },
        { bgPos: '50% 0%' },
        { bgPos: '100% 0%' },
        { bgPos: '0% 100%' },
        { bgPos: '50% 100%' },
        { bgPos: '100% 100%' },
    ];

    useEffect(() => {
        if (!iconsUrl) return;

        // reset icon storage
        if (currentStep === 0) {
            setRandomizedIcons([]);
            prevStepRef.current = 0;
            return;
        }

        if (currentStep > prevStepRef.current) {
            
            // random number for each icon
            const countToAdd = Math.floor(Math.random() * 5) + 1;
            
            const newBatch = [];
            const screenW = window.innerWidth;
            const screenH = window.innerHeight;
            // helper function for random number
            const getRandom = (min, max) => Math.random() * (max - min) + min;

            for (let i = 0; i < countToAdd; i++) {
                // random properties
                const size = getRandom(100, 250);
                const rotate = getRandom(0, 360);
                const x = getRandom(0, screenW - size);
                const y = getRandom(0, screenH - size);
                const randomConfig = iconsConfig[Math.floor(Math.random() * iconsConfig.length)];

                newBatch.push({
                    id: Date.now() + i,
                    size,
                    rotate,
                    x,
                    y,
                    bgPos: randomConfig.bgPos
                });
            }

            setRandomizedIcons(prev => [...prev, ...newBatch]);
            prevStepRef.current = currentStep;
        }

    }, [currentStep, iconsUrl]);

    if (!iconsUrl) return null;

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
            zIndex: -1,
            pointerEvents: 'none',
            overflow: 'hidden',
            background: '#050505'
        }}>
            {randomizedIcons.map((icon) => {
                
                return (
                    <div 
                        key={icon.id}
                        style={{
                            position: 'absolute',
                            width: `${icon.size}px`,
                            height: `${icon.size}px`,
                            left: `${icon.x}px`,
                            top: `${icon.y}px`,
                            opacity: 0.6, 
                            transform: `rotate(${icon.rotate}deg)`,

                            // CSS Sprite
                            backgroundImage: `url(${iconsUrl})`,
                            backgroundSize: '300% 200%',
                            backgroundPosition: icon.bgPos,
                            backgroundRepeat: 'no-repeat',
                        }}
                    />
                );
            })}
        </div>
    );
}
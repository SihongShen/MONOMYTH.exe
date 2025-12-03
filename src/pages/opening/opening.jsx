import React, { use, useEffect, useRef } from 'react';
import './opening.css';

export default function OpeningPage({ onStart }) {
    const TITLE_TEXT = "MONOMYTH";

    // create canvas for 10100 rain effect
    const canvasRef = useRef(null);
    useEffect(() => {
        // initial canvas setup
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        // define width and height for canvas
        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();

        // rain effect setup
        const fontSize = 14;
        const columns = Math.floor(canvas.width / fontSize);
        const drops = Array(columns).fill(0).map(() => Math.random() * -100);

        // draw rain
        const draw = () =>{
            ctx.fillStyle = 'rgba(0, 0, 0, 0.09)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#33ff33';
            ctx.font = `${fontSize}px monospace`;

            // loop through drops
            for (let i = 0; i < drops.length; i++) {
                const text = Math.random() > 0.5 ? '1' : '0';
                const x = i * fontSize;
                const y = drops[i] * fontSize;

                ctx.fillText(text, x, y);

                // reset drop
                if (y > canvas.height && Math.random() > 0.8) {
                    drops[i] = 0;
                }

                drops[i]++;
            }
        };

        const intervalId = setInterval(draw, 43);

        return () => {
            clearInterval(intervalId);
            window.removeEventListener('resize', resizeCanvas)
        };
    }, []);

    return (
        <div className="opening-container" onClick={onStart}>
            <canvas ref={canvasRef} className="matrix-canvas" />
            <h1 className="glitch-title" data-text={TITLE_TEXT}>
                {TITLE_TEXT}
            </h1>
            <div className="blink-text">
                [ CLICK TO INITIALIZE ]
            </div>
        </div>
    );
}
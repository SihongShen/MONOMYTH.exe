import React, { useEffect, useRef, useState, useCallback } from 'react';
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';

const styles = {
    container: {
        position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
        pointerEvents: 'none',
        display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '20%',
        zIndex: 50
    },

    videoHidden: { display: 'none' },

    canvas: {
        position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
        zIndex: 20
    },

    backdrop: {
        position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
        backgroundColor: 'rgba(255, 255, 255, 0.5)',
        backdropFilter: 'blur(3px)',
        zIndex: 10 //
    },
  
    optionZone: {
        width: '30%', height: '60%', 
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        border: '2px solid rgba(255,255,255,0.2)',
        transition: 'all 0.1s',
        position: 'relative',
        overflow: 'hidden',
        zIndex: 10
    },

    text: {
        zIndex: 2, fontSize: '24px', fontWeight: 'bold', color: '#fff',
        textShadow: '0 0 10px rgba(255,255,255,0.8)',
        textAlign: 'center'
    },

    fillLayer: (color, progress) => ({
        position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
        backgroundColor: color,
        opacity: progress / 100,
        transform: `scale(${0.5 + (progress / 200)})`,
        transition: 'opacity 0.1s linear',
        zIndex: 1
    }),

    centerGuide: {
        position: 'absolute', left: '50%', top: '50%',
        transform: 'translate(-50%, -50%)',
        textAlign: 'center',
        color: '#D32F2F', fontSize: '48px', fontWeight: 'bold',
        textShadow: '0 0 15px rgba(211, 47, 47, 0.6), 0 0 5px rgba(211, 47, 47, 0.8)',
        animation: 'pulse 1.5s infinite'
    }
};

const GHOST_HAND = [
    {x: 0.5, y: 0.8}, 
    {x: 0.4, y: 0.75}, {x: 0.35, y: 0.7}, {x: 0.3, y: 0.65}, {x: 0.25, y: 0.6},
    {x: 0.45, y: 0.5}, {x: 0.42, y: 0.4}, {x: 0.4, y: 0.3}, {x: 0.38, y: 0.2},
    {x: 0.5, y: 0.48}, {x: 0.5, y: 0.35}, {x: 0.5, y: 0.25}, {x: 0.5, y: 0.15},
    {x: 0.55, y: 0.5}, {x: 0.58, y: 0.4}, {x: 0.6, y: 0.3}, {x: 0.62, y: 0.2},
    {x: 0.6, y: 0.6}, {x: 0.65, y: 0.55}, {x: 0.7, y: 0.5}, {x: 0.75, y: 0.45}
];

export default function HandChoiceController({ 
    leftOption = "Option A", 
    rightOption = "Option B", 
    onSelect 
}) {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [handLandmarker, setHandLandmarker] = useState(null);
    const [cameraActive, setCameraActive] = useState(false);
  
    // state for hand detection and selection
    const [handDetected, setHandDetected] = useState(false);
    const [selection, setSelection] = useState(null); // 'left' or 'right'
    const [progress, setProgress] = useState(0); // 0 - 100

    // 1. Initialize MediaPipe
    useEffect(() => {
        const initMediaPipe = async () => {
        const vision = await FilesetResolver.forVisionTasks(
            "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
        );
        const landmarker = await HandLandmarker.createFromOptions(vision, {
            baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
            delegate: "GPU"
            },
            runningMode: "VIDEO",
            numHands: 1
        });
        setHandLandmarker(landmarker);
        };
        initMediaPipe();
    }, []);

    // 2. Open camera and start detection loop
    useEffect(() => {
        if (!handLandmarker || !videoRef.current) return;

        const enableCam = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            videoRef.current.srcObject = stream;
            videoRef.current.addEventListener("loadeddata", predictWebcam);
            setCameraActive(true);
        } catch (err) {
            console.error("Camera Error:", err);
        }
        };

        enableCam();

        let lastVideoTime = -1;
        let animationFrameId;

        const predictWebcam = () => {
        // The logic here mainly loops to call detection
        if (videoRef.current && videoRef.current.currentTime !== lastVideoTime) {
            lastVideoTime = videoRef.current.currentTime;
            const results = handLandmarker.detectForVideo(videoRef.current, performance.now());
            
            handleGameLogic(results);
            drawHand(results);
        }
        animationFrameId = requestAnimationFrame(predictWebcam);
        };

        return () => {
            cancelAnimationFrame(animationFrameId);
            if(videoRef.current && videoRef.current.srcObject) {
                videoRef.current.srcObject.getTracks().forEach(track => track.stop());
            }
        };
    }, [handLandmarker]);

    const drawHand = useCallback((results) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
    
        // clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // real hand detected
        if (results && results.landmarks && results.landmarks.length > 0) {
            const landmarks = results.landmarks[0];

            ctx.fillStyle = '#00FFCC';
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#00FFCC';

            for (let i = 0; i < landmarks.length; i++) {
                const x = (1 - landmarks[i].x) * canvas.width;
                const y = landmarks[i].y * canvas.height;
                
                ctx.beginPath();
                ctx.arc(x, y, 3, 0, 2 * Math.PI);
                ctx.fill();
            }
        } 
        // no hand detected
        else {
            const time = performance.now() / 400; 
            const alpha = (Math.sin(time) + 1) / 2 * 0.4 + 0.1;
            
            ctx.fillStyle = `rgba(50, 50, 50, ${alpha})`;
            ctx.shadowBlur = 0;

            for (let i = 0; i < GHOST_HAND.length; i++) {
                const pt = GHOST_HAND[i];
                const x = pt.x * canvas.width;
                const y = pt.y * canvas.height;

                ctx.beginPath();
                ctx.arc(x, y, 3, 0, 2 * Math.PI);
                ctx.fill();
            }
        }
    }, []);

    // 3. Determine selection based on hand position
    const handleGameLogic = (results) => {
        if (results.landmarks && results.landmarks.length > 0) {
            setHandDetected(true);
            
            // Get the coordinates of the index fingertip (index 8) or palm center (index 0 or 9)
            // x coordinate ranges from 0 (left) to 1 (right)
            // Note: The camera may be mirrored by default depending on your CSS flip. Here we assume 0 is left.
            const rawX = results.landmarks[0][8].x; // Index fingertip
            const x = 1 - rawX;
            
            // Logic decision area
            const isLeft = x < 0.4; // Hand on the left 40% of the screen
            const isRight = x > 0.6; // Hand on the right 40% of the screen

            if (isLeft) {
                setSelection('left');
                setProgress(prev => Math.min(prev + 2, 100)); // Increase progress, speed adjustable
            } else if (isRight) {
                setSelection('right');
                setProgress(prev => Math.min(prev + 2, 100));
            } else {
                // Hand in the middle, reset
                setSelection(null);
                setProgress(prev => Math.max(prev - 5, 0)); // Fast rollback
            }

        } else {
            setHandDetected(false);
            setSelection(null);
            setProgress(0);
        }
    };

//  Handle canvas resizing
  useEffect(() => {
    const handleResize = () => {
        if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 4. Listen for progress completion
  useEffect(() => {
    if (progress >= 100 && selection) {
      // Trigger callback
      onSelect(selection === 'left' ? leftOption : rightOption);
      setProgress(0); // Prevent multiple triggers
    }
  }, [progress, selection, onSelect]);

  return (
    <>
        {/* Hidden Video element for MediaPipe to read */}
        <video ref={videoRef} autoPlay playsInline style={styles.videoHidden} />

        {/* transparent layout */}
        <div style={styles.backdrop}></div>

        <canvas ref={canvasRef} style={styles.canvas} />

        {/* UI Layer */}
        <div style={styles.container}>
        
        {/* Left option (blue) */}
        <div style={{
            ...styles.optionZone,
            borderColor: 'rgba(0, 255, 255, 0.5)',
            boxShadow: selection === 'left' ? `0 0 ${progress/2}px rgba(0,255,255,0.8)` : 'none'
        }}>

        {/* Fill layer */}
        <div style={styles.fillLayer('rgba(0, 255, 255, 0.8)', selection === 'left' ? progress : 0)} />
            <span style={styles.text}>{leftOption}</span>
        </div>

        {/* guide text */}
        {!handDetected && (
            <div style={styles.centerGuide}>
                SIGNAL LOST<br/> 
                <small style={{fontSize: '0.8em', fontWeight: 'normal'}}>Please Raise Hand</small>
            </div>
        )}

        {/* Right option (red) */}
        <div style={{
            ...styles.optionZone,
            borderColor: 'rgba(255, 0, 0, 0.5)',
            boxShadow: selection === 'right' ? `0 0 ${progress/2}px rgba(255,0,0,0.8)` : 'none'
        }}>
           {/* Fill layer */}
           <div style={styles.fillLayer('rgba(255, 0, 0, 0.8)', selection === 'right' ? progress : 0)} />
           <span style={styles.text}>{rightOption}</span>
        </div>
      </div>
    </>
  );
}
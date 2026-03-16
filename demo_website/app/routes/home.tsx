import React, { useEffect, useRef, useState } from 'react';
import hands_package from '@mediapipe/hands';
const {Hands, HAND_CONNECTIONS} = hands_package;
import type { Results, LandmarkList } from '@mediapipe/hands';
import * as cam from '@mediapipe/camera_utils';
import draw_package from '@mediapipe/drawing_utils';
const { drawConnectors, drawLandmarks } = draw_package;

const HandTracker: React.FC = () => {

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  useEffect(() => {

    const hands = new Hands({
      locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
    });

    hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });


    hands.onResults((results: Results) => {
      if (!canvasRef.current || !videoRef.current) return;
      setIsLoaded(true);

      const canvasCtx = canvasRef.current.getContext('2d');
      if (!canvasCtx) return;

      const width = canvasRef.current.width;
      const height = canvasRef.current.height;

      canvasCtx.save();
      canvasCtx.clearRect(0, 0, width, height);
      

      canvasCtx.drawImage(results.image, 0, 0, width, height);

      if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {

        const landmarks: LandmarkList = results.multiHandLandmarks[0];


        const wrist = landmarks[0];
        console.log(`Wrist -> x: ${wrist.x.toFixed(3)}, y: ${wrist.y.toFixed(3)}`);
        
        const index_pos = landmarks[5];
        const pinky_pos = landmarks[17];

        const depth = Math.sqrt(
            (index_pos.x - pinky_pos.x)**2 +
            (index_pos.y - pinky_pos.y)**2
        )

        console.log(depth);

        drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, { color: '#00FF00', lineWidth: 5 });
        drawLandmarks(canvasCtx, landmarks, { color: '#FF0000', lineWidth: 2 });
      }
      canvasCtx.restore();
    });


    if (videoRef.current) {
      const camera = new cam.Camera(videoRef.current, {
        onFrame: async () => {

          if (videoRef.current) {
            await hands.send({ image: videoRef.current });
          }
        },
        width: 640,
        height: 480,
      });
      camera.start();
    }

    return () => {
      hands.close();
    };
  }, []);

  return (
    <div style={containerStyle}>
      <h2>Robot Control Percept</h2>
      {!isLoaded && <p>Initializing Hand Tracking...</p>}
      
      <div style={stageStyle}>
        <video
          ref={videoRef}
          style={{ display: 'none' }}
          playsInline
          muted
        />
        <canvas
          ref={canvasRef}
          width={640}
          height={480}
          style={canvasStyle}
        />
      </div>
    </div>
  );
};


const containerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: '20px',
  fontFamily: 'sans-serif'
};

const stageStyle: React.CSSProperties = {
  position: 'relative',
  width: '640px',
  height: '480px'
};

const canvasStyle: React.CSSProperties = {
  width: '100%',
  height: '100%',
  border: '3px solid #222',
  borderRadius: '12px'
};

export default HandTracker;
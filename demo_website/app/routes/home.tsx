import React, { useEffect, useRef, useState } from 'react';
import hands_package from '@mediapipe/hands';
import * as cam from '@mediapipe/camera_utils';
import draw_package from '@mediapipe/drawing_utils';

const { Hands, HAND_CONNECTIONS } = hands_package;
const { drawConnectors, drawLandmarks } = draw_package;

const ProjectPage: React.FC = () => {
  return (
    <div style={pageStyle}>

      <header style={heroStyle}>
        <h1 style={titleStyle}>Intuitive Robot Teleoperation</h1>
        <p style={subtitleStyle}>
          Bridging the gap between natural human motion and robotic precision 
          through Vision-Based Mapping and Shared Autonomy.
        </p>
        <div style={badgeContainer}>
          <span style={badgeStyle}>MediaPipe</span>
          <span style={badgeStyle}>Robosuite</span>
          <span style={badgeStyle}>Shared Autonomy</span>
        </div>
      </header>

      <main style={mainContentStyle}>
        
        <section style={gridSectionStyle}>
          <div style={infoCardStyle}>
            <h4 style={{marginTop: 0}}>Vision-Based Mapping: </h4>
            <p>The teleoperation of robots in simulated and real environments often requires the use of
            specialized equipment and controllers. When collecting data from demonstrations or testing
            robots, operators must typically have prior expertise or training to operate them. Vision-based
            teleoperation offers a method that is more intuitive for users and requires less extensive training. 
            We do this by translating 2D camera coordinates to 3D robot workspace using dynamic scaling and joint-based depth estimation.</p>
          </div>
          <div style={infoCardStyle}>
            <h4 style={{marginTop: 0}}>Shared Autonomy</h4>
            <p>While intuitive, pure vision-based mapping can lack the precision required for many tasks,
so we extend this system with simple shared autonomy, in which the human user maintains
high-level motion control while the robot autonomously fine-tunes. This is accomplished through a biasing protocol that activates within a 0.15m radius of target objects, allowing for fine-tuned precision during the "grab" phase.</p>
          </div>
        </section>


        {/* --- INTERACTIVE MODULE --- */}
        <section style={sectionStyle}>
          <div style={cardStyle}>
            <h3 style={sectionTitleStyle}>Interactive Hand-Tracking Module</h3>
            <p style={textStyle}>
              Below is a replication of our system's <strong>input</strong>: a real-time
              webcam feed that we use to extract X and Y coordinates of hand landmarks. We estimate depth by measuring the Euclidean distance between 
              multiple joints, providing a Z-axis coordinate. Try moving your hand around to test!
            </p>
            <HandTracker />
          </div>
        </section>

        <section style={sectionStyle}>
          <h3 style={centeredTitleStyle}>Task 1: Speed Benchmark (Controller vs. Vision)</h3>
          <video controls style={fullVideoStyle}>
            <source src="timeComparison.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>

          <div style={captionBoxStyle}>
            <p>
              This video demonstrates the task completion speed of a keyboard-controlled teleoperation (left) vs vision-based (right).
              We can see that the intuitive nature of the vision-based approach makes it significantly faster, completing the task in 7 seconds
              while we found that a keyboard-based controller tuned for high accuracy took much longer on average.
            </p>
          </div>
        </section>


        <section style={sectionStyle}>
          <h3 style={centeredTitleStyle}>Task 2: Precision Benchmark (Pick and Place)</h3>
          
          <div style={videoGridStyle}>
            <div>
              <h4 style={videoLabelStyle}>Manual Vision-Based</h4>
              <video controls style={gridVideoStyle}>
                <source src="manual_vision_teleop_demo.mp4" type="video/mp4" />
              </video>
            </div>
            
            <div>
              <h4 style={videoLabelStyle}>Shared Autonomy</h4>
              <video controls style={gridVideoStyle}>
                <source src="shared_autonomy_demo.mp4" type="video/mp4" />
              </video>
            </div>
          </div>

          <div style={captionBoxStyle}>
            <p>
              These videos demonstrate attempts to grab the <strong>bread and can</strong> objects in the "pick and place" task. 
              We can see that the manual tele-operation is unable to grab either object and takes significantly 
              long to get aligned to even try to grab them. Meanwhile, the <strong>shared autonomy</strong> kicks 
              in when the hand gets nearby and automatically aligns, allowing the user to easily grab the objects 
              and deposit them correctly.
            </p>
          </div>
        </section>

      </main>

      <footer style={footerStyle}>
        CS 188 Project — 2026
      </footer>
    </div>
  );
};

/* --- STYLES (Updated for Side-by-Side) --- */

const videoGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '20px',
  marginTop: '20px'
};

const gridVideoStyle: React.CSSProperties = {
  width: '100%',
  borderRadius: '12px',
  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
};

const fullVideoStyle: React.CSSProperties = {
  width: '100%',
  borderRadius: '12px',
  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
};

const videoLabelStyle: React.CSSProperties = {
  textAlign: 'center',
  fontSize: '1.1rem',
  color: '#475569',
  marginBottom: '10px'
};

const captionBoxStyle: React.CSSProperties = {
  backgroundColor: '#f1f5f9',
  padding: '20px',
  borderRadius: '12px',
  marginTop: '24px',
  borderLeft: '5px solid #3b82f6',
  color: '#334155',
  fontSize: '1.05rem',
  lineHeight: '1.5'
};

const centeredTitleStyle: React.CSSProperties = { 
  textAlign: "center", 
  fontSize: "1.8rem", 
  fontWeight: "700",
  marginBottom: "20px"
};

// ... (Rest of your original styles: pageStyle, heroStyle, etc.)
const pageStyle: React.CSSProperties = { backgroundColor: '#f8fafc', minHeight: '100vh', color: '#1e293b', fontFamily: 'system-ui, -apple-system, sans-serif', lineHeight: '1.6' };
const heroStyle: React.CSSProperties = { backgroundColor: '#0f172a', color: 'white', padding: '80px 20px', textAlign: 'center' };
const titleStyle: React.CSSProperties = { fontSize: '3rem', fontWeight: 800, marginBottom: '16px' };
const subtitleStyle: React.CSSProperties = { fontSize: '1.25rem', maxWidth: '800px', margin: '0 auto', color: '#94a3b8' };
const badgeContainer: React.CSSProperties = { display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '20px' };
const badgeStyle: React.CSSProperties = { backgroundColor: '#334155', padding: '6px 12px', borderRadius: '20px', fontSize: '0.8rem' };
const mainContentStyle: React.CSSProperties = { maxWidth: '1000px', margin: '0 auto', padding: '40px 20px' };
const sectionStyle: React.CSSProperties = { marginBottom: '60px' };
const sectionTitleStyle: React.CSSProperties = { fontSize: '1.8rem', fontWeight: 700, marginBottom: '20px', color: '#0f172a' };
const cardStyle: React.CSSProperties = { backgroundColor: 'white', padding: '30px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', display: 'flex', flexDirection: 'column', alignItems: 'center' };
const gridSectionStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '16px'};
const infoCardStyle: React.CSSProperties = { backgroundColor: 'white', padding: '20px', borderRadius: '12px', borderTop: '4px solid #3b82f6', borderBottom: '4px solid #3b82f6' };
const canvasStyle: React.CSSProperties = { width: '100%', height: 'auto', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' };
const loaderStyle: React.CSSProperties = { padding: '20px', backgroundColor: '#f1f5f9', borderRadius: '8px', textAlign: 'center' };
const footerStyle: React.CSSProperties = { textAlign: 'center', padding: '40px', color: '#64748b', fontSize: '0.9rem' };
const textStyle: React.CSSProperties = { color: '#475569', textAlign: 'center', maxWidth: '600px' };


const HandTracker: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [currentDepth, setCurrentDepth] = useState<number>(0);

  const calculateDepth = (landmarks: {x: number, y: number}[]) => {
    
    const getDist = (p1: {x: number, y: number}, p2: {x: number, y: number}) => Math.sqrt(
      Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2)
    );

    const d1 = getDist(landmarks[5], landmarks[9]);   // Index to Middle
    const d2 = getDist(landmarks[9], landmarks[13]);  // Middle to Ring
    const d3 = getDist(landmarks[13], landmarks[17]); // Ring to Pinky

    // Average distance acts as our Z-axis proxy
    return (d1 + d2 + d3);
  };

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

    hands.onResults((results) => {
      if (!canvasRef.current || !videoRef.current) return;
      setIsLoaded(true);
      const canvasCtx = canvasRef.current.getContext('2d');
      if (!canvasCtx) return;

      canvasCtx.save();
      canvasCtx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      canvasCtx.drawImage(results.image, 0, 0, canvasRef.current.width, canvasRef.current.height);

      if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        const landmarks = results.multiHandLandmarks[0];
    
        // 1. Calculate the raw depth value
        const currentDepth = calculateDepth(landmarks);

        // 3. Draw the landmarks
        drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, { color: '#00FF00', lineWidth: 5 });
        drawLandmarks(canvasCtx, landmarks, { color: '#FF0000', lineWidth: 2 });
        
        // 4. Display the depth value on the canvas for the grader to see
        canvasCtx.fillStyle = "white";
        canvasCtx.font = "20px Arial";
        canvasCtx.fillText(`Depth Metric: ${currentDepth.toFixed(3)}`, 10, 30);
      }
      canvasCtx.restore();
    });

    if (videoRef.current) {
      const camera = new cam.Camera(videoRef.current, {
        onFrame: async () => { if (videoRef.current) await hands.send({ image: videoRef.current }); },
        width: 640, height: 480,
      });
      camera.start();
    }
    return () => hands.close();
  }, []);

  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: '640px', marginTop: '20px' }}>
      {!isLoaded && <div style={loaderStyle}>Initializing MediaPipe...</div>}
      <video ref={videoRef} style={{ display: 'none' }} playsInline muted />
      <canvas ref={canvasRef} width={640} height={480} style={canvasStyle} />
    </div>
  );
};

export default ProjectPage;
import cv2
import numpy as np
import threading
import queue
import robosuite as suite
from dex_retargeting.constants import HandType
from example.vector_retargeting.single_hand_detector import SingleHandDetector

class PDController:
    def __init__(self, kp, kd, target):
        """
        Initialize a proportional controller.

        Args:
            kp (float): Proportional gain.
            target (tuple or array): Target position.
        """
        self.kp = kp
        self.kd = kd
        self.lasterr = np.array([0,0,0])
        self.target = target

    def reset(self, target=None):
        """
        Reset the target position.

        Args:
            target (tuple or array, optional): New target position.
        """
        self.lasterr = np.array([0,0,0])

    
    def update(self, current_pos):
        """
        Compute the control signal.

        Args:
            current_pos (array-like): Current position.

        Returns:
            np.ndarray: Control output vector.
        """
        cur_err = self.target - current_pos
        control = self.kp*cur_err + self.kd*(cur_err - self.lasterr)
        self.lasterr = cur_err
        return control

# ----------------------------
# Shared state
# ----------------------------
latest_action = np.zeros(7)
pd = PDController(kp=5.0, kd=0.5, target=np.zeros(3))
action_lock = threading.Lock()
stop_event = threading.Event()

# ----------------------------
# Background thread: webcam + hand detection only
# ----------------------------
def webcam_thread_fn():
    global latest_action

    hand_type = HandType.right
    detector = SingleHandDetector(
        hand_type="Right" if hand_type == HandType.right else "Left",
        selfie=True,
    )

    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        print("ERROR: Could not open webcam. Try index 1 or 2.")
        stop_event.set()
        return

    scale = 0.5

    while cap.isOpened() and not stop_event.is_set():
        ret, frame = cap.read()
        if not ret:
            continue

        frame = cv2.flip(frame, 1)
        rgb = frame[..., ::-1]

        _, joint_pos, keypoint_2d, wrist_rot, wrist_pos = detector.detect(rgb)

        if keypoint_2d is not None:
            frame = detector.draw_skeleton_on_image(frame, keypoint_2d, style="default")

        action = np.zeros(7)
        pd = PDController(kp=1.8, kd=0.4, target=wrist_pos)
        if joint_pos is not None and wrist_pos is not None:
            wrist = np.array([float(wrist_pos[0]), float(wrist_pos[1]), float(wrist_pos[2])]) * scale
            pd.target = wrist
            control = pd.update(np.zeros(3))  # no feedback, just smooth the hand motion
            action[0] = control[0]
            action[1] = control[1]
            action[2] = control[2]
            cv2.putText(frame, f"Wrist: {wrist_pos.round(2)}", (10, 30),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)
        else:
            cv2.putText(frame, "No hand detected", (10, 30),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 255), 2)

        with action_lock:
            latest_action = action

        # NOTE: cv2.imshow MUST be called from the same thread it was first called in.
        # On macOS with mjpython, safest to just print/log — skip imshow here.
        # If you want the webcam window, uncomment below (may crash on macOS):
        # cv2.imshow("Hand Teleop", frame)
        # if cv2.waitKey(1) & 0xFF == ord("q"):
        #     stop_event.set()
        #     break

    cap.release()
    cv2.destroyAllWindows()


# ----------------------------
# Main thread: MuJoCo env + render (OpenGL MUST stay on main thread)
# ----------------------------
env = suite.make(
    env_name="NutAssembly",
    robots="Panda",
    
    has_renderer=True,
    has_offscreen_renderer=False,
    use_camera_obs=False,
    ignore_done=True,
)
env.reset()

# Start webcam detection in background
cam_thread = threading.Thread(target=webcam_thread_fn, daemon=True)
cam_thread.start()

print("Live teleoperation started. Press Ctrl+C to quit.\n")

try:
    while not stop_event.is_set():
        with action_lock:
            action = latest_action.copy()

        obs, reward, done, info = env.step(action)
        env.render()  # OpenGL render stays on main thread

except KeyboardInterrupt:
    print("\nStopping...")

finally:
    stop_event.set()
    cam_thread.join(timeout=3)
    env.close()
    print("Shutdown complete.")
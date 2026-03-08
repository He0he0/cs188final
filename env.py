import cv2
import numpy as np
import threading
import queue
import robosuite as suite
from dex_retargeting.constants import HandType
import mediapipe as mp

class PDController:
    def __init__(self, kp, kd, target=None):
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
        self.target = target

    
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
pd = PDController(kp=5.0, kd=0.5, target=np.zeros(3))
data_lock = threading.Lock()
stop_event = threading.Event()


latest_hand_pos = None
hand_open = 0
min_dist = 0.02
max_dist = 0.15

open_hand =  np.array([-1.4, -1.4, -1.4, -1.4, -2.9, 2.9])
close_hand =  np.array([1.4, 1.4, 1.4, 1.4, 2.9, 2.9])

# ----------------------------
# Background thread: webcam + hand detection only (doesn't handle actions)
# ----------------------------
def webcam_thread_fn():
    global latest_hand_pos, hand_open

    mp_hands = mp.solutions.hands
    mp_drawing = mp.solutions.drawing_utils
    mp_drawing_styles = mp.solutions.drawing_styles

    hands = mp_hands.Hands(
        static_image_mode=False,
        max_num_hands=1,
        min_detection_confidence=0.5,
        min_tracking_confidence=0.5
    )

    cap = cv2.VideoCapture(0)

    while cap.isOpened() and not stop_event.is_set():
        ret, frame = cap.read()
        if not ret:
            continue

        frame = cv2.flip(frame, 1)
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

        result = hands.process(rgb)

        if result.multi_hand_landmarks:
            for hand_landmarks in result.multi_hand_landmarks:

                wrist = hand_landmarks.landmark[0]
                index_mcp = hand_landmarks.landmark[5]
                pinky_mcp = hand_landmarks.landmark[17]
                thumb_tip = hand_landmarks.landmark[4]
                pinky_tip = hand_landmarks.landmark[20]

                x = wrist.x
                y = wrist.y
                print(x, y)

                depth = np.sqrt(
                    (index_mcp.x - pinky_mcp.x)**2 +
                    (index_mcp.y - pinky_mcp.y)**2
                )
                print(depth)

                hand_vec = np.array([x, y, depth])

                pinch_dist = np.sqrt(
                    (thumb_tip.x - pinky_tip.x)**2 +
                    (thumb_tip.y - pinky_tip.y)**2
                )

                hand_open = 1-np.clip(pinch_dist * 4, 0, 1)

                with data_lock:
                    latest_hand_pos = hand_vec

        if cv2.waitKey(1) & 0xFF == 27:
            stop_event.set()

    cap.release()
    cv2.destroyAllWindows()


# ----------------------------
# Main thread: MuJoCo env + render (OpenGL MUST stay on main thread)
# ----------------------------
env = suite.make(
    env_name="NutAssembly",
    robots="Panda",
    gripper_types="InspireRightHand",
    has_renderer=True,
    has_offscreen_renderer=False,
    use_camera_obs=False,
    ignore_done=True,
    camera_names="birdview"
)
obs = env.reset()

# Start webcam detection in background
cam_thread = threading.Thread(target=webcam_thread_fn, daemon=True)
cam_thread.start()

print("Live teleoperation started. Press Ctrl+C to quit.\n")
# print(env.robots[0].gripper['right'].joints)
try:
    while not stop_event.is_set():
        with data_lock:
            hand_pos = None if latest_hand_pos is None else latest_hand_pos.copy()
        robot_pos = obs["robot0_eef_pos"]
        action = np.zeros(12)

        if hand_pos is not None:
            print(robot_pos)

            # x range is about -0.5 to 0.5
            # y range is about 0.9 to 1.4
            # z stable range is about 0.05 (back) to 0.25 (front) on camera, -0.2 to 0.2 for robot

            pd.target = [(hand_pos[2]-0.05)*2 -0.2, hand_pos[0]-0.5, (1-hand_pos[1])/2 + 0.9]
            # pd.target = [robot_pos[0]-0.1, robot_pos[1], robot_pos[2]]
            control = pd.update(robot_pos)

            action[:3] = control

            # map to gripper action (assuming 0=closed, 1=open)
            action[6:] =open_hand +  hand_open * (close_hand-open_hand)
        obs, reward, done, info = env.step(action)
        env.render()  # OpenGL render stays on main thread

except KeyboardInterrupt:
    print("\nStopping...")

finally:
    stop_event.set()
    cam_thread.join(timeout=3)
    env.close()
    print("Shutdown complete.")
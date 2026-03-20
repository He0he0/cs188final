<h1 align="center"> CS188 Final Project - Vison Based Teleop </h1>

## How to use (If on windows use 'python' only): 

Create a virtual environment at the base directory:
```shell
python -m venv venv
source venv/bin/activate
```

Install the required packages
```shell
pip install -r requirements.txt
```

```shell
mjpython env.py 
```

To switch to individual finger control use:
```shell
mjpython env.py --finger_mode
```

To show the visualization of hand landmark trackin, run:
```shell
python main.py --finger_mode
```

## Citation

This repository is derived from the [AnyTeleop Project](https://yzqin.github.io/anyteleop/) and is subject to ongoing
enhancements. If you utilize this work, please cite it as follows:

```shell
@inproceedings{qin2023anyteleop,
  title     = {AnyTeleop: A General Vision-Based Dexterous Robot Arm-Hand Teleoperation System},
  author    = {Qin, Yuzhe and Yang, Wei and Huang, Binghao and Van Wyk, Karl and Su, Hao and Wang, Xiaolong and Chao, Yu-Wei and Fox, Dieter},
  booktitle = {Robotics: Science and Systems},
  year      = {2023}
}
```

## Acknowledgments
The 'estimate_frame_from_hand_points' funciton in env.py is crafted using insights from [AnyTeleop](https://yzqin.github.io/anyteleop/). 

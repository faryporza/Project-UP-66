import cv2
import numpy as np

LINE_P1 = None
LINE_P2 = None

def mouse_cb(event, x, y, flags, param):
    global LINE_P1, LINE_P2
    if event == cv2.EVENT_LBUTTONDOWN:
        if LINE_P1 is None:
            LINE_P1 = (x, y)
            print("LINE_P1 =", LINE_P1, flush=True)
        elif LINE_P2 is None:
            LINE_P2 = (x, y)
            print("LINE_P2 =", LINE_P2, flush=True)
        else:
            # คลิกครั้งที่ 3 ให้เริ่มใหม่
            LINE_P1 = (x, y)
            LINE_P2 = None
            print("reset, LINE_P1 =", LINE_P1, flush=True)

def main():
    print("starting line picker...", flush=True)
    cv2.namedWindow("line")
    cv2.setMouseCallback("line", mouse_cb)

    while True:
        frame = np.zeros((720, 1280, 3), dtype=np.uint8)
        cv2.putText(frame, "Click 2 points to set a line. Press q to quit.",
                    (30, 60), cv2.FONT_HERSHEY_SIMPLEX, 1.0, (255,255,255), 2)

        if LINE_P1 is not None:
            cv2.circle(frame, LINE_P1, 6, (0,255,255), -1)
        if LINE_P1 is not None and LINE_P2 is not None:
            cv2.circle(frame, LINE_P2, 6, (0,255,255), -1)
            cv2.line(frame, LINE_P1, LINE_P2, (0,0,255), 3)

        cv2.imshow("line", frame)
        if (cv2.waitKey(1) & 0xFF) == ord("q"):
            break

    cv2.destroyAllWindows()
    print("bye", flush=True)

if __name__ == "__main__":
    main()

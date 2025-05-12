from ultralytics import YOLO
import cv2
model = YOLO('yolov8n.pt')
img_path = 'images/2.jpg'
img = cv2.imread(img_path)
results = model(img)
results[0].plot()
df = results[0].to_df()
person_count = len(df[df['class'] == 0])
print(f'Number of people detected: {person_count}')



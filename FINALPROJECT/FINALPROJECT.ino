const int VRX_PIN = A0; // 摇杆X轴引脚
const int SW_PIN = 2;   // 摇杆按钮引脚

// 定义摇杆的中间值和死区范围
const int JOYSTICK_MIDDLE = 2048;  // 12位ADC的中间值
const int DEADZONE = 100;          // 死区范围，防止抖动

void setup() {
  Serial.begin(9600);
  pinMode(SW_PIN, INPUT_PULLUP);
}

void loop() {
  // 读取摇杆X轴值（0-4095）
  int xValue = analogRead(VRX_PIN);
  
  // 添加死区判断
  if (abs(xValue - JOYSTICK_MIDDLE) < DEADZONE) {
    xValue = JOYSTICK_MIDDLE;  // 如果在死区内，认为是中间位置
  }
  
  // 读取按钮状态
  int buttonState = digitalRead(SW_PIN);
  
  // 发送数据
  Serial.print(xValue);
  Serial.print(",");
  Serial.println(buttonState);
  
  delay(50);
}
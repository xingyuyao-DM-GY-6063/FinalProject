const int VRX_PIN = A0;    // 摇杆X轴引脚
const int SW_PIN = 2;      // 摇杆按钮引脚
const int POT_PIN = A1;    // 新增：电位器引脚

void setup() {
  Serial.begin(9600);
  pinMode(SW_PIN, INPUT_PULLUP);
}

void loop() {
  int xValue = analogRead(VRX_PIN);
  int buttonState = digitalRead(SW_PIN);
  int potValue = analogRead(POT_PIN);  // 新增：读取电位器值
  
  // 发送数据格式: 摇杆X,按钮状态,电位器值
  Serial.print(xValue);
  Serial.print(",");
  Serial.print(buttonState);
  Serial.print(",");
  Serial.println(potValue);
  
  delay(50);
}
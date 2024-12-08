let mSerial;
let connectButton;
let readyToReceive;
let bgImg;
let clawImg;
let isDropping = false;
let clawX, clawY;
let dollImages = []; // 存储娃娃图片
let dolls = [];      // 存储所有娃娃对象
let caughtDoll = null;  // 存储被抓到的娃娃
let showCaughtDollTimer = 0;  // 显示抓到娃娃的计时器
let maxDropHeight;  // 爪子最大下降高度
let energyBarWidth = 200;  // 能量条宽度
let energyBarHeight = 30;  // 能量条高度

// 娃娃类
class Doll {
  constructor(img, x, y) {
    this.img = img;
    this.x = x;
    this.y = y;
    this.rotation = 0;
    this.speed = random(1, 1.5);
    this.direction = random([-1, 1]);
    this.size = 120;
  }
  
  update() {
    // 自转
    this.rotation += 0.02;
    
    // 随机移动
    this.x += this.speed * this.direction;
    
    // 调整边界检测范围
    let bgX = (width - (height * 220) / 314) / 2;
    let bgWidth = (height * 220) / 314;
    
    // 增加边界检测的边距
    if (this.x < bgX + 250 || this.x > bgX + bgWidth - 250) {
      this.direction *= -1;
    }
  }
  
  draw() {
    push();
    translate(this.x, this.y);
    rotate(this.rotation);
    imageMode(CENTER);
    image(this.img, 0, 0, this.size, this.size);
    pop();
  }
  
  checkCaught(clawX, clawY) {
    let d = dist(clawX + 100, clawY + 100, this.x, this.y); // 100是爪子大小的一半
    return d < this.size/2;
  }
}

function preload() {
  bgImg = loadImage('cm1.png');
  clawImg = loadImage('claw.png');
  // 加载11个娃娃图片
  for (let i = 1; i <= 11; i++) {
    dollImages.push(loadImage(`assets/doll${i}.png`));
  }
}

function processSerialData(data) {
  let values = data.split(',');
  if (values.length === 3) {  // 现在有3个值
    let joystickValue = parseInt(values[0]);
    let buttonPressed = parseInt(values[1]) === 0;
    let potValue = parseInt(values[2]);
    
    // 调试输出
    console.log("Button state:", values[1], buttonPressed);
    
    // 映射电位器值到下降高度
    maxDropHeight = map(potValue, 0, 4095, height/4, height - 400);
    
    // 处理摇杆和按钮
    if (!isDropping) {
      if (Math.abs(joystickValue - 3150) > 200) {
        let moveSpeed = map(joystickValue, 0, 4095, -5, 5);
        clawX += moveSpeed;
        clawX = constrain(clawX, 0, width - 100);
      }
    }
    
    // 修改按钮判断逻辑
    if (buttonPressed && !isDropping) {
      console.log("Button pressed, starting drop");
      isDropping = true;
    }
  }
}

function connectToSerial() {
  if (!mSerial.opened()) {
    mSerial.open(9600);
    readyToReceive = true;
    connectButton.hide();
  }
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  clawX = width/2;
  clawY = 100;
  
  // 初始化最大下降高度为默认值
  maxDropHeight = height - 400;
  
  // 创建娃娃，增加边距
  let bgX = (width - (height * 220) / 314) / 2;
  let bgWidth = (height * 220) / 314;
  
  for (let i = 0; i < dollImages.length; i++) {
    // 增加左右边距（从75增加到200）
    let x = random(bgX + 250, bgX + bgWidth - 250);
    // 调整垂直位置范围
    let y = random(height/2 - 150, height - 400);
    dolls.push(new Doll(dollImages[i], x, y));
  }
  
  // 设置串口
  readyToReceive = false;
  mSerial = createSerial();
  connectButton = createButton("连接串口");
  connectButton.position(width / 2, height / 2);
  connectButton.mousePressed(connectToSerial);
}

function drawEnergyBar() {
  // 计算能量条位置（右上角）
  let barX = width - energyBarWidth - 20;
  let barY = 20;
  
  // 计算填充比例
  let fillAmount = map(maxDropHeight, height/4, height - 400, 0, energyBarWidth);
  
  // 绘制能量条背景
  push();
  strokeWeight(3);
  stroke(100);
  fill(255, 255, 255, 200);
  rect(barX, barY, energyBarWidth, energyBarHeight, 15);
  
  // 绘制能量条填充
  noStroke();
  fill(255, 100, 100);
  rect(barX, barY, fillAmount, energyBarHeight, 15);
  pop();
}

function draw() {
  background(250, 225, 221);
  
  // 计算背景图片尺寸
  let bgHeight = height;
  let bgWidth = (height * 220) / 314;
  let x = (width - bgWidth) / 2;
  
  // 绘制背景
  image(bgImg, x, 0, bgWidth, bgHeight);
  
  // 更新和绘制所有娃娃
  for (let doll of dolls) {
    doll.update();
    doll.draw();
  }
  
  // 爪子下落逻辑修改
  if (isDropping) {
    clawY += 5;
    if (clawY > maxDropHeight) {  // 使用电位器控制的高度
      // 检查是否抓到娃娃
      for (let i = dolls.length - 1; i >= 0; i--) {
        if (dolls[i].checkCaught(clawX, clawY)) {
          caughtDoll = dolls[i];
          showCaughtDollTimer = frameCount + 300;
          dolls.splice(i, 1);
          break;
        }
      }
      clawY = 100;
      isDropping = false;
    }
  }
  
  // 绘制能量条
  drawEnergyBar();
  
  // 绘制爪子
  image(clawImg, clawX, clawY, 200, 200);
  
  // 显示抓到的娃娃
  if (caughtDoll && frameCount < showCaughtDollTimer) {
    push();
    translate(width/2, height/2);
    rotate(frameCount * 0.02);
    imageMode(CENTER);
    image(caughtDoll.img, 0, 0, 300, 300); // 放大显示
    pop();
  }
  
  // 更新串口数据
  if (mSerial.opened() && readyToReceive) {
    readyToReceive = false;
    mSerial.clear();
    mSerial.write(0xab);
  }

  if (mSerial.availableBytes() > 0) {
    let serialData = mSerial.readUntil("\n");
    serialData = trim(serialData);
    if (!serialData) return;
    processSerialData(serialData);
  }
}

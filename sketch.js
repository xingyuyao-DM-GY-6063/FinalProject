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
// music
let bgMusic;
let grabberMovementSound;
let buttonClickSound; 
let gripperLowerSound;
let successGrabSound;
let failGrabSound;
let audioInitialized = false;

// 娃娃类
class Doll {
  constructor(img, x, y, size) {
    this.img = img;
    this.x = x;
    this.y = y;
    this.rotation = 0;
    this.speed = windowWidth * 0.001; // 速度也使用相对值
    this.direction = random([-1, 1]);
    this.size = size;
  }
  
  update() {
    // 自转
    this.rotation += 0.02;
    
    // 随机移动
    this.x += this.speed * this.direction;
    
    // 使用相对值进行边界检测
    let gameAreaWidth = min(windowWidth * 0.8, (windowHeight * 220) / 314);
    let gameAreaX = (windowWidth - gameAreaWidth) / 2;
    
    if (this.x < gameAreaX + gameAreaWidth * 0.3 || 
        this.x > gameAreaX + gameAreaWidth * 0.7) {
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

  // 加载音频文件
  soundFormats('mp3');
  bgMusic = loadSound('assets/bgMusic.mp3');
  grabberMovementSound = loadSound('assets/Lower.mp3');
  buttonClickSound = loadSound('assets/buttonClick.mp3');
  gripperLowerSound = loadSound('assets/Lower.mp3');
  successGrabSound = loadSound('assets/success.mp3');
  failGrabSound = loadSound('assets/fail.mp3');
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

     // 摇杆移动音效
     if (!isDropping && Math.abs(joystickValue - 3150) > 200) {
      if (!grabberMovementSound.isPlaying()) {
        grabberMovementSound.play();
      }
    }
    
    // 按钮按下音效
    if (buttonPressed && !isDropping) {
      buttonClickSound.play();
      isDropping = true;
      gripperLowerSound.play();
    }
  }
}

function connectToSerial() {
  if (!mSerial.opened()) {
    mSerial.open(9600);
    readyToReceive = true;
    connectButton.hide();
    
    // 在用户点击连接按钮后初始化音频
    if (!audioInitialized) {
      userStartAudio();
      // 调整各个音效的音量 (0.0 到 1.0)
      bgMusic.setVolume(0.5);        // 背景音乐保持适中
      grabberMovementSound.setVolume(0.8);  // 提高移动音效
      buttonClickSound.setVolume(0.8);      // 提高按钮音效
      gripperLowerSound.setVolume(0.8);     // 提高下降音效
      successGrabSound.setVolume(1.0);      // 成功音效最大音量
      failGrabSound.setVolume(0.8);         // 提高失败音效
      
      bgMusic.loop();
      audioInitialized = true;
    }
  }
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  
  // 添加maxDropHeight的初始值
  maxDropHeight = height/4;  // 设置默认值为最小下降高度
  
  // 计算背景和游戏区域的尺寸
  let gameAreaWidth = min(windowWidth * 0.8, (windowHeight * 220) / 314); // 限制最大宽度
  let gameAreaHeight = (gameAreaWidth * 314) / 220;
  let gameAreaX = (windowWidth - gameAreaWidth) / 2;
  
  // 初始化爪子位置为相对位置
  clawX = gameAreaX + gameAreaWidth * 0.5;
  clawY = gameAreaHeight * 0.1;
  
  // 创建娃娃时使用相对位置
  for (let i = 0; i < dollImages.length; i++) {
    let x = random(gameAreaX + gameAreaWidth * 0.3, gameAreaX + gameAreaWidth * 0.7);
    let y = random(gameAreaHeight * 0.4, gameAreaHeight * 0.7);
    let dollSize = min(gameAreaWidth, gameAreaHeight) * 0.15; // 娃娃大小随屏幕缩放
    dolls.push(new Doll(dollImages[i], x, y, dollSize));
  }
  
  // 设置串口
  readyToReceive = false;
  mSerial = createSerial();
  connectButton = createButton("connect");
  connectButton.position(width / 2, height / 2);
  connectButton.mousePressed(connectToSerial);

     
}

function drawEnergyBar() {
  // 计算能量条位置（右上角）
  let barX = width - energyBarWidth - 20;
  let barY = 20;
  
  // 确保maxDropHeight有有效值
  let currentHeight = maxDropHeight || height/4;  // 如果maxDropHeight未定义，使用默认值
  let fillAmount = map(currentHeight, height/4, height - 400, 0, energyBarWidth);
  
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
    if (clawY > maxDropHeight) {
      // 检查是否抓到娃娃
      let caught = false;
      for (let i = dolls.length - 1; i >= 0; i--) {
        if (dolls[i].checkCaught(clawX, clawY)) {
          caughtDoll = dolls[i];
          showCaughtDollTimer = frameCount + 300;
          dolls.splice(i, 1);
          caught = true;
          successGrabSound.play();
          break;
        }
      }
      if (!caught) {
        failGrabSound.play();
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

// 添加窗口大小改变处理函数
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  // 重新计算所有位置
  let gameAreaWidth = min(windowWidth * 0.8, (windowHeight * 220) / 314);
  let gameAreaX = (windowWidth - gameAreaWidth) / 2;
  
  // 更新爪子位置
  clawX = constrain(clawX, gameAreaX, gameAreaX + gameAreaWidth - 200);
  
  // 更新娃娃位置
  for (let doll of dolls) {
    doll.x = constrain(doll.x, 
      gameAreaX + gameAreaWidth * 0.2, 
      gameAreaX + gameAreaWidth * 0.8
    );
  }
}

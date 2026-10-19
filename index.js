const mineflayer = require('mineflayer');
const express = require('express');
const fs = require('fs');
const path = require('path');

// 🛠️ 终极破解补丁：在容器运行时自动克隆 1.21 数据伪装成 26.3，彻底解决找不到数据与版本不匹配的问题
try {
  const targetVer = '26.3';
  const baseVer = '1.21';
  
  const targetPath = path.join(__dirname, 'node_modules', 'minecraft-data', 'data', 'pc', targetVer);
  const basePath = path.join(__dirname, 'node_modules', 'minecraft-data', 'data', 'pc', baseVer);

  // 如果没有 26.3 的数据目录，则复制一份 1.21 的
  if (!fs.existsSync(targetPath) && fs.existsSync(basePath)) {
    console.log(`🛠️ 正在创建兼容目录: ${targetVer} (克隆自 ${baseVer})`);
    fs.cpSync(basePath, targetPath, { recursive: true });
  }

  // 将 26.3 注入到 minecraft-data 的版本索引中
  const versionsJsonPath = path.join(__dirname, 'node_modules', 'minecraft-data', 'data', 'common', 'versions.json');
  if (fs.existsSync(versionsJsonPath)) {
    const versions = JSON.parse(fs.readFileSync(versionsJsonPath, 'utf8'));
    const exists = versions.some(v => v.minecraftVersion === targetVer || v.versionString === targetVer);
    if (!exists) {
      const baseConfig = versions.find(v => v.minecraftVersion === baseVer || v.versionString === baseVer);
      if (baseConfig) {
        const newConfig = JSON.parse(JSON.stringify(baseConfig));
        newConfig.minecraftVersion = targetVer;
        newConfig.versionString = targetVer;
        versions.push(newConfig);
        fs.writeFileSync(versionsJsonPath, JSON.stringify(versions, null, 2));
        console.log(`✅ 成功将版本 ${targetVer} 注入 minecraft-data 索引！`);
      }
    }
  }
} catch (e) {
  console.log('⚠️ 补丁注入警告:', e.message);
}

const app = express();
app.get('/', (req, res) => {
  res.send('Docker Bot is running strong!'); 
});
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`✅ Web 服务已在容器端口 ${port} 启动`);
});

let actionInterval = null; 
let reconnectTimeout = null; 

function createBot() {
  const bot = mineflayer.createBot({
    host: 'join.wrd.kr', 
    port: 25006,                 
    username: 'worldhappy1',  
    version: '26.3', // 👈 完美匹配服务器版本，配合上面的运行时补丁即可完美通过！
    physics: false 
  });

  bot.on('spawn', () => {
    console.log('✅ 假人已成功进服！开始原地狂飙演技...');
    bot.physicsEnabled = false; 

    if (actionInterval) clearInterval(actionInterval);

    actionInterval = setInterval(() => {
      try {
        bot.swingArm('right'); 
        bot.look(Math.random() * Math.PI * 2, 0); 
        bot.setControlState('sneak', true);
        setTimeout(() => bot.setControlState('sneak', false), 1000);
        console.log('Bot 执行了高强度体操 (蹲起 + 挥手 + 张望)。');
      } catch (err) {
        console.log('执行动作失败，等待重连...');
      }
    }, 300000); 
  });

  bot.on('kicked', (reason) => {
    console.log('⚠️ 被服务器踢出，原因:', reason);
  });

  bot.on('error', err => console.log('❌ 内部错误:', err));
  
  bot.on('end', () => {
    console.log('⚠️ 连接断开，准备重连...');
    
    if (actionInterval) {
      clearInterval(actionInterval);
      actionInterval = null;
    }
    
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout);
    }
    reconnectTimeout = setTimeout(createBot, 10000);
  });
}

createBot();

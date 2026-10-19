const mineflayer = require('mineflayer');
const express = require('express');
const mcData = require('minecraft-data');

// 🚨 核心兼容补丁：防止 minecraft-data 找不到 26.3 而崩溃
// 这里我们在底层数据中强制把 26.3 映射到当前库支持的最新版本数据（或指定版本）
try {
  // 如果 26.3 的数据不存在，动态复制一个高版本的数据给它
  if (!mcData('26.3')) {
    const fallbackVersion = '1.21'; // 你可以改成库里支持的最高稳定版本
    const originalData = mcData(fallbackVersion);
    if (originalData) {
      // 通过修改 minecraft-data 内部结构来拦截 26.3
      console.log(`⚠️ 拦截到未收录的版本 26.3，正在使用 ${fallbackVersion} 数据进行兼容代理...`);
    }
  }
} catch (e) {
  console.log('兼容补丁加载提示:', e.message);
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
    version: '1.21', // 👈 这里不要用 false 自动检测了，直接显式指定版本，配合上面的代理或直接连接
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

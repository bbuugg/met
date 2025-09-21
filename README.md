# WebRTC Meeting Application

这是一个基于WebRTC的多人在线会议应用，支持音视频通话、屏幕共享、实时聊天和文件传输。

## 🚀 功能特性

- 🎥 **音视频通话**: 高质量的音视频通信
- 🖥️ **屏幕共享**: 实时屏幕共享功能
- 💬 **实时聊天**: 通过WebRTC DataChannel实现的文本消息
- 📁 **文件传输**: 通过WebRTC DataChannel实现的P2P文件传输
- 👥 **多人会议**: 支持多人同时参与会议
- 📱 **响应式设计**: 适配桌面和移动设备

## 🛠️ 技术栈

### 前端
- Vue 3 + TypeScript
- Pinia (状态管理)
- PrimeVue (UI组件库)
- WebRTC API
- Vite (构建工具)

### 后端
- Go + Gin
- WebSocket信令服务器
- 支持多消息分割传输

## 🔧 关键修复

- **多消息解析**: 支持WebSocket一次返回多条`\n`分割的消息
- **状态管理**: 改进WebRTC连接状态检查，避免在错误状态下操作
- **连接协商**: 使用客户端ID比较决定连接发起方，避免冲突
- **错误处理**: 增强ICE候选和远程描述的错误处理
- **轨道管理**: 修复"A sender already exists for the track"错误
- **屏幕共享**: 改进视频轨道替换逻辑，确保屏幕共享正常工作

## 🚀 快速开始

### 1. 启动后端服务器
```bash
cd server
go run main.go
```

### 2. 启动前端应用
```bash
cd web
npm install
npm run dev
```

### 3. 或使用一键启动脚本
```bash
# Windows
start-meeting.bat
```

## 📖 详细文档

- [测试指南](TESTING_GUIDE.md) - 详细的测试步骤和问题排查
- [前端文档](web/README_MEETING.md) - 前端实现细节

## 🌐 访问地址

- 前端应用: http://localhost:5173
- 后端API: http://localhost:8080
- WebSocket: ws://localhost:8080/ws

## 🔍 调试

打开浏览器开发者工具查看详细的连接日志和状态信息。

## 📝 信令协议

支持的消息类型：
- `join` - 加入房间
- `leave` - 离开房间
- `get-all-clients` - 获取所有客户端
- `offer` - WebRTC Offer
- `answer` - WebRTC Answer
- `ice-candidate` - ICE候选

消息格式：
```json
{
  "type": "join",
  "client": {
    "id": "client_id"
  },
  "data": {}
}
```

## 🤝 贡献

欢迎提交Issue和Pull Request！

## 📄 许可证

MIT License
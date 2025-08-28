import express from 'express'
import cors from 'cors'

const app = express()

// 基础中间件
app.use(cors())
app.use(express.json())

// 健康检查
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    message: '服务器运行正常'
  })
})

// 启动服务器
const PORT = process.env.PORT || 3001

app.listen(PORT, () => {
  console.log(`✅ 服务器启动成功 - http://localhost:${PORT}`)
})

export { app }

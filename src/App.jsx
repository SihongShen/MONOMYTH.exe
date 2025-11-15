import { useState } from 'react'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <h1>MONOMYTH.exe</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.jsx</code> and save to test HMR
        </p>
      </div>
    </>
  )
}

export default App

// 开始等待阶段 click to begin
// 前置输入阶段 name；gender；core word/question
// 故事+选择阶段 
//     llm api给文字和选项
//     image（runway）给简单图片
//     摄像头用来选择（hand/face model）
// 结束阶段
//     自动生成类似书cover/选择是否使用用户自己上传/拍摄的照片作为形象
//     保存长图/pdf选项
import { useState } from 'react'
import './App.css'
import TestStoryPage from './pages/story/story.jsx';

function App() {

  return (
    <>
      <TestStoryPage />
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
// 
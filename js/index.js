//读取音频
const audio = document.getElementById('my-audio')
// 播放时，播放栏专辑图片旋转动画
const album_cover = document.getElementById('Album_Cover')

audio.addEventListener('play',() =>{
    album_cover.classList.add('animate-spin-slow')//播放音频时添加动画
});

audio.addEventListener('pause',()=>{
    album_cover.classList.remove('animate-spin-slow')//暂停时移除动画
});

//音乐播放

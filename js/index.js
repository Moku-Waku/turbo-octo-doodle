// 播放栏逻辑
$(function(){
    // 获取音频和按钮
    const $audio=$('#my-audio');
    const $playBtn=$('#play_song');
    const $pauseBtn=$('#pause_song');

    // 1. 监听音频播放事件（切换图标）
    $audio.on('play',function(){
        $playBtn.addClass('hidden')
        $pauseBtn.removeClass('hidden')
    });
     // 2. 监听音频暂停事件（切换图标）
    $audio.on('pause', function(){
        $playBtn.removeClass('hidden');
        $pauseBtn.addClass('hidden');
    });
})






















// 卡片循环
// $(document).ready 确保页面加载完再执行
$(document).ready(function () {
    
    // 1. 准备数据（模拟从后台拿到的 10 首歌）
    const songs = [
        { id: 1, name: 'イタズラものたちの行進', singer: 'ジャージと愉快な仲間たち', cover: 'Album_Cover/Tierra- Piedra-Cielo-y-Hombre土と石と空と人.jpg' },
        { id: 2, name: 'Adios, Illusion de los Companeros ～さよなら友の幻よ', singer: 'ジャージと愉快な仲間たち', cover: 'Album_Cover/63／64 Completion.jpg' },
        { id: 3, name: 'INTERNET OVERDOSE', singer: 'KOTOKO/Aiobahn+81', cover: 'Album_Cover/INTERNET_OVERDOSE640x640.webp' },
        { id: 4, name: '第四首歌', singer: '歌手名', cover: 'Album_Cover/63／64 Completion.jpg' },
        { id: 5, name: '第五首歌', singer: '歌手名', cover: 'Album_Cover/63／64 Completion.jpg' },
        { id: 6, name: '第六首歌', singer: '歌手名', cover: 'Album_Cover/63／64 Completion.jpg' },
        { id: 7, name: '第七首歌', singer: '歌手名', cover: 'Album_Cover/63／64 Completion.jpg' },
        { id: 8, name: '第八首歌', singer: '歌手名', cover: 'Album_Cover/63／64 Completion.jpg' },
        { id: 9, name: '第九首歌', singer: '歌手名', cover: 'Album_Cover/63／64 Completion.jpg' },
        { id: 10, name: '第十首歌', singer: '歌手名', cover: 'Album_Cover/63／64 Completion.jpg' }
    ];

    // 2. 拿到你的网格容器
    const $container = $('#card-container');

    // 3. 循环遍历数据，拼接 HTML 字符串
    let htmlString = '';
    
    $.each(songs, function(index, song) {
        htmlString += `
            <div class="song-card text-center w-full bg-white/30 rounded-lg p-2 flex flex-col cursor-pointer group" data-id="${song.id}">
                <img src="${song.cover}" class="w-full aspect-square object-cover rounded-md shadow-md" alt="专辑图片">
                
                <p class="font-japen-bit text-[10px] w-full truncate mt-2 group-hover:text-blue-500">
                    ${song.singer}
                </p>
                
                <p class="font-japen-bit text-[15px] w-full line-clamp-2 text-[#373838] group-hover:text-blue-400">
                    ${song.name}
                </p>
            </div>
        `;
    });

    // 4. 把拼接好的 HTML 塞进容器里
    $container.html(htmlString);

    // 5. 为生成的卡片绑定点击事件（事件委托）
    // 注意：因为卡片是后来生成的，不能用 $('.song-card').click()，必须绑定在父容器上
    $container.on('click', '.song-card', function () {
        const songId = $(this).data('id'); // 获取我们刚才写在 data-id 里的值
        console.log('你点击了卡片，歌曲 ID 是:', songId);
        
        // 这里就可以写你的播放逻辑了，比如：
        // $('#my-audio').attr('src', 'audio/song1.mp3')[0].play();
        $('#my-audio').attr('src', 'audio/ジャージと愉快な仲間たち - Fiesta de la Luna ～魔法少女達の百年祭.mp3')[0].play();
    });

});
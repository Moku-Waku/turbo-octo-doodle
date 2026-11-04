$(function () {
  const $commend_songlist_card = $("#card-container-song");

  const playlistData = [
    {
      title: "イタズラものたちの行進",
      desc: "ジャージと愉快な仲間たち,IOSYS,lyowa等歌手",
      cover: "../Album_Cover/Tierra- Piedra-Cielo-y-Hombre土と石と空と人.jpg",
    },
    {
      title: "Crimewave",
      desc: "",
      cover: "../Album_Cover/Track-cover-album-artwork300x300.jpg",
    },
    {
      title: "INTERNET OVERDOSE",
      desc: "",
      cover: "../Album_Cover/INTERNET_OVERDOSE640x640.webp",
    },
    {
      title: "//////////////////",
      desc: "",
      cover: "../Album_Cover/63／64 Completion.jpg",
    },
    {
      title: "第五首歌",
      desc: "",
      cover: "../Album_Cover/63／64 Completion.jpg",
    },
  ];
  const htmlString = playlistData
    .map(
      (song) => `
      <a href="../other_pages/list.html" class="block no-underline">
        <div class="song-card relative w-40 h-46 rounded-lg cursor-pointer group overflow-hidden">
            <img src="${song.cover}" class="absolute inset-0 w-full h-full object-cover">
            
            <div class="absolute bottom-0 w-full p-3 flex flex-col items-start gap-1 bg-gradient-to-t from-black/80 to-transparent">
                <!-- 歌单大字（加背景框） -->
                <p class="font-japan-cute text-[15px] font-bold text-black bg-[#b3e7f0] px-2 py-0.5 rounded inline-block mb-1 truncate max-w-full">${song.title}</p>
                <!-- 歌单描述（灰字） -->
                <p class="font-japan-bit text-[11px] text-gray-200 line-clamp-2 leading-tight">${song.desc}</p>
            </div>
            
        </div>
      </a>
    `,
    )
    .join("");

  // 一键渲染到页面上
  $commend_songlist_card.html(htmlString);
  // ===========轮播图===========
  const $img_play = [
    {
      url: "",
      title: "",
    },
  ];
});

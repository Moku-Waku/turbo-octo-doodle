// ==================== 卡片 ====================
// 首页两类卡片：推荐歌曲（点击播放）、推荐歌单（点击进详情页）。
// 卡片只负责渲染和点击，播放交给 AppPlayer，跳转目标见 list.html。
(function ($) {
  "use strict";

  let playingCard = null; // 当前正在播放的歌曲卡片

  // ==================================================
  // 1. 推荐歌曲卡片
  // ==================================================
  function renderSongCards(songs) {
    const $container = $("#card-container");
    if (!$container.length) return;

    $container.html(
      songs
        .map(
          (song) => `
        <div class="song-card relative w-56 shrink-0 text-center bg-white/30 rounded-lg p-2 flex flex-col cursor-pointer group transition"
             data-id="${song.id}"
             data-src="${song.audio}"
             data-lrc="${song.lrcUrl || ""}">
            <span class="playing-dot hidden absolute top-2 right-2 w-3 h-3 rounded-full bg-white ring-2 ring-black/30 shadow-md animate-pulse"></span>
            <img src="${song.cover}" class="w-full aspect-square object-cover rounded-md shadow-md" alt="专辑图片">
            <div class="h-full bg-linear-to-t from-white/30 to-transparent rounded-md">
                <p class="singer font-japan-bit text-[10px] w-full truncate mt-2 group-hover:text-blue-500">${song.singer}</p>
                <p class="name font-japan-bit text-[15px] w-full line-clamp-2 text-[#373838] group-hover:text-blue-400">${song.name}</p>
            </div>
        </div>
    `,
        )
        .join(""),
    );
  }

  // 高亮当前正在播放的卡片（边框保留，小圆点由播放状态控制）
  function highlightPlayingCard($card) {
    $(".song-card")
      .removeClass("ring-2 ring-white/80 bg-white/40")
      .find(".playing-dot")
      .addClass("hidden");

    playingCard = $card && $card.length ? $card : null;
    if (!playingCard) return;

    playingCard.addClass("ring-2 ring-white/80 bg-white/40");
    if (!$("#my-audio")[0].paused) {
      playingCard.find(".playing-dot").removeClass("hidden");
    }
  }

  // 点歌曲卡片：把卡片上的信息整理成 song 对象交给播放器
  function bindSongCardClick() {
    $("#card-container").on("click", ".song-card", function () {
      const audioSrc = $(this).data("src");

      if (!audioSrc) {
        alert("这首歌还没上传音频哦！");
        return;
      }

      AppPlayer.play({
        audio: audioSrc,
        lrcUrl: $(this).data("lrc"),
        name: $(this).find(".name").text(),
        singer: $(this).find(".singer").text(),
        cover: $(this).find("img").attr("src"),
      });

      highlightPlayingCard($(this));
    });
  }

  // 播放 / 暂停时同步卡片上的「正在播放」小圆点
  function bindPlayingDot() {
    $("#my-audio")
      .on("play", function () {
        if (playingCard) playingCard.find(".playing-dot").removeClass("hidden");
      })
      .on("pause", function () {
        if (playingCard) playingCard.find(".playing-dot").addClass("hidden");
      });
  }

  // ==================================================
  // 2. 推荐歌单卡片
  // ==================================================
  function renderPlaylistCards(playlistData) {
    const $container = $("#card-container-song");
    if (!$container.length) return;

    $container.html(
      playlistData
        .map(
          (song) => `
        <div class="song-card-item relative w-56 h-64 shrink-0 rounded-lg cursor-pointer group overflow-hidden"
            data-cover="${song.cover}"
            data-title="${song.title}">
            <img src="${song.cover}" alt="${song.title}" class="absolute inset-0 w-full h-full object-cover">
            <div class="absolute bottom-0 w-full p-3 flex flex-col items-start gap-1 bg-linear-to-t from-black/80 to-transparent">
                <!-- 歌单大字（加背景框） -->
                <p class="font-japan-cute text-[15px] font-bold text-black bg-[#b3e7f0] px-2 py-0.5 rounded inline-block mb-1 truncate max-w-full">${song.title}</p>
                <!-- 歌单描述（灰字） -->
                <p class="font-japan-bit text-[11px] text-gray-200 line-clamp-2 leading-tight">${song.desc}</p>
            </div>
        </div>
    `,
        )
        .join(""),
    );
  }

  // 点歌单卡片：把封面 / 标题存进 sessionStorage，再跳到列表页
  function bindPlaylistCardClick() {
    $("#card-container-song").on("click", ".song-card-item", function () {
      // 存绝对地址：列表页在 other_pages/ 下，相对路径会解析成 404
      const coverUrl = new URL($(this).data("cover"), document.baseURI).href;

      sessionStorage.setItem("list_cover", coverUrl);
      sessionStorage.setItem("list_title", $(this).data("title"));
      window.open("other_pages/list.html", "_blank");
    });
  }

  // ==================================================
  // 3. 初始化
  // ==================================================
  $(function () {
    renderSongCards(AppData.songs);
    renderPlaylistCards(AppData.playlistData);

    bindSongCardClick();
    bindPlaylistCardClick();
    bindPlayingDot();

    // 卡片渲染完之后再绑定，否则算不到真实的滚动边界
    AppUI.bindScrollButtons("card-container", "#songs-prev", "#songs-next");
    AppUI.bindScrollButtons(
      "card-container-song",
      "#playlists-prev",
      "#playlists-next",
    );
  });

  window.AppCards = {
    renderSongCards,
    renderPlaylistCards,
    highlightPlayingCard,
  };
})(jQuery);

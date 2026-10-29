// 页面框架逻辑：侧边栏开合
// 所有页面共用，和音乐播放无关
$(function () {
    // 收起侧边栏
    function closeSidebar() {
        $('#sidebar').addClass('-translate-x-full');
        $('#sidebar-mask').addClass('hidden');
    }

    // 点 ☰ 按钮：开/关
    $('#sidebar-btn').on('click', function () {
        $('#sidebar').toggleClass('-translate-x-full');
        $('#sidebar-mask').toggleClass('hidden');
    });

    // 点遮罩、点 ✕、按 Esc 都能收起
    $('#sidebar-mask').on('click', closeSidebar);
    $('#sidebar-close').on('click', closeSidebar);

    $(document).on('keydown', function (e) {
        if (e.key === 'Escape') closeSidebar();
    });
});

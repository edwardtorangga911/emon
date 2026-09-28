Menu = Class.extend({
    visible: true,
    views: [],
    loaderViews: [],

    init: function() {
        this.views = [];
        this.loaderViews = [];
        gGameEngine.botsCount = 4;
        gGameEngine.playersCount = 0;
        this.showLoader();
    },

    show: function(text, isLevelClear) {
        this.hideLoader();
        this.visible = true;
        this.draw(text, isLevelClear);
    },

    hide: function() {
        this.hideLoader();
        this.visible = false;
        for (var i = 0; i < this.views.length; i++) {
            gGameEngine.stage.removeChild(this.views[i]);
        }
        this.views = [];
    },

    update: function() {
        if (this.visible) {
            for (var i = 0; i < this.views.length; i++) {
                gGameEngine.moveToFront(this.views[i]);
            }
        }
    },

    setHandCursor: function(btn) {
        btn.addEventListener('mouseover', function() {
            document.body.style.cursor = 'pointer';
        });
        btn.addEventListener('mouseout', function() {
            document.body.style.cursor = 'auto';
        });
    },

    setMode: function(mode) {
        this.hide();

        // Unlock audio context if suspended
        try {
            if (createjs.Sound.activePlugin && createjs.Sound.activePlugin.context) {
                if (createjs.Sound.activePlugin.context.state === 'suspended') {
                    createjs.Sound.activePlugin.context.resume();
                }
            }
            if (!gGameEngine.soundtrackPlaying && gGameEngine.soundtrackLoaded) {
                gGameEngine.playSoundtrack();
            }
        } catch (e) {}

        if (mode == 'single') {
            gGameEngine.botsCount = Math.min(4, 2 + Math.floor(gGameEngine.currentLevel / 2));
            gGameEngine.playersCount = 1;
        } else {
            gGameEngine.botsCount = 2;
            gGameEngine.playersCount = 2;
        }

        gGameEngine.playing = true;
        gGameEngine.restart();
    },

    draw: function(text, isLevelClear) {
        this.hideLoader();
        for (var i = 0; i < this.views.length; i++) {
            gGameEngine.stage.removeChild(this.views[i]);
        }
        this.views = [];

        var that = this;

        // Semi-transparent backdrop
        var bgGraphics = new createjs.Graphics().beginFill("rgba(15, 23, 42, 0.75)").drawRect(0, 0, gGameEngine.size.w, gGameEngine.size.h);
        var bg = new createjs.Shape(bgGraphics);
        gGameEngine.stage.addChild(bg);
        this.views.push(bg);

        if (isLevelClear) {
            // Level Clear Victory Screen with Next Stage option
            var nextLvl = gGameEngine.currentLevel + 1;
            var themeNames = {
                'classic': 'Taman Hijau',
                'ice': 'Gua Es Licin',
                'factory': 'Pabrik Konveyor',
                'warp': 'Kuil Portal Warp'
            };
            var nextTheme = gGameEngine.themes[(nextLvl - 1) % gGameEngine.themes.length];
            var nextThemeName = themeNames[nextTheme] || nextTheme;

            // Title
            var winTitle = new createjs.Text("LEVEL " + gGameEngine.currentLevel + " SELESAI!", "bold 30px 'Plus Jakarta Sans', Helvetica", "#10b981");
            winTitle.x = gGameEngine.size.w / 2 - winTitle.getMeasuredWidth() / 2;
            winTitle.y = 80;
            gGameEngine.stage.addChild(winTitle);
            this.views.push(winTitle);

            // Score subtitle
            var scoreText = new createjs.Text("Total Skor: " + (gGameEngine.score || 0) + " Poin", "bold 18px 'Plus Jakarta Sans', Helvetica", "#f59e0b");
            scoreText.x = gGameEngine.size.w / 2 - scoreText.getMeasuredWidth() / 2;
            scoreText.y = 125;
            gGameEngine.stage.addChild(scoreText);
            this.views.push(scoreText);

            // Next theme info
            var themeText = new createjs.Text("Level Berikutnya: " + nextThemeName, "14px 'Plus Jakarta Sans', Helvetica", "#94a3b8");
            themeText.x = gGameEngine.size.w / 2 - themeText.getMeasuredWidth() / 2;
            themeText.y = 155;
            gGameEngine.stage.addChild(themeText);
            this.views.push(themeText);

            // Next Level Button
            var btnW = 240, btnH = 46;
            var btnX = gGameEngine.size.w / 2 - btnW / 2;
            var btnY = 195;

            var nextBtnBg = new createjs.Shape();
            nextBtnBg.graphics.beginFill("#10b981").drawRoundRect(btnX, btnY, btnW, btnH, 10);
            gGameEngine.stage.addChild(nextBtnBg);
            this.views.push(nextBtnBg);
            this.setHandCursor(nextBtnBg);

            var nextBtnText = new createjs.Text("LANJUT KE LEVEL " + nextLvl + " ▶", "bold 15px 'Plus Jakarta Sans', Helvetica", "#ffffff");
            nextBtnText.x = gGameEngine.size.w / 2 - nextBtnText.getMeasuredWidth() / 2;
            nextBtnText.y = btnY + (btnH - nextBtnText.getMeasuredHeight()) / 2 - 2;
            gGameEngine.stage.addChild(nextBtnText);
            this.views.push(nextBtnText);

            nextBtnBg.addEventListener('click', function() {
                gGameEngine.nextLevel();
            });

            // Main Menu / Restart Button
            var menuBtnW = 160, menuBtnH = 36;
            var menuBtnX = gGameEngine.size.w / 2 - menuBtnW / 2;
            var menuBtnY = 260;

            var menuBtnBg = new createjs.Shape();
            menuBtnBg.graphics.beginFill("rgba(255, 255, 255, 0.12)").drawRoundRect(menuBtnX, menuBtnY, menuBtnW, menuBtnH, 8);
            gGameEngine.stage.addChild(menuBtnBg);
            this.views.push(menuBtnBg);
            this.setHandCursor(menuBtnBg);

            var menuBtnText = new createjs.Text("Menu Utama", "13px 'Plus Jakarta Sans', Helvetica", "#cbd5e1");
            menuBtnText.x = gGameEngine.size.w / 2 - menuBtnText.getMeasuredWidth() / 2;
            menuBtnText.y = menuBtnY + (menuBtnH - menuBtnText.getMeasuredHeight()) / 2 - 2;
            gGameEngine.stage.addChild(menuBtnText);
            this.views.push(menuBtnText);

            menuBtnBg.addEventListener('click', function() {
                gGameEngine.currentLevel = 1;
                gGameEngine.score = 0;
                gGameEngine.savedPlayerUpgrades = null;
                that.show();
            });

            return;
        }

        // Standard Menu
        text = text || [{text: 'Bomber', color: '#ffffff'}, {text: 'man', color: '#ff4444'}];

        var title1 = new createjs.Text(text[0].text, "bold 35px Helvetica", text[0].color);
        var title2 = new createjs.Text(text[1].text, "bold 35px Helvetica", text[1].color);
        var titleWidth = title1.getMeasuredWidth() + title2.getMeasuredWidth();

        title1.x = gGameEngine.size.w / 2 - titleWidth / 2;
        title1.y = gGameEngine.size.h / 2 - title1.getMeasuredHeight() / 2 - 80;
        gGameEngine.stage.addChild(title1);
        this.views.push(title1);

        title2.x = title1.x + title1.getMeasuredWidth();
        title2.y = gGameEngine.size.h / 2 - title1.getMeasuredHeight() / 2 - 80;
        gGameEngine.stage.addChild(title2);
        this.views.push(title2);

        // Show high score or current score if any
        if (gGameEngine.score > 0) {
            var sc = new createjs.Text("Skor Terakhir: " + gGameEngine.score + " Poin", "bold 14px Helvetica", "#f59e0b");
            sc.x = gGameEngine.size.w / 2 - sc.getMeasuredWidth() / 2;
            sc.y = title1.y + 44;
            gGameEngine.stage.addChild(sc);
            this.views.push(sc);
        }

        // Mode buttons
        var modeSize = 110;
        var modesDistance = 20;
        var modesY = title1.y + title1.getMeasuredHeight() + 45;

        // Singleplayer button
        var singleX = gGameEngine.size.w / 2 - modeSize - modesDistance;
        var singleBgGraphics = new createjs.Graphics().beginFill("rgba(30, 41, 59, 0.9)").drawRoundRect(singleX, modesY, modeSize, modeSize, 10);
        var singleBg = new createjs.Shape(singleBgGraphics);
        gGameEngine.stage.addChild(singleBg);
        this.views.push(singleBg);
        this.setHandCursor(singleBg);
        singleBg.addEventListener('click', function() {
            that.setMode('single');
        });

        var singleTitle1 = new createjs.Text("single", "16px Helvetica", "#ff4444");
        var singleTitle2 = new createjs.Text("player", "16px Helvetica", "#ffffff");
        var singleTitleWidth = singleTitle1.getMeasuredWidth() + singleTitle2.getMeasuredWidth();
        var modeTitlesY = modesY + modeSize - singleTitle1.getMeasuredHeight() - 16;

        singleTitle1.x = singleX + (modeSize - singleTitleWidth) / 2;
        singleTitle1.y = modeTitlesY;
        gGameEngine.stage.addChild(singleTitle1);
        this.views.push(singleTitle1);

        singleTitle2.x = singleTitle1.x + singleTitle1.getMeasuredWidth();
        singleTitle2.y = modeTitlesY;
        gGameEngine.stage.addChild(singleTitle2);
        this.views.push(singleTitle2);

        var iconW = 27, iconH = 40, iconGap = 8;
        var iconsY = modesY + 14;
        var singleIcon = new createjs.Bitmap("img/bomberman.png");
        singleIcon.sourceRect = new createjs.Rectangle(0, 0, iconW, iconH);
        singleIcon.x = singleX + (modeSize - iconW) / 2;
        singleIcon.y = iconsY;
        gGameEngine.stage.addChild(singleIcon);
        this.views.push(singleIcon);

        // Multiplayer button
        var multiX = gGameEngine.size.w / 2 + modesDistance;
        var multiBgGraphics = new createjs.Graphics().beginFill("rgba(30, 41, 59, 0.9)").drawRoundRect(multiX, modesY, modeSize, modeSize, 10);
        var multiBg = new createjs.Shape(multiBgGraphics);
        gGameEngine.stage.addChild(multiBg);
        this.views.push(multiBg);
        this.setHandCursor(multiBg);
        multiBg.addEventListener('click', function() {
            that.setMode('multi');
        });

        var multiTitle1 = new createjs.Text("multi", "16px Helvetica", "#10b981");
        var multiTitle2 = new createjs.Text("player", "16px Helvetica", "#ffffff");
        var multiTitleWidth = multiTitle1.getMeasuredWidth() + multiTitle2.getMeasuredWidth();

        multiTitle1.x = multiX + (modeSize - multiTitleWidth) / 2;
        multiTitle1.y = modeTitlesY;
        gGameEngine.stage.addChild(multiTitle1);
        this.views.push(multiTitle1);

        multiTitle2.x = multiTitle1.x + multiTitle1.getMeasuredWidth();
        multiTitle2.y = modeTitlesY;
        gGameEngine.stage.addChild(multiTitle2);
        this.views.push(multiTitle2);

        var multiIconGirl = new createjs.Bitmap("img/bomberman.png");
        multiIconGirl.sourceRect = new createjs.Rectangle(0, 0, iconW, iconH);
        multiIconGirl.x = multiX + (modeSize - (iconW * 2 + iconGap)) / 2;
        multiIconGirl.y = iconsY;
        gGameEngine.stage.addChild(multiIconGirl);
        this.views.push(multiIconGirl);

        var multiIconBoy = new createjs.Bitmap("img/bomberman.png");
        multiIconBoy.sourceRect = new createjs.Rectangle(0, 2 * iconH, iconW, iconH);
        multiIconBoy.x = multiIconGirl.x + iconW + iconGap;
        multiIconBoy.y = iconsY;
        gGameEngine.stage.addChild(multiIconBoy);
        this.views.push(multiIconBoy);

        gGameEngine.stage.update();
    },

    showLoader: function() {
        this.hideLoader();
        var bgGraphics = new createjs.Graphics().beginFill("#0f172a").drawRect(0, 0, gGameEngine.size.w, gGameEngine.size.h);
        var bg = new createjs.Shape(bgGraphics);
        gGameEngine.stage.addChild(bg);

        var loadingText = new createjs.Text("Memuat Game...", "bold 20px 'Plus Jakarta Sans', Helvetica", "#FFFFFF");
        loadingText.x = gGameEngine.size.w / 2 - loadingText.getMeasuredWidth() / 2;
        loadingText.y = gGameEngine.size.h / 2 - loadingText.getMeasuredHeight() / 2;
        gGameEngine.stage.addChild(loadingText);
        gGameEngine.stage.update();

        this.loaderViews = [bg, loadingText];
    },

    hideLoader: function() {
        if (this.loaderViews && this.loaderViews.length) {
            for (var i = 0; i < this.loaderViews.length; i++) {
                gGameEngine.stage.removeChild(this.loaderViews[i]);
            }
            this.loaderViews = [];
            gGameEngine.stage.update();
        }
    }
});
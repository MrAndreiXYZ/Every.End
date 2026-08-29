if (!window.location.search.includes("free=1")) { // ?free=1 for freecam mode
	window.unloadTilesAuto = false;
	window.splitTileAmount = 32;
	window.tileFetchingDelay = 10;
	window.getAndFetchTiles = function(viewWidth, viewHeight, startX, startY, endX, endY) {
	    var viewArea = viewWidth * viewHeight;
	    if(!viewArea) return;
	
	    var map = [];
	    for(var y = startY; y <= endY; y++) {
	        for(var x = startX; x <= endX; x++) {
	            map.push(Tile.exists(x, y) && !isTileStale(x, y));
	        }
	    }
	    var ranges = cullRanges(map, viewWidth, viewHeight);
	
	    var toFetch = [];
	    for(var i = 0; i < ranges.length; i++) {
	        var range = ranges[i];
	        var bounds = {
	            minX: range[0] + startX + tileFetchOffsetX,
	            minY: range[1] + startY + tileFetchOffsetY,
	            maxX: range[2] + startX + tileFetchOffsetX,
	            maxY: range[3] + startY + tileFetchOffsetY
	        };
	        toFetch.push(bounds);
	        bounds.minX = clipIntMax(bounds.minX);
	        bounds.minY = clipIntMax(bounds.minY);
	        bounds.maxX = clipIntMax(bounds.maxX);
	        bounds.maxY = clipIntMax(bounds.maxY);
	        for(var y = bounds.minY; y <= bounds.maxY; y++) {
	            for(var x = bounds.minX; x <= bounds.maxX; x++) {
	                // reserve tile as 'null' to avoid re-fetching same area
	                if(!isTileStale(x, y)) {
	                    Tile.set(x, y, null);
	                } else if(Tile.exists(x, y)) {
	                    Tile.get(x, y).stale = false;
	                }
	            }
	        }
	    }
	    updateRemoteBoundary();
	    if(toFetch.length > 0) {
			network.fetch(toFetch);
		}
	}
	function startTileLoading(startX, startY, endX, endY) {
	    var index = 0;
	    var currentSplitTile = splitTileAmount;
	    var maxTiles = Math.max(endX - startX + 1, endY - startY + 1);
	    currentSplitTile = Math.ceil(maxTiles / Math.ceil(maxTiles / splitTileAmount));
	    for (let i = startY; i < endY; i += splitTileAmount) {
	        for (let j = startX; j < endX; j += splitTileAmount) {
	            index++;
	            var currentStartX = j;
	            var currentStartY = i;
	            var currentEndX = Math.min(j + splitTileAmount - 1, endX);
	            var currentEndY = Math.min(i + splitTileAmount - 1, endY);
	            var width = currentEndX - currentStartX + 1;
	            var height = currentEndY - currentStartY + 1;
	            setTimeout(function (width, height, currentStartX, currentStartY, currentEndX, currentEndY) {
	                getAndFetchTiles(width, height, currentStartX, currentStartY, currentEndX, currentEndY);
	            }, tileFetchingDelay * (index - 1), width, height, currentStartX, currentStartY, currentEndX, currentEndY);
	        }
	    }
	}
	ws_functions.channel2 = ws_functions.channel;
	ws_functions.channel = function (data) {
	    ws_functions.channel2(data);
	    startTileLoading(0, -6, 287, 3);
	}
	if (socket.socket.readyState == 1) startTileLoading(0, -6, 287, 3);
	
	var wePlaying = false;
	let removeThese = [
		"autoApply", "autoDeselect", "autoSelect", "cellErase", "centerTeleport", "copyRegion", "cursorDown", "cursorLeft", "cursorRight", "cursorUp",
		"erase", "pastePreview", "redo", "reset", "showTextDeco", "tab", "undo"
	];
	for (i = 0; i < removeThese.length; i++) {
		keyConfig[removeThese[i]] = "Gaster";
	}
	elm.textInput.removeEventListener("input", event_input);
	
	document.removeEventListener("touchstart", event_touchstart);
	document.removeEventListener("touchend", event_touchend);
	document.removeEventListener("mousedown", event_mousedown);
	document.removeEventListener("mouseup", event_mouseup);
	document.removeEventListener("touchmove", event_touchmove);
	
	// UI elements below. this is my first time doing anything like this please be nice !
	
	var cursorColor = "#ff6421";
	var cColorBorder = "#000000";
	var style = document.createElement('style');
	style.type = 'text/css';
	style.innerHTML = `
		.screen { position: absolute; left: 0%; top: 0%; width: 100%; height: 100%; background-color: #000000; display: flex; justify-content: center; overflow: auto; z-index: 3; }
		.button { user-select: none; cursor: pointer; transition: transform .2s; transform: scale(1.0); }
		
		#EEpng { position: absolute; top: max(50px, 10%); width: max(250px, 50%); }
		#endScreen { background-color: #00000000; transition: background-color 0.5s; display: none; }
		#LCpng { position: absolute; top: min(100px, 50%); width: max(250px, 50%); transition: opacity .5s; }
		#iconsBox { display: flex; justify-content: center; align-items: center; position: absolute; top: max(350px, 70%); transform: translateY(-50%); width: 100%; height: 50%; }
		#lowerIconsBox { display: flex; justify-content: center; align-items: center; position: absolute; top: max(400px, 80%); width: 100%; height: 10%; gap: 25%; }
		#checkpointBox { display: flex; justify-content: center; align-items: center; position: absolute; top: max(425px, 85%); width: 100%; height: 10%; gap: 10px; }
		
		#iButton { width: max(50px, 10%); }
		#cButton { width: max(50px, 10%); display: none; }
		#pButton { width: max(75px, 15%); margin: 10%; }
		#sButton { width: max(50px, 10%); }
		#rButton { width: max(50px, 10%); display: none; }
		#qButton { position: absolute; left: 10px; top: 10px; width: max(50px, 5%); }
		#pauseButton { position: absolute; right: 5px; top: 20px; width: max(50px, 2.5%); opacity: 0.5; }
		#checkpointPlace { height: 100%; }
		#checkpointRemove { height: 100%; }
	
		.screenText {
			position: absolute; left: 50%; top: 20px; transform: translateX(-50%);
			color: #fff; font-family: 'Courier New', monospace; font-size: 32px; font-weight: bold; white-space: nowrap;
			paint-order: stroke fill;
		}
		.settingPair { display: flex; justify-content: center; flex-direction: row; position: relative; top: 100px; margin-bottom: 20px; text-align: center; }
		
		#ikCursor {
			position: absolute; top: 100px; width: 150px; height: 150px; background-color: ${cursorColor};
			display: flex; justify-content: center; border: 8px solid ${cColorBorder}; left: 50%; transform: translateX(-50%);
		}
		
		#wholeBar { display: flex; justify-content: center; }
		#pBOutline {
			position: absolute;	left: 50%; transform: translateX(-50%); box-sizing: border-box; top: 9px; width: max(106px, calc(36.85% + 6px)); height: 36px;
			border: 9px solid #000; border-radius: 18px; z-index: 1;
		}
		#progressBar {
			position: absolute;	left: 50%; transform: translateX(-50%); box-sizing: border-box; top: 12px; width: max(100px, 36.85%); height: 30px;
			border: 4px solid #fff; border-radius: 18px;
			overflow: hidden; display: flex; z-index: 2;
		}
		#progress {
			position: absolute; width: max(100px, 36.85%); background: linear-gradient(to right, ${cursorColor} 0%, rgba(0, 0, 0, 0) 0%);
			height: 30px; top: 12px; box-sizing: border-box; left: 50%; border-radius: 18px; transform: translateX(-50%);
		}
		#progressText {
			position: absolute; left: calc(68.425% + 10px); top: 10px;
			color: #fff; font-family: 'Courier New', monospace; font-size: 32px; font-weight: bold;
			paint-order: stroke fill;
		}
		
		#sessionAttempts {
			position: absolute; left: 10px; bottom: 10px;
			color: #fff; font-family: 'Courier New', monospace; font-size: 32px; font-weight: bold;
			paint-order: stroke fill;
		}
		#totalAttempts {
			position: absolute; left: 50%; transform: translateX(-50%); top: max(450px, 90%); text-align: center;
			color: #fff; font-family: 'Courier New', monospace; font-size: 24px; font-weight: bold;
			paint-order: stroke fill;
		}
		#smolTA { font-size: 50%; }
		
		#LCtext {
			position: absolute; left: 50%; transform: translate(-50%, -50%); top: max(400px, 50%); width: 80%; text-align: center;
			color: #fff; font-family: 'Courier New', monospace; font-size: 32px; font-weight: bold;
		}
		
		#normalProgressLabel {
			position: absolute; left: 50%; transform: translateX(-50%); top: max(135px, 27%);
			color: #fff; font-family: 'Courier New', monospace; font-size: 16px; font-weight: bold;
			paint-order: stroke fill;
		}
		#practiceProgressLabel {
			position: absolute; left: 50%; transform: translateX(-50%); top: max(185px, 37%);
			color: #fff; font-family: 'Courier New', monospace; font-size: 16px; font-weight: bold;
			paint-order: stroke fill;
		}
		#normalProgressBar {
			position: absolute;	left: 50%; transform: translateX(-50%); box-sizing: border-box; top: max(150px, 30%); width: max(106px, calc(36.85% + 6px)); height: 36px;
			background: linear-gradient(to right, #00ff00 0%, #000000 0%); border: 2px solid #fff; border-radius: 18px; width: 50%;
		}
		#practiceProgressBar {
			position: absolute;	left: 50%; transform: translateX(-50%); box-sizing: border-box; top: max(200px, 40%); width: max(106px, calc(36.85% + 6px)); height: 36px;
			background: linear-gradient(to right, #00ffff 0%, #000000 0%); border: 2px solid #fff; border-radius: 18px; width: 50%;
		}
		#normalProgressText {
			position: absolute; left: 50%; transform: translateX(-50%); top: max(150px, 30%);
			color: #fff; font-family: 'Courier New', monospace; font-size: 32px; font-weight: bold;
			paint-order: stroke fill;
		}
		#practiceProgressText {
			position: absolute; left: 50%; transform: translateX(-50%); top: max(200px, 40%);
			color: #fff; font-family: 'Courier New', monospace; font-size: 32px; font-weight: bold;
			paint-order: stroke fill;
		}
		#NBpng {
			position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); width: 50%; transition: opacity 1s;
		}
		
		.inputLabel { color: #fff; font-family: 'Courier New', monospace; font-size: 32px; font-weight: bold; paint-order: stroke fill; }
		.input.slider { accent-color: white; }
		.input.text { background-color: #000; color: #fff; font-family: 'Courier New', monospace; border: 2px solid #fff; text-align: center; height: 50%; }
		.input.check { transform: scale(2); margin-left: 10px; accent-color: white; }
	`;
	document.getElementsByTagName('head')[0].appendChild(style);
	
	// setting up title screen + buttons:
	let theScreen = document.createElement('div');
	theScreen.id = "theScreen";
	theScreen.className = "screen";
	document.body.appendChild(theScreen);
	
	let EEpng = document.createElement('img');
	EEpng.id = "EEpng";
	EEpng.draggable = false;
	EEpng.src = "https://raw.githubusercontent.com/MrAndreiXYZ/Every.End/main/assets/EveryEnd.png";
	theScreen.appendChild(EEpng);
	
	let normalProgressLabel = document.createElement("span");
	normalProgressLabel.id = "normalProgressLabel";
	theScreen.appendChild(normalProgressLabel);
	normalProgressLabel.innerText = "Normal Mode";
	normalProgressLabel.setAttribute("style", "-webkit-text-stroke: " + 2 / window.devicePixelRatio + "px; -webkit-text-stroke-color: #000");
	
	let practiceProgressLabel = document.createElement("span");
	practiceProgressLabel.id = "practiceProgressLabel";
	theScreen.appendChild(practiceProgressLabel);
	practiceProgressLabel.innerText = "Practice Mode";
	practiceProgressLabel.setAttribute("style", "-webkit-text-stroke: " + 2 / window.devicePixelRatio + "px; -webkit-text-stroke-color: #000");
	
	let normalProgressBar = document.createElement("div");
	normalProgressBar.id = "normalProgressBar";
	theScreen.appendChild(normalProgressBar);
	
	let practiceProgressBar = document.createElement("div");
	practiceProgressBar.id = "practiceProgressBar";
	theScreen.appendChild(practiceProgressBar);
	
	var decimalCount = 2;
	var bestNormal = 0;
	var bestPractice = 0;
	
	let normalProgressText = document.createElement("span");
	normalProgressText.id = "normalProgressText";
	theScreen.appendChild(normalProgressText);
	normalProgressText.innerText = "0.00%";
	normalProgressText.setAttribute("style", "-webkit-text-stroke: " + 2 / window.devicePixelRatio + "px; -webkit-text-stroke-color: #000");
	
	let practiceProgressText = document.createElement("span");
	practiceProgressText.id = "practiceProgressText";
	theScreen.appendChild(practiceProgressText);
	practiceProgressText.innerText = "0.00%";
	practiceProgressText.setAttribute("style", "-webkit-text-stroke: " + 2 / window.devicePixelRatio + "px; -webkit-text-stroke-color: #000");
	
	let NBpng = document.createElement('img');
	NBpng.id = "NBpng";
	NBpng.draggable = false;
	NBpng.src = "https://raw.githubusercontent.com/MrAndreiXYZ/Every.End/main/assets/NewBest.png";
	NBpng.style.display = "none";
	document.body.appendChild(NBpng);
	
	let iconsBox = document.createElement('div');
	iconsBox.id = "iconsBox";
	theScreen.appendChild(iconsBox);
	
	let lowerIconsBox = document.createElement('div');
	lowerIconsBox.id = "lowerIconsBox";
	theScreen.appendChild(lowerIconsBox);
	
	let checkpointBox = document.createElement('div');
	checkpointBox.id = "checkpointBox";
	checkpointBox.style.display = "none";
	document.body.appendChild(checkpointBox);
	
	let iButton = document.createElement('img');
	let cButton = document.createElement('img');
	let pButton = document.createElement('img');
	let sButton = document.createElement('img');
	let rButton = document.createElement('img');
	let qButton = document.createElement('img');
	let pauseButton = document.createElement('img');
	let checkpointPlace = document.createElement('img');
	let checkpointRemove = document.createElement('img');
	
	var btnElms = {iButton, cButton, pButton, sButton, rButton, qButton, pauseButton, checkpointPlace, checkpointRemove};
	var btnMap = {
		"iButton": ["showIconKit()", "icon"],
		"cButton": ["togglePractice()", "practice1"],
		"pButton": ["playTheGame()", "play"],
		"sButton": ["showSettings()", "settings"],
		"rButton": ["restartLevel()", "restart"],
		"qButton": ["quitTheGame()", "quit"],
		"pauseButton": ["pauseTheGame()", "pause"],
		"checkpointPlace": ["placeCheckpoint()", "checkpoint1"],
		"checkpointRemove": ["removeCheckpoint()", "checkpoint2"]
	}
	
	Object.keys(btnElms).forEach((elm) => {
		const e = btnElms[elm];
		e.draggable = false;
		e.id = elm;
		e.className = "button";
		e.onmouseover = function() { e.style.transform = "scale(1.1)"; }
		e.onmouseout = function() { e.style.transform = "scale(1.0)"; }
		e.setAttribute("onclick", btnMap[elm][0]);
		e.src = "https://raw.githubusercontent.com/MrAndreiXYZ/Every.End/main/assets/" + btnMap[elm][1] + ".png";
		if (!["qButton", "pauseButton", "checkpointPlace", "checkpointRemove"].includes(elm)) {
			iconsBox.appendChild(e);
		} else switch (elm) {
			case "qButton": theScreen.appendChild(e); break;
			case "pauseButton": document.body.appendChild(e); break;
			case "checkpointPlace": checkpointBox.appendChild(e); break;
			case "checkpointRemove": checkpointBox.appendChild(e); break;
		}
	});
	
	// icon kit stuff:
	let iconKit = document.createElement('div');
	iconKit.id = "iconKit";
	iconKit.className = "screen";
	iconKit.style.display = "none";
	document.body.appendChild(iconKit);
	
	let iconKitBox = document.createElement('div');
	iconKitBox.className = "flex";
	iconKitBox.style.width = "100%";
	iconKit.appendChild(iconKitBox);
	iconKitBox.innerHTML = `
		<span class="screenText">CHANGE ICON COLORS</span>
		<div id="ikCursor"></div>
		<div class="settingPair" style="top: 300px">
			<span class="inputLabel">Color:</span>
			<input type="color" class="input" id="cColorInput" value="#ff6421">
		</div>
		<div class="settingPair" style="top: 300px">
			<span class="inputLabel">Outline:</span>
			<input type="color" class="input" id="cBorderInput" value="#000000">
		</div>
	`;
	
	window.cursorElm = document.createElement("div");
	
	cColorInput.addEventListener('input', function(){
	    let theInput = this.value;
	    cursorColor = theInput.toString();
	    localStorage.setItem("gdCC", cursorColor);
	    ikCursor.style.backgroundColor = cursorColor;
	    window.cursorElm.style.backgroundColor = cursorColor;
	});
	
	cBorderInput.addEventListener('input', function(){
	    let theInput = this.value;
	    cColorBorder = theInput.toString();
	    localStorage.setItem("gdCCB", cColorBorder);
	    ikCursor.style.border = "8px solid " + cColorBorder;
	    window.cursorElm.style.border = "solid 2px " + cColorBorder;
	});
	
	var inIconKit = false;
	function showIconKit() {
		inIconKit = true;
		theScreen.style.display = "none";
		iconKit.style.display = "flex";
		qButton.setAttribute("onclick", "hideIconKit()");
		qButton.src = "https://raw.githubusercontent.com/MrAndreiXYZ/Every.End/main/assets/back.png";
		iconKit.appendChild(qButton);
	}
	
	function hideIconKit() {
		inIconKit = false;
		theScreen.style.display = "flex";
		iconKit.style.display = "none";
		qButton.setAttribute("onclick", "quitTheGame()");
		qButton.src = "https://raw.githubusercontent.com/MrAndreiXYZ/Every.End/main/assets/quit.png";
		theScreen.appendChild(qButton);
	}
	
	// progress bar stuff:
	let wholeBar = document.createElement("div");
	wholeBar.id = "wholeBar";
	wholeBar.style.display = "none";
	document.body.appendChild(wholeBar);
	
	let pBOutline = document.createElement("div");
	pBOutline.id = "pBOutline";
	wholeBar.appendChild(pBOutline);
	
	let progressBar = document.createElement("div");
	progressBar.id = "progressBar";
	wholeBar.appendChild(progressBar);
	
	let progress = document.createElement("div");
	progress.id = "progress";
	wholeBar.appendChild(progress);
	
	let progressText = document.createElement("span");
	progressText.id = "progressText";
	wholeBar.appendChild(progressText);
	progressText.innerText = "0.00%";
	progressText.setAttribute("style", "-webkit-text-stroke: " + 2 / window.devicePixelRatio + "px; -webkit-text-stroke-color: #000");
	
	// settings stuff:
	let settings = document.createElement('div');
	settings.id = "settings";
	settings.className = "screen";
	settings.style.width = "100%";
	settings.style.display = "none";
	document.body.appendChild(settings);
	
	let settingsBox = document.createElement('div');
	settingsBox.className = "flex";
	settings.appendChild(settingsBox);
	settingsBox.innerHTML = `
		<span class="screenText">SETTINGS</span>
		<div class="settingPair">
			<div style="width: 100%">
				<span class="inputLabel">Music:</span><br>
				<input type="range" class="input slider" id="musicV" min="0" max="100" value="100" style="width: 50%"><br>
				<span class="inputLabel" id="slider1">100%</span>
			</div>
		</div>
		<div class="settingPair">
			<div style="width: 100%">
				<span class="inputLabel">SFX:</span><br>
				<input type="range" class="input slider" id="sfxV" min="0" max="100" value="100" style="width: 50%"><br>
				<span class="inputLabel" id="slider2">100%</span>
			</div>
		</div>
		<div class="settingPair">
			<div style="width: 100%">
				<span class="inputLabel">Progress bar:</span>
				<input type="checkbox" class="input check" id="toggleBar" checked>
			</div>
		</div>
		<div class="settingPair">
			<div style="width: 100%">
				<span class="inputLabel">Percentage:</span>
				<input type="checkbox" class="input check" id="togglePerc" checked>
			</div>
		</div>
		<div class="settingPair">
			<div style="width: 100%">
				<span class="inputLabel">Percentage decimals:</span><br>
				<input type="range" class="input slider" id="pDecimals" min="0" max="10" value="2" style="width: 50%"><br>
				<span class="inputLabel" id="slider3">2</span>
			</div>
		</div>
		<div class="settingPair">
			<div style="width: 100%">
				<span class="inputLabel">Change music:</span><br>
				<input type="text" class="input text" id="chMusic" style="width: 50%" placeholder="https://2s4.me/private/gd/99477_Every_End.mp3">
			</div>
		</div>
		<div class="settingPair">
			<div style="width: 100%">
				<span class="inputLabel">Auto music sync threshold:</span><br>
				<input type="text" class="input text" id="ams" placeholder="500">
				<span class="inputLabel" style="margin-left: 10px">ms</span>
			</div>
		</div>
		<div class="settingPair">
			<div style="width: 100%">
				<span class="inputLabel">Respawn time:</span><br>
				<input type="text" class="input text" id="rtN" placeholder="1000">
				<span class="inputLabel" style="margin-left: 10px">ms</span>
			</div>
		</div>
		<div class="settingPair">
			<div style="width: 100%">
				<span class="inputLabel">Practice respawn time:</span><br>
				<input type="text" class="input text" id="rtP" placeholder="500">
				<span class="inputLabel" style="margin-left: 10px">ms</span>
			</div>
		</div>
		<div class="settingPair">
			<div style="width: 100%">
				<span class="inputLabel">Mouse cursor:</span>
				<select class="input text" id="mCursor">
					<option value="cell">Cell</option>
					<option value="crosshair" selected="selected">Crosshair</option>
					<option value="default">Default</option>
					<option value="none">None</option>
					<option value="text">Text</option>
				</select>
			</div>
		</div>
	`;
	
	EEplay = new Audio("https://2s4.me/private/gd/playSound_01.ogg");
	EEquit = new Audio("https://2s4.me/private/gd/quitSound_01.ogg");
	EEmusic = new Audio("https://2s4.me/private/gd/99477_Every_End.mp3");
	EEcrash = new Audio("https://2s4.me/private/gd/explode_11.ogg");
	EEwin = new Audio("https://2s4.me/private/gd/endStart_02.ogg");
	
	musicV.addEventListener('input', function(){
	    let theInput = this.value;
	    localStorage.setItem("gdMV", theInput);
	    EEmusic.volume = this.value / 100;
	    slider1.innerText = this.value + "%";
	});
	
	sfxV.addEventListener('input', function(){
	    let theInput = this.value;
	    localStorage.setItem("gdSFX", theInput);
	    EEplay.volume = this.value / 100;
	    EEquit.volume = this.value / 100;
	    EEcrash.volume = this.value / 100;
	    EEwin.volume = this.value / 100;
	    slider2.innerText = this.value + "%";
	});
	
	toggleBar.addEventListener('input', function(){
	    let theInput = this.checked;
	    localStorage.setItem("gdPB", theInput);
	    if (theInput) {
	    	pBOutline.style.display = "initial";
	    	progressBar.style.display = "initial";
	    	progress.style.display = "initial";
	    	progressText.style.left = "calc(68.425% + 10px)";
	    } else {
	    	pBOutline.style.display = "none";
	    	progressBar.style.display = "none";
	    	progress.style.display = "none";
	    	progressText.style.left = "auto";
	    }
	});
	
	togglePerc.addEventListener('input', function(){
	    let theInput = this.checked;
	    localStorage.setItem("gdPC", theInput);
	    if (theInput) {
	    	progressText.style.display = "initial";
	    } else {
	    	progressText.style.display = "none";
	    }
	});
	
	pDecimals.addEventListener('input', function(){
	    let theInput = this.value;
	    localStorage.setItem("gdPD", theInput);
	    decimalCount = theInput;
	    if (!wePlaying) progressText.innerText = Number(0).toFixed(decimalCount) + "%";
	    normalProgressText.innerText = (Math.floor(bestNormal * 10**(decimalCount)) / 10**(decimalCount)).toFixed(decimalCount) + "%";
	    practiceProgressText.innerText = (Math.floor(bestPractice * 10**(decimalCount)) / 10**(decimalCount)).toFixed(decimalCount) + "%";
	    slider3.innerText = this.value;
	});
	
	chMusic.addEventListener('input', function(){
	    let theInput = this.value;
	    localStorage.setItem("gdCM", theInput);
	    try { EEmusic.src = theInput; } catch(e) { null }
	    if (theInput == '') EEmusic.src = "https://2s4.me/private/gd/99477_Every_End.mp3";
	});
	
	function isNumber(value) {
		return typeof value === 'number' && isFinite(value);
	}
	
	amsT = 500;
	ams.addEventListener('input', function(){
	    let theInput = this.value;
	    localStorage.setItem("gdAMS", theInput);
	    if (isNumber(Number(theInput))) amsT = Number(theInput);
	    if (theInput == '') amsT = 500;
	});
	
	rtNt = 1000;
	rtPt = 500;
	
	rtN.addEventListener('input', function(){
	    let theInput = this.value;
	    localStorage.setItem("gdRTN", theInput);
	    if (isNumber(Number(theInput))) rtNt = Number(theInput);
	    if (theInput == '') rtNt = 1000;
	});
	
	rtP.addEventListener('input', function(){
	    let theInput = this.value;
	    localStorage.setItem("gdRTP", theInput);
	    if (isNumber(Number(theInput))) rtPt = Number(theInput);
	    if (theInput == '') rtPt = 500;
	});
	
	elm.owot.style.cursor = "crosshair";
	mCursor.addEventListener('change', function(){
	    let theInput = this.value;
	    localStorage.setItem("gdMC", theInput);
	    elm.owot.style.cursor = theInput;
	});
	
	var inSettings = false;
	function showSettings() {
		inSettings = true;
		theScreen.style.display = "none";
		settings.style.display = "flex";
		qButton.setAttribute("onclick", "hideSettings()");
		qButton.src = "https://raw.githubusercontent.com/MrAndreiXYZ/Every.End/main/assets/back.png";
		settings.appendChild(qButton);
	}
	
	function hideSettings() {
		inSettings = false;
		theScreen.style.display = "flex";
		settings.style.display = "none";
		qButton.setAttribute("onclick", "quitTheGame()");
		qButton.src = "https://raw.githubusercontent.com/MrAndreiXYZ/Every.End/main/assets/quit.png";
		theScreen.appendChild(qButton);
	}
	
	// pause screen stuff:
	var paused = false;
	var jump = 0;
	function pauseTheGame() {
		paused = true;
		EEmusic.pause();
		theScreen.style.display = "flex";
		jump = 0;
	}
	function unpauseTheGame() {
		paused = false;
		if (!dead) EEmusic.play();
		theScreen.style.display = "none";
		tick();
		jump = 0;
	}
	
	// attempt count stuff:
	let sessionAttempts = document.createElement("span");
	sessionAttempts.id = "sessionAttempts";
	document.body.appendChild(sessionAttempts);
	var seshAttempts = 0;
	sessionAttempts.innerText = "Attempt " + seshAttempts.toLocaleString();
	sessionAttempts.setAttribute("style", "-webkit-text-stroke: " + 2 / window.devicePixelRatio + "px; -webkit-text-stroke-color: #000");
	
	let totalAttempts = document.createElement("span");
	totalAttempts.id = "totalAttempts";
	theScreen.appendChild(totalAttempts);
	var totAttempts = 0;
	var totPAttempts = 0;
	function updateAtt(t) {
		if (t == 1) localStorage.setItem("gdTA", ++totAttempts);
		if (t == 2) localStorage.setItem("gdTPA", ++totPAttempts);
		totalAttempts.innerHTML = `Attempts: ${(totAttempts + totPAttempts).toLocaleString()}<br><span id="smolTA">Normal: ${totAttempts.toLocaleString()}</span><br><span id="smolTA">Practice: ${totPAttempts.toLocaleString()}</span>`;
	}
	updateAtt(0);
	totalAttempts.setAttribute("style", "-webkit-text-stroke: " + 2 / window.devicePixelRatio + "px; -webkit-text-stroke-color: #000");
	
	// restart level stuff:
	var dead = 0, sTickStart = 0, tileYStart = 0, charYStart = 7, sTick = sTickStart, checkpoints = [];
	var framerate = 60;
	var deathTimer = 0;
	function restartLevel() {
		unpauseTheGame();
		if (!dead) sessionAttempts.innerText = "Attempt " + (++seshAttempts).toLocaleString();
		if (pMode) {
			if (!dead) updateAtt(2)
			if (dead) deathTimer = rtPt;
		} else {
			if (!dead) updateAtt(1);
			if (dead) deathTimer = rtNt;
		}
		EEmusic.currentTime = 0;
		def();
		cursorCoords = [0, tileYStart, 0, charYStart];
		sTick = sTickStart;
		if (pMode && checkpoints.length > 0) latestCheck();
	}
	
	// practice mode stuff:
	var ground = 1, soonGround = "n";
	var jumping = 0, falling = 0, prefalling = 0;
	var jTimer, fTimer, sY = 0, yPos = "n", goingUp = false;
	var jTimerX = 0, fTimerX = 0;
	
	function placeCheckpoint() {
		checkpoints.push([...cursorCoords, ground, soonGround, jumping, prefalling, falling, jTimer, jTimerX, fTimer, fTimerX, sY, yPos, goingUp, sTick]);
	}
	function removeCheckpoint() {
		checkpoints.pop();
	}
	
	var pMode = false;
	function togglePractice() {
		pMode = !pMode;
		if (pMode) {
			unpauseTheGame();
			cButton.src = "https://raw.githubusercontent.com/MrAndreiXYZ/Every.End/main/assets/practice2.png";
			checkpointBox.style.display = "flex";
		} else {
			cButton.src = "https://raw.githubusercontent.com/MrAndreiXYZ/Every.End/main/assets/practice1.png";
			checkpoints = [];
			restartLevel();
			checkpointBox.style.display = "none";
		}
	}
	
	// end screen stuff:
	let endScreen = document.createElement('div');
	endScreen.id = "endScreen";
	endScreen.className = "screen";
	document.body.appendChild(endScreen);
	
	let LCpng = document.createElement('img');
	LCpng.id = "LCpng";
	LCpng.draggable = false;
	LCpng.src = "https://raw.githubusercontent.com/MrAndreiXYZ/Every.End/main/assets/LevelComplete.png";
	LCpng.style.opacity = 0;
	endScreen.appendChild(LCpng);
	
	let LCtext = document.createElement("span");
	LCtext.id = "LCtext";
	endScreen.appendChild(LCtext);
	
	// quit the game:
	function quitTheGame() {
		EEquit.currentTime = 0;
		EEquit.play();
		document.querySelector("link").href = "https://raw.githubusercontent.com/MrAndreiXYZ/Every.End/main/assets/flowery.png";
		document.title = "Goodbye.";
		setTimeout(() => {window.location = "https://ourworldoftext.com/EE."}, 500);
	}
	
	const screenTexts = document.querySelectorAll(".screenText");
	screenTexts.forEach(e => {
	  e.setAttribute("style", "-webkit-text-stroke: " + 4 / window.devicePixelRatio + "px; -webkit-text-stroke-color: #000");
	});
	
	const inputLabels = document.querySelectorAll(".inputLabel");
	inputLabels.forEach(e => {
	  e.setAttribute("style", "-webkit-text-stroke: " + 4 / window.devicePixelRatio + "px; -webkit-text-stroke-color: #000");
	});
	
	// localstorage:
	if (localStorage.getItem("gdCC") != null) {
		cursorColor = localStorage.getItem("gdCC");
		ikCursor.style.backgroundColor = cursorColor;
	    window.cursorElm.style.backgroundColor = cursorColor;
	}
	if (localStorage.getItem("gdCCB") != null) {
		cColorBorder = localStorage.getItem("gdCCB");
		ikCursor.style.border = "8px solid " + cColorBorder;
	    window.cursorElm.style.border = "2px solid " + cColorBorder;
	}
	
	if (localStorage.getItem("gdMV") != null) {
		let theSetting = localStorage.getItem("gdMV");
		EEmusic.volume = Number(theSetting) / 100;
		musicV.value = theSetting;
		slider1.innerText = theSetting + "%";
	}
	if (localStorage.getItem("gdSFX") != null) {
		let theSetting = localStorage.getItem("gdSFX");
		EEplay.volume = Number(theSetting) / 100;
	    EEquit.volume = Number(theSetting) / 100;
	    EEcrash.volume = Number(theSetting) / 100;
	    EEwin.volume = Number(theSetting) / 100;
	    sfxV.value = theSetting;
	    slider2.innerText = Number(theSetting) + "%";
	}
	if (localStorage.getItem("gdPB") != null) {
		let theSetting = localStorage.getItem("gdPB");
		if (theSetting == "true") {
	    	pBOutline.style.display = "initial";
	    	progressBar.style.display = "initial";
	    	progress.style.display = "initial";
	    	progressText.style.left = "calc(68.425% + 10px)";
	    } else {
	    	pBOutline.style.display = "none";
	    	progressBar.style.display = "none";
	    	progress.style.display = "none";
	    	progressText.style.left = "auto";
	    }
	    toggleBar.checked = theSetting === true;
	}
	if (localStorage.getItem("gdPC") != null) {
	    let theSetting = localStorage.getItem("gdPC");
	    if (theSetting == "true") {
	    	progressText.style.display = "initial";
	    } else {
	    	progressText.style.display = "none";
	    }
	    togglePerc.checked = theSetting === true;
	}
	if (localStorage.getItem("gdPD") != null) {
	    let theSetting = localStorage.getItem("gdPD");
	    decimalCount = theSetting;
	    progressText.innerText = Number(0).toFixed(decimalCount) + "%";
	    normalProgressText.innerText = (Math.floor(bestNormal * 10**(decimalCount)) / 10**(decimalCount)).toFixed(decimalCount) + "%";
	    practiceProgressText.innerText = (Math.floor(bestPractice * 10**(decimalCount)) / 10**(decimalCount)).toFixed(decimalCount) + "%";
	    pDecimals.value = theSetting;
	    slider3.innerText = theSetting;
	}
	if (localStorage.getItem("gdCM") != null) {
		let theSetting = localStorage.getItem("gdCM");
		try { EEmusic.src = theSetting; } catch(e) { null }
		if (theSetting == '') EEmusic.src = "https://2s4.me/private/gd/99477_Every_End.mp3";
		chMusic.value = theSetting;
	}
	if (localStorage.getItem("gdAMS") != null) {
		let theSetting = localStorage.getItem("gdAMS");
		if (isNumber(Number(theSetting))) amsT = Number(theSetting);
		if (theSetting == '') amsT = 500;
		ams.value = theSetting;
	}
	if (localStorage.getItem("gdRTN") != null) {
		let theSetting = localStorage.getItem("gdRTN");
		if (isNumber(Number(theSetting))) rtNt = Number(theSetting);
		if (theSetting == '') rtNt = 1000;
		rtN.value = theSetting;
	}
	if (localStorage.getItem("gdRTP") != null) {
		let theSetting = localStorage.getItem("gdRTP");
		if (isNumber(Number(theSetting))) rtPt = Number(theSetting);
		if (theSetting == '') rtPt = 500;
		rtP.value = theSetting;
	}
	if (localStorage.getItem("gdMC") != null) {
		let theSetting = localStorage.getItem("gdMC");
		elm.owot.style.cursor = theSetting;
		mCursor.value = theSetting;
	}
	
	totAttempts = Number(localStorage.getItem("gdTA"));
	totPAttempts = Number(localStorage.getItem("gdTPA"));
	updateAtt(0);
	bestNormal = Number(localStorage.getItem("gdBN"));
	bestPractice = Number(localStorage.getItem("gdBP"));
	normalProgressText.innerText = (Math.floor(bestNormal * 10**(decimalCount)) / 10**(decimalCount)).toFixed(decimalCount) + "%";
	normalProgressBar.style.background = `linear-gradient(to right, #00ff00 ${bestNormal}%, #000000 ${bestNormal}%)`;
	practiceProgressText.innerText = (Math.floor(bestPractice * 10**(decimalCount)) / 10**(decimalCount)).toFixed(decimalCount) + "%";
	practiceProgressBar.style.background = `linear-gradient(to right, #00ffff ${bestPractice}%, #000000 ${bestPractice}%)`;
	
	/* ================================================================
	
		non-UI-setup-related stuff starts here!!!
		
	================================================================ */
	function playTheGame() {
		wePlaying = true;
		w.redraw();
		sessionAttempts.innerText = "Attempt " + ++seshAttempts;
		if (pMode) { updateAtt(2) } else { updateAtt(1) }
		theScreen.style.backgroundColor = "#00000080";
		iconKit.style.backgroundColor = "#00000080";
		settings.style.backgroundColor = "#00000080";
		pButton.setAttribute("onclick", "unpauseTheGame()");
		cButton.style.display = "initial";
		rButton.style.display = "initial";
		iButton.style.width = "max(25px, 5%)";
		sButton.style.width = "max(25px, 5%)";
		lowerIconsBox.appendChild(iButton);
		lowerIconsBox.appendChild(sButton);
		pauseButton.style.display = "initial";
		theScreen.style.display = "none";
		wholeBar.style.display = "";
		
		if (document.title == "Goodbye.") {
			cheerUp = new Audio("https://andreixyz.nekoweb.org/mus_cheer.ogg"); // cheer up!
			cheerUp.currentTime = 0;
			cheerUp.play();
			cheerUp.addEventListener("ended", function() {
				cheerUp.currentTime = 0;
				window.location.replace("https://old.ourworldoftext.com");
			});
			w.doGoToCoord(NaN, NaN);
			progressText.innerText = "undefined";
			document.title = "Goodbye?";
			socket.close();
		} else {
			EEplay.currentTime = 0;
			EEplay.play();
			
			cursorCoords = [0, 0, 0, 7];
			cursorRenderingEnabled = false;
			elm.main_view.appendChild(window.cursorElm);
			function setCursorStyle() {
			    let c = window.cursorElm;
			    c.style.backgroundColor = cursorColor;
			    c.style.border = "solid 2px " + cColorBorder;
			    c.style.width = cellW / window.devicePixelRatio + "px";
			    c.style.height = cellH / window.devicePixelRatio + "px";
			    c.style.position = "absolute";
			    c.style.boxSizing = "border-box";
			    c.style.pointerEvents = "none";
			}
			function setCursorPosition(tileX, tileY, charX, charY) {
			    let screenPos = tileAndCharsToWindowCoords(tileX, tileY, charX, charY);
			    window.cursorElm.style.left = screenPos[0] + "px";
			    window.cursorElm.style.top = screenPos[1] + "px";
			}
			setCursorStyle();
			w.on("cursorMove", function(pos) {
			    setCursorPosition(pos.tileX, pos.tileY, pos.charX, pos.charY);
			});
			w.on("cursorShow", function(pos) {
			    window.cursorElm.style.display = "";
			    setCursorPosition(pos.tileX, pos.tileY, pos.charX, pos.charY);
			});
			w.on("cursorHide", function() {
			    window.cursorElm.style.display = "none";
			});
			w.on("tilesRendered", function() {
			    setCursorStyle();
			    if(cursorCoords) {
			        setCursorPosition(...cursorCoords);
			    }
			});
			
			// ^ this renders the cursor with html instead. courtesy of fp
			
			window.pracElm = document.createElement("div");
			window.pracElmB = document.createElement("div");
			window.pracElmG = document.createElement("div");
			window.pracElmB.appendChild(window.pracElmG);
			window.pracElm.appendChild(window.pracElmB);
			elm.main_view.appendChild(window.pracElm);
			
			function setPracStyle(d) {
			    let p = window.pracElm;
			    let b = window.pracElmB;
			    let g = window.pracElmG;
			    
			    p.style.backgroundColor = `rgb(0, 0, 0)`;
			    p.style.width = cellW / window.devicePixelRatio * 1.5 + "px";
			    p.style.height = cellH / window.devicePixelRatio * 1.5 + "px";
			    b.style.backgroundColor = `rgb(255, 255, 255)`;
			    b.style.width = "calc(90%)";
			    b.style.height = "calc(90%)";
			    b.style.left = "calc(5%)";
			    b.style.top = "calc(5%)";
			    g.style.backgroundColor = `rgb(0, 255, 0)`;
			    g.style.width = "calc(80%)";
			    g.style.height = "calc(80%)";
			    g.style.left = "calc(10%)";
			    g.style.top = "calc(10%)";
			    
			    let elms = [p, b, g];
			    let styles = {
			    	position: "absolute",
			    	boxSizing: "border-box",
			    	pointerEvents: "none",
			    	clipPath: "polygon(50% 0%, 75% 50%, 50% 100%, 25% 50%)"
			    }
			    elms.forEach(e => {
			    	Object.assign(e.style, styles);
			    	if (d) {
			    		Object.assign(e.style, {display: "none"});
			    	} else { Object.assign(e.style, {display: ""}); }
			    });
			}
			
			function setPracPosition(tileX, tileY, charX, charY) {
			    let screenPos = tileAndCharsToWindowCoords(tileX, tileY, charX - 0.25, charY - 0.25);
			    window.pracElm.style.left = screenPos[0] + "px";
			    window.pracElm.style.top = screenPos[1] + "px";
			}
			w.on("tilesRendered", function() {
			    setPracStyle(1);
			});
			
			// ^ this renders the checkpoint. can you tell i wrote this code (credits to fp for the base)
			
			elm.owot.addEventListener("touchstart", function() { jump = 1; });
			elm.owot.addEventListener("touchend", function() { jump = 0; })
			elm.owot.addEventListener("mousedown", function() { jump = 1; });
			elm.owot.addEventListener("mouseup", function() { jump = 0; })
			
			function inRange() {
				cUp = (positionY + owot.height / 2) / cellH;
				cDn = (positionY - owot.height / 2) / cellH;
				cDif = owot.height / cellH;
				rUp = cUp - cDif / 4;
				rDn = cDn + cDif / 4;
				cPos = -(cursorCoords[1] * 8 + cursorCoords[3]);
				if (rUp < cPos) {
					rDif = cPos - rUp;
					positionY += cellH * rDif;
				} else if (rDn > cPos) {
					rDif = cPos - rDn;
					positionY += cellH * rDif;
				}
			}
			
			function centerOffset() {
			    try { w.doGoToCoord(positionY/cellH/32, cursorCoords[0]/4 + cursorCoords[2]/64 + Math.round(owot.width / 100 * (50 - (656/19.2))) / (defaultSizes.cellW * zoom) / 64) } catch(e) { null }
			}
			
			// ! macro click block goes here !
			j_hY = 1277/600; j_x = 121/240; j_y = -54.34/30;
			j_hX = j_x / (1 + Math.sqrt(1 - j_y / j_hY));
			j_a = -j_hY/(j_hX)**2;
			var speed = 1;
			var blocks = "▔█🮅";
			var hazards = "🬭▆";
			
			function toCoord(n, d) {
				whl = (d == 0 ? Math.floor(n / 16) : Math.floor(n / 8));
				mod = (d == 0 ? (n % 16 + 16) % 16 : (n % 8 + 8) % 8);
				return [whl, mod];
			}
			
			var strikeCodeBlocks = [0x25B2, 0x25BA, 0x25BC, 0x25C4];
			var decoCodeBlocks = [0x2593, 0x2592, 0x2591];
			
			function isSomething(oX, oY, blohaz) { // blohaz (biohazard) = block/hazard
				checkinXR = cursorCoords[0] * 16 + Math.floor(cursorCoords[2]) + oX;
				checkinYR = cursorCoords[1] * 8 + Math.floor(cursorCoords[3]) + oY;
				cChkXR = cursorCoords[0] * 16 + cursorCoords[2];
				cChkYR = cursorCoords[1] * 8 + cursorCoords[3];
				
				checkinX = toCoord(checkinXR, 0);
			    checkinY = toCoord(checkinYR, 1);
			    cChkX = toCoord(cChkXR, 0);
			    cChkY = toCoord(cChkYR, 1);
			
			    info = getCharInfo(checkinX[0], checkinY[0], checkinX[1], checkinY[1]);
			    char = info.char;
			    noHit = (info.color == 1);
			    blockedUp = (info.color == 2);
			    deco = info.decoration;
			    charCode = char.toString().charCodeAt();
			    
			    try { // in case char doesn't is deco not char have
					var bold = Boolean(deco.bold);
				    var italic = Boolean(deco.italic);
				    var under = Boolean(deco.under);
				    var strike = Boolean(deco.strike);
				} catch(e) { null }
				
				isBlock = false;
				isHaz = false;
			    if (blohaz == 0) {
				    if (blocks.includes(char) || blockedUp) {
				        return true;
				    } else if (!deco) {
				        return false;
				    }
				    let isStrikeBlock = strike && strikeCodeBlocks.includes(charCode);
				    let isDecoBlock = deco != null && decoCodeBlocks.includes(charCode);
				    return isStrikeBlock || isDecoBlock || blockedUp;
			    } else {
			    	if (deco != null) {
				 	    let isStrikeBlock = strike && strikeCodeBlocks.includes(charCode);
					    let isDecoBlock = decoCodeBlocks.includes(charCode);
					    isBlock = isStrikeBlock || isDecoBlock || blocks.includes(char) || blockedUp;
			    	} else { isBlock = blocks.includes(char) || blockedUp; }
			    	
			    	try {
			    		isSpike = !strike && strikeCodeBlocks.includes(charCode);
			    	} catch(e) { isSpike = strikeCodeBlocks.includes(charCode); }
				    isGroundSpike = !deco && charCode == 0x2591;
				    isHaz = isSpike || isGroundSpike || hazards.includes(char);
			    }
			}
			
			function collCheck() { // I KNOW. SO MANY NESTED IFS. THIS CODE IS HORRIBLE I KNOW
				if ((cursorCoords[1] * 8 + cursorCoords[3] > 32) || (cursorCoords[1] * 8 + cursorCoords[3] < -48)) return true; // vertical limiter
				for (y = 0; y <= 1; y++) {
					for (x = 0; x <= 1; x++) {
						isSomething(x, y, 1);
						if (!noHit) {
							if (isBlock && !"▔".includes(char)) {
								if (Math.abs(checkinXR - cChkXR) <= 0.625 && Math.abs(checkinYR - cChkYR) <= 0.625) { return true; }
							} else if (isHaz) {
								if (isSpike) {
									if ([0x25B2, 0x25BC].includes(charCode)) {
										if (Math.abs(checkinXR - cChkXR) <= 0.6 && Math.abs(checkinYR - cChkYR) <= 0.7) { return true; }
									} else if ([0x25BA, 0x25C4].includes(charCode)) {
										if (Math.abs(checkinXR - cChkXR) <= 0.7 && Math.abs(checkinYR - cChkYR) <= 0.6) { return true; }
									}
								} else if (isGroundSpike || (!deco && "🬭".includes(char))) {
									if (Math.abs(checkinXR - cChkXR) <= 0.6 && checkinYR - cChkYR <= 0.25) { return true; }
								} else try {
									if ((deco.bold && "🬭".includes(char)) || "▆".includes(char)) {
										if (Math.abs(checkinXR - cChkXR) <= 0.6 && checkinYR - cChkYR <= 0.1) { return true; }
									}
								} catch(e) {
									if ("▆".includes(char)) {
										if (Math.abs(checkinXR - cChkXR) <= 0.6 && checkinYR - cChkYR <= 0.1) { return true; }
									}
								}
							}
						}
					}
				}
			} // goddamn staircase here THIS IS HORRIBLE
			
			function groundCheck() {
				if (isSomething(1, 1, 0)) {
					if (!noHit && checkinYR - cChkYR >= 0.5 && !goingUp) { return 0; }
				}
				if (isSomething(0, 1, 0)) {
					if (!noHit && checkinYR - cChkYR >= 0.5 && !goingUp) { return 0; }
				}
				if (isSomething(1, 2, 0)) {
					if (!noHit && checkinYR - cChkYR >= 0.5 && !goingUp) { return 1; }
				}
				if (isSomething(0, 2, 0)) {
					if (!noHit && checkinYR - cChkYR >= 0.5 && !goingUp) { return 1; }
				}
			}
			
			document.addEventListener("keydown", function(e) {
			    if (checkKeyPress(e, ["UP", "SPACE"]) && !paused) {
			        jump = 1;
			    }
			});
			document.addEventListener("keyup", function(e) {
			    if (checkKeyPress(e, ["UP", "SPACE"]) && !paused) {
			        jump = 0;
			    }
			});
			
			document.addEventListener("keypress", function(e) {
			    if (checkKeyPress(e, "Z") && pMode && !paused) {
			        checkpoints.push([...cursorCoords, ground, soonGround, jumping, prefalling, falling, jTimer, jTimerX, fTimer, fTimerX, sY, yPos, goingUp, sTick]);
			    }
			});
			document.addEventListener("keypress", function(e) {
			    if (checkKeyPress(e, "X") && pMode && !paused) {
			        checkpoints.pop();
			    }
			});
			
			window.latestCheck = function() {
				lC = checkpoints[checkpoints.length - 1];
				for (i = 0; i <= 3; i++) { cursorCoords[i] = lC[i]; }
				ground = lC[4], soonGround = lC[5], jumping = lC[6], prefalling = lC[7], falling = lC[8];
				jTimer = lC[9],	jTimerX = lC[10], fTimer = lC[11], fTimerX = lC[12];
				sY = lC[13], yPos = lC[14], goingUp = lC[15], sTick = lC[16] - 1;
			}
			
			function redrawCheck() {
				requestAnimationFrame(redrawCheck);
				if (checkpoints.length != 0) {
					lC = checkpoints[checkpoints.length - 1];
					setPracStyle(0);
					setPracPosition(lC[0], lC[1], lC[2], lC[3]);
				} else {
					setPracStyle(1);
				}
			}
			redrawCheck();
			
			document.addEventListener("keypress", function(e) {
			    if (checkKeyPress(e, "R") && !paused) {
			    	restartLevel();
			    }
			});
			
			document.addEventListener("keydown", (e) => {
			    if (e.key === "Escape" && !inIconKit && !inSettings) {
			        paused = !paused;
			        if (paused) {
			        	pauseTheGame();
			        } else if (!paused) {
			        	unpauseTheGame();
			        }
			    }
			});
			
			window.def = function() {
				yPos = "n";
				ground = 1;
				soonGround = "n";
				jumping = 0;
				falling = 0; // falling1 is... lost media?
				prefalling = 0;
				goingUp = false;
			}
			
			function fall(j) { // setup for upcoming fall
				sY = cursorCoords[1] * 8 + cursorCoords[3];
			    if (j) {
				    falling = 1; // NO FUCKING WAY
			    } else prefalling = 1;
			    fTimer = sTick * 1000 / framerate;
			}
			
			function scroll(t) {
				whl = Math.floor(t / 16);
				mod = t % 16;
				cursorCoords = [whl, cursorCoords[1], Number(mod.toFixed(4)), cursorCoords[3]];
				if (sTick <= 26336) { centerOffset(); } else { w.redraw(); }
			}
			
			function letsJump() {
				ground = 0;
			    jumping = 1;
			    jTimer = sTick * 1000 / framerate;
			    yPos = 0;
			    sY = cursorCoords[1] * 8 + cursorCoords[3];
			}
			
			function ctrlY(p) {
				if (soonGround != "n" && !goingUp && (soonGround - (sY - p)) < 0) {
				    cursorCoords = [cursorCoords[0], toCoord(soonGround)[0], cursorCoords[2], toCoord(soonGround)[1]];
				    def();
				    ground = 1;
				    if (jump == 1) letsJump();
				} else {
					if (soonGround != "n") { c = Math.min(soonGround, sY - p); } else { c = sY - p; }
				    cursorCoords = [cursorCoords[0], toCoord(c)[0], cursorCoords[2], Number(toCoord(c)[1].toFixed(4))];
				}
			}
			
	    	lcScreenShown = false;
			var firstTime = performance.now();
			window.tick = function() {
				if (sTick == 26337) EEwin.play();
				if (EEwin.currentTime >= 2 && !lcScreenShown) {
		        	lcScreenShown = true;
		        	endScreen.style.display = "flex";
		        	if (pMode) {
		        		LCpng.src = "https://raw.githubusercontent.com/MrAndreiXYZ/Every.End/main/assets/PracticeComplete.png";
		        		LCtext.innerText = `
		        			GG! :)
		        			Thank you for playing.
		        			
		        			Even something like going through this level in practice mode means a lot.
		        			
		        			If you wish to make serious progress on this level, I wish you the best of luck.
		        		`;
		        	} else {
		        		LCpng.src = "https://raw.githubusercontent.com/MrAndreiXYZ/Every.End/main/assets/LevelComplete.png";
		        		LCtext.innerText = `
		        			GG! :)
		        			Thank you for playing.
		        			
		        			If you actually somehow completed this level without cheating, that is genuinely unthinkable.
		        			
		        			You have every right to make a big deal out of that.
		        			
		        			Maybe you can beat the actual level in Geometry Dash now...?
		        		`;
		        	}
			        requestAnimationFrame(() => {
					    requestAnimationFrame(() => {
					        endScreen.style.backgroundColor = "#00000080";
					    });
					});
					LCpng.style.opacity = 1;
		        }
				if (!dead && sTick < 26361) {
					sTick++;
			        if (sTick <= 26336) {
				        progress.style.background = `linear-gradient(to right, ${cursorColor} ${sTick / 264.17}%, rgba(0,0,0,0) ${sTick / 264.17}%)`;
				        progressText.innerText = (Math.floor((sTick / 264.17) * 10**(decimalCount)) / 10**(decimalCount)).toFixed(decimalCount) + "%";
			        } else {
			        	var percentageBeforeEnd = 26336 / 264.17;
			        	var realPercent = ((100 - percentageBeforeEnd) / 25) * (sTick - 26336) + percentageBeforeEnd;
			        	progress.style.background = `linear-gradient(to right, ${cursorColor} ${realPercent}%, rgba(0,0,0,0) ${realPercent}%)`;
				        progressText.innerText = (realPercent).toFixed(2) + "%";
			        }
			        
			        if (Math.abs(sTick / framerate - EEmusic.currentTime) > amsT/1000) EEmusic.currentTime = (sTick / framerate);
			        if (paused) EEmusic.pause();
			        scroll(10.386 / framerate * sTick);
			        if (sTick != 26361) try { inRange() } catch (e) { null };
			        
			        // if (clicks.includes(sTick)) jump = 1;
			        // if (clicks.includes(sTick-1)) jump = 0;
			        
			        if (cursorCoords[1] * 8 + cursorCoords[3] > 7) { cursorCoords = [cursorCoords[0], 0, cursorCoords[2], 7]; }
			        if (jump == 1 && ground == 1 && jumping == 0) letsJump();
			        
			        if (jumping == 1) { // in the process of jumping check
			            jTimerX = 1000 / framerate + (sTick * 1000 / framerate) - jTimer; // ms since jump
			            if (jTimerX < 121/0.24) { // in ms, this is when the cursor starts free-falling
			            	if (jTimerX < 213.581) { // peak height (before the cursor starts going down)
			            		goingUp = true;
			            	} else { goingUp = false; }
			            	yPos = j_a * (jTimerX/1000 - j_hX)**2 + j_hY; // ms to yPos
			                ctrlY(yPos);
			            } else { // after this point we start pre-falling
			            	goingUp = false;
			                jumping = 0;
			                fall(1);
			            }
			        }
			        
			        if (prefalling == 1) { // handling the smooth fall before the free-fall
			        	fTimerX = 1000 / framerate + (sTick * 1000 / framerate) - fTimer;
			        	if (fTimerX < 290.585) { // in ms, this is when the cursor starts free-falling
				        	yPos = j_a * (fTimerX/1000)**2;
			        	    ctrlY(yPos);
			        	} else { // after this point we start free-falling
			        		prefalling = 0;
			        		fall(1);
			        	}
			        }
			        
			        if (falling == 1) { // free-fall check
			            fTimerX = 1000 / framerate + (sTick * 1000 / framerate) - fTimer; // ms since fall
			            yPos = -(15/577) * fTimerX;
			            ctrlY(yPos);
			        }
			        
			        if (sTick <= 26336) {
				        if (groundCheck() != undefined) { // ground check
				            if (yPos != "n") {
				                soonGround = Math.floor(cursorCoords[1] * 8 + cursorCoords[3] + groundCheck());
				            } else ground = 1;
				            if (groundCheck() == 1 && ground == 1) {
				            	ground = 0;
				            	soonGround = "n";
				            	if (!jumping && !falling && !prefalling) fall(0);
				            }
				        } else {
				            ground = 0;
				            soonGround = "n";
				            if (!jumping && !falling && !prefalling) fall(0);
				        }
			        } else if (sTick < 26361) {
			        	cursorCoords[1] = toCoord(7 + j_a * ((sTick - 26336) / framerate)**2)[0];
			        	cursorCoords[3] = (toCoord(7 + j_a * ((sTick - 26336) / framerate)**2)[1]).toFixed(4);
			        }
			        
					collCheck();
				    if (collCheck() && sTick <= 26336) { // death check
				    	dead = 1;
				    	if (pMode) {
				    		if (sTick / 264.17 > bestPractice) { bestPractice = sTick / 264.17; localStorage.setItem("gdBP", bestPractice); }
				    		practiceProgressText.innerText = (Math.floor(bestPractice * 10**(decimalCount)) / 10**(decimalCount)).toFixed(decimalCount) + "%";
				    		practiceProgressBar.style.background = `linear-gradient(to right, #00ffff ${bestPractice}%, #000000 ${bestPractice}%)`;
				    	} else {
				    		if (sTick / 264.17 > bestNormal) {
				    			bestNormal = sTick / 264.17;
				    			localStorage.setItem("gdBN", bestNormal);
				    			NBpng.style.display = "";
					    		requestAnimationFrame(() => {
								    requestAnimationFrame(() => {
								        NBpng.style.opacity = 0;
								    });
								});
					    		setTimeout(() => {NBpng.style.display = "none"; NBpng.style.opacity = 1; }, 500);
				    		}
				    		normalProgressText.innerText = (Math.floor(bestNormal * 10**(decimalCount)) / 10**(decimalCount)).toFixed(decimalCount) + "%";
				    		normalProgressBar.style.background = `linear-gradient(to right, #00ff00 ${bestNormal}%, #000000 ${bestNormal}%)`;
				    	}
				    	EEmusic.pause();
				    	EEcrash.currentTime = 0;
				    	EEcrash.play();
				        def();
				    }
				} else {
					deathTimer += 1000 / framerate;
					if ((!pMode && deathTimer >= rtNt) || (pMode && deathTimer >= rtPt)) {
				        sessionAttempts.innerText = "Attempt " + ++seshAttempts;
						if (pMode) { updateAtt(2) } else { updateAtt(1) }
				        cursorCoords = [0, tileYStart, 0, charYStart];
				        sTick = sTickStart;
				        EEmusic.currentTime = 0;
				        if (!paused) EEmusic.play();
				        if (!paused) dead = 0;
				        if (pMode && checkpoints.length > 0) latestCheck();
				        deathTimer = 0;
			        }
				}
				if (!paused) {
					while (true) { if (performance.now() - firstTime > 1000/framerate/speed) break; }
				    firstTime = performance.now();
				    setTimeout(tick);
				}
			}
			changeZoom(200, 0);
			centerOffset();
			try { inRange() } catch (e) { null };
			w.redraw();
			setTimeout(() => {EEmusic.currentTime = 0; EEmusic.play(); tick()}, 1000);
		}
	}
}

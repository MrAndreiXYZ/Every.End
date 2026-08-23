/*text_decorations.style = "";
text_deco_b.innerText = "^";
text_deco_i.innerText = ">";
text_deco_u.innerText = "v";
text_deco_s.innerText = "<";

var charTable = {
  "1": "█",
  "2": "▲",
  "3": "◄",
  "4": "▼",
  "5": "►",
  "6": "▓",
  "7": "▒",
  "8": "🬭",
  "0": "🯰"
};
var funcTable = {
  "w": () => text_deco_b.click(),
  "a": () => text_deco_s.click(),
  "s": () => text_deco_u.click(),
  "d": () => text_deco_i.click()
};

w.on("writebefore", function(e) {
    if (charTable[e.char]) {
        e.char = charTable[e.char];
    } else if (funcTable[e.char]) {
        funcTable[e.char]();
        e.char = "";
        moveCursor("left");
    }
});

w.on("writebefore", function(e) {
    if (e.char == "9") {
        let a = 1, b = 1, c = 1, d = 1;
        e.char = "";
        moveCursor("left");
        moveCursor("up");
        if (getChar() != " ") a = 0;
        moveCursor("down");
        moveCursor("right");
        if (getChar() != " ") b = 0;
        moveCursor("left");
        moveCursor("down");
        if (getChar() != " ") c = 0;
        moveCursor("up");
        moveCursor("left");
        if (getChar() != " ") d = 0;
        moveCursor("right");
        writeChar("▓", 1, 0, 1, 0, 0, a, b, c, d);
    }
});*/

// editor debug stuff above

w.registerHook("renderchar", function(charCode, ctx, tileX, tileY, charX, charY, offsetX, offsetY, width, height) {
	let wX = width/122, hX = height/122;
	function NW(t) {
	    ctx.clearRect(offsetX,       offsetY,       wX*37, hX*37);
	    ctx.fillStyle = `rgba(0,0,0,${t})`;
	    ctx.fillRect(offsetX,       offsetY,       wX*37, hX*37);
	}
	function N(t) {
	    ctx.clearRect(offsetX+wX*43, offsetY,       wX*36, hX*37);
	    ctx.fillStyle = `rgba(0,0,0,${t})`;
	    ctx.fillRect(offsetX+wX*43, offsetY,       wX*36, hX*37);
	}
	function NE(t) {
	    ctx.clearRect(offsetX+wX*85, offsetY,       wX*37, hX*37);
	    ctx.fillStyle = `rgba(0,0,0,${t})`;
	    ctx.fillRect(offsetX+wX*85, offsetY,       wX*37, hX*37);
	}
	function W(t) {
	    ctx.clearRect(offsetX,       offsetY+hX*43, wX*37, hX*36);
	    ctx.fillStyle = `rgba(0,0,0,${t})`;
	    ctx.fillRect(offsetX,       offsetY+hX*43, wX*37, hX*36);
	}
	function C(t) {
	    ctx.clearRect(offsetX+wX*43, offsetY+hX*43, wX*36, hX*36);
	    ctx.fillStyle = `rgba(0,0,0,${t})`;
	    ctx.fillRect(offsetX+wX*43, offsetY+hX*43, wX*36, hX*36);
	}
	function E(t) {
	    ctx.clearRect(offsetX+wX*85, offsetY+hX*43, wX*37, hX*36);
	    ctx.fillStyle = `rgba(0,0,0,${t})`;
	    ctx.fillRect(offsetX+wX*85, offsetY+hX*43, wX*37, hX*36);
	}
	function SW(t) {
	    ctx.clearRect(offsetX,       offsetY+hX*85, wX*37, hX*37);
	    ctx.fillStyle = `rgba(0,0,0,${t})`;
	    ctx.fillRect(offsetX,       offsetY+hX*85, wX*37, hX*37);
	}
	function S(t) {
	    ctx.clearRect(offsetX+wX*43, offsetY+hX*85, wX*36, hX*37);
	    ctx.fillStyle = `rgba(0,0,0,${t})`;
	    ctx.fillRect(offsetX+wX*43, offsetY+hX*85, wX*36, hX*37);
	}
	function SE(t) {
	    ctx.clearRect(offsetX+wX*85, offsetY+hX*85, wX*37, hX*37);
	    ctx.fillStyle = `rgba(0,0,0,${t})`;
	    ctx.fillRect(offsetX+wX*85, offsetY+hX*85, wX*37, hX*37);
	}
	
	function dgb(m) { // deco grid block
    	ctx.fillStyle = `rgba(0,0,0,0)`;
        ctx.fillRect(offsetX, offsetY, width, height);
    	NW(m+0.2); N(m+0.2); NE(m+0.2); W(m+0.2); C(m); E(m+0.2); SW(m+0.2); S(m+0.2); SE(m+0.2);
    	ctx.fillStyle = `rgba(0,0,0,0)`;
    }
    
    function blk() {
    	let t = textRenderCtx.fillStyle;
        textRenderCtx.fillStyle = `rgba(0,0,0,0.8)`;
        ctx.fillRect(offsetX, offsetY, width, height);
        textRenderCtx.fillStyle = t;
        
        ctx.strokeStyle = "#FFFFFF";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.lineCap = "square";
        ctx.lineJoin = "bevel";
        ctx.moveTo(offsetX+1, offsetY+1);
        ctx.lineTo(offsetX + width-1, offsetY+1);
        ctx.moveTo(offsetX + width-1, offsetY+1);
        ctx.lineTo(offsetX + width-1, offsetY + height-1);
        ctx.moveTo(offsetX+1, offsetY + height-1);
        ctx.lineTo(offsetX + width-1, offsetY + height-1);
        ctx.moveTo(offsetX+1, offsetY+1);
        ctx.lineTo(offsetX+1, offsetY + height-1);
        ctx.stroke();
    }
    
    function spk(c) { // spike
    	let t = textRenderCtx.fillStyle;
        textRenderCtx.fillStyle = `rgba(0,0,0,0.8)`;
        drawTriangleShardChar(c, ctx, offsetX, offsetY, width, height);
        textRenderCtx.fillStyle = t;
        ctx.strokeStyle = "#FFFFFF";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.lineCap = "square";
        ctx.lineJoin = "bevel";
        if (c == 0x25B2) {
        	ctx.moveTo(offsetX + 1, offsetY + height - 1);
	        ctx.lineTo(offsetX + width - 1, offsetY + height - 1);
	        ctx.lineTo(offsetX + width/2, offsetY + 1);
	        ctx.lineTo(offsetX + 1, offsetY + height - 1);
        } else if (c == 0x25BC) {
        	ctx.moveTo(offsetX + 1, offsetY + 1);
	        ctx.lineTo(offsetX + width - 1, offsetY + 1);
	        ctx.lineTo(offsetX + width/2, offsetY + height - 1);
	        ctx.lineTo(offsetX + 1, offsetY + 1);
        }
        ctx.stroke();
    }
    
    function gsp(b) { // ground spike
    	ctx.fillStyle = `rgba(0,0,0,0)`;
        ctx.fillRect(offsetX, offsetY, width, height);
        
        ctx.fillStyle = "#000000";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.lineCap = "square";
        ctx.lineJoin = "bevel";
        let wG = width/121, hG = height/121;
        if (!b) {
	        ctx.moveTo(offsetX,          offsetY + height);
	        ctx.lineTo(offsetX,          offsetY + height - hG*17);
	        ctx.lineTo(offsetX + wG*12,  offsetY + height - hG*37);
	        ctx.lineTo(offsetX + wG*19,  offsetY + height - hG*24);
	        ctx.lineTo(offsetX + wG*35,  offsetY + height - hG*65);
	        ctx.lineTo(offsetX + wG*49,  offsetY + height - hG*29);
	        ctx.lineTo(offsetX + wG*57,  offsetY + height - hG*40);
	        ctx.lineTo(offsetX + wG*66,  offsetY + height - hG*27);
	        ctx.lineTo(offsetX + wG*74,  offsetY + height - hG*36);
	        ctx.lineTo(offsetX + wG*79,  offsetY + height - hG*31);
	        ctx.lineTo(offsetX + wG*89,  offsetY + height - hG*56);
	        ctx.lineTo(offsetX + wG*101, offsetY + height - hG*26);
	        ctx.lineTo(offsetX + wG*107, offsetY + height - hG*44);
	        ctx.lineTo(offsetX + width,  offsetY + height - hG*18);
	        ctx.lineTo(offsetX + width,  offsetY + height);
	        ctx.lineTo(offsetX,          offsetY + height);
        	ctx.fill();
        } else {
        	ctx.fillRect(offsetX, offsetY + height - hG*41, width, hG*41);
        }
        ctx.closePath();
        ctx.fillStyle = `rgba(0,0,0,0)`;
    }
	
    if (charCode == 0x2588) { // full block
    	ctx.clearRect(offsetX, offsetY, width, height);
        ctx.fillStyle = `rgba(0,0,0,0.8)`;
        ctx.fillRect(offsetX, offsetY, width, height);
        
        ctx.strokeStyle = "#FFFFFF";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.lineCap = "square";
        ctx.lineJoin = "bevel";
        ctx.moveTo(offsetX+1, offsetY+1);
        ctx.lineTo(offsetX + width-1, offsetY+1);
        ctx.moveTo(offsetX + width-1, offsetY+1);
        ctx.lineTo(offsetX + width-1, offsetY + height-1);
        ctx.moveTo(offsetX+1, offsetY + height-1);
        ctx.lineTo(offsetX + width-1, offsetY + height-1);
        ctx.moveTo(offsetX+1, offsetY+1);
        ctx.lineTo(offsetX+1, offsetY + height-1);
        ctx.stroke();
        
        return true; // return true to indicate that the char has been overridden
    } else if ([0x25B2,0x25BA,0x25BC,0x25C4].includes(charCode)) { // spikes
    	let info = getCharInfo(tileX, tileY, charX, charY);
    	if (!!info.decoration?.bold) {
    		dgb(0.2);
    	} else if (!!info.decoration?.italic) {
    		dgb(0.4);
    	} else if (!!info.decoration?.strike) {
    		ctx.clearRect(offsetX, offsetY, width, height);
    		blk();
    	}
    	if (!!info.decoration?.under) {
    		gsp(0);
    	}
    	
        let t = textRenderCtx.fillStyle;
        textRenderCtx.fillStyle = `rgba(0,0,0,0.8)`;
        drawTriangleShardChar(charCode, ctx, offsetX, offsetY, width, height);
        textRenderCtx.fillStyle = t;
        
        ctx.strokeStyle = "#FFFFFF";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.lineCap = "square";
        ctx.lineJoin = "bevel";
        switch (charCode) {
            case 0x25B2:
                ctx.moveTo(offsetX + 1, offsetY + height - 1);
                ctx.lineTo(offsetX + width - 1, offsetY + height - 1);
                ctx.lineTo(offsetX + width/2, offsetY + 1);
                ctx.lineTo(offsetX + 1, offsetY + height - 1);
                break;
            case 0x25BA:
                ctx.moveTo(offsetX + 1, offsetY + 1);
                ctx.lineTo(offsetX + 1, offsetY + height - 1);
                ctx.lineTo(offsetX + width - 1, offsetY + height/2);
                ctx.lineTo(offsetX + 1, offsetY + 1);
                break;
            case 0x25BC:
                ctx.moveTo(offsetX + 1, offsetY + 1);
                ctx.lineTo(offsetX + width - 1, offsetY + 1);
                ctx.lineTo(offsetX + width/2, offsetY + height - 1);
                ctx.lineTo(offsetX + 1, offsetY + 1);
                break;
            case 0x25C4:
                ctx.moveTo(offsetX + width - 1, offsetY + 1);
                ctx.lineTo(offsetX + width - 1, offsetY + height - 1);
                ctx.lineTo(offsetX + 1, offsetY + height/2);
                ctx.lineTo(offsetX + width - 1, offsetY + 1);
        }
        
        ctx.stroke();
        
        return true;
    } else if ([0x2593,0x2592,0x2591].includes(charCode)) { // grid blocks
        let info = getCharInfo(tileX, tileY, charX, charY);
        let a = !!info.decoration?.bold;
        let b = !!info.decoration?.italic;
        let c = !!info.decoration?.under;
        let d = !!info.decoration?.strike;
        ctx.clearRect(offsetX, offsetY, width, height);
        
        NW(0.4); N(0.4); NE(0.4); W(0.4); C(0.4); E(0.4); SW(0.4); S(0.4); SE(0.4);
        
        ctx.strokeStyle = "#FFFFFF";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.lineCap = "square";
        ctx.lineJoin = "bevel";

        if ([0x2593,0x2591].includes(charCode)) {
            if (a) {
                NW(0.8); N(0.8); NE(0.8);
                W(0.6); C(0.6); E(0.6);
                ctx.moveTo(offsetX+1, offsetY+1);
                ctx.lineTo(offsetX + width-1, offsetY+1);
            }
            if (b) {
                NE(0.8); E(0.8); SE(0.8);
                a ? null : N(0.6); C(0.6); S(0.6);
                ctx.moveTo(offsetX + width-1, offsetY+1);
                ctx.lineTo(offsetX + width-1, offsetY + height-1);
            }
            if (c) {
                SW(0.8); S(0.8); SE(0.8);
                W(0.6); C(0.6); b ? null : E(0.6);
                ctx.moveTo(offsetX+1, offsetY + height-1);
                ctx.lineTo(offsetX + width-1, offsetY + height-1);
            }
            if (d) {
                NW(0.8); W(0.8); SW(0.8);
                a ? null : N(0.6); C(0.6); c ? null : S(0.6);
                ctx.moveTo(offsetX+1, offsetY+1);
                ctx.lineTo(offsetX+1, offsetY + height-1);
            }
        } else if (charCode == 0x2592) {
            if (a) {
                NW(0.8);
                W(0.6); C(0.6); N(0.6);
                ctx.moveTo(offsetX+1, offsetY+1);
                ctx.lineTo(offsetX+1, offsetY+1);
            }
            if (b) {
                NE(0.8);
                E(0.6); C(0.6); N(0.6);
                ctx.moveTo(offsetX + width-1, offsetY+1);
                ctx.lineTo(offsetX + width-1, offsetY+1);
            }
            if (c) {
            	SE(0.8);
                E(0.6); C(0.6); S(0.6);
                ctx.moveTo(offsetX + width-1, offsetY + height-1);
                ctx.lineTo(offsetX + width-1, offsetY + height-1);
            }
            if (d) {
            	SW(0.8);
                W(0.6); C(0.6); S(0.6);
                ctx.moveTo(offsetX+1, offsetY + height-1);
                ctx.lineTo(offsetX+1, offsetY + height-1);
            }
        }
        if (!a && !b && !c && !d) C(0.2);
        ctx.stroke();
        if (charCode == 0x2591) gsp(0);
        
        return true;
    } else if (charCode == 0x1FB2D) { // ground spike
    	let info = getCharInfo(tileX, tileY, charX, charY);
        gsp(!!info.decoration?.bold);
    } else if (charCode == 0x1FBF2) { // double deco grid block
    	dgb(0.4);
    } else if (charCode == 0x1FBF3) { // triple deco grid block
    	dgb(0.6);
    } else if (charCode == 0x1FB85) { // ground spike + full block
    	gsp(0);
        blk();
    } else if (charCode == 0x2586) { // deco grid block + flat ground spike
    	dgb(0.2);
    	gsp(1);
    } else if (charCode == 0x2594) { // ground block
    	ctx.moveTo(offsetX, offsetY);
    	gradient = ctx.createLinearGradient(0, 0, 0, height*8);
    	gradient.addColorStop(0, "rgba(0, 0, 0, 0.2)");
    	gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
    	ctx.fillStyle = gradient;
    	ctx.fillRect(offsetX, offsetY, width, height*8);
    	ctx.fillStyle = "#FFFFFF";
    	ctx.fillRect(offsetX, offsetY, width, height/8);
    }
    
    return false; // return false to indicate nothing has changed
});
w.redraw();
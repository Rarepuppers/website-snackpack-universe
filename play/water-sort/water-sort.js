(function () {
  "use strict";

  var CAPACITY = 4;
  var MODES = {
    easy:    { colours: 4, scramble: 26, label: "Easy" },
    classic: { colours: 6, scramble: 46, label: "Classic" },
    hard:    { colours: 9, scramble: 72, label: "Hard" },
    expert:  { colours: 12, scramble: 104, label: "Expert" }
  };
  var NAMES = ["blue","coral","orange","green","purple","teal","pink","violet","gold","royal blue","amber","forest green"];
  var stage = document.getElementById("ws-stage");
  var board = document.getElementById("ws-board");
  var status = document.getElementById("ws-status");
  var timeEl = document.getElementById("ws-time");
  var movesEl = document.getElementById("ws-moves");
  var bestEl = document.getElementById("ws-best");
  var undoBtn = document.getElementById("ws-undo");
  var winEl = document.getElementById("ws-win");
  var params = new URLSearchParams(location.search);
  var dailyParam = params.get("daily");
  var storedMode = window.SnackPackStore ? (window.SnackPackStore.get("water-sort", "mode") || "classic") : "classic";
  var mode = MODES[storedMode] ? storedMode : "classic";
  var daily = dailyParam !== null;
  var seed = 0, tubes = [], initial = [], history = [], solution = [], selected = -1;
  var moves = 0, elapsed = 0, started = false, won = false, timer = null, resume = null, solutionMap = Object.create(null);
  var patterns = false;
  try { patterns = localStorage.getItem("sp_water_sort_patterns") === "1"; } catch (e) {}

  function hash(text) {
    var h = 2166136261;
    for (var i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function rngFactory(value) {
    var s = value >>> 0 || 0x9e3779b9;
    return function () { s += 0x6d2b79f5; var t=s; t=Math.imul(t^(t>>>15),t|1); t^=t+Math.imul(t^(t>>>7),t|61); return ((t^(t>>>14))>>>0)/4294967296; };
  }
  function dailyNumber(value) {
    if (value && /^\d+$/.test(value)) return Number(value);
    var iso = value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : new Date().toISOString().slice(0, 10);
    return Math.floor(Date.parse(iso + "T00:00:00Z") / 86400000);
  }
  function copyTubes(value) { return value.map(function (tube) { return tube.slice(); }); }
  function topRun(tube) { if (!tube.length) return 0; var c=tube[tube.length-1], n=1; while (n<tube.length && tube[tube.length-1-n]===c) n++; return n; }
  function canPour(from, to, state) { var a=state[from], b=state[to]; return from!==to && a.length>0 && b.length<CAPACITY && (!b.length || a[a.length-1]===b[b.length-1]); }
  function pour(from, to, state) {
    if (!canPour(from,to,state)) return 0;
    var a=state[from], b=state[to], count=Math.min(topRun(a),CAPACITY-b.length), colour=a[a.length-1];
    while (count--) { a.pop(); b.push(colour); }
    return Math.min(topRun(b), CAPACITY);
  }
  function solved(state) { return state.every(function (t) { return !t.length || (t.length===CAPACITY && t.every(function(c){return c===t[0];})); }); }
  function stateKey(state) { return state.map(function(t){return t.join("");}).join("|"); }
  function rebuildSolutionMap() {
    solutionMap=Object.create(null);var proof=copyTubes(initial);
    for(var i=0;i<solution.length;i++){var move=solution[i];solutionMap[stateKey(proof)]=move.slice();if(!pour(move[0],move[1],proof))return false;}
    var verified=solved(proof);board.dataset.solutionVerified=String(verified);return verified;
  }

  // Start solved and make reversible moves. Reversing the recorded steps is a
  // constructive proof that every shipped board can be completed without an
  // extra tube, a paid booster, or an ad unlock.
  function generate(baseSeed) {
    var cfg=MODES[mode], attempt=0;
    while (attempt++ < 40) {
      var random=rngFactory((baseSeed + attempt*2654435761)>>>0);
      var state=[]; for(var c=0;c<cfg.colours;c++) state.push([c,c,c,c]); state.push([],[]);
      var inverse=[], last="";
      for(var step=0;step<cfg.scramble;step++) {
        var choices=[];
        for(var from=0;from<state.length;from++) {
          if(!state[from].length) continue;
          var run=topRun(state[from]), colour=state[from][state[from].length-1];
          for(var to=0;to<state.length;to++) {
            if(from===to || state[to].length>=CAPACITY) continue;
            if(state[to].length && state[to][state[to].length-1]===colour) continue;
            var max=Math.min(run,CAPACITY-state[to].length);
            for(var amount=1;amount<=max;amount++) {
              if(amount===run && amount<state[from].length) continue;
              if((from+":"+to)===last) continue;
              choices.push([from,to,amount]);
            }
          }
        }
        if(!choices.length) break;
        choices.sort(function(a,b){ var ae=state[a[1]].length?0:1, be=state[b[1]].length?0:1; return ae-be; });
        var pool=choices.slice(0,Math.max(1,Math.ceil(choices.length*.72)));
        var pick=pool[Math.floor(random()*pool.length)], colour=state[pick[0]][state[pick[0]].length-1];
        for(var n=0;n<pick[2];n++){state[pick[0]].pop();state[pick[1]].push(colour);}
        inverse.unshift([pick[1],pick[0]]); last=pick[1]+":"+pick[0];
      }
      var breaks=state.reduce(function(sum,t){for(var i=1;i<t.length;i++)if(t[i]!==t[i-1])sum++;return sum;},0);
      if(!solved(state) && breaks>=Math.max(3,cfg.colours-1)) return {tubes:state,solution:inverse};
    }
    throw new Error("Could not create a Water Sort board");
  }

  function formatTime(value) { return Math.floor(value/60)+":"+String(value%60).padStart(2,"0"); }
  function bestKey() { return "sp_water_sort_best_"+mode; }
  function readBest() { try { var n=Number(localStorage.getItem(bestKey())); return n>0?n:0; } catch(e){return 0;} }
  function updateBest() { var best=readBest(); if(!best || elapsed<best){try{localStorage.setItem(bestKey(),String(elapsed));}catch(e){} return true;} return false; }
  function play(name) { if(window.SnackPackAudio) window.SnackPackAudio.play(name); }
  function startTimer() { if(started || won) return; started=true; timer=setInterval(function(){elapsed++;timeEl.textContent=formatTime(elapsed);if(resume)resume.changed();},1000); }
  function stopTimer() { if(timer){clearInterval(timer);timer=null;} }
  function tubeLabel(tube,index) { var contents=tube.length?tube.slice().reverse().map(function(c){return NAMES[c];}).join(", "):"empty"; return "Tube "+(index+1)+", "+contents; }
  function render() {
    board.innerHTML="";
    tubes.forEach(function(tube,index){
      var button=document.createElement("button"); button.type="button"; button.className="ws-tube"; button.dataset.index=index;
      button.setAttribute("aria-label",tubeLabel(tube,index)); button.setAttribute("aria-pressed",String(selected===index));
      if(selected>=0 && canPour(selected,index,tubes)) button.classList.add("is-target");
      if(tube.length===CAPACITY && tube.every(function(c){return c===tube[0];})) button.classList.add("is-complete");
      var liquids=tube.map(function(colour,slot){return '<span class="ws-liquid" data-colour="'+colour+'" style="--slot:'+slot+'"></span>';}).join("");
      button.innerHTML='<span class="ws-rim" aria-hidden="true"></span><span class="ws-glass" aria-hidden="true">'+liquids+'</span>';
      board.appendChild(button);
    });
    timeEl.textContent=formatTime(elapsed); movesEl.textContent=String(moves); var best=readBest(); bestEl.textContent=best?formatTime(best):"—";
    undoBtn.disabled=!history.length||won; stage.classList.toggle("is-patterned",patterns);
    document.getElementById("ws-patterns").setAttribute("aria-pressed",String(patterns));
    document.getElementById("ws-daily").setAttribute("aria-pressed",String(daily));
    document.querySelectorAll("[data-mode]").forEach(function(b){b.setAttribute("aria-pressed",String(b.dataset.mode===mode));});
  }
  function choose(index) {
    if(won) return;
    if(selected<0) { if(!tubes[index].length){status.textContent="That tube is empty — choose one with liquid.";play("invalid");return;} selected=index; status.textContent="Tube "+(index+1)+" selected. Choose an empty tube or a matching colour.";play("pickup");render();return; }
    if(index===selected){selected=-1;status.textContent="Selection cleared.";render();return;}
    if(!canPour(selected,index,tubes)){status.textContent="That pour does not fit. Match the top colour or use an empty tube.";play("invalid");selected=-1;render();return;}
    startTimer(); history.push(copyTubes(tubes)); if(history.length>150)history.shift(); pour(selected,index,tubes); moves++; selected=-1; play("place");
    if(solved(tubes)) finish(); else {status.textContent="Good pour. Keep one spare tube available when you can.";render();if(resume)resume.changed();}
  }
  function finish() {
    won=true;stopTimer();var newBest=updateBest();status.textContent="Solved in "+moves+" moves and "+formatTime(elapsed)+"!";play("win");render();
    winEl.hidden=false;winEl.innerHTML="<strong>Every colour sorted.</strong><span>"+moves+" moves · "+formatTime(elapsed)+(newBest?" · new best time":"")+"</span>";
    if(resume)resume.clear();
    if(window.SnackPack&&window.SnackPack.celebrate)window.SnackPack.celebrate({game:"Water Sort"});
    if(window.SnackPackShare)window.SnackPackShare.result({mount:stage,game:"Water Sort",puzzle:daily?dailyNumber(dailyParam):null,headline:MODES[mode].label+" solved in "+moves+" moves",stats:[formatTime(elapsed),"no extra tubes"],grid:["🟦🟥🟨🟩","🟪🟩🟥🟦"]});
  }
  function newGame(nextSeed) {
    stopTimer(); seed=nextSeed!=null?nextSeed:(daily?hash("water-sort:"+mode+":"+dailyNumber(dailyParam)):(Math.random()*4294967295)>>>0);
    var built=generate(seed);tubes=built.tubes;initial=copyTubes(tubes);solution=built.solution;if(!rebuildSolutionMap())throw new Error("Water Sort solution proof failed");history=[];moves=0;elapsed=0;started=false;won=false;selected=-1;winEl.hidden=true;winEl.innerHTML="";
    status.textContent=daily?"Today's shared "+MODES[mode].label.toLowerCase()+" puzzle is ready.":"Sort each colour into its own tube.";render();if(resume)resume.changed();
  }
  function resetGame(){if(!moves)return;history=[];tubes=copyTubes(initial);moves=0;elapsed=0;started=false;won=false;selected=-1;stopTimer();winEl.hidden=true;status.textContent="Puzzle reset. Try a different first pour.";play("tick");render();if(resume)resume.changed();}
  function undo(){if(!history.length||won)return;tubes=history.pop();moves=Math.max(0,moves-1);selected=-1;status.textContent="Last pour undone.";play("tick");render();if(resume)resume.changed();}
  function hint(){
    var choice=solutionMap[stateKey(tubes)]||null;
    for(var from=0;from<tubes.length&&!choice;from++)for(var to=0;to<tubes.length;to++)if(canPour(from,to,tubes)&&tubes[to].length&&tubes[from][tubes[from].length-1]===tubes[to][tubes[to].length-1]){choice=[from,to];break;}
    if(!choice)for(var a=0;a<tubes.length&&!choice;a++)for(var b=0;b<tubes.length;b++)if(canPour(a,b,tubes)&&!tubes[b].length&&topRun(tubes[a])<tubes[a].length){choice=[a,b];break;}
    if(!choice)for(var x=0;x<tubes.length&&!choice;x++)for(var y=0;y<tubes.length;y++)if(canPour(x,y,tubes)){choice=[x,y];break;}
    status.textContent=choice?"Hint: try tube "+(choice[0]+1)+" → tube "+(choice[1]+1)+".":"No useful pour found — undo or reset this board.";play(choice?"success":"invalid");
  }

  board.addEventListener("click",function(e){var button=e.target.closest(".ws-tube");if(button)choose(Number(button.dataset.index));});
  document.getElementById("ws-new").addEventListener("click",function(){if(resume)resume.clear();newGame();});
  document.getElementById("ws-reset").addEventListener("click",resetGame);
  undoBtn.addEventListener("click",undo);document.getElementById("ws-hint").addEventListener("click",hint);
  document.getElementById("ws-patterns").addEventListener("click",function(){patterns=!patterns;try{localStorage.setItem("sp_water_sort_patterns",patterns?"1":"0");}catch(e){}render();status.textContent=patterns?"Colour patterns on.":"Colour patterns off.";});
  document.getElementById("ws-daily").addEventListener("click",function(){if(resume)resume.save();daily=!daily;dailyParam=daily?new Date().toISOString().slice(0,10):null;if(resume)resume.variantChanged();newGame();});
  document.querySelectorAll("[data-mode]").forEach(function(button){button.addEventListener("click",function(){if(button.dataset.mode===mode)return;if(resume)resume.save();mode=button.dataset.mode;if(window.SnackPackStore)window.SnackPackStore.set("water-sort","mode",mode);if(resume)resume.variantChanged();newGame();});});

  function validBoard(value,cfg){
    if(!Array.isArray(value)||value.length!==cfg.colours+2)return false;
    var counts=Array(cfg.colours).fill(0);for(var i=0;i<value.length;i++){var t=value[i];if(!Array.isArray(t)||t.length>CAPACITY)return false;for(var j=0;j<t.length;j++){if(!Number.isInteger(t[j])||t[j]<0||t[j]>=cfg.colours)return false;counts[t[j]]++;}}
    return counts.every(function(n){return n===CAPACITY;});
  }
  function validState(payload){
    var cfg=MODES[payload&&payload.mode];if(!cfg||payload.daily!==daily||!validBoard(payload.tubes,cfg)||!validBoard(payload.initial,cfg))return false;
    if(!Array.isArray(payload.history)||payload.history.length>150||!payload.history.every(function(item){return validBoard(item,cfg);}))return false;
    return Number.isFinite(payload.elapsed)&&payload.elapsed>=0&&Number.isFinite(payload.moves)&&payload.moves>=0&&Number.isFinite(payload.seed);
  }
  function serialize(){return{mode:mode,daily:daily,seed:seed,tubes:copyTubes(tubes),initial:copyTubes(initial),history:history.slice(-150),solution:solution,elapsed:elapsed,moves:moves,started:started};}
  function restore(payload){if(!validState(payload))return false;mode=payload.mode;seed=payload.seed>>>0;tubes=copyTubes(payload.tubes);initial=copyTubes(payload.initial);history=(payload.history||[]).map(copyTubes);solution=payload.solution||[];if(!rebuildSolutionMap())return false;elapsed=Math.floor(payload.elapsed);moves=Math.floor(payload.moves);started=Boolean(payload.started);won=false;selected=-1;winEl.hidden=true;if(started)timer=setInterval(function(){elapsed++;timeEl.textContent=formatTime(elapsed);if(resume)resume.changed();},1000);render();return true;}
  function variant(){return(daily?"daily-"+dailyNumber(dailyParam):"free")+"-"+mode;}

  newGame();
  if(window.SnackPackResume)resume=window.SnackPackResume.attach({game:"water-sort",gameVersion:1,variant:variant,serialize:serialize,validate:validState,restore:restore,isActive:function(){return moves>0&&!won;},onRestore:function(){status.textContent="Saved Water Sort puzzle restored.";}});
  if(window.SnackPackKeyboard)window.SnackPackKeyboard.attachGrid({container:board,cellSelector:".ws-tube",label:"Water Sort tubes"});
  if(window.SnackPackAudio)window.SnackPackAudio.preload(["pickup","place","invalid","success","win","tick"]);
}());

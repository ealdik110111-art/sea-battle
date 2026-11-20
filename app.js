const FLEET = [4,3,3,2,2,2,1,1,1,1];
const SIZE = 10;
let board = [];
let ships = [];
let history = [];
let direction = "H";
let lang = "kk";

const $ = id => document.getElementById(id);

const words = {
  kk: {
    ready:"ДАЙЫН", rotate:"Бұру", undo:"Қайтару",
    auto:"Автоматты орналастыру", reset:"Қайта бастау",
    horizontal:"Көлденең", vertical:"Тігінен",
    complete:"Барлық кеме орналастырылды!",
    invalid:"Бұл жерге кеме қоюға болмайды.",
    resetDone:"Тақта тазартылды.",
    autoDone:"Кемелер автоматты орналастырылды.",
    readyDone:"Флот дайын! Келесі кезеңге өтеміз.",
    remaining:"Қалды", placed:"Қойылды"
  },
  ru: {
    ready:"ГОТОВО", rotate:"Повернуть", undo:"Отменить",
    auto:"Авторасстановка", reset:"Начать заново",
    horizontal:"Горизонтально", vertical:"Вертикально",
    complete:"Все корабли размещены!",
    invalid:"Нельзя поставить корабль сюда.",
    resetDone:"Поле очищено.",
    autoDone:"Корабли расставлены автоматически.",
    readyDone:"Флот готов! Переходим к следующему этапу.",
    remaining:"Осталось", placed:"Готово"
  },
  en: {
    ready:"READY", rotate:"Rotate", undo:"Undo",
    auto:"Auto place", reset:"Reset",
    horizontal:"Horizontal", vertical:"Vertical",
    complete:"All ships are placed!",
    invalid:"Cannot place a ship here.",
    resetDone:"Board cleared.",
    autoDone:"Ships placed automatically.",
    readyDone:"Fleet ready! Moving to the next stage.",
    remaining:"Left", placed:"Placed"
  }
};

function t(key) {
  return words[lang][key] || key;
}

function newBoard() {
  return Array.from({length:SIZE},()=>Array(SIZE).fill(0));
}

function cellsFor(r,c,len,dir) {
  return Array.from({length:len},(_,i)=>[
    r+(dir==="V"?i:0),
    c+(dir==="H"?i:0)
  ]);
}

function canPlace(r,c,len,dir) {
  const cells = cellsFor(r,c,len,dir);

  for(const [y,x] of cells) {
    if(y<0 || y>=SIZE || x<0 || x>=SIZE) return false;
    if(board[y][x]) return false;

    for(let dy=-1;dy<=1;dy++) {
      for(let dx=-1;dx<=1;dx++) {
        const ny=y+dy, nx=x+dx;
        if(ny>=0 && ny<SIZE && nx>=0 && nx<SIZE && board[ny][nx]) {
          return false;
        }
      }
    }
  }
  return true;
}

function place(r,c,len,dir) {
  if(!canPlace(r,c,len,dir)) return false;

  const cells=cellsFor(r,c,len,dir);
  const id=ships.length+1;

  cells.forEach(([y,x])=>board[y][x]=id);
  ships.push({id,len,cells});
  history.push({cells});
  return true;
}

function render() {
  const boardEl=$("board");
  boardEl.innerHTML="";

  const colLabels=$("colLabels");
  const rowLabels=$("rowLabels");
  colLabels.innerHTML="";
  rowLabels.innerHTML="";

  "ABCDEFGHIJ".split("").forEach(letter=>{
    const label=document.createElement("span");
    label.textContent=letter;
    colLabels.appendChild(label);
  });

  for(let n=1;n<=10;n++) {
    const label=document.createElement("span");
    label.textContent=n;
    rowLabels.appendChild(label);
  }

  for(let r=0;r<SIZE;r++) {
    for(let c=0;c<SIZE;c++) {
      const cell=document.createElement("button");
      cell.type="button";
      cell.className="cell"+(board[r][c]?" ship":"");
      cell.setAttribute("aria-label",`${r+1}, ${c+1}`);
      cell.addEventListener("click",()=>handleCell(r,c));
      boardEl.appendChild(cell);
    }
  }

  $("progressText").textContent=`${ships.length} / 10`;
  $("fleetCount").textContent=`${ships.length}/10`;
  $("progressBar").style.width=(ships.length*10)+"%";
  $("progressHint").textContent=ships.length===10?t("complete"):"";
  $("directionText").textContent=direction==="H"?t("horizontal"):t("vertical");
  $("undoBtn").disabled=history.length===0;
  $("readyBtn").disabled=ships.length!==10;
  $("autoBtn").disabled=ships.length===10;

  $("shipList").innerHTML="";
  FLEET.forEach((len,i)=>{
    const item=document.createElement("div");
    item.className="ship-item"+(i===ships.length?" active":"")+(i<ships.length?" done":"");

    const shape=document.createElement("div");
    shape.className="ship-shape";
    for(let n=0;n<len;n++) shape.appendChild(document.createElement("i"));

    const number=document.createElement("div");
    number.className="ship-number";
    number.textContent=`${len} ×`;

    const status=document.createElement("div");
    status.className="ship-status";
    status.textContent=i<ships.length?t("placed"):t("remaining");

    item.append(shape,number,status);
    $("shipList").appendChild(item);
  });
}

function notify(message) {
  const toast=$("toast");
  toast.textContent=message;
  toast.classList.add("show");
  setTimeout(()=>toast.classList.remove("show"),2200);
}

function handleCell(r,c) {
  if(ships.length>=10) return;

  const len=FLEET[ships.length];
  if(!place(r,c,len,direction)) {
    notify(t("invalid"));
    return;
  }

  render();
  if(ships.length===10) notify(t("complete"));
}

function resetBoard() {
  board=newBoard();
  ships=[];
  history=[];
  direction="H";
  render();
}

function autoPlace() {
  for(let attempt=0;attempt<300;attempt++) {
    board=newBoard();
    ships=[];
    history=[];

    let success=true;

    for(const len of FLEET) {
      const options=[];

      for(let r=0;r<SIZE;r++) {
        for(let c=0;c<SIZE;c++) {
          for(const dir of ["H","V"]) {
            if(canPlace(r,c,len,dir)) options.push([r,c,dir]);
          }
        }
      }

      if(!options.length) {
        success=false;
        break;
      }

      const choice=options[Math.floor(Math.random()*options.length)];
      place(...choice.slice(0,2),len,choice[2]);
    }

    if(success && ships.length===10) {
      render();
      notify(t("autoDone"));
      return;
    }
  }

  resetBoard();
  notify(t("invalid"));
}

$("rotateBtn").addEventListener("click",()=>{
  direction=direction==="H"?"V":"H";
  render();
});

$("undoBtn").addEventListener("click",()=>{
  if(!history.length) return;

  const last=history.pop();
  last.cells.forEach(([r,c])=>board[r][c]=0);
  ships.pop();
  render();
});

$("autoBtn").addEventListener("click",autoPlace);

$("resetBtn").addEventListener("click",()=>{
  resetBoard();
  notify(t("resetDone"));
});

$("readyBtn").addEventListener("click",()=>{
  if(ships.length===10) notify(t("readyDone"));
});

$("language").addEventListener("change",e=>{
  lang=e.target.value;
  render();
});

board=newBoard();
render();

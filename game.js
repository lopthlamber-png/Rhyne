import { db, ref, set, onValue, remove } from "./firebase.js";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const WORLD = 128;
const SCALE = 20;

let players = {};
let myId = Math.random().toString(36).substr(2, 9);

let myPlayer = {
  x: 64,
  y: 64,
  color: "#" + Math.floor(Math.random()*16777215).toString(16)
};

// Firebase sync
set(ref(db, "players/" + myId), myPlayer);

onValue(ref(db, "players"), (snap) => {
  players = snap.val() || {};
});

window.addEventListener("beforeunload", () => {
  remove(ref(db, "players/" + myId));
});

/* ======================
   JOYSTICK SYSTEM
====================== */
let joy = { x: 0, y: 0 };
let dragging = false;

const joystick = document.getElementById("joystick");
const stick = document.getElementById("stick");

joystick.addEventListener("touchstart", () => dragging = true);

joystick.addEventListener("touchend", () => {
  dragging = false;
  joy = { x: 0, y: 0 };
  stick.style.transform = `translate(0px,0px)`;
});

joystick.addEventListener("touchmove", (e) => {
  if (!dragging) return;

  let rect = joystick.getBoundingClientRect();
  let t = e.touches[0];

  let dx = t.clientX - (rect.left + rect.width/2);
  let dy = t.clientY - (rect.top + rect.height/2);

  let max = 40;
  dx = Math.max(-max, Math.min(max, dx));
  dy = Math.max(-max, Math.min(max, dy));

  joy.x = dx / max;
  joy.y = dy / max;

  stick.style.transform = `translate(${dx}px,${dy}px)`;
});

/* ======================
   MOVEMENT LOOP
====================== */
function update() {
  myPlayer.x += joy.x * 0.6;
  myPlayer.y += joy.y * 0.6;

  myPlayer.x = Math.max(0, Math.min(WORLD, myPlayer.x));
  myPlayer.y = Math.max(0, Math.min(WORLD, myPlayer.y));

  set(ref(db, "players/" + myId), myPlayer);

  requestAnimationFrame(update);
}
update();

/* ======================
   RENDER LOOP
====================== */
function draw() {
  ctx.clearRect(0,0,canvas.width,canvas.height);

  let camX = myPlayer.x * SCALE - canvas.width/2;
  let camY = myPlayer.y * SCALE - canvas.height/2;

  // world grid
  for (let x = 0; x < WORLD; x++) {
    for (let y = 0; y < WORLD; y++) {
      ctx.fillStyle = "#1a1a1a";
      ctx.fillRect(x*SCALE - camX, y*SCALE - camY, 1, 1);
    }
  }

  // players
  for (let id in players) {
    let p = players[id];
    ctx.fillStyle = p.color;
    ctx.fillRect(
      p.x*SCALE - camX,
      p.y*SCALE - camY,
      10, 10
    );
  }

  requestAnimationFrame(draw);
}
draw();
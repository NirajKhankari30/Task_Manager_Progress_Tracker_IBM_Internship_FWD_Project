/* Advanced Task Manager - Full JS with working tabs + motivation features + notifications + chart */

// Elements
const taskList = document.getElementById("taskList");
const addTaskBtn = document.getElementById("addTaskBtn");
const taskModal = document.getElementById("taskModal");
const closeModalBtn = document.getElementById("closeModalBtn");
const saveTaskBtn = document.getElementById("saveTaskBtn");
const taskInput = document.getElementById("taskInput");
const priorityInput = document.getElementById("priorityInput");
const deadlineInput = document.getElementById("deadlineInput");
const progress = document.getElementById("progress");
const progressText = document.getElementById("progressText");
const searchInput = document.getElementById("searchInput");
const currentDate = document.getElementById("currentDate");
const quoteBox = document.getElementById("quote");
const streakBox = document.getElementById("streak");
const pointsBox = document.getElementById("points");

// Tabs
const allTasksTab = document.getElementById("allTasksTab");
const todayTab = document.getElementById("todayTab");
const upcomingTab = document.getElementById("upcomingTab");
const completedTab = document.getElementById("completedTab");
const dashboardTab = document.getElementById("dashboardTab");

// Theme toggle
const themeToggle = document.getElementById("themeToggle");

// Data (persisted)
let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
let points = Number(localStorage.getItem("points") || 0);
let streak = Number(localStorage.getItem("streak") || 0);
let lastCompletedDate = localStorage.getItem("lastCompletedDate") || null;

let currentView = "all";
let chart = null;

// ---------- Quotes & Date ----------
const quotes = [
  "Don’t watch the clock; do what it does. Keep going.",
  "Great things are done by a series of small things brought together.",
  "It always seems impossible until it’s done.",
  "Push yourself, because no one else is going to do it for you.",
  "Success is the sum of small efforts, repeated daily."
];
quoteBox.textContent = "💡 " + quotes[Math.floor(Math.random()*quotes.length)];
currentDate.textContent = new Date().toDateString();

// ---------- Modal actions ----------
addTaskBtn.addEventListener("click", () => taskModal.style.display = "flex");
closeModalBtn.addEventListener("click", () => taskModal.style.display = "none");
saveTaskBtn.addEventListener("click", () => {
  const text = taskInput.value.trim();
  if (!text) return;
  const task = { text, priority: priorityInput.value, deadline: deadlineInput.value, completed: false };
  tasks.push(task);
  saveAndRender();
  taskModal.style.display = "none";
  taskInput.value = ""; deadlineInput.value = "";
});

// ---------- Tabs ----------
allTasksTab.addEventListener("click", () => { currentView = "all"; highlightTab(allTasksTab); renderTasks(); });
todayTab.addEventListener("click", () => { currentView = "today"; highlightTab(todayTab); renderTasks(); });
upcomingTab.addEventListener("click", () => { currentView = "upcoming"; highlightTab(upcomingTab); renderTasks(); });
completedTab.addEventListener("click", () => { currentView = "completed"; highlightTab(completedTab); renderTasks(); });
dashboardTab.addEventListener("click", () => { currentView = "dashboard"; highlightTab(dashboardTab); showDashboard(); });

function highlightTab(tabEl){
  document.querySelectorAll(".sidebar ul li").forEach(li => li.classList.remove("active"));
  tabEl.classList.add("active");
}

// ---------- Search ----------
searchInput.addEventListener("input", () => renderTasks());

// ---------- Render logic with correct index mapping ----------
function getFilteredList() {
  // map to objects with original index so toggles/deletes affect correct item
  let arr = tasks.map((task, idx) => ({ task, idx }));

  if (currentView === "today") {
    const todayStr = new Date().toISOString().split("T")[0];
    arr = arr.filter(({task}) => task.deadline && task.deadline.startsWith(todayStr));
  } else if (currentView === "upcoming") {
    const now = new Date();
    arr = arr.filter(({task}) => task.deadline && new Date(task.deadline) > now);
  } else if (currentView === "completed") {
    arr = arr.filter(({task}) => task.completed);
  }

  const q = (searchInput.value || "").toLowerCase().trim();
  if (q) arr = arr.filter(({task}) => task.text.toLowerCase().includes(q));

  return arr;
}

function renderTasks(){
  // If dashboard view, show dashboard instead
  if (currentView === "dashboard") return showDashboard();

  const list = getFilteredList();
  taskList.innerHTML = "";

  if (list.length === 0) {
    taskList.innerHTML = "<li style='text-align:center;color:gray;padding:14px;background:white;border-radius:8px;'>No tasks found</li>";
    updateProgress();
    drawChart();
    return;
  }

  list.forEach(({task, idx}) => {
    const li = document.createElement("li");
    li.classList.add(`priority-${task.priority}`);

    const left = document.createElement("div");
    left.className = "left";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = task.completed;
    checkbox.addEventListener("change", () => toggleTask(idx));

    const span = document.createElement("span");
    span.textContent = task.text + (task.deadline ? ` (Due: ${task.deadline})` : "");
    if (task.completed) span.style.textDecoration = "line-through";

    left.append(checkbox, span);

    const actions = document.createElement("div");
    const delBtn = document.createElement("button");
    delBtn.innerHTML = "❌";
    delBtn.addEventListener("click", () => deleteTask(idx));

    actions.appendChild(delBtn);

    li.append(left, actions);
    taskList.appendChild(li);
  });

  updateProgress();
  drawChart();
}

// ---------- Task control ----------
function toggleTask(index) {
  tasks[index].completed = !tasks[index].completed;
  if (tasks[index].completed) {
    points += 10;
    triggerConfetti();
    handleStreak();
  }
  saveAndRender();
}

function deleteTask(index) {
  tasks.splice(index, 1);
  saveAndRender();
}

function updateProgress(){
  const completed = tasks.filter(t => t.completed).length;
  const total = tasks.length;
  const percent = total ? Math.round((completed/total)*100) : 0;
  progress.style.width = percent + "%";
  progressText.textContent = `${percent}% Completed`;
  pointsBox.textContent = `🏆 Points: ${points}`;
  streakBox.textContent = `🔥 Streak: ${streak} days`;
}

// ---------- Save ----------
function saveAndRender(){
  localStorage.setItem("tasks", JSON.stringify(tasks));
  localStorage.setItem("points", String(points));
  localStorage.setItem("streak", String(streak));
  if (lastCompletedDate) localStorage.setItem("lastCompletedDate", lastCompletedDate);
  renderTasks();
}

// ---------- Streak ----------
function handleStreak(){
  const todayStr = new Date().toDateString();
  if (lastCompletedDate !== todayStr) {
    streak += 1;
    lastCompletedDate = todayStr;
    localStorage.setItem("lastCompletedDate", lastCompletedDate);
  }
}

// ---------- Confetti ----------
function triggerConfetti(){
  const canvas = document.getElementById("confettiCanvas");
  const ctx = canvas.getContext("2d");
  canvas.width = window.innerWidth; canvas.height = window.innerHeight;
  const pieces = Array.from({length: 90}, () => ({
    x: Math.random()*canvas.width,
    y: -Math.random()*canvas.height,
    w: 8 + Math.random()*8,
    h: 8 + Math.random()*8,
    color: `hsl(${Math.random()*360},100%,50%)`,
    speed: 2 + Math.random()*4,
    rot: Math.random()*360
  }));

  let raf;
  const start = Date.now();
  function frame(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    pieces.forEach(p => {
      p.y += p.speed;
      p.rot += 8;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rot * Math.PI)/180);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w/2, -p.h/2, p.w, p.h);
      ctx.restore();
      if (p.y > canvas.height + 20) { p.y = -20; p.x = Math.random()*canvas.width; }
    });
    if (Date.now() - start < 3000) raf = requestAnimationFrame(frame); else {
      ctx.clearRect(0,0,canvas.width,canvas.height);
      cancelAnimationFrame(raf);
    }
  }
  frame();
}

// ---------- Chart (doughnut) ----------
function drawChart(){
  const ctx = document.getElementById("chartCanvas").getContext("2d");
  const completed = tasks.filter(t => t.completed).length;
  const pending = tasks.length - completed;
  if (chart) chart.destroy();
  chart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Completed','Pending'],
      datasets: [{
        data: [completed, Math.max(0,pending)],
        backgroundColor: ['#28a745','#ff4d4d']
      }]
    },
    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }
  });
}

// ---------- Dashboard view ----------
function showDashboard(){
  // show a compact summary in the task area and ensure chart is updated
  const total = tasks.length;
  const completed = tasks.filter(t => t.completed).length;
  const pending = total - completed;
  const overdue = tasks.filter(t => t.deadline && !t.completed && new Date(t.deadline) < new Date()).length;

  taskList.innerHTML = `
    <li style="padding:18px;background:white;border-radius:8px;margin-bottom:10px;">
      <h3>📊 Dashboard Summary</h3>
      <p>Total Tasks: <strong>${total}</strong></p>
      <p>Completed: <strong>${completed}</strong></p>
      <p>Pending: <strong>${pending}</strong></p>
      <p>Overdue: <strong style="color:${overdue? '#ff4d4d':'#28a745'}">${overdue}</strong></p>
    </li>
  `;
  updateProgress();
  drawChart();
}

// ---------- Notifications (deadline reminders) ----------
if ("Notification" in window && Notification.permission !== "granted") {
  Notification.requestPermission().then(() => {});
}
function checkDeadlines(){
  const now = new Date();
  tasks.forEach(t => {
    if (t.deadline && !t.completed) {
      const dt = new Date(t.deadline);
      if (!isNaN(dt) && dt <= now) {
        // send notification (repeat allowed each check if still incomplete)
        if ("Notification" in window && Notification.permission === "granted") {
          new Notification("⏰ Task Reminder", { body: `${t.text} is due now!` });
        }
      }
    }
  });
}
// check every minute
setInterval(checkDeadlines, 60000);

// ---------- Theme toggle ----------
themeToggle.addEventListener("click", () => document.body.classList.toggle("dark-mode"));

// ---------- Init ----------
renderTasks();
drawChart();
updateProgress();
checkDeadlines(); // immediate check

const MAX_NUMBER = 45;
const PICK_COUNT = 6;
const MAX_HISTORY = 5;
const STORAGE_KEY = "ai-lotto-history";
const DRAW_BUTTON_TEXT = "번호 추첨";

const numberBoard = document.querySelector("#numberBoard");
const drawButton = document.querySelector("#drawButton");
const resetButton = document.querySelector("#resetButton");
const statusText = document.querySelector("#statusText");
const historyList = document.querySelector("#historyList");
const clearHistoryButton = document.querySelector("#clearHistoryButton");

const state = {
  currentNumbers: [],
  revealedCount: 0,
  history: loadHistory(),
};

function loadHistory() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(saved) ? saved.slice(0, MAX_HISTORY) : [];
  } catch {
    return [];
  }
}

function saveHistory() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.history));
}

function getRangeClass(number) {
  if (number <= 9) return "range-1";
  if (number <= 19) return "range-10";
  if (number <= 29) return "range-20";
  if (number <= 39) return "range-30";
  return "range-40";
}

function drawRandomNumbers() {
  const numbers = Array.from({ length: MAX_NUMBER }, (_, index) => index + 1);

  for (let index = numbers.length - 1; index > 0; index -= 1) {
    const randomIndex = randomInt(0, index);
    [numbers[index], numbers[randomIndex]] = [numbers[randomIndex], numbers[index]];
  }

  return numbers.slice(0, PICK_COUNT);
}

function randomInt(min, max) {
  const range = max - min + 1;
  const random = crypto.getRandomValues(new Uint32Array(1))[0] / 2 ** 32;
  return Math.floor(random * range) + min;
}

function startNewGame() {
  state.currentNumbers = drawRandomNumbers();
  state.revealedCount = 0;
  drawButton.textContent = DRAW_BUTTON_TEXT;
  updateStatus();
  renderBoard();
}

function revealNextNumber() {
  if (!state.currentNumbers.length) {
    startNewGame();
  } else if (state.revealedCount === PICK_COUNT) {
    startNewGame();
  }

  state.revealedCount += 1;
  renderBoard();
  updateStatus();

  if (state.revealedCount === PICK_COUNT) {
    addToHistory(state.currentNumbers);
    drawButton.textContent = DRAW_BUTTON_TEXT;
  }
}

function resetCurrentGame() {
  state.currentNumbers = [];
  state.revealedCount = 0;
  drawButton.textContent = DRAW_BUTTON_TEXT;
  updateStatus();
  renderBoard();
}

function updateStatus() {
  if (!state.currentNumbers.length) {
    statusText.textContent = "새 게임 대기";
    return;
  }

  if (state.revealedCount === PICK_COUNT) {
    statusText.textContent = "추첨 완료";
    return;
  }

  statusText.textContent = `${state.revealedCount}/${PICK_COUNT} 공개`;
}

function addToHistory(numbers) {
  if (state.history.length >= MAX_HISTORY) {
    return;
  }

  const key = numbers.join("-");
  state.history = [
    {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      numbers,
    },
    ...state.history.filter((item) => item.numbers.join("-") !== key),
  ].slice(0, MAX_HISTORY);

  saveHistory();
  renderHistory();
}

function clearHistory() {
  state.history = [];
  saveHistory();
  renderHistory();
}

function renderBoard() {
  const fragment = document.createDocumentFragment();
  const numbers =
    state.currentNumbers.length > 0 ? state.currentNumbers : Array(PICK_COUNT).fill(null);

  numbers.forEach((number, index) => {
    const ball = document.createElement("div");
    const isRevealed = number !== null && index < state.revealedCount;
    ball.className = `ball ${isRevealed ? `revealed ${getRangeClass(number)}` : "hidden"}`;
    ball.textContent = isRevealed ? String(number).padStart(2, "0") : "?";
    fragment.append(ball);
  });

  numberBoard.replaceChildren(fragment);
}

function renderHistory() {
  if (!state.history.length) {
    historyList.innerHTML = '<li class="empty-state">아직 저장된 게임이 없습니다.</li>';
    return;
  }

  const fragment = document.createDocumentFragment();

  state.history.forEach((item) => {
    const row = document.createElement("li");
    row.className = "history-item";

    const balls = document.createElement("div");
    balls.className = "history-balls";

    item.numbers.forEach((number) => {
      const ball = document.createElement("span");
      ball.className = `mini-ball ${getRangeClass(number)}`;
      ball.textContent = String(number).padStart(2, "0");
      balls.append(ball);
    });

    row.append(balls);
    fragment.append(row);
  });

  historyList.replaceChildren(fragment);
}

drawButton.addEventListener("click", revealNextNumber);
resetButton.addEventListener("click", resetCurrentGame);
clearHistoryButton.addEventListener("click", clearHistory);

renderBoard();
renderHistory();
updateStatus();

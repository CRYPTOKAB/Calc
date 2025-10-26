const $expr = document.getElementById("expr"); 
const $result = document.getElementById("result"); 
const $equals = document.getElementById("equals"); 
const API = "/api/calc"; 
function insertText(txt) { 
const start = $expr.selectionStart; 
const end = $expr.selectionEnd; 
const before = $expr.value.slice(0, start); 
const after  = $expr.value.slice(end); 
$expr.value = before + txt + after; 
const caret = start + txt.length; 
$expr.focus(); 
$expr.setSelectionRange(caret, caret); 
} 
function wrapIfFunc(token) { 
// For function buttons: add "(" if not already 
if (!token.endsWith("(")) return token; 
return token; 
} 
function delChar() { 
const start = $expr.selectionStart; 
const end = $expr.selectionEnd; 
if (start !== end) { 
const before = $expr.value.slice(0, start); 
const after  = $expr.value.slice(end); 
$expr.value = before + after; 
$expr.setSelectionRange(start, start); 
return; 
} 
if (start > 0) { 
const before = $expr.value.slice(0, start - 1); 
const after  = $expr.value.slice(start); 
$expr.value = before + after; 
$expr.setSelectionRange(start - 1, start - 1); 
  } 
  $expr.focus(); 
} 
 
async function calculate() { 
  const expr = $expr.value.trim(); 
  if (!expr) { $result.textContent = "= 0"; return; } 
  try { 
    const res = await fetch(API, { 
      method: "POST", 
      headers: {"Content-Type": "application/json"}, 
      body: JSON.stringify({ expr }) 
    }); 
    const data = await res.json(); 
    if (data.ok) { 
      $result.textContent = "= " + data.result; 
    } else { 
      $result.textContent = "Error: " + (data.error || "Invalid"); 
    } 
  } catch (e) { 
    $result.textContent = "Network error"; 
  } 
} 
 
document.querySelectorAll("button[data-insert]").forEach(btn => { 
  btn.addEventListener("click", () => insertText(btn.getAttribute("data-insert"))); 
}); 
 
document.querySelectorAll("button[data-func]").forEach(btn => { 
  btn.addEventListener("click", () => insertText(wrapIfFunc(btn.getAttribute("data-func")))); 
}); 
document.querySelector("button[data-action='clear']").addEventListener("click", () => { 
$expr.value = ""; 
$result.textContent = "= 0"; 
$expr.focus(); 
}); 
document.querySelector("button[data-action='del']").addEventListener("click", delChar); 
$equals.addEventListener("click", calculate); 
// Keyboard: Enter = calculate, Backspace delete, characters inserted directly 
$expr.addEventListener("keydown", (e) => { 
if (e.key === "Enter") { 
e.preventDefault(); 
calculate(); 
} 
}); 
$expr.addEventListener("input", () => { 
// Live preview (debounced) 
clearTimeout($expr._t); 
$expr._t = setTimeout(calculate, 250); 
}); 
// Initial focus 
$expr.focus();
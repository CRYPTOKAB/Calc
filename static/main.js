// static/main.js

const $expr = document.getElementById("expr"); 
const $result = document.getElementById("result"); 
const $equals = document.getElementById("equals"); 
const API = "/api/calc"; 

function insertText(txt) { 
    const start = $expr.selectionStart; 
    const end = $expr.selectionEnd; 
    const before = $expr.value.slice(0, start); 
    const after  = $expr.value.slice(end); 
    
    // Check if the character before the insertion point is a number or a constant (like 'pi')
    // If so, and we're inserting a function, add a '*' for implicit multiplication.
    // This is optional but improves calculator usability.
    const lastChar = start > 0 ? $expr.value.slice(start - 1, start) : '';
    if (txt.endsWith("(") && lastChar.match(/[\d\.a-zA-Z\)]/)) {
        txt = "*" + txt;
    }

    $expr.value = before + txt + after; 
    const caret = start + txt.length; 
    $expr.focus(); 
    $expr.setSelectionRange(caret, caret); 
} 

function wrapIfFunc(token) { 
    // This function handles the "data-func" buttons (like sin, cos)
    // The token from the button should already include the '(', e.g., "sin("
    return token; // No change needed here if buttons provide "sin("
} 

function delChar() { 
    const start = $expr.selectionStart; 
    const end = $expr.selectionEnd; 

    // If text is selected, delete the selection
    if (start !== end) { 
        const before = $expr.value.slice(0, start); 
        const after  = $expr.value.slice(end); 
        $expr.value = before + after; 
        $expr.setSelectionRange(start, start); 
        $expr.focus();
        return; 
    } 

    // If nothing is selected, delete one character before the caret
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

        // Check for non-200 status codes (e.g., 400, 500)
        if (!res.ok) {
            // Read the JSON error response from the server if available
            try {
                const data = await res.json();
                $result.textContent = "Error: " + (data.error || "Server responded with an error");
            } catch (e) {
                // Handle cases where the server sends a non-JSON error
                $result.textContent = "HTTP Error: " + res.status;
            }
            return;
        }

        const data = await res.json(); 
        
        if (data.ok) { 
            $result.textContent = "= " + data.result; 
        } else { 
            // Handle errors returned *within* the 200 OK response (as defined in app.py)
            $result.textContent = "Error: " + (data.error || "Invalid expression"); 
        } 

    } catch (e) { 
        // This is the "Network error" block: connection issues, server not running, etc.
        console.error("Fetch failed:", e);
        $result.textContent = "Network error (Is the Python server running?)"; 
    } 
} 

// --- Event Listeners ---

// Numbers and Operators (data-insert)
document.querySelectorAll("button[data-insert]").forEach(btn => { 
    btn.addEventListener("click", () => insertText(btn.getAttribute("data-insert"))); 
}); 

// Functions (data-func)
document.querySelectorAll("button[data-func]").forEach(btn => { 
    btn.addEventListener("click", () => insertText(wrapIfFunc(btn.getAttribute("data-func")))); 
}); 

// Action: Clear
document.querySelector("button[data-action='clear']").addEventListener("click", () => { 
    $expr.value = ""; 
    $result.textContent = "= 0"; 
    $expr.focus(); 
}); 

// Action: Delete
document.querySelector("button[data-action='del']").addEventListener("click", delChar); 

// Action: Equals
$equals.addEventListener("click", calculate); 

// Keyboard: Enter = calculate
$expr.addEventListener("keydown", (e) => { 
    if (e.key === "Enter") { 
        e.preventDefault(); 
        calculate(); 
    } 
}); 

// Live preview (debounced)
$expr.addEventListener("input", () => { 
    clearTimeout($expr._t); 
    $expr._t = setTimeout(calculate, 250); 
}); 

// Initial focus 
$expr.focus();

// Add a slight delay to ensure it focuses after the page fully loads
setTimeout(() => $expr.focus(), 50);

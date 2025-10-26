# app.py

from flask import Flask, request, jsonify, render_template, send_from_directory
import math
import sys

# Add constants and functions from the standard math library
# This dictionary will be used to safely evaluate the expression
SAFE_GLOBALS = {
    '__builtins__': None,  # Disable built-in functions
    'sin': math.sin,
    'cos': math.cos,
    'tan': math.tan,
    'sqrt': math.sqrt,
    'log': math.log,
    'pi': math.pi,
    'e': math.e,
}
# Add basic operators and number types
SAFE_GLOBALS.update({
    '__import__': None,
    'abs': abs,
    'int': int,
    'float': float,
    'pow': pow,
    'round': round,
})

app = Flask(__name__, static_folder='static')

@app.route('/')
def serve_index():
    """Serves the main HTML page."""
    # Flask looks for templates in a 'templates' folder by default, 
    # but we'll use a direct file path for simplicity if we had a dedicated templates folder.
    # For this structure, we'll assume index.html is served from the root.
    return render_template('index.html')

@app.route('/api/calc', methods=['POST'])
def calculate_api():
    """
    Handles POST requests to /api/calc.
    It takes an expression, safely evaluates it, and returns the result.
    """
    try:
        # 1. Get the expression from the JSON body
        data = request.get_json()
        if not data or 'expr' not in data:
            return jsonify({"ok": False, "error": "No expression provided"}), 400

        expr = str(data['expr']).strip()
        if not expr:
            return jsonify({"ok": True, "result": "0"}) # Return 0 for empty input

        # 2. **Safety Check** (Crucial for evaluation)
        # We must prevent dangerous commands like 'os.system("rm -rf /")'
        # Check for dangerous characters/keywords
        if any(keyword in expr for keyword in ['import', 'os.', 'sys.', 'exec', 'eval(']):
            return jsonify({"ok": False, "error": "Forbidden operation"}), 403

        # 3. **Evaluation**
        # The 'eval()' function is dangerous. We use 'compile' and a restricted
        # environment to make it safer, primarily limiting the accessible functions.
        code = compile(expr, '<string>', 'eval')
        
        # Check if the expression contains builtins that were filtered out
        if code.co_names:
            for name in code.co_names:
                if name not in SAFE_GLOBALS:
                    return jsonify({"ok": False, "error": f"Function '{name}' not allowed"}), 403

        # Use the restricted global environment
        result = eval(code, SAFE_GLOBALS)
        
        # 4. Format and Return
        # Format the result to 8 decimal places max, avoiding trailing zeros
        formatted_result = f'{result:g}' 

        return jsonify({"ok": True, "result": formatted_result})

    except ZeroDivisionError:
        return jsonify({"ok": False, "error": "Division by zero"}), 400
    except (SyntaxError, NameError, TypeError) as e:
        # Catch errors like '1++' or 'invalidfunc()'
        return jsonify({"ok": False, "error": str(e)}), 400
    except Exception as e:
        # Catch unexpected server errors
        print(f"Server Error: {e}", file=sys.stderr)
        return jsonify({"ok": False, "error": "Server calculation error"}), 500

if __name__ == '__main__':
    # You'll access the calculator at http://127.0.0.1:5000/
    print("Starting Flask server on http://127.0.0.1:5000/")
    app.run(debug=True)

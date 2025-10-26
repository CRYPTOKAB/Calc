from __future__ import annotations

from flask import Flask, render_template, request, jsonify
import ast
import operator
import math


app = Flask(__name__)

bin_ops ={
    ast.Add: operator.add,
    ast.Sub: operator.sub,
    ast.Mult: operator.mul,
    ast.Div: operator.truediv,
    ast.FloorDiv:operator.floordiv,
    ast.mod: operator.mod,
    ast.Pow: operator.pow,
}
UNARY_ops = {

ast.UAdd: operator.pos,
ast.USub: operator.neg,

}

ALLOWED_NAMES = {
    "PI": math.pi,
    "e": math.e
}

ALLOWED_FUNCS = {

    "sqrt": math.sqrt,
    "sin": math.sin,
    "cos": math.cos,
    "tan": math.tan,
    "log": math.log,
    "exp":math.exp,
    "abs": abs,
    "round": round,
}

class SafeEvalError(Exception):
    pass

def _eval(node):
    if isinstance(node, ast.BinOp) and type(node.op) in bin_ops:
        left = _eval(node.left)
        right = _eval(node.right)
        op_func = bin_ops[type(node.op)]
        if type(node.op) is ast.Div and right == 0:
            raise SafeEvalError("Division by zero is not allowed.")
        return op_func(left, right)

    if isinstance(node, ast.UnaryOp) and type(node.op) in UNARY_ops:
        return UNARY_ops[type(node.op)](_eval(node.operand))

    if isinstance(node, ast.Name):
        if node.id in ALLOWED_NAMES:
            return ALLOWED_NAMES[node.id]
        raise SafeEvalError(f"Unknown name: {node.id}")

    if isinstance(node, ast.Call):
        if isinstance(node.func, ast.Name) and node.func.id in ALLOWED_FUNCS:
            func = ALLOWED_FUNCS[node.func.id]
            if node.keywords:
                raise SafeEvalError("Keyword arguments are not allowed.")
            args = [_eval(arg) for arg in node.args]
            return func(*args)
        raise SafeEvalError(f"Funtion not allowed")

    raise SafeEvalError(f"Unsupported expression")

def safe_eval(expr: str) -> float | int:
    try:
        expr = (expr or "").replace("x", "*").replace("÷", "/")
        tree = ast.parse(expr, mode="eval")
        result = _eval(tree.body)
        if isinstance(result, float) and result.is_integer():
            return int(result)
        return result
    except ZeroDivisionError as zde:
        raise SafeEvalError("Division by zero is not allowed.") from zde
    except Exception as e:
        raise SafeEvalError(str(e)) from e
    
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/calculate', methods=['POST'])
def api_calc():
    data = request.get_json(silent=True) or {}
    expression = data.get('expr', '')
    try:
        result = safe_eval(expression)
        return jsonify({'result': result})
    except SafeEvalError as zde:
        return jsonify({"ok": False, 'error': str(zde)}), 400
    except SafeEvalError as e:
        return jsonify({'error': str(e)}), 400
    
if __name__ == '__main__':
    app.run(debug=True)
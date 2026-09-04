import sys
import io
import ast
import traceback
from typing import List, Dict, Any, Tuple
from backend.models import TraceStepModel

class SafeExecutionSandbox:
    """
    Executes Python code in a controlled namespace while tracing each line
    and recording variables, stdout, and friendly explanations.
    """
    def __init__(self, max_steps: int = 50):
        self.max_steps = max_steps
        self.steps: List[TraceStepModel] = []
        self.stdout_buf = io.StringIO()
        self.step_counter = 0

    def explain_step(self, line_no: int, code_lines: List[str], vars_now: Dict[str, str], delta_vars: Dict[str, str]) -> Tuple[str, str]:
        if 1 <= line_no <= len(code_lines):
            raw = code_lines[line_no - 1].strip()
        else:
            raw = ""

        # Title and explanation heuristics
        if raw.startswith("def "):
            fn_name = raw.split("(")[0].replace("def ", "").strip()
            return f"Define function `{fn_name}`", f"Function `{fn_name}` is declared in memory and ready to be invoked."
        elif raw.startswith("for "):
            return f"Loop iteration ({raw})", f"Loop evaluates its sequence condition. Current variables: {', '.join(f'{k}={v}' for k, v in delta_vars.items()) if delta_vars else 'Advancing index'}."
        elif raw.startswith("while "):
            return f"While check ({raw})", "Testing loop invariant condition before running the body."
        elif raw.startswith("if ") or raw.startswith("elif "):
            return f"Condition check: `{raw}`", f"Evaluating branching branch based on current state."
        elif " = " in raw:
            target = raw.split("=")[0].strip()
            return f"Assign value to `{target}`", f"Computed and stored update: {', '.join(f'{k}={v}' for k, v in delta_vars.items()) if delta_vars else raw}."
        elif raw.startswith("return"):
            return "Return from function", f"Function finishes execution returning value: {raw.replace('return', '').strip()}."
        elif raw.startswith("print("):
            return "Print output", f"Outputs text to console stdout."
        else:
            return f"Execute line {line_no}", f"Executed `{raw}`."

    def trace_code(self, source_code: str) -> List[TraceStepModel]:
        code_lines = source_code.splitlines()
        self.steps = []
        self.step_counter = 0
        old_stdout = sys.stdout
        sys.stdout = self.stdout_buf

        # Safe execution globals
        safe_builtins = {
            "abs": abs, "all": all, "any": any, "bin": bin, "bool": bool,
            "chr": chr, "dict": dict, "enumerate": enumerate, "filter": filter,
            "float": float, "format": format, "hex": hex, "int": int,
            "isinstance": isinstance, "len": len, "list": list, "map": map,
            "max": max, "min": min, "ord": ord, "pow": pow, "print": print,
            "range": range, "reversed": reversed, "round": round, "set": set,
            "sorted": sorted, "str": str, "sum": sum, "tuple": tuple, "zip": zip,
            "True": True, "False": False, "None": None,
        }
        exec_globals = {"__builtins__": safe_builtins, "__name__": "__main__"}
        prev_vars: Dict[str, str] = {}

        def trace_func(frame, event, arg):
            if event != "line" or self.step_counter >= self.max_steps:
                return trace_func
            
            # Filter only lines in this user code (represented by <string>)
            if frame.f_code.co_filename != "<string>":
                return trace_func

            line_no = frame.f_lineno
            # Snapshot local/global vars
            raw_vars = {**frame.f_globals, **frame.f_locals}
            current_vars: Dict[str, str] = {}
            for k, v in raw_vars.items():
                if k.startswith("__") or callable(v):
                    continue
                try:
                    s = repr(v)
                    if len(s) > 40:
                        s = s[:37] + "…"
                    current_vars[k] = s
                except Exception:
                    current_vars[k] = "<?>"

            delta_vars = {k: v for k, v in current_vars.items() if prev_vars.get(k) != v}

            # Check stdout diff
            current_stdout = self.stdout_buf.getvalue()
            stdout_delta = current_stdout if self.step_counter == 0 else ""

            title, explanation = self.explain_step(line_no, code_lines, current_vars, delta_vars)

            self.steps.append(TraceStepModel(
                stepIndex=self.step_counter,
                line=line_no,
                title=title,
                explanation=explanation,
                variables=current_vars,
                stdout=stdout_delta if stdout_delta else None
            ))
            self.step_counter += 1
            prev_vars.clear()
            prev_vars.update(current_vars)
            return trace_func

        try:
            compiled = compile(source_code, "<string>", "exec")
            sys.settrace(trace_func)
            exec(compiled, exec_globals)
        except Exception as e:
            tb = traceback.format_exc()
            self.steps.append(TraceStepModel(
                stepIndex=self.step_counter,
                line=self.steps[-1].line if self.steps else 1,
                title="Runtime Error",
                explanation=f"Error encountered: {type(e).__name__}: {str(e)}",
                variables=prev_vars,
                stdout=f"Traceback:\n{tb}"
            ))
        finally:
            sys.settrace(None)
            sys.stdout = old_stdout

        return self.steps

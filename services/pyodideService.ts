
export const runPythonCode = async <T,>(
  pyodide: any,
  userCode: string,
  testInput: string
): Promise<{ output: string; error: string | null }> => {
  // Sanitize input to be safely embedded in a Python string literal
  const sanitizedInput = testInput
    .replace(/\\/g, '\\\\') // Escape backslashes
    .replace(/'/g, "\\'")   // Escape single quotes
    .replace(/"/g, '\\"')   // Escape double quotes
    .replace(/\n/g, '\\n');  // Escape newlines

  // This wrapper script redirects stdin and captures stdout/stderr
  const wrapperCode = `
import sys
import io

# Store original std streams
original_stdin = sys.stdin
original_stdout = sys.stdout
original_stderr = sys.stderr

# Redirect stdin to our input string
sys.stdin = io.StringIO("${sanitizedInput}")

# Redirect stdout and stderr to capture output
captured_output = io.StringIO()
sys.stdout = captured_output
sys.stderr = captured_output

try:
    # Execute user's code
    exec("""
${userCode}
""")
except Exception as e:
    import traceback
    traceback.print_exc()

# Restore original std streams
sys.stdin = original_stdin
sys.stdout = original_stdout
sys.stderr = original_stderr

# Return the captured output
captured_output.getvalue()
`;

  try {
    // Run the entire wrapped script and get the result
    const output = await pyodide.runPythonAsync(wrapperCode);
    return { output: output.trim(), error: null };
  } catch (e) {
    // This catch block might not be hit due to try/except in Python, but is a safeguard.
    console.error("Error executing Python code in pyodideService:", e);
    return { output: '', error: (e as Error).message };
  }
};

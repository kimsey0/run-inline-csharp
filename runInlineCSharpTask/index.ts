import * as tl from 'azure-pipelines-task-lib/task';
import * as tr from 'azure-pipelines-task-lib/toolrunner';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

async function run(): Promise<void> {
    try {
        // Get inputs
        const scriptType = tl.getInput('scriptType', false) || 'inline';
        const script = tl.getInput('script', false);
        const scriptPath = tl.getPathInput('scriptPath', false);
        const args = tl.getInput('arguments', false) || '';
        const envVars = tl.getInput('environmentVariables', false) || '';
        const workingDirectory = tl.getPathInput('workingDirectory', false) || tl.getVariable('System.DefaultWorkingDirectory')!;
        const failOnStderr = tl.getBoolInput('failOnStderr', false);

        // Validate inputs based on script type
        if (scriptType === 'inline' && !script) {
            throw new Error('Script content is required when scriptType is "inline".');
        }
        if (scriptType === 'filePath' && !scriptPath) {
            throw new Error('Script path is required when scriptType is "filePath".');
        }
        if (scriptType === 'filePath' && scriptPath && !tl.exist(scriptPath)) {
            throw new Error(`Script file not found: ${scriptPath}`);
        }

        // Verify dotnet is available
        const dotnetPath = tl.which('dotnet', true);
        tl.debug(`Found dotnet at: ${dotnetPath}`);

        // Parse environment variables
        const env: { [key: string]: string } = {};
        if (envVars) {
            const lines = envVars.split(/\r?\n/);
            for (const line of lines) {
                const trimmed = line.trim();
                if (trimmed && trimmed.includes('=')) {
                    const eqIndex = trimmed.indexOf('=');
                    const name = trimmed.substring(0, eqIndex);
                    const value = trimmed.substring(eqIndex + 1);
                    if (name) {
                        env[name] = value;
                        tl.debug(`Setting environment variable: ${name}`);
                    }
                }
            }
        }

        let exitCode: number;
        let stderrOutput = '';
        let tempFile: string | null = null;

        // Create tool runner
        const dotnet: tr.ToolRunner = tl.tool(dotnetPath);
        dotnet.arg('run');

        if (scriptType === 'inline') {
            // For inline scripts, write to a temp file
            const tempDir = tl.getVariable('Agent.TempDirectory') || os.tmpdir();
            tempFile = path.join(tempDir, `script_${Date.now()}.cs`);

            tl.debug(`Writing inline script to: ${tempFile}`);
            fs.writeFileSync(tempFile, script!, 'utf8');
            dotnet.arg(tempFile);
        } else {
            // For file path, use the specified file
            dotnet.arg(scriptPath!);
        }

        // Add arguments if provided
        if (args) {
            dotnet.arg('--');
            const parsedArgs = parseArguments(args);
            for (const arg of parsedArgs) {
                dotnet.arg(arg);
            }
        }

        // Set up options
        const options: tr.IExecOptions = {
            cwd: workingDirectory,
            env: { ...process.env, ...env } as { [key: string]: string },
            silent: false,
            failOnStdErr: false,
            ignoreReturnCode: true,
            outStream: process.stdout,
            errStream: process.stderr
        };

        // Capture stderr for failOnStderr check
        const stderrListener = (data: Buffer) => {
            stderrOutput += data.toString();
        };

        if (failOnStderr) {
            dotnet.on('stderr', stderrListener);
        }

        try {
            exitCode = await dotnet.exec(options);
        } finally {
            // Clean up temp file
            if (tempFile) {
                try {
                    fs.unlinkSync(tempFile);
                    tl.debug(`Cleaned up temp file: ${tempFile}`);
                } catch (cleanupErr) {
                    tl.warning(`Failed to clean up temp file: ${tempFile}`);
                }
            }
        }

        // Check for failure conditions
        if (exitCode !== 0) {
            tl.setResult(tl.TaskResult.Failed, `Script exited with code ${exitCode}`);
            return;
        }

        if (failOnStderr && stderrOutput && stderrOutput.trim().length > 0) {
            tl.setResult(tl.TaskResult.Failed, 'Script wrote to stderr and failOnStderr is true.');
            return;
        }

        tl.setResult(tl.TaskResult.Succeeded, 'Script executed successfully.');

    } catch (err: any) {
        tl.setResult(tl.TaskResult.Failed, err.message || 'Unknown error occurred');
    }
}

/**
 * Parse command-line arguments, respecting quoted strings
 */
function parseArguments(args: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuote = false;
    let quoteChar = '';

    for (let i = 0; i < args.length; i++) {
        const char = args[i];

        if ((char === '"' || char === "'") && !inQuote) {
            inQuote = true;
            quoteChar = char;
        } else if (char === quoteChar && inQuote) {
            inQuote = false;
            quoteChar = '';
        } else if (char === ' ' && !inQuote) {
            if (current.length > 0) {
                result.push(current);
                current = '';
            }
        } else {
            current += char;
        }
    }

    if (current.length > 0) {
        result.push(current);
    }

    return result;
}

run();

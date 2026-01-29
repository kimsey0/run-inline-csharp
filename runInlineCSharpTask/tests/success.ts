import * as tmrm from 'azure-pipelines-task-lib/mock-run';
import * as path from 'path';

const taskPath = path.join(__dirname, '..', 'index.js');
const tmr = new tmrm.TaskMockRunner(taskPath);

// Set inputs
tmr.setInput('scriptType', 'filePath');
tmr.setInput('scriptPath', '/test/script.cs');
tmr.setInput('arguments', '');
tmr.setInput('environmentVariables', '');
tmr.setInput('failOnStderr', 'false');

// Set answers
tmr.setAnswers({
    which: {
        'dotnet': '/usr/bin/dotnet'
    },
    checkPath: {
        '/usr/bin/dotnet': true,
        '/test/script.cs': true
    },
    exist: {
        '/test/script.cs': true
    },
    exec: {
        '/usr/bin/dotnet run /test/script.cs': {
            code: 0,
            stdout: 'Hello from C#!',
            stderr: ''
        }
    }
});

// Mock variables - set Windows-compatible path
process.env['SYSTEM_DEFAULTWORKINGDIRECTORY'] = process.cwd();
process.env['AGENT_TEMPDIRECTORY'] = process.env['TEMP'] || process.env['TMP'] || '/tmp';

tmr.run();

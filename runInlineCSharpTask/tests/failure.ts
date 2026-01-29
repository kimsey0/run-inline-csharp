import * as tmrm from 'azure-pipelines-task-lib/mock-run';
import * as path from 'path';

const taskPath = path.join(__dirname, '..', 'index.js');
const tmr = new tmrm.TaskMockRunner(taskPath);

// Set inputs - script with compilation error
tmr.setInput('scriptType', 'filePath');
tmr.setInput('scriptPath', '/test/bad-script.cs');
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
        '/test/bad-script.cs': true
    },
    exist: {
        '/test/bad-script.cs': true
    },
    exec: {
        '/usr/bin/dotnet run /test/bad-script.cs': {
            code: 1,
            stdout: '',
            stderr: 'error CS1519: Invalid token'
        }
    }
});

// Mock variables - set Windows-compatible path
process.env['SYSTEM_DEFAULTWORKINGDIRECTORY'] = process.cwd();
process.env['AGENT_TEMPDIRECTORY'] = process.env['TEMP'] || process.env['TMP'] || '/tmp';

tmr.run();

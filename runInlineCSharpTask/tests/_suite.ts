import * as path from 'path';
import * as assert from 'assert';
import * as ttm from 'azure-pipelines-task-lib/mock-test';

describe('RunInlineCSharp Task Tests', function () {
    this.timeout(10000);

    it('should succeed with valid script file', function (done) {
        const tp = path.join(__dirname, 'success.js');
        const tr = new ttm.MockTestRunner(tp);

        tr.runAsync().then(() => {
            assert.strictEqual(tr.succeeded, true, 'should have succeeded');
            assert.strictEqual(tr.warningIssues.length, 0, 'should have no warnings');
            assert.strictEqual(tr.errorIssues.length, 0, 'should have no errors');
            assert.ok(tr.stdout.includes('Hello from C#!'), 'should include script output');
            done();
        }).catch((err) => {
            done(err);
        });
    });

    it('should fail with non-zero exit code', function (done) {
        const tp = path.join(__dirname, 'failure.js');
        const tr = new ttm.MockTestRunner(tp);

        tr.runAsync().then(() => {
            assert.strictEqual(tr.succeeded, false, 'should have failed');
            assert.ok(tr.errorIssues.length > 0, 'should have error issues');
            assert.ok(tr.errorIssues[0].includes('exit'), 'error should mention exit code');
            done();
        }).catch((err) => {
            done(err);
        });
    });
});

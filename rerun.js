const { exec } = require('child_process');

// Function to execute the server1.js file
function runServer1() {
    const child = exec('node src/server1.js', (error, stdout, stderr) => {
        if (error) {
            console.error(`Error executing server1.js: ${error}`);
        }
        console.log(`stdout: ${stdout}`);
        console.error(`stderr: ${stderr}`);
    });

    child.on('exit', (code, signal) => {
        console.log(`server1.js exited with code ${code} and signal ${signal}`);
        // If the server1.js exited unexpectedly, restart it
        if (code !== 0) {
            console.log('Restarting server1.js...');
            runServer1();
        }
    });
}

// Start running the server1.js file
runServer1();

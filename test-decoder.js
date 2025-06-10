#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');
const { execSync } = require('node:child_process');

// ANSI color codes for better output
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    bold: '\x1b[1m'
};

class DecoderTester {
    constructor() {
        this.logFile = 'decoder-test-results.log';
    }

    showHelp() {
        console.log(`
${colors.bold}LoRaWAN Decoder Testing Tool${colors.reset}

${colors.cyan}USAGE:${colors.reset}
  node test-decoder.js <decoder-name> --data <base64-payload> [options]
  node test-decoder.js <decoder-name> --file <json-file-path> [options]

${colors.cyan}EXAMPLES:${colors.reset}
  node test-decoder.js Dragino/LHT65 --data "AXQBSwqJAkA2Ffi0Cg///NA="
  node test-decoder.js RAK/RAK2171 --file "/path/to/uplink.json"
  node test-decoder.js Dragino/LHT65 --data "AXQBSwqJAkA2Ffi0Cg///NA=" --port 2

${colors.cyan}OPTIONS:${colors.reset}
  --data <payload>     Test with raw base64 payload data
  --file <path>        Test with JSON file containing uplink data
  --port <number>      Specify fPort (default: 1)
  --decoder <file>     Specify decoder file (default: decoder.js)
  --help, -h           Show this help message
  --list               List all available decoders
  --no-log             Don't write results to log file
  --verbose, -v        Show detailed output

${colors.cyan}DECODER NAMING:${colors.reset}
  Use the directory path relative to current directory:
  - Dragino/LHT65
  - RAK/RAK2171
  - Browan/TBHV100
  
${colors.cyan}LOG FILE:${colors.reset}
  Results are logged to: ${this.logFile}
  Most recent tests appear at the top.

${colors.cyan}NOTES:${colors.reset}
  - JSON files should contain 'data' field with base64 payload
  - fPort will be extracted from JSON file if available
  - Use --list to see all available decoders
        `);
    }

    listDecoders() {
        console.log(`\n${colors.bold}Available Decoders:${colors.reset}\n`);
        
        const directories = fs.readdirSync('.', { withFileTypes: true })
            .filter(dirent => dirent.isDirectory() && !dirent.name.startsWith('.'))
            .map(dirent => dirent.name);

        for (const dir of directories) {
            this.findDecodersInDirectory(dir, '');
        }
    }

    findDecodersInDirectory(dirPath, prefix) {
        try {
            const fullPath = path.join('.', dirPath);
            const items = fs.readdirSync(fullPath, { withFileTypes: true });
            
            // Check for decoder files in current directory
            const decoderFiles = items
                .filter(item => item.isFile() && item.name.endsWith('.js'))
                .map(item => item.name);
            
            if (decoderFiles.length > 0) {
                console.log(`${colors.green}${prefix}${dirPath}/${colors.reset}`);
                decoderFiles.forEach(file => {
                    console.log(`  ${colors.cyan}├── ${file}${colors.reset}`);
                });
            }

            // Recursively check subdirectories
            const subDirs = items.filter(item => item.isDirectory());
            for (const subDir of subDirs) {
                this.findDecodersInDirectory(path.join(dirPath, subDir.name), prefix + '  ');
            }
        } catch (error) {
            // Skip directories we can't read
        }
    }

    base64ToBytes(base64String) {
        const buffer = Buffer.from(base64String, 'base64');
        return Array.from(buffer);
    }

    loadDecoder(decoderPath, decoderFile = 'decoder.js') {
        const fullPath = path.join(decoderPath, decoderFile);
        
        if (!fs.existsSync(fullPath)) {
            throw new Error(`Decoder file not found: ${fullPath}`);
        }

        const decoderCode = fs.readFileSync(fullPath, 'utf8');
        
        // Create a safe execution context
        const context = {
            console: console,
            Buffer: Buffer,
            Date: Date,
            Math: Math,
            JSON: JSON,
            String: String,
            Number: Number,
            Array: Array,
            Object: Object
        };

        try {
            // Execute the decoder code in our context
            const wrappedCode = `
                ${decoderCode}
                
                // Export the Decoder function
                if (typeof Decoder === 'function') {
                    context.DecoderFunction = Decoder;
                } else {
                    throw new Error('No Decoder function found in decoder file');
                }
            `;
            
            eval(wrappedCode);
            return context.DecoderFunction;
        } catch (error) {
            throw new Error(`Failed to load decoder: ${error.message}`);
        }
    }

    parseJsonFile(filePath) {
        if (!fs.existsSync(filePath)) {
            throw new Error(`File not found: ${filePath}`);
        }

        const fileContent = fs.readFileSync(filePath, 'utf8');
        const jsonData = JSON.parse(fileContent);

        if (!jsonData.data) {
            throw new Error('JSON file must contain a "data" field with base64 payload');
        }

        return {
            data: jsonData.data,
            fPort: jsonData.fPort || 1,
            uplinkInfo: jsonData
        };
    }

    runTest(decoderName, options) {
        const startTime = new Date();
        let testResult = {
            timestamp: startTime.toISOString(),
            decoderName: decoderName,
            success: false,
            error: null,
            input: {},
            output: null,
            executionTime: 0
        };

        try {
            // Load the decoder
            const decoderFunction = this.loadDecoder(decoderName, options.decoder);
            
            // Prepare test data
            let payload, fPort, uplinkInfo = null;
            
            if (options.file) {
                const fileData = this.parseJsonFile(options.file);
                payload = fileData.data;
                fPort = fileData.fPort;
                uplinkInfo = fileData.uplinkInfo;
                testResult.input.source = 'file';
                testResult.input.filePath = options.file;
            } else {
                payload = options.data;
                fPort = options.port;
                testResult.input.source = 'direct';
            }

            testResult.input.payload = payload;
            testResult.input.fPort = fPort;

            // Convert base64 to bytes
            const bytes = this.base64ToBytes(payload);

            if (options.verbose) {
                console.log(`\n${colors.cyan}Testing decoder:${colors.reset} ${decoderName}`);
                console.log(`${colors.cyan}Payload:${colors.reset} ${payload}`);
                console.log(`${colors.cyan}Bytes:${colors.reset} [${bytes.join(', ')}]`);
                console.log(`${colors.cyan}fPort:${colors.reset} ${fPort}`);
                console.log(`${colors.cyan}Decoder file:${colors.reset} ${options.decoder}`);
            }

            // Run the decoder
            const execStart = Date.now();
            let result;
            
            // Try different function signatures
            try {
                result = decoderFunction(bytes, fPort, uplinkInfo);
            } catch (error) {
                // Try with just bytes and port
                result = decoderFunction(bytes, fPort);
            }
            
            const execEnd = Date.now();
            testResult.executionTime = execEnd - execStart;
            testResult.output = result;
            testResult.success = true;

            // Display results
            console.log(`\n${colors.green}✓ Decoder test successful!${colors.reset}`);
            console.log(`${colors.bold}Decoded Result:${colors.reset}`);
            console.log(JSON.stringify(result, null, 2));
            console.log(`\n${colors.yellow}Execution time: ${testResult.executionTime}ms${colors.reset}`);

        } catch (error) {
            testResult.error = error.message;
            console.log(`\n${colors.red}✗ Decoder test failed!${colors.reset}`);
            console.log(`${colors.red}Error: ${error.message}${colors.reset}`);
            
            if (options.verbose) {
                console.log(`${colors.red}Stack trace:${colors.reset}`);
                console.log(error.stack);
            }
        }

        // Log results if not disabled
        if (!options.noLog) {
            this.logResults(testResult);
        }

        return testResult;
    }

    logResults(testResult) {
        const separator = '='.repeat(80);
        const logEntry = `
${separator}
TEST EXECUTION - ${testResult.timestamp}
${separator}
Decoder: ${testResult.decoderName}
Status: ${testResult.success ? 'SUCCESS' : 'FAILED'}
Execution Time: ${testResult.executionTime}ms

INPUT:
  Source: ${testResult.input.source}
  ${testResult.input.filePath ? `File: ${testResult.input.filePath}` : ''}
  Payload: ${testResult.input.payload}
  fPort: ${testResult.input.fPort}

OUTPUT:
${testResult.success ? JSON.stringify(testResult.output, null, 2) : `ERROR: ${testResult.error}`}

${separator}

`;

        // Prepend to log file (newest entries at top)
        let existingLog = '';
        if (fs.existsSync(this.logFile)) {
            existingLog = fs.readFileSync(this.logFile, 'utf8');
        }

        fs.writeFileSync(this.logFile, logEntry + existingLog);
        console.log(`\n${colors.blue}Results logged to: ${this.logFile}${colors.reset}`);
    }
}

// Main execution
function main() {
    const tester = new DecoderTester();
    const args = process.argv.slice(2);

    if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
        tester.showHelp();
        return;
    }

    if (args.includes('--list')) {
        tester.listDecoders();
        return;
    }

    // Parse arguments
    const options = {
        data: null,
        file: null,
        port: 1,
        decoder: 'decoder.js',
        verbose: false,
        noLog: false
    };

    let decoderName = null;

    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        const nextArg = args[i + 1];

        switch (arg) {
            case '--data':
                options.data = nextArg;
                i++;
                break;
            case '--file':
                options.file = nextArg;
                i++;
                break;
            case '--port':
                options.port = parseInt(nextArg) || 1;
                i++;
                break;
            case '--decoder':
                options.decoder = nextArg;
                i++;
                break;
            case '--verbose':
            case '-v':
                options.verbose = true;
                break;
            case '--no-log':
                options.noLog = true;
                break;
            default:
                if (!arg.startsWith('--') && !decoderName) {
                    decoderName = arg;
                }
                break;
        }
    }

    // Validate arguments
    if (!decoderName) {
        console.log(`${colors.red}Error: Decoder name is required${colors.reset}`);
        console.log('Use --help for usage information');
        process.exit(1);
    }

    if (!options.data && !options.file) {
        console.log(`${colors.red}Error: Either --data or --file must be specified${colors.reset}`);
        console.log('Use --help for usage information');
        process.exit(1);
    }

    if (options.data && options.file) {
        console.log(`${colors.red}Error: Cannot specify both --data and --file${colors.reset}`);
        console.log('Use --help for usage information');
        process.exit(1);
    }

    // Run the test
    try {
        tester.runTest(decoderName, options);
    } catch (error) {
        console.log(`${colors.red}Fatal error: ${error.message}${colors.reset}`);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    main();
}

module.exports = DecoderTester; 
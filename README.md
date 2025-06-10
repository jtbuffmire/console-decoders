# LoRaWAN Console Decoders

A comprehensive collection of LoRaWAN payload decoder functions for Helium Console, with a powerful testing tool to validate decoder functionality.

## 📋 Overview

This repository contains payload decoder functions for various LoRaWAN devices that can be used with Helium Console. Each device directory includes decoder functions that convert raw binary payloads into human-readable JSON objects.

## 🚀 Quick Start

### Using Decoders in Helium Console

1. Navigate to the device directory of interest (e.g., `Dragino/LHT65/`)
2. Copy the contents of `decoder.js` 
3. Paste into the custom script window in Helium Console
4. Save and test with your device

### Testing Decoders Locally

Use our built-in testing tool to validate decoders before deployment:

```bash
# Test with raw payload data
node test-decoder.js Dragino/LHT65 --data "AXQBSwqJAkA2Ffi0Cg///NA="

# Test with JSON uplink file
node test-decoder.js RAK/RAK2171 --file "/path/to/uplink.json"

# Get help
node test-decoder.js --help

# List all available decoders
node test-decoder.js --list
```

## 🛠 Installation

### Prerequisites

- Node.js 14.0.0 or higher
- Git (for cloning and updates)

### Setup

```bash
# Clone the repository
git clone https://github.com/buoy-fish-tech/console-decoders.git
cd console-decoders

# Make the test script executable
chmod +x test-decoder.js

# Test the installation
node test-decoder.js --help
```

## 📖 Testing Tool Usage

### Command Format

```bash
node test-decoder.js <decoder-name> [--data <payload> | --file <path>] [options]
```

### Options

| Option | Description | Example |
|--------|-------------|---------|
| `--data <payload>` | Test with raw base64 payload | `--data "AXQBSwqJAkA2Ffi0Cg///NA="` |
| `--file <path>` | Test with JSON uplink file | `--file "/path/to/uplink.json"` |
| `--port <number>` | Specify fPort (default: 1) | `--port 2` |
| `--decoder <file>` | Specify decoder file (default: decoder.js) | `--decoder "decoder-v1.8.js"` |
| `--verbose, -v` | Show detailed output | `-v` |
| `--no-log` | Don't write to log file | `--no-log` |
| `--list` | List all available decoders | `--list` |
| `--help, -h` | Show help message | `--help` |

### Examples

```bash
# Basic test with payload data
node test-decoder.js Dragino/LHT65 --data "AXQBSwqJAkA2Ffi0Cg///NA="

# Test with specific port
node test-decoder.js Dragino/LHT65 --data "AXQBSwqJAkA2Ffi0Cg///NA=" --port 2

# Test with JSON file from Helium Console
node test-decoder.js RAK/RAK2171 --file "./sample-uplink.json"

# Verbose output with specific decoder version
node test-decoder.js Dragino/LHT65 --data "AXQBSwqJAkA2Ffi0Cg///NA=" --decoder "decoder-v1.8.js" --verbose

# Test without logging to file
node test-decoder.js Dragino/LHT65 --data "AXQBSwqJAkA2Ffi0Cg///NA=" --no-log
```

### Sample JSON Input File

When using `--file`, your JSON file should contain a `data` field with the base64 payload:

```json
{
    "deduplicationId": "f7a12418-5e71-48ea-af27-1b4929642d7f",
    "time": "2025-06-10T02:42:28.079+00:00",
    "deviceInfo": {
        "tenantId": "e1d293fb-6dc5-4214-a23a-94696f17f82f",
        "applicationName": "RAK Buoys",
        "deviceName": "Deck Tying Eel (3AF5)",
        "devEui": "ac1f09fffe183af5"
    },
    "devAddr": "78000190",
    "fPort": 2,
    "data": "AXQBSwqJAkA2Ffi0Cg///NA=",
    "object": {
        "voltage_1": 3.31,
        "altitude_10": -8.16,
        "gps_10": {
            "latitude": 37.76258,
            "altitude": -8.16,
            "longitude": -122.418673
        }
    }
}
```

## 📊 Test Results & Logging

All test results are automatically logged to `decoder-test-results.log` with:

- **Timestamp** - When the test was executed
- **Decoder Information** - Which decoder was tested
- **Input Details** - Payload, fPort, and source information
- **Output Results** - Decoded payload or error details
- **Execution Time** - Performance metrics

Recent tests appear at the top of the log file for easy access.

## 📁 Supported Devices

### Current Device Support

| Manufacturer | Devices | Status |
|--------------|---------|--------|
| **Abeeway** | Various trackers | ✅ Active |
| **Adeunis** | Environmental sensors | ✅ Active |
| **Browan** | TBHV100, TBDW100 | ✅ Active |
| **COTX** | Various devices | ✅ Active |
| **Digital Matter** | Asset trackers | ✅ Active |
| **Dragino** | LHT65, LGT92, LSN50, LSE01, and more | ✅ Active |
| **Elsys** | Environmental sensors | ✅ Active |
| **IMBuildings** | Building sensors | ✅ Active |
| **KS Technologies** | Various sensors | ✅ Active |
| **Laird** | Connectivity solutions | ✅ Active |
| **MCCI** | Environmental sensors | ✅ Active |
| **RAK** | WisBlock, trackers, sensors | ✅ Active |
| **RadioBridge** | Sensors and alerts | ✅ Active |
| **SEEED** | SenseCAP series | ✅ Active |
| **TekTelic** | Various IoT devices | ✅ Active |
| **Ursalink** | Industrial sensors | ✅ Active |

### Adding New Devices

1. Create a directory: `manufacturer/device-model/`
2. Add `decoder.js` with your decoder function
3. Include a `readme.md` with device specifications
4. Test with the testing tool
5. Submit a pull request

## 🔧 Decoder Function Format

All decoders should follow this standard format:

```javascript
function Decoder(bytes, port, uplink_info) {
    // bytes: Array of integers representing the payload
    // port: fPort number (integer)
    // uplink_info: Optional uplink metadata object
    
    var decoded = {};
    
    // Your decoding logic here
    decoded.temperature = ((bytes[0] << 8) | bytes[1]) / 100;
    decoded.humidity = bytes[2];
    
    return decoded;
}
```

### Key Requirements

- **Function Name**: Must be `Decoder`
- **Parameters**: `bytes` (required), `port` (required), `uplink_info` (optional)
- **Return Value**: JavaScript object with decoded values
- **Error Handling**: Should handle malformed payloads gracefully

## 🚀 Development & Testing

### Running Tests

```bash
# Test a specific decoder
npm run test Dragino/LHT65 --data "AXQBSwqJAkA2Ffi0Cg///NA="

# List all decoders
npm run list

# Get help
npm run help
```

### Contributing

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/new-decoder`)
3. **Add** your decoder following the format guidelines
4. **Test** thoroughly using the testing tool
5. **Commit** your changes (`git commit -am 'Add NewDevice decoder'`)
6. **Push** to the branch (`git push origin feature/new-decoder`)
7. **Submit** a Pull Request

### Quality Guidelines

- ✅ Test with multiple payload samples
- ✅ Handle edge cases and errors gracefully
- ✅ Include comprehensive documentation
- ✅ Follow consistent naming conventions
- ✅ Validate with the built-in testing tool

## 📚 Resources

### LoRaWAN Resources

- [LoRaWAN Specification](https://lora-alliance.org/resource_hub/lorawan-specification-v1-0-3/)
- [Helium Console Documentation](https://docs.helium.com/use-the-network/console/)
- [Base64 Encoding Reference](https://developer.mozilla.org/en-US/docs/Web/API/WindowBase64/Base64_encoding_and_decoding)

### Payload Decoding Tips

- **Byte Order**: Most devices use big-endian encoding
- **Data Types**: Common patterns for temperature, GPS, battery levels
- **Bit Manipulation**: Use bitwise operations for packed data
- **Error Handling**: Always validate payload length and content

## 🐛 Troubleshooting

### Common Issues

**"Decoder file not found"**
- Verify the decoder path is correct
- Ensure the directory contains a `decoder.js` file

**"Invalid base64 payload"**
- Check that the payload is properly base64 encoded
- Verify the payload length matches expected device format

**"No Decoder function found"**
- Ensure the decoder file contains a `function Decoder(...)`
- Check for syntax errors in the decoder file

### Getting Help

1. Check the test logs in `decoder-test-results.log`
2. Use `--verbose` flag for detailed debugging
3. Consult device documentation for payload format
4. Open an issue on GitHub with test results

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributors

- **JT** - Project maintainer and primary contributor
- **Community** - Various decoder contributions and improvements

## 🌐 Community

- **GitHub Issues**: Bug reports and feature requests
- **Pull Requests**: Code contributions welcome
- **Documentation**: Help improve guides and examples

---

**Made with ❤️ for the LoRaWAN and Helium communities**

> 💡 **Tip**: Start with `node test-decoder.js --list` to explore available decoders, then test with your device payloads using `--data` or `--file` options!

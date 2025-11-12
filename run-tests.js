#!/usr/bin/env node

/**
 * JARVIS IntelliAgent Command Line Test Runner
 * Usage: node run-tests.js [options]
 */

const https = require('https');
const http = require('http');

const BASE_URL = 'http://localhost:5000';

// Test configurations
const TEST_PERSONAS = {
  'admin': 'Jarvis Admin',
  'auw': 'Rachel Thompson (AUW)', 
  'it': 'John Stevens (IT Support)'
};

const SAMPLE_COMMANDS = {
  admin: [
    'show system status',
    'deploy new agent',
    'update system config',
    'test agent communication'
  ],
  auw: [
    'process claim 12345',
    'analyze risk profile',
    'create new policy',
    'handle customer inquiry'
  ],
  it: [
    'check server health',
    'run security scan',
    'schedule maintenance',
    'diagnose network issue'
  ]
};

// Utility function to make HTTP requests
function makeRequest(url, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 80,
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    const req = http.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(responseData);
          resolve({ status: res.statusCode, data: parsedData });
        } catch (error) {
          resolve({ status: res.statusCode, data: responseData });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

// Test individual command
async function testCommand(command, persona = 'admin') {
  console.log(`\n🧪 Testing: "${command}"`);
  console.log(`👤 Persona: ${TEST_PERSONAS[persona]}`);
  
  const startTime = Date.now();
  
  try {
    const response = await makeRequest(`${BASE_URL}/api/commands`, 'POST', {
      command: command,
      persona: persona,
      mode: 'text'
    });
    
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    if (response.status === 200 && response.data.success) {
      console.log(`✅ Success (${responseTime}ms)`);
      console.log(`📋 Result: ${response.data.result || 'Command processed successfully'}`);
      return { success: true, responseTime, result: response.data.result };
    } else {
      console.log(`❌ Failed (${responseTime}ms)`);
      console.log(`💥 Error: ${response.data.message || 'Unknown error'}`);
      return { success: false, responseTime, error: response.data.message };
    }
  } catch (error) {
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    console.log(`❌ Network Error (${responseTime}ms)`);
    console.log(`💥 Error: ${error.message}`);
    return { success: false, responseTime, error: error.message };
  }
}

// Test system endpoints
async function testSystemEndpoints() {
  console.log('\n🔧 Testing System Endpoints');
  console.log('============================');
  
  const endpoints = [
    { name: 'System Metrics', path: '/api/metrics' },
    { name: 'Agent Hierarchy', path: '/api/agents' },
    { name: 'Recent Activities', path: '/api/activities' },
    { name: 'User Authentication', path: '/api/auth/user' }
  ];
  
  const results = [];
  
  for (const endpoint of endpoints) {
    try {
      console.log(`\n📡 Testing ${endpoint.name}...`);
      const response = await makeRequest(`${BASE_URL}${endpoint.path}`);
      
      if (response.status === 200 || response.status === 304) {
        console.log(`✅ ${endpoint.name}: OK`);
        results.push({ name: endpoint.name, success: true });
      } else if (response.status === 401) {
        console.log(`🔐 ${endpoint.name}: Authentication required (expected)`);
        results.push({ name: endpoint.name, success: true, note: 'Auth required' });
      } else {
        console.log(`❌ ${endpoint.name}: Failed (${response.status})`);
        results.push({ name: endpoint.name, success: false, status: response.status });
      }
    } catch (error) {
      console.log(`❌ ${endpoint.name}: Error - ${error.message}`);
      results.push({ name: endpoint.name, success: false, error: error.message });
    }
  }
  
  return results;
}

// Test persona commands
async function testPersona(persona) {
  console.log(`\n👤 Testing ${TEST_PERSONAS[persona]} Commands`);
  console.log('='.repeat(50));
  
  const commands = SAMPLE_COMMANDS[persona];
  const results = [];
  
  for (const command of commands) {
    const result = await testCommand(command, persona);
    results.push({ command, persona, ...result });
    
    // Small delay between commands
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  return results;
}

// Run comprehensive test suite
async function runFullTestSuite() {
  console.log('🚀 JARVIS IntelliAgent Test Suite');
  console.log('=================================');
  console.log(`📡 Testing against: ${BASE_URL}`);
  console.log(`🕐 Started at: ${new Date().toLocaleTimeString()}\n`);
  
  const allResults = [];
  
  try {
    // Test system endpoints
    const endpointResults = await testSystemEndpoints();
    
    // Test all personas
    for (const persona of Object.keys(SAMPLE_COMMANDS)) {
      const personaResults = await testPersona(persona);
      allResults.push(...personaResults);
    }
    
    // Generate summary
    console.log('\n📊 Test Summary');
    console.log('================');
    
    const totalTests = allResults.length;
    const successfulTests = allResults.filter(r => r.success).length;
    const failedTests = totalTests - successfulTests;
    const successRate = totalTests > 0 ? ((successfulTests / totalTests) * 100).toFixed(1) : 0;
    
    console.log(`📈 Total Tests: ${totalTests}`);
    console.log(`✅ Successful: ${successfulTests}`);
    console.log(`❌ Failed: ${failedTests}`);
    console.log(`📊 Success Rate: ${successRate}%`);
    
    if (allResults.length > 0) {
      const avgResponseTime = allResults
        .filter(r => r.responseTime)
        .reduce((sum, r) => sum + r.responseTime, 0) / allResults.filter(r => r.responseTime).length;
      
      console.log(`⚡ Average Response Time: ${avgResponseTime.toFixed(0)}ms`);
    }
    
    // Show failed tests
    if (failedTests > 0) {
      console.log('\n❌ Failed Tests:');
      allResults.filter(r => !r.success).forEach(test => {
        console.log(`  - "${test.command}" (${test.persona}): ${test.error}`);
      });
    }
    
    // Show endpoint status
    console.log('\n🔧 System Endpoints:');
    endpointResults.forEach(endpoint => {
      const status = endpoint.success ? '✅' : '❌';
      const note = endpoint.note ? ` (${endpoint.note})` : '';
      console.log(`  ${status} ${endpoint.name}${note}`);
    });
    
    console.log(`\n🕐 Completed at: ${new Date().toLocaleTimeString()}`);
    console.log('✅ Test suite finished!');
    
  } catch (error) {
    console.error(`\n💥 Test suite failed: ${error.message}`);
    process.exit(1);
  }
}

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    command: null,
    persona: 'admin',
    help: false,
    full: false
  };
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '-h':
      case '--help':
        options.help = true;
        break;
      case '-p':
      case '--persona':
        options.persona = args[++i];
        break;
      case '-c':
      case '--command':
        options.command = args[++i];
        break;
      case '-f':
      case '--full':
        options.full = true;
        break;
      default:
        if (!options.command && !arg.startsWith('-')) {
          options.command = arg;
        }
        break;
    }
  }
  
  return options;
}

// Show help
function showHelp() {
  console.log(`
🤖 JARVIS IntelliAgent Test Runner

Usage:
  node run-tests.js [options]

Options:
  -h, --help              Show this help message
  -f, --full              Run full test suite (default)
  -c, --command <cmd>     Test a specific command
  -p, --persona <persona> Set persona (admin, auw, it)

Examples:
  node run-tests.js                                    # Run full test suite
  node run-tests.js -c "show system status"           # Test specific command
  node run-tests.js -c "process claim" -p auw         # Test with specific persona

Available Personas:
  admin - Jarvis Admin (system management)
  auw   - Rachel Thompson (underwriting)
  it    - John Stevens (IT support)
`);
}

// Main execution
async function main() {
  const options = parseArgs();
  
  if (options.help) {
    showHelp();
    return;
  }
  
  if (options.command) {
    // Test single command
    console.log('🧪 Single Command Test');
    console.log('======================');
    await testCommand(options.command, options.persona);
  } else {
    // Run full test suite
    await runFullTestSuite();
  }
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error(`\n💥 Uncaught error: ${error.message}`);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error(`\n💥 Unhandled promise rejection: ${reason}`);
  process.exit(1);
});

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  testCommand,
  testPersona,
  testSystemEndpoints,
  runFullTestSuite
};
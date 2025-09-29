// backend/service-manager.js
const { spawn } = require('child_process');
const path = require('path');

// Configuration - UPDATED WITH CORRECT COMMANDS
const config = {
  spyder: {
    path: '.', // Current directory (backend)
    port: 5000,
    startCommand: 'node server2.js'  // SPYDER uses node server2.js
  },
  llmNlp: {
    path: './LLM-NLP', 
    port: 5001,
    startCommand: 'npm start'  // LLM-NLP uses npm start
  }
};

class ServiceManager {
  constructor() {
    this.processes = new Map();
    this.setupExitHandlers();
  }

  startService(name, serviceConfig) {
    console.log(`Starting ${name} on port ${serviceConfig.port}...`);
    
    // Split the command into parts for better handling
    const [command, ...args] = serviceConfig.startCommand.split(' ');
    
    const child = spawn(command, args, {
      cwd: serviceConfig.path,
      shell: true,
      env: { ...process.env, PORT: serviceConfig.port }
    });
    
    this.processes.set(name, child);
    
    child.stdout.on('data', (data) => {
      console.log(`[${name}] ${data.toString().trim()}`);
    });
    
    child.stderr.on('data', (data) => {
      console.error(`[${name}-ERROR] ${data.toString().trim()}`);
    });
    
    child.on('close', (code) => {
      console.log(`[${name}] Process exited with code ${code}`);
      this.processes.delete(name);
      
      // Auto-restart if the service crashes (optional)
      if (code !== 0) {
        console.log(`[${name}] Restarting in 3 seconds...`);
        setTimeout(() => this.startService(name, serviceConfig), 3000);
      }
    });
    
    return child;
  }

  stopService(name) {
    if (this.processes.has(name)) {
      console.log(`Stopping ${name}...`);
      this.processes.get(name).kill();
      this.processes.delete(name);
    }
  }

  async checkServiceHealth() {
    console.log('\n[Health Check] Checking services...');
    
    for (const [name, serviceConfig] of Object.entries(config)) {
      try {
        // Use Node.js built-in fetch (v18+)
        const response = await fetch(`http://localhost:${serviceConfig.port}`, {
          timeout: 3000
        });
        
        if (response.ok) {
          console.log(`✓ ${name} is healthy on port ${serviceConfig.port}`);
        } else {
          console.warn(`⚠ ${name} returned status ${response.status}`);
        }
      } catch (error) {
        console.warn(`✗ ${name} is not responding on port ${serviceConfig.port}: ${error.message}`);
      }
    }
  }

  setupExitHandlers() {
    const shutdown = () => {
      console.log('\nShutting down services...');
      for (const name of this.processes.keys()) {
        this.stopService(name);
      }
      process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  }

  startAll() {
    console.log('Starting all services...\n');
    this.startService('spyder', config.spyder);
    this.startService('llmNlp', config.llmNlp);
    
    // Start health checks after a delay
    setTimeout(() => {
      setInterval(() => this.checkServiceHealth(), 10000); // Check every 10 seconds
    }, 15000); // Start checking after 15 seconds
    
    console.log(`
Services configuration:
- SPYDER backend: http://localhost:${config.spyder.port} (node server2.js)
- LLM-NLP backend: http://localhost:${config.llmNlp.port} (npm start)

Press Ctrl+C to stop all services
`);
  }
}

// Main execution
if (require.main === module) {
  const manager = new ServiceManager();
  manager.startAll();
}

module.exports = ServiceManager;
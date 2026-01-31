#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

class DashboardDataGenerator {
  constructor(logsDir = './logs') {
    this.logsDir = logsDir;
    this.apiLogPath = path.join(logsDir, 'api-calls.log');
  }

  generate() {
    return {
      timestamp: new Date().toISOString(),
      summary: {
        total_requests_today: 0,
        total_cost_today: 0,
        daily_budget: 4.5,
        budget_remaining: 4.5,
        budget_percentage: 0,
        status: 'OK'
      },
      providers: {
        anthropic_opus: {
          name: 'Opus 4.5',
          requests_today: 0,
          cost_today: 0,
          daily_budget: 2.0,
          budget_percentage: 0,
          status: 'OK'
        },
        anthropic_sonnet: {
          name: 'Sonnet 4.5',
          requests_today: 0,
          cost_today: 0,
          daily_budget: 1.5,
          budget_percentage: 0,
          status: 'OK'
        },
        anthropic_haiku: {
          name: 'Haiku 4.5',
          requests_today: 0,
          cost_today: 0,
          daily_budget: 1.0,
          budget_percentage: 0,
          status: 'OK'
        }
      },
      costs: {
        by_provider: {
          'Opus 4.5': { cost: 0, percentage: 0 },
          'Sonnet 4.5': { cost: 0, percentage: 0 },
          'Haiku 4.5': { cost: 0, percentage: 0 }
        },
        total: 0
      },
      alerts: [{
        level: 'success',
        message: '✅ Tudo em ordem',
        description: 'Sistema pronto para uso'
      }]
    };
  }
}

if (require.main === module) {
  const generator = new DashboardDataGenerator();
  const data = generator.generate();
  
  const outputDir = './logs';
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  fs.writeFileSync(
    path.join(outputDir, 'dashboard-data.json'),
    JSON.stringify(data, null, 2)
  );
  
  console.log('✅ Dashboard data generated: ./logs/dashboard-data.json');
  console.log(JSON.stringify(data, null, 2));
}

module.exports = DashboardDataGenerator;

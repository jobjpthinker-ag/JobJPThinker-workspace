#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

class DashboardDataGenerator {
  constructor(logsDir = '../logs') {
    this.logsDir = logsDir;
    this.apiLogPath = path.join(logsDir, 'api-calls.log');
  }

  generate() {
    const lines = this.readLogLines();
    
    return {
      timestamp: new Date().toISOString(),
      summary: this.generateSummary(lines),
      providers: this.generateProviderStats(lines),
      costs: this.generateCostBreakdown(lines),
      alerts: this.generateAlerts(lines)
    };
  }

  readLogLines() {
    if (!fs.existsSync(this.apiLogPath)) {
      console.log('Log file not found:', this.apiLogPath);
      return [];
    }
    
    try {
      const content = fs.readFileSync(this.apiLogPath, 'utf8');
      return content.split('\n').filter(line => line.trim());
    } catch (e) {
      console.log('Error reading log:', e.message);
      return [];
    }
  }

  generateSummary(lines) {
    let totalCost = 0;
    
    lines.forEach(line => {
      const match = line.match(/\$([0-9.]+)/);
      if (match) {
        totalCost += parseFloat(match[1]);
      }
    });

    return {
      total_requests_today: lines.length,
      total_cost_today: parseFloat(totalCost.toFixed(4)),
      daily_budget: 4.5,
      budget_remaining: parseFloat((4.5 - totalCost).toFixed(4)),
      budget_percentage: parseFloat(((totalCost / 4.5) * 100).toFixed(1)),
      status: totalCost >= 4.5 ? 'EXCEEDED' : totalCost >= 3.6 ? 'WARNING' : 'OK'
    };
  }

  generateProviderStats(lines) {
    const providers = {
      anthropic_opus: { name: 'Opus 4.5', cost: 0, count: 0 },
      anthropic_sonnet: { name: 'Sonnet 4.5', cost: 0, count: 0 },
      anthropic_haiku: { name: 'Haiku 4.5', cost: 0, count: 0 }
    };

    lines.forEach(line => {
      const match = line.match(/\[API\] (anthropic_\w+): (\d+) tokens, \$([0-9.]+)/);
      if (match) {
        const provider = match[1];
        const cost = parseFloat(match[3]);
        
        if (providers[provider]) {
          providers[provider].count++;
          providers[provider].cost += cost;
        }
      }
    });

    const result = {};
    Object.entries(providers).forEach(([key, provider]) => {
      const budget = key === 'anthropic_opus' ? 2.0 : key === 'anthropic_sonnet' ? 1.5 : 1.0;
      result[key] = {
        name: provider.name,
        requests_today: provider.count,
        cost_today: parseFloat(provider.cost.toFixed(4)),
        daily_budget: budget,
        budget_percentage: parseFloat(((provider.cost / budget) * 100).toFixed(1)),
        status: provider.cost >= budget ? 'EXCEEDED' : provider.cost >= (budget * 0.8) ? 'WARNING' : 'OK'
      };
    });

    return result;
  }

  generateCostBreakdown(lines) {
    const stats = this.generateProviderStats(lines);
    const total = Object.values(stats).reduce((sum, s) => sum + s.cost_today, 0);

    const by_provider = {};
    Object.values(stats).forEach(stat => {
      by_provider[stat.name] = {
        cost: stat.cost_today,
        percentage: total > 0 ? parseFloat(((stat.cost_today / total) * 100).toFixed(1)) : 0
      };
    });

    return {
      by_provider: by_provider,
      total: parseFloat(total.toFixed(4))
    };
  }

  generateAlerts(lines) {
    const summary = this.generateSummary(lines);
    const stats = this.generateProviderStats(lines);
    const alerts = [];

    if (summary.status === 'EXCEEDED') {
      alerts.push({
        level: 'error',
        message: '🔴 Budget diário excedido!',
        description: `Gasto: $${summary.total_cost_today} / Budget: $${summary.daily_budget}`
      });
    } else if (summary.status === 'WARNING') {
      alerts.push({
        level: 'warning',
        message: '🟡 Cuidado: 80% do budget diário usado',
        description: `Gasto: $${summary.total_cost_today} / Budget: $${summary.daily_budget}`
      });
    }

    Object.values(stats).forEach(stat => {
      if (stat.status === 'EXCEEDED') {
        alerts.push({
          level: 'error',
          message: `🔴 ${stat.name} budget excedido`,
          description: `Gasto: $${stat.cost_today} / Budget: $${stat.daily_budget}`
        });
      } else if (stat.status === 'WARNING') {
        alerts.push({
          level: 'warning',
          message: `🟡 ${stat.name} em 80% do budget`,
          description: `Gasto: $${stat.cost_today} / Budget: $${stat.daily_budget}`
        });
      }
    });

    if (alerts.length === 0) {
      alerts.push({
        level: 'success',
        message: '✅ Tudo em ordem',
        description: `${lines.length} requisições processadas, $${summary.total_cost_today} gasto`
      });
    }

    return alerts;
  }
}

if (require.main === module) {
  const generator = new DashboardDataGenerator();
  const data = generator.generate();
  
  const outputDir = '../logs';
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  fs.writeFileSync(
    path.join(outputDir, 'dashboard-data.json'),
    JSON.stringify(data, null, 2)
  );
  
  console.log('✅ Dashboard data generated: ../logs/dashboard-data.json');
  console.log(JSON.stringify(data, null, 2));
}

module.exports = DashboardDataGenerator;

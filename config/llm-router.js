const fs = require('fs');
const path = require('path');

class LLMRouter {
  constructor(configPath) {
    this.config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    this.providers = this.config.providers;
    this.usage = this._initializeUsageTracking();
  }

  /**
   * Router principal: Decide qual LLM usar baseado na tarefa
   */
  async route(task) {
    const assessment = this._assessTask(task);
    
    console.log(`[ROUTER] Task: ${task.type}, Complexity: ${assessment.complexity}`);

    // Decisão baseada em complexidade e tipo
    if (assessment.complexity >= 8) {
      return this._selectProvider('anthropic_opus');
    } else if (assessment.complexity >= 5) {
      return this._selectProvider('anthropic_sonnet');
    } else {
      return this._selectProvider('anthropic_haiku');
    }
  }

  /**
   * Avalia complexidade da tarefa
   */
  _assessTask(task) {
    const complexity = this._calculateComplexity(task);
    const estimatedCost = this._estimateCost(task, complexity);

    return {
      type: task.type,
      complexity: complexity,
      estimated_tokens: task.estimated_tokens || 500,
      estimated_cost: estimatedCost,
      priority: task.priority || 'normal'
    };
  }

  /**
   * Calcula complexidade (1-10)
   */
  _calculateComplexity(task) {
    let score = 5; // Padrão: médio

    // Fatores que aumentam complexidade
    if (task.type === 'financial_analysis') score += 4;    // +4 = 9
    if (task.type === 'strategic_planning') score += 3;    // +3
    if (task.involves_multiple_sources) score += 2;        // +2
    if (task.requires_reasoning) score += 1;               // +1

    // Fatores que diminuem complexidade
    if (task.type === 'classification') score -= 3;        // -3 = 2
    if (task.type === 'validation') score -= 2;            // -2
    if (task.type === 'formatting') score -= 2;            // -2

    return Math.min(10, Math.max(1, score)); // Clamp 1-10
  }

  /**
   * Seleciona provider com fallback
   */
  _selectProvider(preferredProvider) {
    const provider = this.providers[preferredProvider];
    
    if (this._isProviderAvailable(preferredProvider)) {
      return provider;
    }

    // Fallback chain
    console.warn(`[ROUTER] ${preferredProvider} indisponível, usando fallback`);
    for (const fallback of this.config.routing.fallback_chain) {
      if (this._isProviderAvailable(fallback)) {
        return this.providers[fallback];
      }
    }

    throw new Error('Nenhum provider disponível!');
  }

  /**
   * Verifica disponibilidade (quota, budget, etc)
   */
  _isProviderAvailable(providerName) {
    const provider = this.providers[providerName];
    const usage = this.usage[providerName];

    // Checar budget
    if (usage.daily_spend >= provider.quotas.daily_budget) {
      console.warn(`[ROUTER] ${providerName} budget diário excedido`);
      return false;
    }

    // Checar rate limit
    if (usage.requests_this_minute >= provider.quotas.requests_per_minute) {
      console.warn(`[ROUTER] ${providerName} rate limit excedido`);
      return false;
    }

    return true;
  }

  /**
   * Estima custo da tarefa
   */
  _estimateCost(task, complexity) {
    const inputCost = (task.estimated_tokens || 500) * 0.00001;
    const outputCost = (task.estimated_tokens || 500) * 0.00002;
    return inputCost + outputCost;
  }

  /**
   * Inicializa tracking de uso
   */
  _initializeUsageTracking() {
    const tracking = {};
    
    for (const [name, provider] of Object.entries(this.providers)) {
      tracking[name] = {
        daily_spend: 0,
        requests_this_minute: 0,
        requests_today: 0,
        tokens_used: 0,
        last_reset: new Date()
      };
    }

    return tracking;
  }

  /**
   * Registra chamada API
   */
  logApiCall(provider, tokens, cost) {
    const timestamp = new Date().toISOString();
    
    this.usage[provider].daily_spend += cost;
    this.usage[provider].requests_this_minute += 1;
    this.usage[provider].requests_today += 1;
    this.usage[provider].tokens_used += tokens;

    console.log(`[API] ${provider}: ${tokens} tokens, $${cost.toFixed(4)}`);
  }
}

module.exports = LLMRouter;

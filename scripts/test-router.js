#!/usr/bin/env node

const LLMRouter = require('../config/llm-router.js');
const path = require('path');

console.log('================================');
console.log('  LLM Router Test Suite');
console.log('================================\n');

// Inicializar router
const configPath = path.join(__dirname, '../config/llm-providers.json');
const router = new LLMRouter(configPath);

// Casos de teste
const testCases = [
  {
    name: 'Teste 1: Análise Financeira Complexa',
    task: {
      type: 'financial_analysis',
      involves_multiple_sources: true,
      requires_reasoning: true,
      estimated_tokens: 2000
    },
    expectedProvider: 'anthropic_opus'
  },
  {
    name: 'Teste 2: Extração de Dados',
    task: {
      type: 'data_extraction',
      estimated_tokens: 1000
    },
    expectedProvider: 'anthropic_sonnet'
  },
  {
    name: 'Teste 3: Classificação Simples',
    task: {
      type: 'classification',
      estimated_tokens: 100
    },
    expectedProvider: 'anthropic_haiku'
  },
  {
    name: 'Teste 4: Formatação',
    task: {
      type: 'formatting',
      estimated_tokens: 200
    },
    expectedProvider: 'anthropic_haiku'
  }
];

// Executar testes
let passed = 0;
let failed = 0;

testCases.forEach((test, index) => {
  console.log(`\n${test.name}`);
  console.log('─'.repeat(50));
  
  try {
    const complexity = router._calculateComplexity(test.task);
    const selectedProvider = router._selectProvider(
      complexity >= 8 ? 'anthropic_opus' :
      complexity >= 5 ? 'anthropic_sonnet' :
      'anthropic_haiku'
    );
    
    const providerName = Object.keys(router.providers).find(
      key => router.providers[key] === selectedProvider
    );
    
    console.log(`📊 Task: ${test.task.type}`);
    console.log(`📈 Complexity: ${complexity}/10`);
    console.log(`🤖 Selected: ${selectedProvider.name}`);
    console.log(`💰 Est. Cost: $${router._estimateCost(test.task, complexity).toFixed(4)}`);
    
    if (providerName === test.expectedProvider) {
      console.log(`✅ PASSED`);
      passed++;
    } else {
      console.log(`❌ FAILED - Esperava ${test.expectedProvider}, obteve ${providerName}`);
      failed++;
    }
    
  } catch (error) {
    console.log(`❌ ERROR: ${error.message}`);
    failed++;
  }
});

// Resumo
console.log('\n' + '='.repeat(50));
console.log(`✅ Passed: ${passed}/${testCases.length}`);
console.log(`❌ Failed: ${failed}/${testCases.length}`);
console.log('='.repeat(50) + '\n');

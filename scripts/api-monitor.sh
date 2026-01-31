#!/bin/bash

LOG_DIR="${1:-.}/logs"
API_LOG="$LOG_DIR/api-calls.log"

echo "================================"
echo "  OpenClaw API Usage Monitor"
echo "================================"
echo ""

# Criar logs se não existirem
mkdir -p "$LOG_DIR"
touch "$API_LOG"

echo "📅 TODAY'S USAGE:"
echo ""

# Contabilizar por provider
echo "Opus (Análise):"
grep "\[API\] anthropic_opus" "$API_LOG" 2>/dev/null | tail -5 || echo "  (Sem uso hoje)"

echo ""
echo "Sonnet (Processamento):"
grep "\[API\] anthropic_sonnet" "$API_LOG" 2>/dev/null | tail -5 || echo "  (Sem uso hoje)"

echo ""
echo "Haiku (Trivial):"
grep "\[API\] anthropic_haiku" "$API_LOG" 2>/dev/null | tail -5 || echo "  (Sem uso hoje)"

echo ""
echo "================================"
echo "  CUSTO RESUMIDO"
echo "================================"
echo ""

# Total hoje
TODAY_COST=$(grep -E "\[API\]" "$API_LOG" 2>/dev/null | \
  awk '{print $NF}' | \
  sed 's/\$//g' | \
  awk '{sum+=$1} END {printf "%.4f", sum}')

echo "💰 Gasto hoje: \$$TODAY_COST"
echo "📊 Budget restante (diário): \$(echo \"4.5 - $TODAY_COST\" | bc)"
echo ""

# Últimas chamadas
echo "📈 ÚLTIMAS 5 CHAMADAS:"
grep "\[API\]" "$API_LOG" 2>/dev/null | tail -5

echo ""
echo "✅ Monitor atualizado em: $(date)"

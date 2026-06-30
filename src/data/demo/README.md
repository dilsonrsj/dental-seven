# Dados fictícios da demo — Clínica Sorriso Norte

Arquivos JSON versionados no repositório para o MVP funcionar **sem Supabase**.

| Arquivo | Conteúdo |
|---------|----------|
| `patients.json` | 8 pacientes fictícios |
| `dentists.json` | Dra. Ana Silva, Dr. Carlos Mendes |
| `appointments.json` | 15 consultas (datas relativas à semana atual) |
| `whatsapp-threads.json` | 4 conversas |
| `whatsapp-messages.json` | 12 mensagens demo |

As datas de consultas e mensagens são calculadas em tempo de execução a partir de `day_offset` (segunda-feira da semana atual = dia 0), igual ao seed SQL `002_seed_demo.sql`.

**Variável de ambiente:** `DEMO_MOCK_DATA=true` (padrão) usa estes arquivos. Defina `DEMO_MOCK_DATA=false` para voltar ao Supabase.

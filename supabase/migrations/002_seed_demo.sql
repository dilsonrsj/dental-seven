-- Dental Seven MVP — seed demo (fictício, idempotente)
-- Clínica Sorriso Norte e dados de demonstração

insert into clinics (id, name, slug) values
  ('11111111-1111-1111-1111-111111111111', 'Clínica Sorriso Norte', 'sorriso-norte')
on conflict (id) do nothing;

insert into dentists (id, clinic_id, name, color) values
  ('22222222-2222-2222-2222-222222222201', '11111111-1111-1111-1111-111111111111', 'Dra. Ana Silva', '#4490E2'),
  ('22222222-2222-2222-2222-222222222202', '11111111-1111-1111-1111-111111111111', 'Dr. Carlos Mendes', '#6BA3E8')
on conflict (id) do nothing;

-- 8 pacientes fictícios
insert into patients (id, clinic_id, name, phone, whatsapp, birth_date, notes) values
  (
    '33333333-3333-3333-3333-333333333301',
    '11111111-1111-1111-1111-111111111111',
    'Marina Costa',
    '(11) 98765-4321',
    '5511987654321',
    '1990-03-15',
    'Demo: paciente fictícia. Prefere horários pela manhã. Sensibilidade leve nos dentes anteriores.'
  ),
  (
    '33333333-3333-3333-3333-333333333302',
    '11111111-1111-1111-1111-111111111111',
    'João Pereira',
    '(11) 97654-3210',
    '5511976543210',
    '1985-07-22',
    'Demo: paciente fictício. Retorno periódico a cada 6 meses. Sem alergias conhecidas.'
  ),
  (
    '33333333-3333-3333-3333-333333333303',
    '11111111-1111-1111-1111-111111111111',
    'Fernanda Lima',
    '(11) 96543-2109',
    '5511965432109',
    '1992-11-08',
    'Demo: paciente fictícia. Interesse em clareamento. Primeira consulta na clínica.'
  ),
  (
    '33333333-3333-3333-3333-333333333304',
    '11111111-1111-1111-1111-111111111111',
    'Lucas Oliveira',
    '(11) 95432-1098',
    '5511954321098',
    '1978-01-30',
    'Demo: paciente fictício. Aparelho removível em uso. Evitar procedimentos longos.'
  ),
  (
    '33333333-3333-3333-3333-333333333305',
    '11111111-1111-1111-1111-111111111111',
    'Beatriz Santos',
    '(11) 94321-0987',
    '5511943210987',
    '1995-05-12',
    'Demo: paciente fictícia. Contato preferencial via WhatsApp. Ansiedade leve em consultas.'
  ),
  (
    '33333333-3333-3333-3333-333333333306',
    '11111111-1111-1111-1111-111111111111',
    'Rafael Souza',
    '(11) 93210-9876',
    '5511932109876',
    '1988-09-25',
    'Demo: paciente fictício. Trabalha em home office — flexível no horário da tarde.'
  ),
  (
    '33333333-3333-3333-3333-333333333307',
    '11111111-1111-1111-1111-111111111111',
    'Camila Rodrigues',
    '(11) 92109-8765',
    '5511921098765',
    '1998-12-03',
    'Demo: paciente fictícia. Estudante universitária. Disponível após 14h.'
  ),
  (
    '33333333-3333-3333-3333-333333333308',
    '11111111-1111-1111-1111-111111111111',
    'Pedro Almeida',
    '(11) 91098-7654',
    '5511910987654',
    '1982-04-18',
    'Demo: paciente fictício. Indicado por Marina Costa (demo). Avaliação ortodôntica pendente.'
  )
on conflict (id) do nothing;

-- 15 consultas — semana atual ± dias adjacentes (relativo a now())
insert into appointments (
  id, clinic_id, dentist_id, patient_id, starts_at, ends_at, duration_min, status, procedure_label, notes
) values
  (
    '44444444-4444-4444-4444-444444444401',
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222201',
    '33333333-3333-3333-3333-333333333301',
    date_trunc('week', now()) - interval '1 day' + interval '10 hours',
    date_trunc('week', now()) - interval '1 day' + interval '10 hours 30 minutes',
    30, 'completed', 'Limpeza', 'Demo: consulta concluída no domingo anterior.'
  ),
  (
    '44444444-4444-4444-4444-444444444402',
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222202',
    '33333333-3333-3333-3333-333333333302',
    date_trunc('week', now()) + interval '8 hours',
    date_trunc('week', now()) + interval '8 hours 45 minutes',
    45, 'confirmed', 'Retorno', 'Demo: retorno semestral confirmado — segunda-feira 08h.'
  ),
  (
    '44444444-4444-4444-4444-444444444403',
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222201',
    '33333333-3333-3333-3333-333333333303',
    date_trunc('week', now()) + interval '1 day' + interval '9 hours',
    date_trunc('week', now()) + interval '1 day' + interval '10 hours',
    60, 'pending', 'Avaliação', 'Demo: primeira avaliação — aguardando confirmação.'
  ),
  (
    '44444444-4444-4444-4444-444444444404',
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222202',
    '33333333-3333-3333-3333-333333333304',
    date_trunc('week', now()) + interval '1 day' + interval '14 hours',
    date_trunc('week', now()) + interval '1 day' + interval '14 hours 30 minutes',
    30, 'confirmed', 'Retorno', 'Demo: ajuste de aparelho removível.'
  ),
  (
    '44444444-4444-4444-4444-444444444405',
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222201',
    '33333333-3333-3333-3333-333333333305',
    date_trunc('week', now()) + interval '2 days' + interval '11 hours',
    date_trunc('week', now()) + interval '2 days' + interval '11 hours 30 minutes',
    30, 'confirmed', 'Limpeza', 'Demo: limpeza de rotina — paciente ansiosa, reservar tempo extra.'
  ),
  (
    '44444444-4444-4444-4444-444444444406',
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222202',
    '33333333-3333-3333-3333-333333333306',
    date_trunc('week', now()) + interval '2 days' + interval '15 hours',
    date_trunc('week', now()) + interval '2 days' + interval '16 hours',
    60, 'pending', 'Clareamento', 'Demo: sessão de clareamento — pendente confirmação WhatsApp.'
  ),
  (
    '44444444-4444-4444-4444-444444444407',
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222201',
    '33333333-3333-3333-3333-333333333307',
    date_trunc('week', now()) + interval '3 days' + interval '14 hours 30 minutes',
    date_trunc('week', now()) + interval '3 days' + interval '15 hours',
    30, 'confirmed', 'Avaliação', 'Demo: avaliação ortodôntica inicial.'
  ),
  (
    '44444444-4444-4444-4444-444444444408',
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222202',
    '33333333-3333-3333-3333-333333333308',
    date_trunc('week', now()) + interval '3 days' + interval '16 hours',
    date_trunc('week', now()) + interval '3 days' + interval '16 hours 45 minutes',
    45, 'cancelled', 'Avaliação', 'Demo: cancelada pelo paciente — reagendar.'
  ),
  (
    '44444444-4444-4444-4444-444444444409',
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222201',
    '33333333-3333-3333-3333-333333333301',
    date_trunc('week', now()) + interval '4 days' + interval '8 hours 30 minutes',
    date_trunc('week', now()) + interval '4 days' + interval '9 hours',
    30, 'confirmed', 'Retorno', 'Demo: retorno pós-limpeza.'
  ),
  (
    '44444444-4444-4444-4444-444444444410',
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222202',
    '33333333-3333-3333-3333-333333333303',
    date_trunc('week', now()) + interval '4 days' + interval '10 hours',
    date_trunc('week', now()) + interval '4 days' + interval '11 hours',
    60, 'pending', 'Clareamento', 'Demo: segunda sessão de clareamento (demo).'
  ),
  (
    '44444444-4444-4444-4444-444444444411',
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222201',
    '33333333-3333-3333-3333-333333333305',
    date_trunc('week', now()) + interval '5 days' + interval '9 hours',
    date_trunc('week', now()) + interval '5 days' + interval '9 hours 30 minutes',
    30, 'confirmed', 'Retorno', 'Demo: retorno pós-limpeza — sexta-feira manhã.'
  ),
  (
    '44444444-4444-4444-4444-444444444412',
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222202',
    '33333333-3333-3333-3333-333333333302',
    date_trunc('week', now()) + interval '5 days' + interval '11 hours 30 minutes',
    date_trunc('week', now()) + interval '5 days' + interval '12 hours',
    30, 'completed', 'Limpeza', 'Demo: limpeza concluída na sexta.'
  ),
  (
    '44444444-4444-4444-4444-444444444413',
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222201',
    '33333333-3333-3333-3333-333333333306',
    date_trunc('week', now()) + interval '6 days' + interval '10 hours',
    date_trunc('week', now()) + interval '6 days' + interval '10 hours 30 minutes',
    30, 'pending', 'Retorno', 'Demo: sábado — horário especial demo.'
  ),
  (
    '44444444-4444-4444-4444-444444444414',
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222202',
    '33333333-3333-3333-3333-333333333307',
    date_trunc('week', now()) + interval '6 days' + interval '14 hours',
    date_trunc('week', now()) + interval '6 days' + interval '15 hours',
    60, 'confirmed', 'Clareamento', 'Demo: clareamento — sábado tarde.'
  ),
  (
    '44444444-4444-4444-4444-444444444415',
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222201',
    '33333333-3333-3333-3333-333333333308',
    date_trunc('week', now()) + interval '7 days' + interval '9 hours',
    date_trunc('week', now()) + interval '7 days' + interval '9 hours 45 minutes',
    45, 'pending', 'Avaliação', 'Demo: reagendamento pós-cancelamento — domingo seguinte.'
  )
on conflict (id) do nothing;

-- 4 threads WhatsApp (pacientes com conversas demo)
insert into whatsapp_threads (id, clinic_id, patient_id, last_message_at) values
  (
    '55555555-5555-5555-5555-555555555501',
    '11111111-1111-1111-1111-111111111111',
    '33333333-3333-3333-3333-333333333301',
    date_trunc('week', now()) + interval '2 days' + interval '16 hours 20 minutes'
  ),
  (
    '55555555-5555-5555-5555-555555555502',
    '11111111-1111-1111-1111-111111111111',
    '33333333-3333-3333-3333-333333333305',
    date_trunc('week', now()) + interval '3 days' + interval '10 hours 45 minutes'
  ),
  (
    '55555555-5555-5555-5555-555555555503',
    '11111111-1111-1111-1111-111111111111',
    '33333333-3333-3333-3333-333333333303',
    date_trunc('week', now()) + interval '4 days' + interval '9 hours 15 minutes'
  ),
  (
    '55555555-5555-5555-5555-555555555504',
    '11111111-1111-1111-1111-111111111111',
    '33333333-3333-3333-3333-333333333306',
    date_trunc('week', now()) + interval '1 day' + interval '18 hours 30 minutes'
  )
on conflict (id) do nothing;

-- 10 mensagens WhatsApp demo (inbound/outbound)
insert into whatsapp_messages (id, thread_id, direction, body, sent_at, status) values
  (
    '66666666-6666-6666-6666-666666666601',
    '55555555-5555-5555-5555-555555555501',
    'outbound',
    'Olá Marina! Lembramos sua consulta de retorno na quinta às 08h30. Confirma presença? (Demo)',
    date_trunc('week', now()) + interval '2 days' + interval '15 hours',
    'read'
  ),
  (
    '66666666-6666-6666-6666-666666666602',
    '55555555-5555-5555-5555-555555555501',
    'inbound',
    'Oi! Confirmo sim, estarei aí. Obrigada! 😊',
    date_trunc('week', now()) + interval '2 days' + interval '15 hours 12 minutes',
    'delivered'
  ),
  (
    '66666666-6666-6666-6666-666666666603',
    '55555555-5555-5555-5555-555555555501',
    'outbound',
    'Perfeito! Até quinta. Clínica Sorriso Norte — demo.',
    date_trunc('week', now()) + interval '2 days' + interval '16 hours 20 minutes',
    'read'
  ),
  (
    '66666666-6666-6666-6666-666666666604',
    '55555555-5555-5555-5555-555555555502',
    'inbound',
    'Bom dia! Tenho muita ansiedade em consultas. Tem como reservar um horário mais calmo?',
    date_trunc('week', now()) + interval '3 days' + interval '9 hours 30 minutes',
    'delivered'
  ),
  (
    '66666666-6666-6666-6666-666666666605',
    '55555555-5555-5555-5555-555555555502',
    'outbound',
    'Olá Beatriz! Claro, reservamos a primeira consulta do dia (09h) para você. Dra. Ana cuida com calma. (Demo)',
    date_trunc('week', now()) + interval '3 days' + interval '10 hours',
    'read'
  ),
  (
    '66666666-6666-6666-6666-666666666606',
    '55555555-5555-5555-5555-555555555502',
    'inbound',
    'Muito obrigada! Isso me deixa mais tranquila.',
    date_trunc('week', now()) + interval '3 days' + interval '10 hours 45 minutes',
    'delivered'
  ),
  (
    '66666666-6666-6666-6666-666666666607',
    '55555555-5555-5555-5555-555555555503',
    'outbound',
    'Fernanda, sua avaliação para clareamento está agendada para terça às 09h. Traga exames se tiver. (Demo)',
    date_trunc('week', now()) + interval '1 day' + interval '17 hours',
    'delivered'
  ),
  (
    '66666666-6666-6666-6666-666666666608',
    '55555555-5555-5555-5555-555555555503',
    'inbound',
    'Recebi! Posso remarcar para quarta no mesmo horário?',
    date_trunc('week', now()) + interval '4 days' + interval '8 hours 50 minutes',
    'delivered'
  ),
  (
    '66666666-6666-6666-6666-666666666609',
    '55555555-5555-5555-5555-555555555503',
    'outbound',
    'Sim, remarcamos para quarta 09h. Até lá! (Demo Sorriso Norte)',
    date_trunc('week', now()) + interval '4 days' + interval '9 hours 15 minutes',
    'read'
  ),
  (
    '66666666-6666-6666-6666-666666666610',
    '55555555-5555-5555-5555-555555555504',
    'inbound',
    'Boa tarde, consigo ir na terça às 15h para o clareamento?',
    date_trunc('week', now()) + interval '1 day' + interval '17 hours 45 minutes',
    'delivered'
  ),
  (
    '66666666-6666-6666-6666-666666666611',
    '55555555-5555-5555-5555-555555555504',
    'outbound',
    'Olá Rafael! Terça 15h está disponível com Dr. Carlos. Confirmamos? (Demo)',
    date_trunc('week', now()) + interval '1 day' + interval '18 hours 10 minutes',
    'read'
  ),
  (
    '66666666-6666-6666-6666-666666666612',
    '55555555-5555-5555-5555-555555555504',
    'inbound',
    'Confirmado! Obrigado.',
    date_trunc('week', now()) + interval '1 day' + interval '18 hours 30 minutes',
    'delivered'
  )
on conflict (id) do nothing;

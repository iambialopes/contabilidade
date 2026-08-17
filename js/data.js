/* Corrêa Controle Interno — Dados editáveis da aplicação. */
window.CorreaData = {
  clients: [
    { name: 'Alvorada Comércio de Alimentos', cnpj: '12.345.678/0001-90', city: 'São Paulo, SP', tax: 'SIMPLES', activity: 'Comércio varejista', payroll: 'Sim', active: true, initials: 'AC', tone: '' },
    { name: 'Ateliê Linha & Forma', cnpj: '45.678.901/0001-23', city: 'Campinas, SP', tax: 'PRESUMIDO', activity: 'Serviços de design', payroll: 'Não', active: true, initials: 'LF', tone: 'peach' },
    { name: 'Brava Tecnologia', cnpj: '23.456.789/0001-45', city: 'Belo Horizonte, MG', tax: 'REAL', activity: 'Tecnologia da informação', payroll: 'Sim', active: true, initials: 'BT', tone: 'blue' },
    { name: 'Café do Largo', cnpj: '78.901.234/0001-56', city: 'Jundiaí, SP', tax: 'MEI', activity: 'Alimentação', payroll: 'Não', active: false, initials: 'CL', tone: 'peach' },
    { name: 'Mosaico Arquitetura', cnpj: '34.567.890/0001-12', city: 'Santos, SP', tax: 'SIMPLES', activity: 'Arquitetura e urbanismo', payroll: 'Sim', active: true, initials: 'MA', tone: 'mint' }
  ],
  departments: [
    { key: 'overview', label: 'Visão geral', detail: 'Acompanhar escritório', icon: '▦' },
    { key: 'fiscal', label: 'Fiscal', detail: 'Obrigações e guias', icon: '▤' },
    { key: 'pessoal', label: 'Pessoal', detail: 'Folha e eventos', icon: '♧' },
    { key: 'contabil', label: 'Contábil', detail: 'Movimentação e balancete', icon: '▣' },
    { key: 'societario', label: 'Societário', detail: 'Processos e procurações', icon: '▥' }
  ],
  departmentsData: {
    fiscal: { eyebrow: 'Obrigações e guias', intro: 'Controle as entregas fiscais por empresa, competência e canal de envio.', metric: '12', metricLabel: 'entregas no ciclo', tasks: [
      ['Importação das notas', 'Receber XML, validar período e organizar documentos.', 'Em andamento', 'Hoje', 'peach'], ['Apuração na Domínio', 'Conferir impostos e bases antes da transmissão.', 'Aguardando', '20 AGO', 'sand'], ['Transmissão PGDAS', 'Transmitir declaração e salvar protocolo do cliente.', 'Programada', '21 AGO', 'olive'], ['Envio da guia', 'Enviar por WhatsApp ou e-mail e registrar confirmação.', 'Aguardando', '22 AGO', 'blue'], ['Sintegra e DSTDA', 'Validar obrigações estaduais conforme atividade.', 'Aguardando', '25 AGO', 'sand'], ['Livro eletrônico e EFD Reinf', 'Revisar arquivos, recibos e pendências de retorno.', 'Aguardando', '27 AGO', 'olive'], ['DEFIS anual', 'Acompanhar documentação e fechamento anual.', 'Anual', 'Março', 'blue']
    ] },
    pessoal: { eyebrow: 'Folha e eventos', intro: 'Organize a folha, eventos trabalhistas e as comunicações de cada competência.', metric: '08', metricLabel: 'pontos na folha', tasks: [
      ['Conferir anotações', 'Revisar alterações, empréstimos e apontamentos do período.', 'Em andamento', 'Hoje', 'peach'], ['Cálculo da folha', 'Processar folha e conferir bases, descontos e líquidos.', 'Aguardando', '23 AGO', 'olive'], ['Eventos para eSocial', 'Enviar eventos e acompanhar retornos do ambiente.', 'Aguardando', '24 AGO', 'blue'], ['Fechamento DCTFWeb', 'Conferir fechamento, débitos e recibos da competência.', 'Programada', '25 AGO', 'sand'], ['Recibos e guias', 'Gerar documentos e enviar por WhatsApp ou e-mail.', 'Aguardando', '26 AGO', 'olive'], ['Admissões, férias e rescisões', 'Registrar movimentações e prazos dos colaboradores.', 'Contínuo', 'Sempre', 'peach'], ['Atestados e procedimentos', 'Manter anotações da folha e próximos procedimentos.', 'Contínuo', 'Sempre', 'blue'], ['Distribuição de lucros e EFD Reinf', 'Alinhar com Contábil e acompanhar eventos da folha.', 'Aguardando', '28 AGO', 'sand']
    ] },
    contabil: { eyebrow: 'Movimentação e balancete', intro: 'Registre a documentação contábil recebida e acompanhe o fechamento de cada empresa.', metric: '04', metricLabel: 'fechamentos ativos', tasks: [
      ['Solicitar movimentação', 'Enviar solicitação e registrar documentos pendentes.', 'Em andamento', 'Hoje', 'peach'], ['Importar extratos', 'Organizar extratos bancários e conferir período.', 'Aguardando', '22 AGO', 'blue'], ['Distribuição de lucros', 'Verificar valores e alinhar documentação com a empresa.', 'Aguardando', '26 AGO', 'sand'], ['Fechamento do balancete', 'Conferir lançamentos e concluir balancete mensal.', 'Programada', '30 AGO', 'olive']
    ] },
    societario: { eyebrow: 'Processos e procurações', intro: 'Acompanhe os processos societários, vínculos e documentos legais por empresa.', metric: '06', metricLabel: 'processos ativos', tasks: [
      ['Cadastro das empresas', 'Manter dados cadastrais e documentos do sistema atualizados.', 'Em andamento', 'Hoje', 'peach'], ['Procurações', 'Controlar validade, poderes e responsáveis por cada procuração.', 'Aguardando', '22 AGO', 'sand'], ['Vínculo SAT e CRC', 'Confirmar vínculos e acessos necessários para atendimento.', 'Aguardando', '24 AGO', 'blue'], ['Abertura de CNPJ', 'Acompanhar etapas, documentos e protocolos de abertura.', 'Programada', '27 AGO', 'olive'], ['Baixa e alteração', 'Organizar processos, exigências e retornos dos órgãos.', 'Aguardando', '30 AGO', 'peach']
    ] }
  }
};

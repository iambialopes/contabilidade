/* Direção visual: Verde Sálvia Editorial. Cada departamento funciona como uma página de trabalho com checklist, prazos e cliente em foco. */
import { ArrowUpRight, Plus } from "lucide-react";
import { toast } from "sonner";

type Department = "Fiscal" | "Pessoal" | "Contábil" | "Societário";
type Client = { name: string; tax: string; initials: string };
type Task = { title: string; description: string; status: string; due: string; tone: "peach" | "sand" | "olive" | "blue" };

const modules: Record<Department, { eyebrow: string; intro: string; metric: string; metricLabel: string; tasks: Task[] }> = {
  Fiscal: { eyebrow: "Obrigações e guias", intro: "Controle as entregas fiscais por empresa, competência e canal de envio.", metric: "12", metricLabel: "entregas no ciclo", tasks: [
    { title: "Importação das notas", description: "Receber XML, validar período e organizar documentos.", status: "Em andamento", due: "Hoje", tone: "peach" },
    { title: "Apuração na Domínio", description: "Conferir impostos e bases antes da transmissão.", status: "Aguardando", due: "20 AGO", tone: "sand" },
    { title: "Transmissão PGDAS", description: "Transmitir declaração e salvar protocolo do cliente.", status: "Programada", due: "21 AGO", tone: "olive" },
    { title: "Envio da guia", description: "Enviar por WhatsApp ou e-mail e registrar confirmação.", status: "Aguardando", due: "22 AGO", tone: "blue" },
    { title: "Sintegra e DSTDA", description: "Validar obrigações estaduais conforme atividade.", status: "Aguardando", due: "25 AGO", tone: "sand" },
    { title: "Livro eletrônico e EFD Reinf", description: "Revisar arquivos, recibos e pendências de retorno.", status: "Aguardando", due: "27 AGO", tone: "olive" },
    { title: "DEFIS anual", description: "Acompanhar documentação e fechamento anual.", status: "Anual", due: "Março", tone: "blue" },
  ] },
  Pessoal: { eyebrow: "Folha e eventos", intro: "Organize a folha, eventos trabalhistas e as comunicações de cada competência.", metric: "08", metricLabel: "pontos na folha", tasks: [
    { title: "Conferir anotações", description: "Revisar alterações, empréstimos e apontamentos do período.", status: "Em andamento", due: "Hoje", tone: "peach" },
    { title: "Cálculo da folha", description: "Processar folha e conferir bases, descontos e líquidos.", status: "Aguardando", due: "23 AGO", tone: "olive" },
    { title: "Eventos para eSocial", description: "Enviar eventos e acompanhar retornos do ambiente.", status: "Aguardando", due: "24 AGO", tone: "blue" },
    { title: "Fechamento DCTFWeb", description: "Conferir fechamento, débitos e recibos da competência.", status: "Programada", due: "25 AGO", tone: "sand" },
    { title: "Recibos e guias", description: "Gerar documentos e enviar por WhatsApp ou e-mail.", status: "Aguardando", due: "26 AGO", tone: "olive" },
    { title: "Admissões, férias e rescisões", description: "Registrar movimentações e prazos dos colaboradores.", status: "Contínuo", due: "Sempre", tone: "peach" },
    { title: "Atestados e procedimentos", description: "Manter anotações da folha e próximos procedimentos.", status: "Contínuo", due: "Sempre", tone: "blue" },
    { title: "Distribuição de lucros e EFD Reinf", description: "Alinhar com Contábil e acompanhar eventos da folha.", status: "Aguardando", due: "28 AGO", tone: "sand" },
  ] },
  Contábil: { eyebrow: "Movimentação e balancete", intro: "Registre a documentação contábil recebida e acompanhe o fechamento de cada empresa.", metric: "04", metricLabel: "fechamentos ativos", tasks: [
    { title: "Solicitar movimentação", description: "Enviar solicitação e registrar documentos pendentes.", status: "Em andamento", due: "Hoje", tone: "peach" },
    { title: "Importar extratos", description: "Organizar extratos bancários e conferir período.", status: "Aguardando", due: "22 AGO", tone: "blue" },
    { title: "Distribuição de lucros", description: "Verificar valores e alinhar documentação com a empresa.", status: "Aguardando", due: "26 AGO", tone: "sand" },
    { title: "Fechamento do balancete", description: "Conferir lançamentos e concluir balancete mensal.", status: "Programada", due: "30 AGO", tone: "olive" },
  ] },
  Societário: { eyebrow: "Processos e procurações", intro: "Acompanhe os processos societários, vínculos e documentos legais por empresa.", metric: "06", metricLabel: "processos ativos", tasks: [
    { title: "Cadastro das empresas", description: "Manter dados cadastrais e documentos do sistema atualizados.", status: "Em andamento", due: "Hoje", tone: "peach" },
    { title: "Procurações", description: "Controlar validade, poderes e responsáveis por cada procuração.", status: "Aguardando", due: "22 AGO", tone: "sand" },
    { title: "Vínculo SAT e CRC", description: "Confirmar vínculos e acessos necessários para atendimento.", status: "Aguardando", due: "24 AGO", tone: "blue" },
    { title: "Abertura de CNPJ", description: "Acompanhar etapas, documentos e protocolos de abertura.", status: "Programada", due: "27 AGO", tone: "olive" },
    { title: "Baixa e alteração", description: "Organizar processos, exigências e retornos dos órgãos.", status: "Aguardando", due: "30 AGO", tone: "peach" },
  ] },
};

export default function DepartmentPage({ department, selectedClient }: { department: Department; selectedClient: Client }) {
  const current = modules[department];
  const toneClasses: Record<Task["tone"], string> = { peach: "bg-[#F4E2DC] text-[#B9786B]", sand: "bg-[#F0E8D7] text-[#9B8055]", olive: "bg-[#E4EBDD] text-[#607254]", blue: "bg-[#E3E9EB] text-[#6D858C]" };
  return <section className="space-y-6"><div className="rounded-[24px] border border-[#E1DED4] bg-[#EEEDE4] p-6 sm:p-8"><div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end"><div><p className="eyebrow text-[#718066]">{current.eyebrow}</p><h2 className="display-serif mt-3 text-4xl leading-tight text-[#485441]">Departamento {department}</h2><p className="mt-3 max-w-[660px] text-sm leading-6 text-[#65705F]">{current.intro}</p></div><div className="rounded-2xl bg-[#F8F6F0] px-5 py-4 lg:min-w-[190px]"><p className="eyebrow">Cliente em foco</p><p className="mt-2 text-sm font-extrabold text-[#52604D]">{selectedClient.name}</p><p className="mt-1 text-[11px] text-[#899184]">{current.metric} {current.metricLabel}</p></div></div></div><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="eyebrow">Checklist do departamento</p><h3 className="display-serif mt-2 text-[26px] text-[#4B5748]">Rotinas e próximos prazos</h3></div><button onClick={() => toast(`Nova rotina de ${department} será criada na próxima etapa.`)} className="inline-flex items-center gap-2 rounded-xl bg-[#66715B] px-4 py-3 text-xs font-bold text-white"><Plus className="h-4 w-4" /> Nova rotina</button></div><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{current.tasks.map((task) => <button key={task.title} onClick={() => toast(`${task.title}: acompanhamento aberto para ${selectedClient.name}.`)} className="group rounded-[18px] border border-[#E3E0D7] bg-[#FBFAF6] p-5 text-left soft-shadow hover:-translate-y-0.5 hover:border-[#C8D3BE]"><div className="flex items-start justify-between gap-3"><span className={`rounded-lg px-2.5 py-1 text-[10px] font-extrabold ${toneClasses[task.tone]}`}>{task.status}</span><span className="text-[10px] font-extrabold uppercase tracking-[.12em] text-[#9CA49A]">{task.due}</span></div><h4 className="mt-5 text-sm font-extrabold text-[#4D5949]">{task.title}</h4><p className="mt-2 min-h-[42px] text-xs leading-5 text-[#7D8679]">{task.description}</p><div className="mt-5 flex items-center justify-between border-t border-[#EEEAE2] pt-3 text-[10px] font-bold text-[#899184]"><span>{selectedClient.initials} · {selectedClient.tax}</span><ArrowUpRight className="h-4 w-4 text-[#B3BCAF] transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" /></div></button>)}</div></section>;
}

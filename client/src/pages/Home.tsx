/* Direção visual: Verde Sálvia Editorial. A tela usa o cliente como unidade central, com sidebar persistente, cartões de rotina e cor apenas para estado/atenção. */
import { useMemo, useState } from "react";
import {
  Activity, ArrowUpRight, Bell, BriefcaseBusiness, Building2, CalendarDays,
  Check, ChevronDown, CircleAlert, ClipboardCheck, FileText, FolderKanban,
  LayoutDashboard, Mail, Menu, MoreHorizontal, Plus, Search, Settings2,
  Sparkles, Users, X
} from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import DepartmentPage from "./DepartmentPage";

type Department = "Visão geral" | "Fiscal" | "Pessoal" | "Contábil" | "Societário";

type Client = {
  name: string; cnpj: string; city: string; tax: string; activity: string;
  payroll: boolean; active: boolean; initials: string; color: string;
};

const departments: { name: Department; icon: typeof LayoutDashboard; detail: string }[] = [
  { name: "Visão geral", icon: LayoutDashboard, detail: "Acompanhar escritório" },
  { name: "Fiscal", icon: FileText, detail: "Obrigações e guias" },
  { name: "Pessoal", icon: Users, detail: "Folha e eventos" },
  { name: "Contábil", icon: BriefcaseBusiness, detail: "Movimentação e balancete" },
  { name: "Societário", icon: Building2, detail: "Processos e procurações" },
];

const clients: Client[] = [
  { name: "Alvorada Comércio de Alimentos", cnpj: "12.345.678/0001-90", city: "São Paulo, SP", tax: "SIMPLES", activity: "Comércio varejista", payroll: true, active: true, initials: "AC", color: "#D8E0D0" },
  { name: "Ateliê Linha & Forma", cnpj: "45.678.901/0001-23", city: "Campinas, SP", tax: "PRESUMIDO", activity: "Serviços de design", payroll: false, active: true, initials: "LF", color: "#F2D8CF" },
  { name: "Brava Tecnologia", cnpj: "23.456.789/0001-45", city: "Belo Horizonte, MG", tax: "REAL", activity: "Tecnologia da informação", payroll: true, active: true, initials: "BT", color: "#D5D9E2" },
  { name: "Café do Largo", cnpj: "78.901.234/0001-56", city: "Jundiaí, SP", tax: "MEI", activity: "Alimentação", payroll: false, active: false, initials: "CL", color: "#E8DABF" },
  { name: "Mosaico Arquitetura", cnpj: "34.567.890/0001-12", city: "Santos, SP", tax: "SIMPLES", activity: "Arquitetura e urbanismo", payroll: true, active: true, initials: "MA", color: "#D7E6E1" },
];

const taskGroups = [
  { title: "Fiscal", color: "#6C765F", tasks: ["Importação das notas", "Apuração na Domínio", "Transmissão PGDAS", "Envio da guia", "Sintegra", "DSTDA", "Livro eletrônico", "EFD Reinf fiscal", "DEFIS anual"] },
  { title: "Pessoal", color: "#C88F82", tasks: ["Conferir anotações", "Empréstimos trabalhados", "Cálculo da folha", "Eventos eSocial", "Fechamento DCTFWeb", "Recibos e guias", "Admissões e férias", "Rescisões e atestados", "EFD Reinf folha"] },
  { title: "Contábil", color: "#8798A0", tasks: ["Solicitar movimentação", "Importar extratos", "Verificar distribuição de lucros", "Fechamento do balancete"] },
  { title: "Societário", color: "#A89274", tasks: ["Cadastro das empresas", "Procurações", "Vínculo SAT e CRC", "Abertura de CNPJ", "Baixa", "Alteração"] },
];

function StatusPill({ active }: { active: boolean }) {
  return <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${active ? "bg-[#E4EBDD] text-[#56634C]" : "bg-[#ECEAE5] text-[#87857C]"}`}><span className={`h-1.5 w-1.5 rounded-full ${active ? "bg-[#7B956B]" : "bg-[#AAA89F]"}`} />{active ? "Ativo" : "Inativo"}</span>;
}

export default function Home() {
  const [location, setLocation] = useLocation();
  const department: Department = location === "/fiscal" ? "Fiscal" : location === "/pessoal" ? "Pessoal" : location === "/contabil" ? "Contábil" : location === "/societario" ? "Societário" : "Visão geral";
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Client>(clients[0]);
  const [showNew, setShowNew] = useState(false);
  const [activeOnly, setActiveOnly] = useState(true);

  const filtered = useMemo(() => clients.filter((client) => {
    const matchesSearch = `${client.name} ${client.cnpj} ${client.city}`.toLowerCase().includes(query.toLowerCase());
    return matchesSearch && (!activeOnly || client.active);
  }), [query, activeOnly]);

  const chooseDepartment = (name: Department) => {
    const paths: Record<Department, string> = { "Visão geral": "/", Fiscal: "/fiscal", Pessoal: "/pessoal", "Contábil": "/contabil", Societário: "/societario" };
    setLocation(paths[name]);
  };

  return (
    <div className="min-h-screen bg-[#F4F2EC] text-[#3C4536]">
      <aside className="sidebar-shadow fixed inset-y-0 left-0 z-20 hidden w-[272px] flex-col bg-[#66715B] text-[#F7F5EF] lg:flex">
        <div className="flex items-center gap-3 px-7 pb-8 pt-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-[15px] bg-[#F3ECE3] p-2 shadow-inner"><img src="/manus-storage/correa-monogram_d472554c.png" className="h-full w-full object-contain" alt="Monograma Corrêa" /></div>
          <div><p className="display-serif text-[24px] leading-none tracking-tight">Corrêa</p><p className="mt-1 text-[9px] font-bold uppercase tracking-[.17em] text-[#E9C3B6]">Controle interno</p></div>
        </div>
        <div className="px-5"><p className="eyebrow mb-3 text-[#C8D0BF]">Navegação</p>
          <nav className="space-y-1">{departments.map((item) => { const Icon = item.icon; const isSelected = department === item.name; return <button key={item.name} onClick={() => chooseDepartment(item.name)} className={`group flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-left ${isSelected ? "bg-[#F4F2EC] text-[#56634C] shadow-sm" : "text-[#E2E7DC] hover:bg-white/10"}`}><Icon className={`h-[18px] w-[18px] ${isSelected ? "text-[#C88F82]" : "text-[#C5CEBC]"}`} strokeWidth={1.8} /><span className="flex-1"><span className="block text-[13px] font-bold">{item.name}</span><span className={`mt-0.5 block text-[10px] ${isSelected ? "text-[#8D9685]" : "text-[#C4CCBC]"}`}>{item.detail}</span></span>{isSelected && <span className="h-6 w-1 rounded-full bg-[#D4A092]" />}</button>; })}</nav>
        </div>
        <div className="mt-auto px-5 pb-5"><div className="rounded-2xl border border-white/10 bg-white/[.07] p-4"><div className="mb-3 flex items-center gap-2"><Sparkles className="h-4 w-4 text-[#E6B1A3]" /><span className="text-xs font-bold">Fechamento em foco</span></div><p className="text-[11px] leading-relaxed text-[#D0D8C8]">Acompanhe as tarefas mais próximas do prazo em uma única visão.</p><button onClick={() => toast("Filtro de fechamento será configurado na próxima etapa.")} className="mt-4 flex items-center gap-1 text-[11px] font-bold text-[#F2C3B7]">Ver pendências <ArrowUpRight className="h-3.5 w-3.5" /></button></div><div className="mt-5 flex items-center gap-3 border-t border-white/10 pt-5"><div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#E9B2A2] text-[11px] font-extrabold text-[#56634C]">MC</div><div className="flex-1"><p className="text-xs font-bold">Ihara</p><p className="text-[10px] text-[#C3CCBA]">Administradora</p></div><Settings2 className="h-4 w-4 text-[#C3CCBA]" /></div></div>
      </aside>

      <main className="lg:pl-[272px]">
        <header className="flex h-[84px] items-center justify-between border-b border-[#E4E0D7] bg-[#F7F5EF]/90 px-5 backdrop-blur-md sm:px-8 lg:px-12">
          <div className="flex items-center gap-3"><button className="rounded-lg p-2 hover:bg-[#EAE8E0] lg:hidden"><Menu className="h-5 w-5" /></button><div className="hidden h-10 w-10 items-center justify-center rounded-xl bg-[#66715B] p-2 lg:flex"><img src="/manus-storage/correa-monogram_d472554c.png" className="h-full w-full object-contain" alt="Monograma Corrêa" /></div><div><p className="eyebrow">Segunda-feira, 17 de agosto de 2026</p><h1 className="display-serif mt-2 text-[28px] leading-none text-[#424C3C] sm:text-[32px]">{department === "Visão geral" ? "Bom dia, Ihara" : `Departamento ${department}`}</h1></div></div>
          <div className="flex items-center gap-2 sm:gap-4"><button onClick={() => toast("Você está em dia com as notificações críticas.")} className="relative rounded-xl p-2.5 text-[#717B6D] hover:bg-[#EAE8E0]"><Bell className="h-[19px] w-[19px]" strokeWidth={1.8} /><span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-[#C88F82] ring-2 ring-[#F7F5EF]" /></button><div className="hidden h-8 w-px bg-[#E1DDD4] sm:block" /><div className="flex items-center gap-2.5"><div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#E9B2A2] text-xs font-extrabold text-[#56634C]">MC</div><div className="hidden sm:block"><p className="text-xs font-bold text-[#4A5545]">Ihara</p><p className="text-[10px] text-[#8A9184]">Administradora</p></div><ChevronDown className="hidden h-4 w-4 text-[#8A9184] sm:block" /></div></div>
        </header>

        <div className="container py-7 sm:py-9"><div className="mb-5 flex flex-wrap items-center gap-x-5 gap-y-2 border-l-2 border-[#D4A092] pl-3 text-[11px] text-[#7C8578]"><span className="font-extrabold uppercase tracking-[.12em] text-[#66715B]">Painel de hoje</span><span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-[#D4A092]" /> 07 pontos de atenção</span><span className="flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5 text-[#66715B]" /> 02 vencem hoje</span><span className="hidden items-center gap-1.5 sm:flex"><ClipboardCheck className="h-3.5 w-3.5 text-[#66715B]" /> 86% das rotinas em dia</span></div>
          {department === "Visão geral" ? <>
            <section className="paper-grain relative overflow-hidden rounded-[24px] border border-[#E1DED4] bg-[#EEEDE4] p-6 sm:p-8"><div className="relative z-10 max-w-[650px]"><p className="eyebrow text-[#718066]">Visão do escritório</p><h2 className="display-serif mt-3 text-3xl leading-tight text-[#485441] sm:text-[40px]">O trabalho de hoje,<br /><span className="text-[#C88F82]">organizado por cliente.</span></h2><p className="mt-4 max-w-[510px] text-sm leading-6 text-[#65705F]">Centralize as rotinas dos quatro departamentos e encontre rapidamente o próximo passo de cada empresa.</p><button onClick={() => setShowNew(true)} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#66715B] px-4 py-3 text-xs font-bold text-[#F8F6F0] shadow-[0_8px_16px_rgba(73,83,63,.18)] hover:bg-[#56634C]"><Plus className="h-4 w-4" /> Cadastrar cliente</button></div><img src="/manus-storage/correa-routine-illustration_3ba6d67b.png" alt="Ilustração de rotinas organizadas" className="absolute -bottom-4 right-0 hidden h-[210px] w-[315px] object-contain opacity-90 md:block" /></section>
            <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Summary icon={Building2} label="Empresas ativas" value="04" detail="de 05 cadastradas" tone="olive" /><Summary icon={ClipboardCheck} label="Rotinas em dia" value="86%" detail="+8% este mês" tone="peach" /><Summary icon={CircleAlert} label="Pontos de atenção" value="07" detail="2 vencem hoje" tone="sand" /><Summary icon={CalendarDays} label="Próximo fechamento" value="28 AGO" detail="Folha mensal" tone="blue" /></section>
          </> : <DepartmentPage department={department as Exclude<Department, "Visão geral">} selectedClient={selected} />}

          <section className="mt-8"><div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><p className="eyebrow">Base de clientes</p><h2 className="display-serif mt-2 text-[28px] text-[#485441]">Empresas acompanhadas</h2></div><button onClick={() => setShowNew(true)} className="hidden items-center gap-2 text-xs font-bold text-[#66715B] hover:text-[#C88F82] sm:flex"><Plus className="h-4 w-4" /> Adicionar cliente</button></div>
            <div className="soft-shadow overflow-hidden rounded-[20px] border border-[#E3E0D7] bg-[#FBFAF6]"><div className="flex flex-col gap-3 border-b border-[#ECE9E1] p-4 sm:flex-row sm:items-center sm:justify-between"><div className="relative max-w-[360px] flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9BA197]" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar por empresa, CNPJ ou cidade" className="h-10 w-full rounded-xl border border-[#E2DED5] bg-[#F5F3ED] pl-9 pr-3 text-xs text-[#4D5949] outline-none placeholder:text-[#A3A79E] focus:border-[#A9B69C] focus:ring-2 focus:ring-[#DCE5D4]" /></div><div className="flex items-center gap-2"><button onClick={() => setActiveOnly((value) => !value)} className={`rounded-xl border px-3 py-2 text-[11px] font-bold ${activeOnly ? "border-[#C8D3BE] bg-[#EDF2E9] text-[#617257]" : "border-[#E2DED5] bg-transparent text-[#858B81]"}`}>{activeOnly ? "Somente ativos" : "Todos os clientes"}</button><button onClick={() => toast("Filtros avançados serão habilitados na próxima etapa.")} className="rounded-xl border border-[#E2DED5] p-2 text-[#858B81] hover:bg-[#F0EEE7]"><Settings2 className="h-4 w-4" /></button></div></div>
              <div className="overflow-x-auto"><table className="w-full min-w-[860px] text-left"><thead className="bg-[#F6F4EE]"><tr>{["Cliente", "CNPJ", "Cidade", "Tributação", "Atividade", "Folha", "Status", ""].map((heading) => <th key={heading} className="px-5 py-3 text-[10px] font-extrabold uppercase tracking-[.12em] text-[#949A90]">{heading}</th>)}</tr></thead><tbody>{filtered.map((client) => <tr key={client.cnpj} onClick={() => setSelected(client)} className={`table-row-hover cursor-pointer border-t border-[#F0EDE6] ${selected.cnpj === client.cnpj ? "bg-[#F3F6EF]" : ""}`}><td className="px-5 py-4"><div className="flex items-center gap-3"><div style={{ backgroundColor: client.color }} className="flex h-9 w-9 items-center justify-center rounded-[11px] text-[10px] font-extrabold text-[#5F6956]">{client.initials}</div><span className="max-w-[210px] text-xs font-bold text-[#4B5748]">{client.name}</span></div></td><td className="px-5 py-4 text-xs text-[#727A70]">{client.cnpj}</td><td className="px-5 py-4 text-xs text-[#727A70]">{client.city}</td><td className="px-5 py-4"><span className="rounded-md bg-[#F1EEE5] px-2 py-1 text-[10px] font-extrabold text-[#77796D]">{client.tax}</span></td><td className="px-5 py-4 text-xs text-[#727A70]">{client.activity}</td><td className="px-5 py-4 text-xs font-semibold text-[#697366]">{client.payroll ? "Sim" : "Não"}</td><td className="px-5 py-4"><StatusPill active={client.active} /></td><td className="px-5 py-4"><button onClick={(e) => { e.stopPropagation(); toast(`Abrindo detalhes de ${client.name}.`); }} className="rounded-lg p-1.5 text-[#9BA197] hover:bg-[#E8EEE2] hover:text-[#66715B]"><ArrowUpRight className="h-4 w-4" /></button></td></tr>)}</tbody></table></div>{filtered.length === 0 && <div className="p-10 text-center text-sm text-[#858C81]">Nenhum cliente encontrado com esses filtros.</div>}</div>
          </section>

          <section className="mt-8 grid gap-5 lg:grid-cols-[1.35fr_.65fr]"><div className="rounded-[20px] border border-[#E3E0D7] bg-[#FBFAF6] p-5 sm:p-6"><div className="flex items-center justify-between"><div><p className="eyebrow">Rotinas por setor</p><h3 className="display-serif mt-2 text-[24px] text-[#4B5748]">Mapa de acompanhamento</h3></div><Activity className="h-5 w-5 text-[#B2BCAE]" /></div><div className="mt-5 space-y-4">{taskGroups.map((group) => <div key={group.title} className="flex items-center gap-4"><div className="w-[76px] text-[11px] font-bold text-[#6F786B]">{group.title}</div><div className="h-2 flex-1 overflow-hidden rounded-full bg-[#EBE9E2]"><div style={{ width: group.title === "Fiscal" ? "82%" : group.title === "Pessoal" ? "64%" : group.title === "Contábil" ? "91%" : "48%", backgroundColor: group.color }} className="h-full rounded-full" /></div><span className="w-8 text-right text-[11px] font-bold text-[#858C81]">{group.title === "Fiscal" ? "82%" : group.title === "Pessoal" ? "64%" : group.title === "Contábil" ? "91%" : "48%"}</span></div>)}</div></div><div className="relative overflow-hidden rounded-[20px] bg-[#DDE4D6] p-6"><div className="relative z-10"><p className="eyebrow text-[#74836A]">Cliente selecionado</p><div className="mt-4 flex items-center gap-3"><div style={{ backgroundColor: selected.color }} className="flex h-11 w-11 items-center justify-center rounded-[13px] text-xs font-extrabold text-[#5F6956]">{selected.initials}</div><div><h3 className="text-sm font-extrabold text-[#4D5C48]">{selected.name}</h3><p className="mt-0.5 text-[10px] text-[#758171]">{selected.city} · {selected.tax}</p></div></div><div className="mt-6 grid grid-cols-2 gap-2"><div className="rounded-xl bg-white/60 p-3"><p className="text-[10px] text-[#80907A]">Pendências</p><p className="mt-1 text-xl font-extrabold text-[#52624B]">03</p></div><div className="rounded-xl bg-white/60 p-3"><p className="text-[10px] text-[#80907A]">Em dia</p><p className="mt-1 text-xl font-extrabold text-[#52624B]">18</p></div></div><button onClick={() => toast(`Detalhes de ${selected.name} em preparação.`)} className="mt-5 flex items-center gap-2 text-xs font-bold text-[#596A51]">Ver ficha completa <ArrowUpRight className="h-4 w-4" /></button></div><img src="/manus-storage/correa-ledger-illustration_36dda93f.png" alt="Ilustração de livro contábil" className="absolute -bottom-8 -right-10 h-36 w-44 object-contain opacity-60" /></div></section>
        </div>
      </main>

      {showNew && <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2E392C]/30 p-4 backdrop-blur-sm"><div className="w-full max-w-[520px] rounded-[24px] border border-[#E1DED4] bg-[#FBFAF6] p-6 shadow-2xl sm:p-8"><div className="flex items-start justify-between"><div><p className="eyebrow">Nova ficha</p><h2 className="display-serif mt-2 text-[30px] text-[#4B5748]">Cadastrar cliente</h2><p className="mt-2 text-xs text-[#7D8579]">A primeira etapa para acompanhar as rotinas por setor.</p></div><button onClick={() => setShowNew(false)} className="rounded-lg p-2 text-[#8C9489] hover:bg-[#EEECE5]"><X className="h-5 w-5" /></button></div><div className="mt-6 grid gap-4 sm:grid-cols-2"><FormField label="Razão social" placeholder="Nome da empresa" wide /><FormField label="CNPJ" placeholder="00.000.000/0000-00" /><FormField label="Cidade" placeholder="Cidade / UF" /><FormField label="Tributação" placeholder="Selecionar" /><FormField label="Atividade principal" placeholder="Descreva a atividade" wide /></div><div className="mt-7 flex justify-end gap-3"><button onClick={() => setShowNew(false)} className="rounded-xl px-4 py-3 text-xs font-bold text-[#7D8579] hover:bg-[#EEECE5]">Cancelar</button><button onClick={() => { setShowNew(false); toast("Ficha criada como rascunho. Conecte o banco de dados para persistir o cadastro."); }} className="rounded-xl bg-[#66715B] px-5 py-3 text-xs font-bold text-white">Salvar rascunho</button></div></div></div>}
    </div>
  );
}

function Summary({ icon: Icon, label, value, detail, tone }: { icon: typeof Building2; label: string; value: string; detail: string; tone: string }) {
  const styles: Record<string, string> = { olive: "bg-[#E4EBDD] text-[#66715B]", peach: "bg-[#F4E2DC] text-[#BD8679]", sand: "bg-[#F0E8D7] text-[#A48B60]", blue: "bg-[#E3E9EB] text-[#71868C]" };
  return <div className="soft-shadow rounded-[18px] border border-[#E5E1D8] bg-[#FBFAF6] p-4"><div className="flex items-start justify-between"><span className={`flex h-9 w-9 items-center justify-center rounded-xl ${styles[tone]}`}><Icon className="h-4 w-4" /></span><MoreHorizontal className="h-4 w-4 text-[#B4B8AF]" /></div><p className="mt-4 text-[11px] font-bold text-[#818A7E]">{label}</p><div className="mt-1 flex items-baseline gap-2"><span className="display-serif text-[28px] text-[#4D5949]">{value}</span><span className="text-[10px] font-semibold text-[#9BA197]">{detail}</span></div></div>;
}

function FormField({ label, placeholder, wide }: { label: string; placeholder: string; wide?: boolean }) {
  return <label className={`block ${wide ? "sm:col-span-2" : ""}`}><span className="mb-1.5 block text-[10px] font-extrabold uppercase tracking-[.12em] text-[#8C9489]">{label}</span><input placeholder={placeholder} className="h-11 w-full rounded-xl border border-[#E2DED5] bg-[#F5F3ED] px-3 text-xs text-[#4D5949] outline-none placeholder:text-[#B0B4AC] focus:border-[#A9B69C] focus:ring-2 focus:ring-[#DCE5D4]" /></label>;
}

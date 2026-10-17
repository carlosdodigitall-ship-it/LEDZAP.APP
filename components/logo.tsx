export function Logo({ dark = false }: { dark?: boolean } = {}) {
 return <div className="inline-flex items-center gap-2.5">
  <span className="relative grid h-10 w-10 shrink-0 place-items-center rounded-[14px] bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 shadow-lg shadow-blue-600/25">
   <svg viewBox="0 0 40 40" className="relative h-7 w-7" fill="none" aria-hidden="true"><path d="M22.7 4.5 9.8 21.1h8.6l-1.1 14.4 13-19.1h-9.1l1.5-11.9Z" fill="white" stroke="#dbeafe" strokeLinejoin="round" strokeWidth="1.2"/><path d="M7.5 28.5h6" stroke="#BFDBFE" strokeLinecap="round" strokeWidth="2.5"/></svg>
  </span>
  <span className="leading-none"><span className={"block text-[1.3rem] font-black tracking-[-0.06em] "+(dark?"text-white":"text-slate-950")}>Led<span className={dark?"text-blue-300":"text-blue-600"}>Zap</span></span><span className={"mt-1 block text-[9px] font-bold uppercase tracking-[0.17em] "+(dark?"text-slate-400":"text-slate-500")}>CRM • WhatsApp • Gestão</span></span>
 </div>;
}

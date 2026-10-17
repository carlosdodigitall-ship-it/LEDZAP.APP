"use client";
import Link from "next/link";
import {FormEvent,useState} from "react";
import {Logo} from "@/components/logo";
import {createClient} from "@/lib/supabase/client";
import {useRouter} from "next/navigation";
import {ArrowRight,Eye,EyeOff,CheckCircle2,ShieldCheck,Sparkles,UserRound,Building2,Mail,Phone,LockKeyhole} from "lucide-react";

export default function Cadastro(){
 const router=useRouter();
 const [name,setName]=useState("");const [company,setCompany]=useState("");const [phone,setPhone]=useState("");const [email,setEmail]=useState("");const [password,setPassword]=useState("");const [showPassword,setShowPassword]=useState(false);const [error,setError]=useState("");const [success,setSuccess]=useState(false);const [loading,setLoading]=useState(false);
 async function handleSubmit(e:FormEvent<HTMLFormElement>){
  e.preventDefault();if(loading)return;setError("");
  if(name.trim().length<2||company.trim().length<2||phone.replace(/\\D/g,"").length<10||password.length<8){setError("Confira seus dados. A senha deve ter pelo menos 8 caracteres.");return;}
  setLoading(true);
  try{
   const supabase=createClient();const cleanEmail=email.trim().toLowerCase();
   const {data,error:signupError}=await supabase.auth.signUp({email:cleanEmail,password,options:{data:{full_name:name.trim(),phone:phone.trim(),organization_name:company.trim()}}});
   if(signupError){const msg=signupError.message.toLowerCase();setError(msg.includes("already registered")||msg.includes("already exists")?"Este e-mail já possui uma conta. Entre pela página de login.":"Não foi possível criar sua conta: "+signupError.message);return;}
   fetch("/api/email/welcome",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name:name.trim(),email:cleanEmail})}).catch(()=>{});
   if(data.session){router.replace("/dashboard");router.refresh();}else setSuccess(true);
  }catch(err){console.error("Falha no cadastro do LedZap",err);setError("Não foi possível conectar. Confira sua internet e tente novamente.");}
  finally{setLoading(false);}
 }
 const field="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100";
 const icon="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400";
 return <main className="min-h-screen bg-[radial-gradient(ellipse_at_top_left,rgba(191,219,254,0.52),transparent_38%),linear-gradient(135deg,#f8fbff_0%,#fff_52%,#f1f5ff_100%)] px-4 py-6 sm:px-6 sm:py-10">
  <div className="mx-auto grid min-h-[calc(100vh-3rem)] max-w-6xl items-center gap-7 lg:grid-cols-[.95fr_1.05fr]">
   <section className="relative hidden min-h-[610px] overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-950 via-blue-950 to-blue-700 p-9 text-white shadow-2xl shadow-blue-950/15 lg:flex lg:flex-col"><div className="absolute -right-28 -top-20 h-72 w-72 rounded-full bg-blue-400/20 blur-3xl"/><div className="relative"><Logo dark/></div><div className="relative my-auto py-14"><span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-2 text-xs font-bold text-blue-100"><Sparkles size={15}/> Sua operação em um só lugar</span><h1 className="mt-6 max-w-md text-4xl font-black leading-tight tracking-tight xl:text-5xl">Comece com clareza. Cresça com controle.</h1><p className="mt-5 max-w-md leading-7 text-blue-100">Organize clientes, acompanhe oportunidades e conecte tarefas, cobranças e WhatsApp no ritmo do seu negócio.</p><div className="mt-8 space-y-4 text-sm font-semibold text-white/90"><p className="flex items-center gap-3"><CheckCircle2 size={18} className="text-emerald-300"/> Funil visual e tarefas do CRM</p><p className="flex items-center gap-3"><CheckCircle2 size={18} className="text-emerald-300"/> Dados persistidos no Supabase</p><p className="flex items-center gap-3"><CheckCircle2 size={18} className="text-emerald-300"/> Regras de WhatsApp com consentimento</p></div></div><div className="relative mt-auto flex items-center gap-2 border-t border-white/15 pt-5 text-xs text-blue-100"><ShieldCheck size={16}/> Autenticação e dados no Supabase.</div></section>
   <section className="mx-auto w-full max-w-xl rounded-[2rem] border border-slate-200/80 bg-white p-5 shadow-xl shadow-blue-950/5 sm:p-8 lg:p-10">
    <div className="mb-7 flex items-center justify-between gap-3 lg:hidden"><Logo/><Link href="/login" className="text-sm font-bold text-blue-700">Já tenho conta</Link></div>
    {success?<div className="py-8 text-center sm:py-12"><div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-emerald-50 text-emerald-600"><Mail size={28}/></div><h2 className="mt-5 text-2xl font-black text-slate-950">Confira seu e-mail</h2><p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-slate-600">Sua conta foi criada. Use o link de confirmação enviado pelo Supabase para concluir o acesso ao LedZap.</p><Link href="/login" className="mt-7 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3.5 text-sm font-extrabold text-white hover:bg-blue-700">Ir para login <ArrowRight size={16}/></Link></div>:<>
     <div className="hidden lg:block"><Link href="/" className="text-xs font-bold text-slate-500 hover:text-blue-700">← Voltar para o site</Link></div><div className="mt-1 sm:mt-2"><p className="text-xs font-black uppercase tracking-[0.2em] text-blue-700">Crie sua conta</p><h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Comece pelo básico.</h2><p className="mt-3 text-sm leading-6 text-slate-500">Teste o LedZap por 3 dias e organize sua operação.</p></div>
     {error&&<div role="alert" className="mt-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{error}</div>}
     <form onSubmit={handleSubmit} className="mt-7 space-y-4">
      <div><label htmlFor="name" className="text-sm font-bold text-slate-700">Seu nome</label><div className="relative"><UserRound size={17} className={icon}/><input id="name" name="name" autoComplete="name" required minLength={2} value={name} onChange={e=>setName(e.target.value)} placeholder="Como podemos chamar você?" className={field+" pl-10"}/></div></div>
      <div><label htmlFor="company" className="text-sm font-bold text-slate-700">Nome da empresa</label><div className="relative"><Building2 size={17} className={icon}/><input id="company" name="organization" autoComplete="organization" required minLength={2} value={company} onChange={e=>setCompany(e.target.value)} placeholder="Sua empresa ou negócio" className={field+" pl-10"}/></div></div>
      <div className="grid gap-4 sm:grid-cols-2"><div><label htmlFor="phone" className="text-sm font-bold text-slate-700">WhatsApp</label><div className="relative"><Phone size={17} className={icon}/><input id="phone" name="tel" autoComplete="tel" type="tel" required value={phone} onChange={e=>setPhone(e.target.value)} placeholder="(11) 99999-9999" className={field+" pl-10"}/></div></div><div><label htmlFor="email" className="text-sm font-bold text-slate-700">E-mail</label><div className="relative"><Mail size={17} className={icon}/><input id="email" name="email" autoComplete="email" type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="voce@empresa.com" className={field+" pl-10"}/></div></div></div>
      <div><label htmlFor="password" className="text-sm font-bold text-slate-700">Senha</label><div className="relative"><LockKeyhole size={17} className={icon}/><input id="password" name="new-password" autoComplete="new-password" type={showPassword?"text":"password"} required minLength={8} value={password} onChange={e=>setPassword(e.target.value)} placeholder="Use pelo menos 8 caracteres" className={field+" pl-10 pr-12"}/><button type="button" onClick={()=>setShowPassword(v=>!v)} aria-label={showPassword?"Ocultar senha":"Mostrar senha"} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700">{showPassword?<EyeOff size={17}/>:<Eye size={17}/>}</button></div></div>
      <button type="submit" disabled={loading} className="mt-2 inline-flex min-h-13 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">{loading?"Criando sua conta…":"Criar conta grátis"} {!loading&&<ArrowRight size={17}/>}</button>
     </form>
     <p className="mt-5 text-center text-sm text-slate-500">Já tem conta? <Link href="/login" className="font-extrabold text-blue-700 hover:text-blue-800">Entrar</Link></p><p className="mt-5 flex items-start gap-2 border-t border-slate-100 pt-4 text-xs leading-5 text-slate-400"><ShieldCheck size={15} className="mt-0.5 shrink-0 text-emerald-600"/> Não compartilhe sua senha ou códigos de verificação.</p>
    </>}
   </section>
  </div>
 </main>;
}

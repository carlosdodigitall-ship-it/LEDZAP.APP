import {NextResponse} from "next/server";
import {createClient} from "@/lib/supabase/server";
import {getWhatsAppProvider} from "@/lib/whatsapp";
export const runtime="nodejs";
function connected(v:any){return v?.connected===true||v?.authenticated===true||["connected","open","online","ready","authenticated"].includes(String(v?.status??v?.state??v?.connection??"").toLowerCase());}
export async function POST(request:Request){
 const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)return NextResponse.json({error:"Não autenticado."},{status:401});
 const {data:member,error:memberError}=await supabase.from("organization_members").select("organization_id").eq("user_id",user.id).limit(1).maybeSingle();if(memberError||!member)return NextResponse.json({error:memberError?.message||"Organização não encontrada."},{status:400});
 const body=await request.json().catch(()=>({}));const id=typeof body.messageId==="string"?body.messageId:"";if(!id)return NextResponse.json({error:"Informe o ID do agendamento."},{status:400});
 const {data:row,error:rowError}=await supabase.from("scheduled_messages").select("*").eq("id",id).eq("organization_id",member.organization_id).maybeSingle();if(rowError||!row)return NextResponse.json({error:"Agendamento não encontrado."},{status:404});
 if(row.status!=="scheduled")return NextResponse.json({error:"Este agendamento não está mais na fila."},{status:409});
 if(row.consent_confirmed!==true)return NextResponse.json({error:"Envio bloqueado: não há consentimento registrado."},{status:403});
 if(body.sendNow!==true&&new Date(row.scheduled_at).getTime()>Date.now())return NextResponse.json({error:"O horário programado ainda não chegou."},{status:409});
 const {data:instance,error:instanceError}=await supabase.from("whatsapp_instances").select("*").eq("organization_id",member.organization_id).maybeSingle();if(instanceError||!instance)return NextResponse.json({error:"Nenhuma instância WhatsApp cadastrada."},{status:400});
 const provider=getWhatsAppProvider({instanceId:instance.instance_id,token:instance.token,clientToken:instance.client_token});
 let remote:any;try{remote=await provider.getStatus(instance.instance_id);}catch(e:any){return NextResponse.json({error:"Não foi possível consultar a conexão real do WhatsApp: "+(e?.message||"erro do provedor")},{status:502});}
 if(!connected(remote))return NextResponse.json({error:"WhatsApp desconectado no provedor. Conecte a sessão antes do envio.",connected:false,status:remote?.status||remote?.state||"disconnected"},{status:409});
 const {data:claim,error:claimError}=await supabase.from("scheduled_messages").update({status:"processing",last_error:null,updated_at:new Date().toISOString()}).eq("id",row.id).eq("organization_id",member.organization_id).eq("status","scheduled").select("id").maybeSingle();if(claimError||!claim)return NextResponse.json({error:"Outro processo já está tratando esta mensagem. Atualize a fila."},{status:409});
 try{
  const result=await provider.sendMessage({to:row.phone,message:row.message},instance.instance_id);if(!result?.success)throw new Error("O provedor não confirmou o envio.");
  const now=new Date().toISOString();const {error:e}=await supabase.from("scheduled_messages").update({status:"sent",provider_message_id:result.messageId||null,sent_at:now,last_error:null,updated_at:now}).eq("id",row.id).eq("organization_id",member.organization_id);if(e)throw e;
  await supabase.from("whatsapp_messages").insert({organization_id:member.organization_id,instance_id:instance.id,customer_id:row.customer_id||null,direction:"outbound",message:row.message,external_message_id:result.messageId||null,status:"sent"});
  return NextResponse.json({ok:true,status:"sent",messageId:result.messageId||null});
 }catch(e:any){const msg=String(e?.message||"Falha ao enviar mensagem").slice(0,1000);await supabase.from("scheduled_messages").update({status:"failed",last_error:msg,updated_at:new Date().toISOString()}).eq("id",row.id).eq("organization_id",member.organization_id);return NextResponse.json({error:msg,status:"failed"},{status:502});}
}

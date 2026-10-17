import {NextResponse} from "next/server";
import {createAdminClient} from "@/lib/supabase/admin";
import {getWhatsAppProvider} from "@/lib/whatsapp";
export const runtime="nodejs";
function connected(v:any){return v?.connected===true||v?.authenticated===true||["connected","open","online","ready","authenticated"].includes(String(v?.status??v?.state??v?.connection??"").toLowerCase());}
export async function GET(request:Request){
 const secret=process.env.CRON_SECRET;if(!secret||request.headers.get("authorization")!=="Bearer "+secret)return NextResponse.json({error:"Cron não autorizado ou CRON_SECRET não configurado."},{status:401});
 const admin=createAdminClient();const {data:due,error}=await admin.from("scheduled_messages").select("*").eq("status","scheduled").eq("consent_confirmed",true).lte("scheduled_at",new Date().toISOString()).order("scheduled_at",{ascending:true}).limit(50);if(error)return NextResponse.json({error:error.message},{status:500});
 let sent=0,failed=0,skipped=0;const results:{id:string;status:string;reason?:string}[]=[];
 for(const row of due||[]){
  const {data:claim,error:claimError}=await admin.from("scheduled_messages").update({status:"processing",last_error:null,updated_at:new Date().toISOString()}).eq("id",row.id).eq("status","scheduled").select("id").maybeSingle();if(claimError||!claim){skipped++;continue;}
  try{
   const {data:instance,error:instanceError}=await admin.from("whatsapp_instances").select("*").eq("organization_id",row.organization_id).maybeSingle();if(instanceError||!instance)throw new Error("Nenhuma instância WhatsApp configurada.");
   const provider=getWhatsAppProvider({instanceId:instance.instance_id,token:instance.token,clientToken:instance.client_token});const remote=await provider.getStatus(instance.instance_id);if(!connected(remote))throw new Error("WhatsApp desconectado no provedor.");
   const result=await provider.sendMessage({to:row.phone,message:row.message},instance.instance_id);if(!result?.success)throw new Error("O provedor não confirmou o envio.");
   const now=new Date().toISOString();await admin.from("scheduled_messages").update({status:"sent",provider_message_id:result.messageId||null,sent_at:now,last_error:null,updated_at:now}).eq("id",row.id);
   await admin.from("whatsapp_messages").insert({organization_id:row.organization_id,instance_id:instance.id,customer_id:row.customer_id||null,direction:"outbound",message:row.message,external_message_id:result.messageId||null,status:"sent"});
   sent++;results.push({id:row.id,status:"sent"});
  }catch(e:any){const reason=String(e?.message||"Falha ao enviar").slice(0,1000);await admin.from("scheduled_messages").update({status:"failed",last_error:reason,updated_at:new Date().toISOString()}).eq("id",row.id);failed++;results.push({id:row.id,status:"failed",reason});}
 }
 return NextResponse.json({ok:true,checked:(due||[]).length,sent,failed,skipped,results});
}

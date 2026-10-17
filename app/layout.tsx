import type { Metadata, Viewport } from "next";
import "./globals.css";
export const viewport: Viewport={themeColor:"#2563eb"};
export const metadata: Metadata={
 title:"LedZap | CRM, WhatsApp e Gestão",
 description:"Organize oportunidades, clientes, follow-ups, cobranças e mensagens do WhatsApp no LedZap.",
 applicationName:"LedZap",
 icons:{icon:"/favicon.svg",shortcut:"/favicon.svg",apple:"/favicon.svg"}
};
export default function RootLayout({children}:{children:React.ReactNode}){
 return <html lang="pt-BR"><body>{children}</body></html>;
}

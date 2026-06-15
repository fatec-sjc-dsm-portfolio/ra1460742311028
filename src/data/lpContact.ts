export const LP_CONTACT = {
  whatsapp: '5512988150491',
  email: 'joaoggbs62@gmail.com',
  whatsappMessage:
    'Olá João! Vi sua página de Landing Pages e quero conversar sobre um projeto.',
  emailSubject: 'Quero uma Landing Page',
  emailBody:
    'Olá João,\n\nVi sua página e gostaria de conversar sobre uma Landing Page para meu negócio.\n\nMeu projeto:\n- Nome / marca:\n- Segmento:\n- Objetivo principal (vendas, captação, autoridade):\n- Prazo desejado:\n\nObrigado!',
} as const;

export function whatsappUrl(): string {
  const text = encodeURIComponent(LP_CONTACT.whatsappMessage);
  return `https://wa.me/${LP_CONTACT.whatsapp}?text=${text}`;
}

export function mailtoUrl(): string {
  const subject = encodeURIComponent(LP_CONTACT.emailSubject);
  const body = encodeURIComponent(LP_CONTACT.emailBody);
  return `mailto:${LP_CONTACT.email}?subject=${subject}&body=${body}`;
}

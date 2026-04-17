/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
}

export const SignupEmail = ({
  siteName,
  siteUrl,
  recipient,
  confirmationUrl,
}: SignupEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>أكد بريدك الإلكتروني للبدء مع {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Heading style={brand}>SolarMatch ☀️</Heading>
        </Section>
        <Section style={card}>
          <Heading style={h1}>أهلاً بك في {siteName}</Heading>
          <Text style={text}>
            شكراً لتسجيلك في{' '}
            <Link href={siteUrl} style={link}>
              <strong>{siteName}</strong>
            </Link>
            . نحن سعداء لانضمامك إلى رحلتنا نحو الطاقة الشمسية في مصر.
          </Text>
          <Text style={text}>
            من فضلك أكد بريدك الإلكتروني (<strong>{recipient}</strong>) بالضغط على الزر أدناه:
          </Text>
          <Section style={{ textAlign: 'center', margin: '32px 0' }}>
            <Button style={button} href={confirmationUrl}>
              تأكيد البريد الإلكتروني
            </Button>
          </Section>
          <Text style={footer}>
            إذا لم تقم بإنشاء حساب، يمكنك تجاهل هذه الرسالة بأمان.
          </Text>
        </Section>
        <Text style={signature}>— فريق SolarMatch</Text>
      </Container>
    </Body>
  </Html>
)

export default SignupEmail

const main = { backgroundColor: '#ffffff', fontFamily: 'Inter, Arial, sans-serif', padding: '32px 0' }
const container = { maxWidth: '560px', margin: '0 auto', padding: '0 20px' }
const header = { textAlign: 'center' as const, padding: '8px 0 24px' }
const brand = { fontSize: '24px', fontWeight: 'bold' as const, color: '#355C7D', margin: 0, fontFamily: '"Space Grotesk", Inter, Arial, sans-serif' }
const card = { backgroundColor: '#F7F8F6', border: '1px solid #E5E7EB', borderRadius: '16px', padding: '32px 28px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#1A1A1A', margin: '0 0 18px', fontFamily: '"Space Grotesk", Inter, Arial, sans-serif' }
const text = { fontSize: '15px', color: '#1A1A1A', lineHeight: '1.6', margin: '0 0 16px' }
const link = { color: '#355C7D', textDecoration: 'underline' }
const button = { backgroundColor: '#355C7D', color: '#ffffff', fontSize: '15px', fontWeight: 'bold' as const, borderRadius: '12px', padding: '14px 28px', textDecoration: 'none', display: 'inline-block' }
const footer = { fontSize: '13px', color: '#667085', margin: '24px 0 0', lineHeight: '1.5' }
const signature = { fontSize: '13px', color: '#667085', textAlign: 'center' as const, margin: '20px 0 0' }

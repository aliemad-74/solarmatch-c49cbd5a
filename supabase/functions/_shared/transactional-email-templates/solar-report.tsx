/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Section, Text, Button, Hr, Row, Column,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'SolarMatch'
const SITE_URL = 'https://solarmatch.site'

interface SolarReportProps {
  name?: string
  location?: string
  systemSizeKw?: number
  annualProduction?: number
  annualSavings?: number
  paybackYears?: number
  co2Saved?: number
  feasibility?: string
  reportUrl?: string
}

const fmt = (n?: number, d = 0) =>
  typeof n === 'number' && isFinite(n) ? n.toLocaleString('en-US', { maximumFractionDigits: d }) : '—'

const SolarReportEmail = ({
  name,
  location,
  systemSizeKw,
  annualProduction,
  annualSavings,
  paybackYears,
  co2Saved,
  feasibility,
  reportUrl,
}: SolarReportProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your SolarMatch feasibility report is ready</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>{name ? `Hi ${name},` : 'Hi,'}</Heading>
        <Text style={text}>
          Your solar feasibility report from <strong>{SITE_NAME}</strong> is ready.
          Below is a summary of the analysis{location ? ` for ${location}` : ''}.
        </Text>

        {feasibility && (
          <Section style={badge}>
            <Text style={badgeText}>Verdict: {feasibility}</Text>
          </Section>
        )}

        <Section style={card}>
          <Row>
            <Column style={cell}>
              <Text style={label}>System Size</Text>
              <Text style={value}>{fmt(systemSizeKw, 2)} kWp</Text>
            </Column>
            <Column style={cell}>
              <Text style={label}>Annual Production</Text>
              <Text style={value}>{fmt(annualProduction)} kWh</Text>
            </Column>
          </Row>
          <Hr style={divider} />
          <Row>
            <Column style={cell}>
              <Text style={label}>Annual Savings</Text>
              <Text style={value}>{fmt(annualSavings)} EGP</Text>
            </Column>
            <Column style={cell}>
              <Text style={label}>Payback</Text>
              <Text style={value}>{fmt(paybackYears, 1)} yrs</Text>
            </Column>
          </Row>
          {typeof co2Saved === 'number' && (
            <>
              <Hr style={divider} />
              <Row>
                <Column style={cell}>
                  <Text style={label}>CO₂ Avoided / yr</Text>
                  <Text style={value}>{fmt(co2Saved)} kg</Text>
                </Column>
              </Row>
            </>
          )}
        </Section>

        {reportUrl && (
          <Section style={{ textAlign: 'center', margin: '28px 0' }}>
            <Button href={reportUrl} style={button}>View Full Report</Button>
          </Section>
        )}

        <Text style={text}>
          This is a preliminary feasibility study and does not replace a professional
          on-site engineering inspection.
        </Text>

        <Hr style={divider} />
        <Text style={footer}>
          {SITE_NAME} · <a href={SITE_URL} style={link}>{SITE_URL.replace('https://', '')}</a>
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: SolarReportEmail,
  subject: 'Your SolarMatch feasibility report',
  displayName: 'Solar feasibility report',
  previewData: {
    name: 'Ahmed',
    location: 'Cairo, Egypt',
    systemSizeKw: 5.2,
    annualProduction: 9100,
    annualSavings: 18500,
    paybackYears: 4.8,
    co2Saved: 4200,
    feasibility: 'Suitable',
    reportUrl: 'https://solarmatch.site',
  },
} satisfies TemplateEntry

const main: React.CSSProperties = { backgroundColor: '#ffffff', fontFamily: 'Inter, Arial, sans-serif', margin: 0, padding: 0 }
const container: React.CSSProperties = { maxWidth: '560px', margin: '0 auto', padding: '32px 24px' }
const h1: React.CSSProperties = { fontSize: '22px', fontWeight: 700, color: '#355C7D', fontFamily: '"Space Grotesk", sans-serif', margin: '0 0 16px' }
const text: React.CSSProperties = { fontSize: '14px', lineHeight: 1.6, color: '#1A1A1A', margin: '0 0 16px' }
const badge: React.CSSProperties = { backgroundColor: '#355C7D', borderRadius: '8px', padding: '10px 14px', margin: '8px 0 20px', display: 'inline-block' }
const badgeText: React.CSSProperties = { color: '#ffffff', fontSize: '13px', fontWeight: 600, margin: 0 }
const card: React.CSSProperties = { backgroundColor: '#F7F8FA', border: '1px solid #E5E7EB', borderRadius: '16px', padding: '20px', margin: '8px 0 20px' }
const cell: React.CSSProperties = { padding: '8px 12px' }
const label: React.CSSProperties = { fontSize: '11px', color: '#667085', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 4px' }
const value: React.CSSProperties = { fontSize: '16px', fontWeight: 700, color: '#1A1A1A', margin: 0 }
const button: React.CSSProperties = { backgroundColor: '#355C7D', color: '#ffffff', borderRadius: '12px', padding: '12px 28px', fontSize: '14px', fontWeight: 600, textDecoration: 'none', display: 'inline-block' }
const divider: React.CSSProperties = { borderTop: '1px solid #E5E7EB', margin: '12px 0' }
const footer: React.CSSProperties = { fontSize: '12px', color: '#667085', textAlign: 'center', margin: '16px 0 0' }
const link: React.CSSProperties = { color: '#C89B3C', textDecoration: 'none' }

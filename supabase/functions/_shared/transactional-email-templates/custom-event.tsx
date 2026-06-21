import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Section, Text, Hr,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props {
  subject?: string
  nama?: string
  kode?: string
  kategori?: string
  bodyHtml?: string // HTML-safe, already escaped + <br> applied
  preview?: string
}

const Email = ({ subject, bodyHtml, preview }: Props) => (
  <Html lang="id">
    <Head />
    <Preview>{preview || subject || 'Safar Iman'}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={brand}>
          <Text style={brandText}>SAFAR IMAN</Text>
        </Section>
        <Section style={card}>
          {subject ? <Heading style={h1}>{subject}</Heading> : null}
          <div
            style={bodyStyle}
            // bodyHtml is sanitized server-side: HTML-escaped then \n -> <br/>
            dangerouslySetInnerHTML={{ __html: bodyHtml ?? '' }}
          />
        </Section>
        <Hr style={hr} />
        <Text style={footer}>
          {/* senderName falls back to brand */}
          Safar Iman · Program Umrah Pemuda Pemudi Indonesia
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: (d: Props) => d?.subject || 'Notifikasi Safar Iman',
  displayName: 'Notifikasi Safar Iman',
  previewData: {
    subject: 'Pendaftaran Safar Iman Berhasil',
    nama: 'Ahmad',
    kode: 'HXP-DEMO1234',
    bodyHtml: 'Assalamualaikum Ahmad,<br/><br/>Pendaftaranmu sudah tercatat.',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, Helvetica, sans-serif', margin: 0, padding: '24px 0' }
const container = { maxWidth: '560px', margin: '0 auto', padding: '0 16px' }
const brand = { textAlign: 'center' as const, padding: '8px 0 16px' }
const brandText = { fontSize: '14px', letterSpacing: '0.3em', color: '#0a6e57', fontWeight: 700, margin: 0 }
const card = { backgroundColor: '#f7faf8', border: '1px solid #e3ebe6', borderRadius: '14px', padding: '28px 24px' }
const h1 = { fontSize: '20px', lineHeight: '28px', color: '#0a2e25', margin: '0 0 14px' }
const bodyStyle = { fontSize: '15px', lineHeight: '24px', color: '#1f2937' }
const hr = { borderColor: '#e3ebe6', margin: '24px 0 12px' }
const footer = { textAlign: 'center' as const, color: '#6b7280', fontSize: '12px', margin: 0 }

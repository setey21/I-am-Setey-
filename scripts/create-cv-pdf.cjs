const fs = require('fs')

const pages = [[]]
let page = 0
let y = 790

const addLine = (text, { size = 10, bold = false, color = '0.12 0.18 0.26' } = {}) => {
  if (y < 58) {
    pages.push([])
    page += 1
    y = 790
  }
  pages[page].push({ text, y, size, bold, color })
  y -= size >= 17 ? 25 : size >= 12 ? 19 : 15
}

const addParagraph = (text, options = {}) => {
  const maxLength = options.maxLength || 88
  const words = text.split(/\s+/)
  let line = ''
  for (const word of words) {
    const next = line ? `${line} ${word}` : word
    if (next.length > maxLength && line) {
      addLine(line, options)
      line = word
    } else {
      line = next
    }
  }
  if (line) addLine(line, options)
}

const addSection = (title) => {
  y -= 4
  addLine(title.toUpperCase(), { size: 12, bold: true, color: '0.03 0.48 0.68' })
}

addLine('SETEY BRHANEY HAFTIE', { size: 21, bold: true, color: '0.03 0.48 0.68' })
addLine('Full-Stack Web & Mobile Developer | IT & Database Administrator', { size: 11, bold: true })
addParagraph('Gondar, Amhara, Ethiopia | seteybrhaney8@gmail.com | +251 922 487 435 | +251 943 837 543', { size: 9, color: '0.35 0.39 0.44', maxLength: 93 })
addParagraph('GitHub: github.com/setey21 | github.com/setey', { size: 9, color: '0.35 0.39 0.44' })

addSection('Professional profile')
addParagraph('Computer Science graduate from the University of Gondar with practical IT, network, and database administration internship experience, complemented by intensive full-stack web and mobile development training. Interested in building modern web and mobile applications, RESTful APIs, database systems, and reliable digital solutions.')

addSection('Technical skills')
addParagraph('Frontend: HTML5, CSS3, JavaScript, React.js')
addParagraph('Backend and APIs: Node.js, Express.js, RESTful API development, API integration')
addParagraph('Mobile: React Native, Expo')
addParagraph('Databases: PostgreSQL, Oracle SQL, database design, administration, backup and optimization')
addParagraph('IT systems: Windows Server, Ubuntu Linux, Active Directory, LAN, DNS, DHCP')
addParagraph('Tools: Git, GitHub, VS Code, Vercel, Render')

addSection('Experience')
addLine('IT, Network & Database Administration Intern', { bold: true })
addLine('University of Gondar Data Center | Gondar, Ethiopia | July-September 2025', { size: 9, color: '0.35 0.39 0.44' })
addParagraph('Worked with Windows Server and Ubuntu Linux; managed users and permissions with Active Directory; configured LAN, DNS, and DHCP; worked with Oracle SQL and PostgreSQL; participated in database backup and optimization activities.')

addSection('Professional training')
addLine('Full-Stack Web & Mobile Application Development', { bold: true })
addLine('Erkab Skills Training Organization, Gondar | 3 months | 2026', { size: 9, color: '0.35 0.39 0.44' })
addParagraph('Training covered React.js, React Native with Expo, Node.js, Express.js, PostgreSQL, RESTful API design, authentication concepts, Git, GitHub, and application deployment workflows.')

addSection('Education')
addLine('B.Sc. in Computer Science | University of Gondar, Ethiopia', { bold: true })
addParagraph('Graduated June 23, 2026 | CGPA: 3.27/4.00 | National Exit Exam: 60%')

addSection('Certifications and additional training')
addParagraph('Full-Stack Web & Mobile App Development - Erkab Skills Training Organization (2026)')
addParagraph('Employability & Entrepreneurship Skills - CEED, University of Gondar (June 2026)')
addParagraph('English Language Proficiency - Office of the Registrar, University of Gondar (2026)')

addSection('Languages and project areas')
addParagraph('Languages: Amharic (native), Tigrinya (fluent), English (proficient - academic and technical).')
addParagraph('Project areas: Smart Digital Job & Skill Matching Portal; Doctor AI - Mobile Health Assistant; Academic & Database Systems. Detailed project features and live links are not listed until verified.')

const escapePdfText = (text) => text.replace(/[\\()]/g, '\\$&')
const textStream = (entries) => entries.map(({ text, y: lineY, size, bold, color }) =>
  `${color} rg BT /${bold ? 'F2' : 'F1'} ${size} Tf 52 ${lineY} Td (${escapePdfText(text)}) Tj ET`,
).join('\n')

const pageCount = pages.length
const regularFontId = 3 + pageCount * 2
const boldFontId = regularFontId + 1
const objects = [
  '<< /Type /Catalog /Pages 2 0 R >>',
  `<< /Type /Pages /Kids [${pages.map((_, index) => `${3 + index * 2} 0 R`).join(' ')}] /Count ${pageCount} >>`,
]

pages.forEach((entries, index) => {
  const pageId = 3 + index * 2
  const contentId = pageId + 1
  const stream = textStream(entries)
  objects[pageId - 1] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 ${regularFontId} 0 R /F2 ${boldFontId} 0 R >> >> /Contents ${contentId} 0 R >>`
  objects[contentId - 1] = `<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`
})
objects.push(
  '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>',
)

let pdf = '%PDF-1.4\n'
const offsets = [0]
objects.forEach((object, index) => {
  offsets.push(Buffer.byteLength(pdf))
  pdf += `${index + 1} 0 obj\n${object}\nendobj\n`
})
const xref = Buffer.byteLength(pdf)
pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`
for (let index = 1; index < offsets.length; index += 1) {
  pdf += `${String(offsets[index]).padStart(10, '0')} 00000 n \n`
}
pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`

fs.mkdirSync('public', { recursive: true })
fs.writeFileSync('public/Setey-Brhaney-Haftie-CV.pdf', pdf, 'binary')

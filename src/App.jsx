import { useEffect, useState } from 'react'
import {
  ArrowRight, ArrowUp, Award, BriefcaseBusiness, Check, ChevronRight,
  Code2, Database, Download, ExternalLink, GraduationCap, Layers3, Mail,
  Menu, Monitor, Moon, Network, Phone, Smartphone, Sun, Workflow, X, MapPin,
} from 'lucide-react'
import {
  certifications, experience, navItems, personalInfo, processSteps, projects,
  services, skills,
} from './data/content'
import AdminDashboard from './AdminDashboard'

const copyrightYear = new Date().getFullYear()
const serviceVisuals = [Monitor, Code2, Layers3, Smartphone, Workflow, Database, Network]
const projectIllustrations = {
  'Web Development': '/images/illustrations/project-web.svg',
  'Mobile Development': '/images/illustrations/project-mobile.svg',
  'Database Systems': '/images/illustrations/project-data.svg',
}

function SectionTitle({ eyebrow, title, description }) {
  return (
    <header className="section-heading">
      <p className="eyebrow">{eyebrow}</p>
      <h2>{title}</h2>
      {description && <p className="section-description">{description}</p>}
    </header>
  )
}

function Portfolio() {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark')
  const [cvDownloadUrl, setCvDownloadUrl] = useState('/Setey-Brhaney-Haftie-CV.pdf')
  const [cvLoadError, setCvLoadError] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const [activeSection, setActiveSection] = useState('home')
  const [projectFilter, setProjectFilter] = useState('All')
  const [showTop, setShowTop] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })
  const [formError, setFormError] = useState('')
  const [formStatus, setFormStatus] = useState('')
  const [contactTrap, setContactTrap] = useState('')
  const [sendingContact, setSendingContact] = useState(false)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem('theme', theme)
  }, [theme])

  useEffect(() => {
    let cancelled = false
    fetch('/api/cv', { cache: 'no-store' })
      .then((response) => {
        if (!response.ok) throw new Error('Could not check the current CV.')
        return response.json()
      })
      .then((result) => {
        if (!cancelled && result?.downloadUrl) setCvDownloadUrl(result.downloadUrl)
      })
      .catch(() => {
        if (!cancelled) setCvLoadError('Unable to check for a newer CV right now; the included CV is still available.')
      })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    const onScroll = () => {
      setShowTop(window.scrollY > 700)
      let current = 'home'
      for (const [, id] of navItems) {
        const section = document.getElementById(id)
        if (section && section.getBoundingClientRect().top <= 160) current = id
      }
      setActiveSection(current)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
    setMenuOpen(false)
  }

  const submitContact = async (event) => {
    event.preventDefault()
    if (!form.name.trim() || !form.email.trim() || !form.subject.trim() || !form.message.trim()) {
      setFormStatus('')
      setFormError('Please complete every field before sending your message.')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setFormStatus('')
      setFormError('Please enter a valid email address.')
      return
    }
    setFormError('')
    setFormStatus('')
    setSendingContact(true)
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, website: contactTrap }),
      })
      if (!(response.headers.get('content-type') || '').includes('application/json')) {
        throw new Error('The contact email service is unavailable here. Please use the email link on this page.')
      }
      let result
      try {
        result = await response.json()
      } catch {
        throw new Error('The contact service returned an invalid response. Please try again later.')
      }
      if (!response.ok) throw new Error(result.error || 'Your message could not be sent. Please try again.')
      setForm({ name: '', email: '', subject: '', message: '' })
      setContactTrap('')
      setFormStatus('Your message was sent successfully. Thank you for getting in touch.')
    } catch (error) {
      setFormError(error instanceof TypeError
        ? 'Could not reach the contact service. Please try again later or use the email link on this page.'
        : error instanceof Error ? error.message : 'Your message could not be sent. Please try again.')
    } finally {
      setSendingContact(false)
    }
  }

  const filteredProjects = projectFilter === 'All'
    ? projects
    : projects.filter((project) => project.category === projectFilter)

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">Skip to content</a>
      <nav className="navbar" aria-label="Primary navigation">
        <button className="brand" type="button" onClick={() => scrollTo('home')} aria-label="Go to home">SBH<span>.</span></button>
        <button className="menu-toggle" type="button" aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'} aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)}>
          {menuOpen ? <X /> : <Menu />}
        </button>
        <div className={`nav-content ${menuOpen ? 'open' : ''}`}>
          <div className="nav-links">
            {navItems.map(([label, id]) => (
              <button key={id} type="button" className={activeSection === id ? 'active' : ''} onClick={() => scrollTo(id)}>{label}</button>
            ))}
          </div>
          <div className="nav-actions">
            <button className="icon-button" type="button" aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`} onClick={() => setTheme((value) => value === 'dark' ? 'light' : 'dark')}>
              {theme === 'dark' ? <Sun /> : <Moon />}
            </button>
            <a className="button button-small" href={cvDownloadUrl} download><Download /> Download CV</a>
          </div>
        </div>
      </nav>

      <main id="main">
        <section className="hero section" id="home">
          <div className="hero-copy">
            <p className="eyebrow">Hello, I'm Setey Brhaney</p>
            <h1>Building Digital Experiences <span>Through Technology.</span></h1>
            <p className="hero-lead">I am a Computer Science graduate and Full-Stack Web & Mobile Developer interested in creating modern, useful, and scalable digital applications.</p>
            <div className="hero-meta">
              <span><MapPin /> {personalInfo.location}</span>
              <span><BriefcaseBusiness /> {personalInfo.title}</span>
            </div>
            <div className="button-row">
              <button className="button" type="button" onClick={() => scrollTo('projects')}>Explore My Projects <ArrowRight /></button>
              <a className="button button-secondary" href={cvDownloadUrl} download><Download /> Download CV</a>
              <button className="text-button" type="button" onClick={() => scrollTo('contact')}>Contact Me <ChevronRight /></button>
            </div>
          </div>
          <div className="hero-visual" aria-label="Setey Brhaney professional initials portrait">
            <div className="orbit orbit-one"></div>
            <div className="orbit orbit-two"></div>
            <div className="profile-card">
              <div className="code-chip chip-top">&lt;developer /&gt;</div>
              <img
                className="profile-photo"
                src="/images/setey.jpg"
                alt="Setey Brhaney Haftie in graduation attire"
              />
              <div className="code-chip chip-bottom">React.js + SQL</div>
            </div>
          </div>
        </section>

        <section className="section" id="about">
          <SectionTitle eyebrow="About Me" title="A strong foundation across software and systems." />
          <div className="about-grid">
            <div className="about-copy">
              <p>I am a Computer Science graduate from the University of Gondar, Ethiopia. My education developed a foundation in computing, databases, software development, and problem-solving.</p>
              <p>I complemented my degree with postgraduate full-stack web and mobile development training and an IT, Network, and Database Administration internship at the University of Gondar Data Center.</p>
              <p>I am particularly interested in modern web applications, cross-platform mobile applications, RESTful APIs, database systems, and reliable digital solutions.</p>
            </div>
            <div className="about-highlights">
              <div className="about-visual">
                <img src="/images/illustrations/about-systems.svg" alt="Illustration of web development, connected systems, and data" />
              </div>
              <div className="stats-grid">
                {[['B.Sc.', 'Computer Science'], ['3.27', 'CGPA / 4.00'], ['60%', 'National Exit Exam'], ['3 Months', 'IT internship']].map(([value, label]) => (
                  <article className="stat-card" key={label}><strong>{value}</strong><span>{label}</span></article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="section" id="skills">
          <SectionTitle eyebrow="Technical Skills" title="Tools and technologies I work with." />
          <div className="card-grid skills-grid">
            {skills.map((skill) => (
              <article className="card skill-card" key={skill.category}>
                <div className="card-icon"><Code2 /></div><h3>{skill.category}</h3><p>{skill.description}</p>
                <div className="tag-list">{skill.items.map((item) => <span key={item}>{item}</span>)}</div>
              </article>
            ))}
          </div>
        </section>

        <section className="section" id="experience">
          <SectionTitle eyebrow="Experience" title="Practical learning and professional exposure." />
          <div className="timeline">
            {experience.map((item) => (
              <article className="timeline-item" key={item.role}>
                <div className="timeline-marker"></div>
                <div className="card experience-card">
                  <p className="experience-type">{item.type}</p><h3>{item.role}</h3>
                  <p className="experience-org">{item.organization}</p><p className="experience-date">{item.date}</p>
                  <p>{item.description}</p>
                  <ul>{item.points.map((point) => <li key={point}><Check /> <span>{point}</span></li>)}</ul>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="section" id="projects">
          <SectionTitle eyebrow="Featured Projects" title="Selected project areas." description="Project details are presented transparently until screenshots and verified repository information are available." />
          <div className="filter-list" aria-label="Filter projects">
            {['All', 'Web Development', 'Mobile Development', 'Database Systems'].map((filter) => (
              <button type="button" key={filter} className={projectFilter === filter ? 'active' : ''} onClick={() => setProjectFilter(filter)}>{filter}</button>
            ))}
          </div>
          <div className="card-grid project-grid">
            {filteredProjects.map((project) => (
              <article className="card project-card" key={project.title}>
                <div className="project-visual">
                  <img
                    src={projectIllustrations[project.category] || projectIllustrations['Web Development']}
                    alt={`Concept illustration for ${project.title}`}
                  />
                  <span>{project.category}</span>
                </div>
                <div className="project-body">
                  <p className="project-category">{project.category}</p><h3>{project.title}</h3><p>{project.description}</p>
                  <div className="tag-list">{project.stack.map((item) => <span key={item}>{item}</span>)}</div>
                  {project.placeholder && <p className="placeholder-note">Project details and links to be updated.</p>}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="section" id="education">
          <SectionTitle eyebrow="Education" title="Academic background." />
          <div className="education-grid">
            <article className="card education-card">
              <div className="education-icon"><GraduationCap /></div>
              <div><p className="education-label">Bachelor's degree</p><h3>{personalInfo.education.degree}</h3><p>{personalInfo.education.university}</p></div>
              <dl>
                <div><dt>Graduation</dt><dd>{personalInfo.education.graduation}</dd></div>
                <div><dt>CGPA</dt><dd>{personalInfo.education.cgpa}</dd></div>
                <div><dt>Exit exam</dt><dd>{personalInfo.education.examScore}</dd></div>
              </dl>
            </article>
            <div className="cv-actions">
              <div>
                <p className="cv-label">Curriculum Vitae</p>
                <strong>Public CV download</strong>
                <p className="cv-note">This file is included with the website so visitors can download it.</p>
                {cvLoadError && <p className="cv-note" role="status">{cvLoadError}</p>}
              </div>
              <a className="button" href={cvDownloadUrl} download><Download /> Download CV</a>
            </div>
          </div>
        </section>

        <section className="section" id="certifications">
          <SectionTitle eyebrow="Certifications" title="Additional learning and credentials." />
          <div className="card-grid certification-grid">
            {certifications.map((certificate) => (
              <article className="card certificate-card" key={certificate.title}>
                <div className="certificate-icon"><Award /></div><p className="certificate-year">{certificate.year}</p><h3>{certificate.title}</h3><p>{certificate.organization}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="section" id="services">
          <SectionTitle eyebrow="Services" title="Areas where I can contribute." />
          <div className="card-grid services-grid">
            {services.map(([title, description], index) => {
              const ServiceVisual = serviceVisuals[index % serviceVisuals.length]
              return (
                <article className="card service-card" key={title}>
                  <div className="service-art"><ServiceVisual aria-hidden="true" /></div>
                  <h3>{title}</h3>
                  <p>{description}</p>
                </article>
              )
            })}
          </div>
        </section>

        <section className="section" id="process">
          <SectionTitle eyebrow="Professional Approach" title="How I Approach Software Development." />
          <div className="process-grid">
            {processSteps.map(([number, title, description]) => (
              <article className="process-card" key={number}><span>{number}</span><h3>{title}</h3><p>{description}</p></article>
            ))}
          </div>
        </section>

        <section className="section contact-section" id="contact">
          <SectionTitle eyebrow="Contact" title="Let's Build Something Meaningful." />
          <p className="contact-intro">I am interested in connecting with software development teams, technology companies, recruiters, and people working on meaningful digital solutions.</p>
          <div className="contact-grid">
            <div className="contact-details">
              <a href={`mailto:${personalInfo.email}`}><span><Mail /></span><div><small>Email</small><strong>{personalInfo.email}</strong></div></a>
              {personalInfo.phones.map((phone) => <a href={`tel:${phone.replace(/\s/g, '')}`} key={phone}><span><Phone /></span><div><small>Phone</small><strong>{phone}</strong></div></a>)}
              <div className="contact-detail"><span><MapPin /></span><div><small>Location</small><strong>{personalInfo.location}</strong></div></div>
              {personalInfo.github.map((github) => <a href={github} target="_blank" rel="noreferrer" key={github}><span><ExternalLink /></span><div><small>GitHub</small><strong>{github.replace('https://', '')}</strong></div></a>)}
            </div>
            <form className="contact-form" onSubmit={submitContact} noValidate aria-busy={sendingContact}>
              <label className="contact-trap" aria-hidden="true">Leave this field empty<input tabIndex={-1} autoComplete="off" value={contactTrap} onChange={(event) => setContactTrap(event.target.value)} /></label>
              <div className="form-row">
                <label>Full name<input value={form.name} onChange={(event) => { setForm({ ...form, name: event.target.value }); setFormError(''); setFormStatus('') }} placeholder="Your name" /></label>
                <label>Email<input type="email" value={form.email} onChange={(event) => { setForm({ ...form, email: event.target.value }); setFormError(''); setFormStatus('') }} placeholder="you@example.com" /></label>
              </div>
              <label>Subject<input value={form.subject} onChange={(event) => { setForm({ ...form, subject: event.target.value }); setFormError(''); setFormStatus('') }} placeholder="Project or opportunity" /></label>
              <label>Message<textarea value={form.message} onChange={(event) => { setForm({ ...form, message: event.target.value }); setFormError(''); setFormStatus('') }} placeholder="Tell me about your message..." rows="6" /></label>
              {formError && <p className="form-error" role="alert">{formError}</p>}
              {formStatus && <p className="form-success" role="status">{formStatus}</p>}
              <button className="button" type="submit" disabled={sendingContact}>{sendingContact ? 'Sending…' : 'Send Message'} <Mail /></button>
            </form>
          </div>
        </section>
      </main>

      <footer>
        <div className="footer-main">
          <div><button className="brand footer-brand" type="button" onClick={() => scrollTo('home')}>SBH<span>.</span></button><p>{personalInfo.title}<br />| {personalInfo.roleLine}</p></div>
          <div><h3>Quick navigation</h3><div className="footer-links">{navItems.map(([label, id]) => <button type="button" key={id} onClick={() => scrollTo(id)}>{label}</button>)}</div></div>
          <div><h3>Profiles</h3>{personalInfo.github.map((github) => <a href={github} target="_blank" rel="noreferrer" key={github}><ExternalLink /> GitHub</a>)}<a href={`mailto:${personalInfo.email}`}><Mail /> Email</a></div>
        </div>
        <div className="footer-bottom"><p>© {copyrightYear} Designed and developed by Setey Brhaney Haftie.</p></div>
      </footer>

      {showTop && <button className="back-to-top" type="button" aria-label="Back to top" onClick={() => scrollTo('home')}><ArrowUp /></button>}
    </div>
  )
}

export default function App() {
  const path = window.location.pathname.replace(/\/+$/, '') || '/'
  return path === '/admin' ? <AdminDashboard /> : <Portfolio />
}

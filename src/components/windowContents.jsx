import { useState } from 'react';
import { projects } from '../data/projects.js';

const assetUrl = (path) => `${import.meta.env.BASE_URL}${path}`;

const skillGroups = [
  ['languages', ['Python', 'JavaScript', 'Kotlin', 'PHP', 'SQL']],
  ['frameworks', ['React', 'Django REST', 'Flutter', 'BERT (Hugging Face)']],
  ['databases', ['MongoDB', 'MySQL']],
  ['ai / ml', ['LLM Integration', 'Generative AI', 'Fine-tuned Classifiers']],
  ['tools', ['Git', 'GitHub', 'REST APIs', 'Android Studio', 'VS Code']],
];

const timeline = [
  ['2025.11 - 2026.03', 'Verif-AI', 'Project Manager / Lead Developer'],
  ['2025.07 - 2025.10', 'Bimby', 'Artificial Intelligence Engineer'],
  ['2025.01 - 2025.04', 'Upang BookTrack', 'Lead Developer'],
];

const certifications = [
  ['2026.04.04', 'AI Beginners Guide (Simplilearn)'],
  ['2026.03.11', 'Data Analytics with AI (SoloLearn)'],
];

const GROUP_GAP = 12;
const DETAIL_WIDTH = 600;
const PROJECTS_WIDTH = 480;
const PROJECTS_GROUP_WIDTH = DETAIL_WIDTH + GROUP_GAP + PROJECTS_WIDTH;

const baseMeta = {
  help: { title: 'commands.txt', width: 340 },
  about: { title: 'about.txt', width: 540 },
  projects: { title: 'projects/', width: PROJECTS_WIDTH, anchor: 'right', groupWidth: PROJECTS_GROUP_WIDTH },
  resume: { title: 'resume.pdf', width: 560 },
  contact: { title: 'contact.txt', width: 360 },
  meteorgarden: { title: 'Meteor_Garden.jpg', width: 760, centered: true },
};

export const windowMeta = {
  ...baseMeta,
  projectdetail: { title: 'project/', width: DETAIL_WIDTH, anchor: 'left', groupWidth: PROJECTS_GROUP_WIDTH },
};

// Windows that behave as one item in the tray.
export const windowGroup = ['projects', 'projectdetail'];

// Only these can be launched by typing a command.
export const windowIds = Object.keys(baseMeta);

function Help({ commands, onRun }) {
  return (
    <>
      <p className="cmd-window-hint">click a command to run it, or type it in the shell.</p>
      <ul>
        {commands.map((item) => (
          <li key={item.name}>
            <button type="button" onClick={() => onRun(item.name)}>
              <code>/{item.name}</code>
              <span>{item.desc}</span>
            </button>
          </li>
        ))}
      </ul>
      <p className="cmd-window-foot">tab = autocomplete / up = history</p>
    </>
  );
}

function About() {
  return (
    <div className="win-text about-win">
      <div className="about-id">
        <div className="about-photo"><img src={assetUrl('profile.jpg')} alt="Shean Kenchi Tomeldan" /></div>
        <div className="about-id-text">
          <p className="about-name">Shean Kenchi G. Tomeldan</p>
          <p className="win-label">software developer / product thinker</p>
          <dl className="about-facts">
            <dt>location</dt><dd>Dagupan City, Pangasinan</dd>
            <dt>studying</dt><dd>BS Information Technology, 3rd year</dd>
            <dt>school</dt><dd>University of Pangasinan</dd>
            <dt>grad</dt><dd>expected 2027</dd>
            <dt>status</dt><dd className="about-status">open to internships</dd>
          </dl>
        </div>
      </div>

      <h3 className="win-heading">summary</h3>
      <p>Hands-on experience building AI-integrated and full-stack applications. I lead end-to-end development of LLM-powered platforms, including scam detection systems that use fine-tuned BERT models across web and mobile.</p>
      <p>Looking to join software development and AI/ML teams in a challenging internship environment.</p>

      <h3 className="win-heading">toolbox</h3>
      {skillGroups.map(([group, items]) => (
        <div className="about-skill-row" key={group}>
          <span className="win-label">{group}</span>
          <div className="win-tags">{items.map((item) => <span key={item}>{item}</span>)}</div>
        </div>
      ))}

      <h3 className="win-heading">timeline</h3>
      <ul className="about-list">
        {timeline.map(([date, name, role]) => (
          <li key={name}><code>{date}</code><span><b>{name}</b> / {role}</span></li>
        ))}
      </ul>

      <h3 className="win-heading">education</h3>
      <ul className="about-list">
        <li><code>2023 - 2027</code><span><b>University of Pangasinan</b> / BS Information Technology</span></li>
        <li><code>2020 - 2023</code><span><b>St. John&apos;s Cathedral School</b> / Senior High School, Dean&apos;s Lister (Jan, Mar, May 2023)</span></li>
      </ul>

      <h3 className="win-heading">certifications</h3>
      <ul className="about-list">
        {certifications.map(([date, name]) => (
          <li key={name}><code>{date}</code><span>{name}</span></li>
        ))}
      </ul>
    </div>
  );
}

function Projects({ onOpen }) {
  return (
    <div className="win-text">
      {projects.map((project) => (
        <article className="win-project" key={project.id}>
          <p className="win-project-head"><code>{project.number}</code> {project.name} <span>{project.year}</span></p>
          <p className="win-label">{project.role}</p>
          <p>{project.summary}</p>
          <div className="win-tags">{project.stack.map((item) => <span key={item}>{item}</span>)}</div>
          <button type="button" className="win-btn" onClick={() => onOpen(project.id)}>[ open details ]</button>
        </article>
      ))}
      <a className="win-link" href="https://github.com/ManokManokManok" target="_blank" rel="noreferrer">github.com/ManokManokManok</a>
    </div>
  );
}

function Screenshot({ shot, index }) {
  const [failed, setFailed] = useState(false);
  return (
    <figure className="shot">
      {failed ? (
        <div className="shot-placeholder">
          <span>[ screenshot {String(index + 1).padStart(2, '0')} ]</span>
          <small>coming soon</small>
        </div>
      ) : (
        <img src={shot.src} alt={shot.caption} onError={() => setFailed(true)} draggable="false" />
      )}
      <figcaption>{shot.caption}</figcaption>
    </figure>
  );
}

function ProjectDetail({ projectId }) {
  const project = projects.find((item) => item.id === projectId);
  if (!project) return null;
  return (
    <div className="win-text project-win">
      <p className="project-win-title"><code>{project.number}</code> {project.name}</p>
      <p className="win-label">{project.role} / {project.period}</p>
      <dl className="about-facts">
        <dt>type</dt><dd>{project.descriptor.toLowerCase()}</dd>
        <dt>signal</dt><dd className="about-status">{project.signal}</dd>
      </dl>

      <h3 className="win-heading">overview</h3>
      <p>{project.overview}</p>

      <h3 className="win-heading">highlights</h3>
      <ul className="project-bullets">
        {project.highlights.map((item) => <li key={item}>{item}</li>)}
      </ul>

      <h3 className="win-heading">stack</h3>
      <div className="win-tags">{project.stackFull.map((item) => <span key={item}>{item}</span>)}</div>

      <h3 className="win-heading">screenshots</h3>
      <div className="shot-grid">
        {project.screenshots.map((shot, index) => <Screenshot shot={shot} index={index} key={shot.src} />)}
      </div>

      <h3 className="win-heading">links</h3>
      <div className="win-actions">
        {project.links.map((link) => <a className="win-link" href={link.href} target="_blank" rel="noreferrer" key={link.label}>[ {link.label} ]</a>)}
      </div>
    </div>
  );
}

function Resume() {
  return (
    <div className="win-text resume-win">
      <div className="win-actions resume-actions">
        <a className="win-link" href={assetUrl('resume.pdf')} target="_blank" rel="noreferrer">[ open ]</a>
        <a className="win-link" href={assetUrl('resume.pdf')} download="Tomeldan-Shean-Kenchi-Resume.pdf">[ download ]</a>
      </div>
      <iframe className="resume-frame" src={`${assetUrl('resume.pdf')}#view=FitH&toolbar=0&navpanes=0`} title="Resume preview" />
    </div>
  );
}

function Contact() {
  return (
    <div className="win-text">
      <p><span className="win-label">email</span><br /><a className="win-link" href="mailto:kenchitomeldan@gmail.com">kenchitomeldan@gmail.com</a></p>
      <p><span className="win-label">github</span><br /><a className="win-link" href="https://github.com/ManokManokManok" target="_blank" rel="noreferrer">github.com/ManokManokManok</a></p>
      <p><span className="win-label">linkedin</span><br /><a className="win-link" href="https://www.linkedin.com/in/kenchitomeldan/" target="_blank" rel="noreferrer">linkedin.com/in/kenchitomeldan</a></p>
    </div>
  );
}

export function WindowBody({ id, commands, onRun, onOpen, activeProject }) {
  if (id === 'help') return <Help commands={commands} onRun={onRun} />;
  if (id === 'about') return <About />;
  if (id === 'projects') return <Projects onOpen={onOpen} />;
  if (id === 'projectdetail') return <ProjectDetail projectId={activeProject} />;
  if (id === 'resume') return <Resume />;
  if (id === 'meteorgarden') return <img className="win-image" src={assetUrl('meteor_garden.jpg')} alt="Meteor Garden" draggable="false" />;
  return <Contact />;
}

import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { 
  MdClose, MdPerson, MdEmail, MdFileDownload, 
  MdWork, MdSchool, MdFolder, MdWorkspacePremium, 
  MdLaunch, MdArrowUpward, MdPhone
} from 'react-icons/md';
import { FaLinkedin, FaGithub, FaEnvelope } from 'react-icons/fa';
import './portfolio.css';

gsap.registerPlugin(ScrollTrigger);

// Custom Typing Effect Hook
function useTypingEffect(words, speed = 100, delay = 2000) {
  const [text, setText] = useState('');
  const [wordIndex, setWordIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let timer;
    const currentWord = words[wordIndex];

    if (isDeleting) {
      timer = setTimeout(() => {
        setText(currentWord.substring(0, text.length - 1));
      }, speed / 2);
    } else {
      timer = setTimeout(() => {
        setText(currentWord.substring(0, text.length + 1));
      }, speed);
    }

    if (!isDeleting && text === currentWord) {
      timer = setTimeout(() => setIsDeleting(true), delay);
    } else if (isDeleting && text === '') {
      setIsDeleting(false);
      setWordIndex((prev) => (prev + 1) % words.length);
    }

    return () => clearTimeout(timer);
  }, [text, isDeleting, wordIndex, words, speed, delay]);

  return text;
}

export default function PortfolioModal({ isOpen, onClose }) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const followerRef = useRef(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeSection, setActiveSection] = useState('home');
  const [counters, setCounters] = useState({ exp: 0, proj: 0, cert: 0 });

  const typedRole = useTypingEffect([
    'Full Stack Developer',
    'Laravel Specialist',
    'React & Node Developer',
    'AngularJS Specialist'
  ], 120, 2000);

  // Particle Background
  useEffect(() => {
    if (!isOpen || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const resizeCanvas = () => {
      canvas.width = canvas.parentElement.offsetWidth || window.innerWidth;
      canvas.height = canvas.parentElement.offsetHeight || window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const particles = [];
    const particleCount = 45;

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 2 + 1,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        alpha: Math.random() * 0.5 + 0.2
      });
    }

    let mouse = { x: null, y: null };
    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    };
    canvas.parentElement.addEventListener('mousemove', handleMouseMove);

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw links between close particles
      for (let i = 0; i < particles.length; i++) {
        const p1 = particles[i];
        
        ctx.beginPath();
        ctx.arc(p1.x, p1.y, p1.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(99, 102, 241, ${p1.alpha})`;
        ctx.fill();

        p1.x += p1.vx;
        p1.y += p1.vy;

        if (p1.x < 0 || p1.x > canvas.width) p1.vx *= -1;
        if (p1.y < 0 || p1.y > canvas.height) p1.vy *= -1;

        // Interactive mouse connection
        if (mouse.x && mouse.y) {
          const dx = p1.x - mouse.x;
          const dy = p1.y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.strokeStyle = `rgba(99, 102, 241, ${(1 - dist / 120) * 0.15})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }

      animationFrameId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [isOpen]);

  // Cursor Spotlight & Scroll Monitoring
  useEffect(() => {
    if (!isOpen) return;

    const handleScroll = (e) => {
      const target = e.target;
      const totalHeight = target.scrollHeight - target.clientHeight;
      if (totalHeight > 0) {
        const progress = (target.scrollTop / totalHeight) * 100;
        setScrollProgress(progress);
      }

      // Check active section
      const sections = ['home', 'about', 'skills', 'experience', 'projects', 'education', 'certifications', 'contact'];
      for (const section of sections) {
        const el = document.getElementById(`portfolio-${section}`);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 200 && rect.bottom >= 200) {
            setActiveSection(section);
          }
        }
      }
    };

    const handleGlobalMouseMove = (e) => {
      if (followerRef.current) {
        gsap.to(followerRef.current, {
          x: e.clientX,
          y: e.clientY,
          duration: 0.1,
          opacity: 1
        });
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
    }
    window.addEventListener('mousemove', handleGlobalMouseMove);

    return () => {
      if (container) {
        container.removeEventListener('scroll', handleScroll);
      }
      window.removeEventListener('mousemove', handleGlobalMouseMove);
    };
  }, [isOpen]);

  // Counter Incrementor Animation trigger
  useEffect(() => {
    if (!isOpen || activeSection !== 'about') return;

    let startExp = 0;
    let startProj = 0;
    let startCert = 0;

    const interval = setInterval(() => {
      let done = true;
      if (startExp < 2) {
        startExp += 1;
        done = false;
      }
      if (startProj < 10) {
        startProj += 1;
        done = false;
      }
      if (startCert < 3) {
        startCert += 1;
        done = false;
      }

      setCounters({ exp: startExp, proj: startProj, cert: startCert });
      if (done) clearInterval(interval);
    }, 100);

    return () => clearInterval(interval);
  }, [isOpen, activeSection]);

  // GSAP Entrance Animations
  useGSAP(() => {
    if (!isOpen) return;

    // Hero timeline
    const tl = gsap.timeline();
    tl.fromTo('.hero-text-reveal', 
      { x: -100, opacity: 0 }, 
      { x: 0, opacity: 1, duration: 0.8, ease: 'power3.out', stagger: 0.2 }
    );
    tl.fromTo('.hero-profile-container', 
      { scale: 0.8, opacity: 0 }, 
      { scale: 1, opacity: 1, duration: 0.8, ease: 'back.out(1.5)' },
      '-=0.6'
    );
    tl.fromTo('.hero-button-group button, .hero-button-group a', 
      { y: 30, opacity: 0 }, 
      { y: 0, opacity: 1, duration: 0.5, ease: 'power2.out', stagger: 0.1 },
      '-=0.4'
    );

    // Staggered reveal for skills
    gsap.fromTo('.skill-card-animate',
      { y: 50, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.6,
        stagger: 0.08,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: '#portfolio-skills',
          scroller: containerRef.current,
          start: 'top 75%'
        }
      }
    );

    // Timeline line reveal
    gsap.fromTo('.timeline-line',
      { scaleY: 0 },
      {
        scaleY: 1,
        duration: 1.2,
        ease: 'none',
        transformOrigin: 'top center',
        scrollTrigger: {
          trigger: '#portfolio-experience',
          scroller: containerRef.current,
          start: 'top 70%'
        }
      }
    );

    // Timeline item bullets and slides
    gsap.fromTo('.timeline-item',
      { x: -50, opacity: 0 },
      {
        x: 0,
        opacity: 1,
        duration: 0.8,
        stagger: 0.3,
        scrollTrigger: {
          trigger: '#portfolio-experience',
          scroller: containerRef.current,
          start: 'top 60%'
        }
      }
    );
  }, { scope: containerRef, dependencies: [isOpen] });

  if (!isOpen) return null;

  const handleDotClick = (section) => {
    const el = document.getElementById(`portfolio-${section}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleBackToTop = () => {
    if (containerRef.current) {
      containerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="portfolio-modal-overlay">
      {/* Scroll indicator */}
      <div className="portfolio-scroll-progress" style={{ width: `${scrollProgress}%` }} />

      {/* Floating Cursor Follower */}
      <div className="portfolio-cursor-follower" ref={followerRef} />

      {/* Close button */}
      <button className="portfolio-close-btn" onClick={onClose} title="Close Portfolio">
        <MdClose size={24} />
      </button>

      {/* Side Dot Navigation */}
      <div className="portfolio-nav">
        {['home', 'about', 'skills', 'experience', 'projects', 'education', 'certifications', 'contact'].map((sec) => (
          <div 
            key={sec} 
            className={`portfolio-nav-dot ${activeSection === sec ? 'active' : ''}`}
            onClick={() => handleDotClick(sec)}
            title={sec.toUpperCase()}
          />
        ))}
      </div>

      <div className="portfolio-modal-container" ref={containerRef}>
        
        {/* Section 1: Home / Hero */}
        <section id="portfolio-home" className="portfolio-section" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', background: 'radial-gradient(circle at 80% 20%, rgba(99, 102, 241, 0.08) 0%, transparent 50%)' }}>
          <canvas className="portfolio-particles-canvas" ref={canvasRef} />
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 40, width: '100%', alignItems: 'center' }}>
            <div style={{ order: 2 }}>
              <div className="hero-profile-container" style={{ width: 280, height: 280, margin: '0 auto', borderRadius: '50%', overflow: 'hidden', border: '4px solid var(--accent)', boxShadow: 'var(--shadow-accent)', background: 'var(--bg-surface)' }}>
                <img src="/profile.jpg" alt="Rubin Kaiser" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            </div>
            
            <div style={{ order: 1 }}>
              <h4 className="hero-text-reveal" style={{ color: 'var(--accent)', fontWeight: 600, letterSpacing: 1, marginBottom: 12 }}>👋 WELCOME TO MY WORLD</h4>
              <h1 className="hero-text-reveal" style={{ fontSize: '3.2rem', fontWeight: 800, lineHeight: 1.2, marginBottom: 16 }}>
                Hi, I'm <span style={{ background: 'linear-gradient(to right, var(--accent), var(--purple))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Rubin Kaiser M</span>
              </h1>
              <h2 className="hero-text-reveal" style={{ fontSize: '1.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 24, height: 40 }}>
                a <span style={{ color: 'var(--orange)' }}>{typedRole}</span><span className="typed-cursor" style={{ animation: 'blink 0.7s infinite' }}>|</span>
              </h2>
              
              <div className="hero-button-group" style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginTop: 32 }}>
                <a 
                  href="/resume.pdf" 
                  download 
                  className="btn btn-primary"
                  style={{ gap: 8, display: 'inline-flex', padding: '12px 24px', borderRadius: 'var(--radius-full)' }}
                >
                  <MdFileDownload size={20} /> Download Resume
                </a>
                <button 
                  onClick={() => handleDotClick('contact')} 
                  className="btn btn-secondary"
                  style={{ padding: '12px 24px', borderRadius: 'var(--radius-full)' }}
                >
                  Hire Me
                </button>
              </div>

              <div className="hero-text-reveal" style={{ display: 'flex', gap: 20, marginTop: 40 }}>
                <a href="https://linkedin.com/in/rubin-kaiser-m-b605962b9" target="_blank" rel="noreferrer" style={{ color: 'var(--text-muted)', fontSize: 24, transition: 'var(--transition)' }} className="social-icon-hover">
                  <FaLinkedin />
                </a>
                <a href="https://github.com/mrubinkaiser" target="_blank" rel="noreferrer" style={{ color: 'var(--text-muted)', fontSize: 24, transition: 'var(--transition)' }} className="social-icon-hover">
                  <FaGithub />
                </a>
                <a href="mailto:m.rubinkaiser@gmail.com" style={{ color: 'var(--text-muted)', fontSize: 24, transition: 'var(--transition)' }} className="social-icon-hover">
                  <FaEnvelope />
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: About Me */}
        <section id="portfolio-about" className="portfolio-section" style={{ background: 'var(--bg-elevated)' }}>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 800, textAlign: 'center', marginBottom: 60 }}>About Me</h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 40 }}>
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <h3 style={{ fontSize: '1.6rem', marginBottom: 16, color: 'var(--accent)' }}>Who I Am</h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: 20, fontSize: '1.05rem', lineHeight: 1.7 }}>
                Hi, I'm **Rubin Kaiser M**, a Full Stack Developer specializing in Laravel, PHP, AngularJS, and React. 
                I enjoy building responsive web applications and continuously learning modern technologies to construct high-performance digital systems.
              </p>
              <h3 style={{ fontSize: '1.3rem', marginBottom: 10, color: 'var(--text-primary)' }}>Career Objective</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                To leverage my engineering expertise in PHP, Laravel, and React to deliver clean, scalable interfaces, and drive customer-facing features in collaboration with forward-thinking engineering squads.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, alignItems: 'center' }}>
              <div className="glass-card" style={{ textAlign: 'center', padding: '24px 10px' }}>
                <h3 style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--accent)', margin: 0 }}>{counters.exp}+</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 8 }}>Years Experience</p>
              </div>
              <div className="glass-card" style={{ textAlign: 'center', padding: '24px 10px' }}>
                <h3 style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--purple)', margin: 0 }}>{counters.proj}+</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 8 }}>Projects Built</p>
              </div>
              <div className="glass-card" style={{ textAlign: 'center', padding: '24px 10px' }}>
                <h3 style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--orange)', margin: 0 }}>{counters.cert}+</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 8 }}>Certifications</p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Skills */}
        <section id="portfolio-skills" className="portfolio-section">
          <h2 style={{ fontSize: '2.5rem', fontWeight: 800, textAlign: 'center', marginBottom: 60 }}>My Skills</h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
            
            {/* Frontend */}
            <div className="glass-card skill-card-animate">
              <h3 style={{ fontSize: '1.2rem', marginBottom: 20, color: 'var(--accent)', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 8 }}>Frontend</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {['HTML5', 'CSS3', 'JavaScript', 'React.js', 'AngularJS', 'Responsive Design'].map(s => (
                  <span key={s} style={{ background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.2)', padding: '6px 12px', borderRadius: 'var(--radius-sm)', fontSize: 13 }}>{s}</span>
                ))}
              </div>
            </div>

            {/* Backend */}
            <div className="glass-card skill-card-animate">
              <h3 style={{ fontSize: '1.2rem', marginBottom: 20, color: 'var(--purple)', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 8 }}>Backend</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {['PHP', 'Laravel', 'Node.js', 'Flask', 'Go (Golang)'].map(s => (
                  <span key={s} style={{ background: 'rgba(168, 85, 247, 0.1)', border: '1px solid rgba(168, 85, 247, 0.2)', padding: '6px 12px', borderRadius: 'var(--radius-sm)', fontSize: 13 }}>{s}</span>
                ))}
              </div>
            </div>

            {/* Database */}
            <div className="glass-card skill-card-animate">
              <h3 style={{ fontSize: '1.2rem', marginBottom: 20, color: 'var(--orange)', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 8 }}>Database</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {['MySQL', 'PostgreSQL', 'MongoDB', 'PhpMyAdmin'].map(s => (
                  <span key={s} style={{ background: 'rgba(249, 115, 22, 0.1)', border: '1px solid rgba(249, 115, 22, 0.2)', padding: '6px 12px', borderRadius: 'var(--radius-sm)', fontSize: 13 }}>{s}</span>
                ))}
              </div>
            </div>

            {/* Programming & Libraries */}
            <div className="glass-card skill-card-animate">
              <h3 style={{ fontSize: '1.2rem', marginBottom: 20, color: 'var(--accent)', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 8 }}>Programming & Libraries</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {['Python', 'JavaScript', 'Go', 'SQL', 'GSAP', 'Pandas', 'Beautiful Soup', 'Tkinter', 'Turtle Graphics'].map(s => (
                  <span key={s} style={{ background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.2)', padding: '6px 12px', borderRadius: 'var(--radius-sm)', fontSize: 13 }}>{s}</span>
                ))}
              </div>
            </div>

          </div>
        </section>

        {/* Section 4: Experience */}
        <section id="portfolio-experience" className="portfolio-section" style={{ background: 'var(--bg-elevated)' }}>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 800, textAlign: 'center', marginBottom: 60 }}>Experience</h2>
          
          <div className="timeline-wrapper">
            <div className="timeline-line" />
            
            <div className="timeline-item">
              <div className="timeline-bullet" />
              <div className="glass-card" style={{ marginLeft: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                  <div>
                    <h3 style={{ fontSize: '1.3rem', fontWeight: 700 }}>Laravel Developer</h3>
                    <h4 style={{ color: 'var(--accent)', fontWeight: 500 }}>F.TIP INFOSOL (Aadai ERP)</h4>
                  </div>
                  <span style={{ background: 'rgba(99, 102, 241, 0.1)', padding: '4px 12px', borderRadius: 'var(--radius-full)', fontSize: 12, height: 'fit-content' }}>
                    Dec 2025 - Present
                  </span>
                </div>
                <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
                  Directing full-stack feature releases for the client Aadai ERP software suite. Refining application architectures using PHP, Laravel, MySQL, and AngularJS to handle custom production-level requirements.
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {['Laravel', 'PHP', 'AngularJS', 'MySQL'].map(t => (
                    <span key={t} style={{ background: 'rgba(255,255,255,0.05)', padding: '4px 8px', borderRadius: 'var(--radius-sm)', fontSize: 11, color: 'var(--text-muted)' }}>{t}</span>
                  ))}
                </div>
              </div>
            </div>

            <div className="timeline-item">
              <div className="timeline-bullet" style={{ background: 'var(--purple)', boxShadow: '0 0 8px var(--purple)' }} />
              <div className="glass-card" style={{ marginLeft: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                  <div>
                    <h3 style={{ fontSize: '1.3rem', fontWeight: 700 }}>React Developer Intern</h3>
                    <h4 style={{ color: 'var(--purple)', fontWeight: 500 }}>Eloiacs Software Pvt Ltd</h4>
                  </div>
                  <span style={{ background: 'rgba(168, 85, 247, 0.1)', padding: '4px 12px', borderRadius: 'var(--radius-full)', fontSize: 12, height: 'fit-content' }}>
                    May 2025 - Sep 2025
                  </span>
                </div>
                <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
                  Built web interfaces and responsive layouts using React, Node.js, HTML, CSS, and modern JavaScript. Participated in team code integrations and UI optimization runs.
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {['React', 'Node.js', 'HTML', 'CSS', 'JavaScript'].map(t => (
                    <span key={t} style={{ background: 'rgba(255,255,255,0.05)', padding: '4px 8px', borderRadius: 'var(--radius-sm)', fontSize: 11, color: 'var(--text-muted)' }}>{t}</span>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* Section 5: Projects */}
        <section id="portfolio-projects" className="portfolio-section">
          <h2 style={{ fontSize: '2.5rem', fontWeight: 800, textAlign: 'center', marginBottom: 60 }}>Featured Projects</h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
            
            {/* Project 1: Weather Dashboard */}
            <div className="project-flip-card">
              <div className="project-flip-inner">
                <div className="project-flip-front glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
                  <div>
                    <MdFolder size={40} style={{ color: 'var(--accent)' }} />
                    <h3 style={{ fontSize: '1.4rem', marginTop: 16 }}>Weather Dashboard</h3>
                    <p style={{ color: 'var(--text-secondary)', marginTop: 8, fontSize: '0.9rem' }}>Real-time location-based weather monitoring dashboard integrated with multiple visual forecast charts.</p>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {['React', 'Vite', 'OpenWeatherAPI'].map(t => <span key={t} style={{ fontSize: 11, color: 'var(--text-muted)' }}>#{t}</span>)}
                  </div>
                </div>
                <div className="project-flip-back">
                  <h3>Weather Dashboard</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '12px 0 24px' }}>Fetches geo-coordinates and plots temperatures and trends.</p>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <a href="https://github.com/mrubinkaiser" target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm" style={{ gap: 6 }}><FaGithub /> GitHub</a>
                    <a href="#" className="btn btn-primary btn-sm" style={{ gap: 6 }}><MdLaunch /> Live Demo</a>
                  </div>
                </div>
              </div>
            </div>

            {/* Project 2: Recipe Hub */}
            <div className="project-flip-card">
              <div className="project-flip-inner">
                <div className="project-flip-front glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
                  <div>
                    <MdFolder size={40} style={{ color: 'var(--purple)' }} />
                    <h3 style={{ fontSize: '1.4rem', marginTop: 16 }}>Recipe Hub</h3>
                    <p style={{ color: 'var(--text-secondary)', marginTop: 8, fontSize: '0.9rem' }}>Interactive recipe indexing and sharing application with automated category sorting.</p>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {['Laravel', 'MySQL', 'Blade'].map(t => <span key={t} style={{ fontSize: 11, color: 'var(--text-muted)' }}>#{t}</span>)}
                  </div>
                </div>
                <div className="project-flip-back">
                  <h3>Recipe Hub</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '12px 0 24px' }}>Dynamic recipe manager with login, ratings, and filters.</p>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <a href="https://github.com/mrubinkaiser" target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm" style={{ gap: 6 }}><FaGithub /> GitHub</a>
                    <a href="#" className="btn btn-primary btn-sm" style={{ gap: 6 }}><MdLaunch /> Live Demo</a>
                  </div>
                </div>
              </div>
            </div>

            {/* Project 3: Student Result Analysis */}
            <div className="project-flip-card">
              <div className="project-flip-inner">
                <div className="project-flip-front glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
                  <div>
                    <MdFolder size={40} style={{ color: 'var(--orange)' }} />
                    <h3 style={{ fontSize: '1.4rem', marginTop: 16 }}>Student Result Analysis</h3>
                    <p style={{ color: 'var(--text-secondary)', marginTop: 8, fontSize: '0.9rem' }}>Analytics dashboard displaying academic indicators, class rankings, and failure distributions.</p>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {['Python', 'Flask', 'Pandas'].map(t => <span key={t} style={{ fontSize: 11, color: 'var(--text-muted)' }}>#{t}</span>)}
                  </div>
                </div>
                <div className="project-flip-back">
                  <h3>Student Analysis</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '12px 0 24px' }}>Processes grading lists and plots visual analytics charts.</p>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <a href="https://github.com/mrubinkaiser" target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm" style={{ gap: 6 }}><FaGithub /> GitHub</a>
                    <a href="#" className="btn btn-primary btn-sm" style={{ gap: 6 }}><MdLaunch /> Live Demo</a>
                  </div>
                </div>
              </div>
            </div>

            {/* Project 4: E-Commerce Web */}
            <div className="project-flip-card">
              <div className="project-flip-inner">
                <div className="project-flip-front glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
                  <div>
                    <MdFolder size={40} style={{ color: 'var(--accent)' }} />
                    <h3 style={{ fontSize: '1.4rem', marginTop: 16 }}>E-Commerce Store</h3>
                    <p style={{ color: 'var(--text-secondary)', marginTop: 8, fontSize: '0.9rem' }}>Fully responsive online store with virtual shopping cart, stripe checking, and admin order trackers.</p>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {['React.js', 'Node.js', 'MongoDB'].map(t => <span key={t} style={{ fontSize: 11, color: 'var(--text-muted)' }}>#{t}</span>)}
                  </div>
                </div>
                <div className="project-flip-back">
                  <h3>E-Commerce Store</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '12px 0 24px' }}>A premium shopping template with backend APIs.</p>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <a href="https://github.com/mrubinkaiser" target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm" style={{ gap: 6 }}><FaGithub /> GitHub</a>
                    <a href="#" className="btn btn-primary btn-sm" style={{ gap: 6 }}><MdLaunch /> Live Demo</a>
                  </div>
                </div>
              </div>
            </div>

            {/* Project 5: TimeTrack Application */}
            <div className="project-flip-card">
              <div className="project-flip-inner">
                <div className="project-flip-front glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
                  <div>
                    <MdFolder size={40} style={{ color: 'var(--purple)' }} />
                    <h3 style={{ fontSize: '1.4rem', marginTop: 16 }}>TimeTrack System</h3>
                    <p style={{ color: 'var(--text-secondary)', marginTop: 8, fontSize: '0.9rem' }}>The exact MERN system you are viewing! Time logger, custom tokens, and admin user controller dashboards.</p>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {['MongoDB', 'Express', 'React', 'Node'].map(t => <span key={t} style={{ fontSize: 11, color: 'var(--text-muted)' }}>#{t}</span>)}
                  </div>
                </div>
                <div className="project-flip-back">
                  <h3>TimeTrack System</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '12px 0 24px' }}>Complete MERN task auditor with custom settings.</p>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <a href="https://github.com/mrubinkaiser" target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm" style={{ gap: 6 }}><FaGithub /> GitHub</a>
                    <a href="#" className="btn btn-primary btn-sm" style={{ gap: 6 }}><MdLaunch /> Live Demo</a>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* Section 6: Education */}
        <section id="portfolio-education" className="portfolio-section" style={{ background: 'var(--bg-elevated)' }}>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 800, textAlign: 'center', marginBottom: 60 }}>Education</h2>
          
          <div className="timeline-wrapper">
            <div className="timeline-line" />

            <div className="timeline-item">
              <div className="timeline-bullet" />
              <div className="glass-card" style={{ marginLeft: 20 }}>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 700 }}>M.Sc Computer Science</h3>
                <h4 style={{ color: 'var(--accent)', fontWeight: 500, margin: '4px 0 8px' }}>Postgraduate Degree</h4>
                <p style={{ color: 'var(--text-secondary)' }}>
                  Focused on Advanced Algorithms, Machine Learning modeling, Cloud Databases, and modern Web Stack Architectures.
                </p>
              </div>
            </div>

            <div className="timeline-item">
              <div className="timeline-bullet" style={{ background: 'var(--purple)', boxShadow: '0 0 8px var(--purple)' }} />
              <div className="glass-card" style={{ marginLeft: 20 }}>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 700 }}>B.Sc Computer Science</h3>
                <h4 style={{ color: 'var(--purple)', fontWeight: 500, margin: '4px 0 8px' }}>Undergraduate Degree</h4>
                <p style={{ color: 'var(--text-secondary)' }}>
                  Acquired key fundamentals in Object-Oriented Programming (OOP), Data Structures, Relational Databases (SQL), and Systems Engineering.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 7: Certifications */}
        <section id="portfolio-certifications" className="portfolio-section">
          <h2 style={{ fontSize: '2.5rem', fontWeight: 800, textAlign: 'center', marginBottom: 60 }}>Certifications</h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
            
            {/* Cert 1 */}
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <MdWorkspacePremium size={32} style={{ color: 'var(--orange)' }} />
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>100 Days of Code: The Complete Python Pro Bootcamp</h3>
              <h4 style={{ color: 'var(--text-secondary)', fontSize: 13, fontWeight: 500 }}>Udemy - Issued Jan 2023</h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                {['Python', 'Flask', 'HTML', 'CSS', 'Pandas', 'Beautiful Soup'].map(c => (
                  <span key={c} style={{ background: 'rgba(255,255,255,0.03)', padding: '2px 8px', borderRadius: 4, fontSize: 11 }}>{c}</span>
                ))}
              </div>
            </div>

            {/* Cert 2 */}
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <MdWorkspacePremium size={32} style={{ color: 'var(--accent)' }} />
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Introduction to Web Design and Development</h3>
              <h4 style={{ color: 'var(--text-secondary)', fontSize: 13, fontWeight: 500 }}>LinkedIn - Issued Oct 2023</h4>
              <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Covered responsive layouts, semantic DOM structures, and core user-centric design theories.</p>
            </div>

            {/* Cert 3 */}
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <MdWorkspacePremium size={32} style={{ color: 'var(--purple)' }} />
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>HTML Essential Training</h3>
              <h4 style={{ color: 'var(--text-secondary)', fontSize: 13, fontWeight: 500 }}>LinkedIn - Issued Oct 2023</h4>
              <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Deep-dive into HTML5 specifications, SEO tags, forms, validation standards, and DOM tree structures.</p>
            </div>

          </div>
        </section>

        {/* Section 8: Contact */}
        <section id="portfolio-contact" className="portfolio-section" style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 800, textAlign: 'center', marginBottom: 60 }}>Get In Touch</h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 40 }}>
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <h3 style={{ fontSize: '1.4rem', color: 'var(--accent)' }}>Contact Information</h3>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Feel free to drop a line, discuss custom Laravel or React dashboard integrations, or schedule standard recruitment syncs.
              </p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, fontSize: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <MdEmail size={20} style={{ color: 'var(--accent)' }} />
                  <span>m.rubinkaiser@gmail.com</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <FaLinkedin size={20} style={{ color: 'var(--accent)' }} />
                  <a href="https://linkedin.com/in/rubin-kaiser-m-b605962b9" target="_blank" rel="noreferrer" style={{ textDecoration: 'underline' }}>LinkedIn Profile</a>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <FaGithub size={20} style={{ color: 'var(--accent)' }} />
                  <a href="https://github.com/mrubinkaiser" target="_blank" rel="noreferrer" style={{ textDecoration: 'underline' }}>GitHub Repositories</a>
                </div>
              </div>
            </div>

            <div className="glass-card">
              <form onSubmit={e => { e.preventDefault(); alert('Message sent successfully!'); }} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 12, color: 'var(--text-muted)' }}>Name</label>
                  <input type="text" className="form-control" placeholder="John Doe" required style={{ background: 'rgba(255,255,255,0.02)' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 12, color: 'var(--text-muted)' }}>Email</label>
                  <input type="email" className="form-control" placeholder="you@example.com" required style={{ background: 'rgba(255,255,255,0.02)' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 12, color: 'var(--text-muted)' }}>Message</label>
                  <textarea rows={4} className="form-control" placeholder="Write your message here..." required style={{ background: 'rgba(255,255,255,0.02)', resize: 'none' }} />
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 8 }}>Send Message</button>
              </form>
            </div>
          </div>
        </section>

        {/* Section 9: Footer */}
        <footer style={{ background: 'rgba(10, 12, 18, 0.95)', padding: '40px 10% 80px', color: 'var(--text-secondary)', fontSize: 13 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 24 }}>
            <div>
              <h3 style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: 16, marginBottom: 8 }}>Rubin Kaiser M</h3>
              <p style={{ color: 'var(--text-muted)' }}>Building responsive MERN & Laravel ERP software architectures.</p>
            </div>
            
            <div style={{ display: 'flex', gap: 24 }}>
              <span onClick={() => handleDotClick('home')} style={{ cursor: 'pointer' }}>Home</span>
              <span onClick={() => handleDotClick('about')} style={{ cursor: 'pointer' }}>About</span>
              <span onClick={() => handleDotClick('projects')} style={{ cursor: 'pointer' }}>Projects</span>
              <span onClick={() => handleDotClick('contact')} style={{ cursor: 'pointer' }}>Contact</span>
            </div>
          </div>
          
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: 24, paddingTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <span>© {new Date().getFullYear()} Rubin Kaiser M. All rights reserved.</span>
            
            <button 
              className="back-to-top-btn visible"
              onClick={handleBackToTop}
              title="Back to Top"
              style={{ position: 'relative', bottom: 'auto', right: 'auto' }}
            >
              <MdArrowUpward />
            </button>
          </div>
        </footer>

      </div>
    </div>
  );
}

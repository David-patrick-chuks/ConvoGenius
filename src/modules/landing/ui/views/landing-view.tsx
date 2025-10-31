"use client";

import { motion, useScroll, useTransform, useInView } from "framer-motion";
import { useRef, useEffect, useState } from "react";
import { useSpring, animated, useSprings, config } from "@react-spring/web";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowRightIcon, 
  CheckIcon,
  StarIcon,
  SparklesIcon,
  UsersIcon,
  ShieldCheckIcon,
  VideoIcon,
  BrainIcon,
  MicIcon,
  EyeIcon,
  MessageSquareIcon,
  TargetIcon,
  TrendingUpIcon,
  GlobeIcon
} from "lucide-react";
import Link from "next/link";
import Image from "next/image"; 
// Enhanced Testimonials Section with INSANE GSAP Effects
const TestimonialsSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const testimonialCardRef = useRef<HTMLDivElement>(null);
  const avatarRef = useRef<HTMLDivElement>(null);
  const particleSystemRef = useRef<HTMLDivElement>(null);

  const testimonials = [
    {
      name: "Sarah Chen",
      role: "VP of Engineering",
      company: "TechNova",
      content: "ConvoGenius transformed our engineering reviews completely. The AI doesn't just transcribe—it understands the technical nuances and provides insights we never thought possible.",
      avatar: "SC",
      rating: 5,
      color: "from-green-500 to-emerald-500"
    },
    {
      name: "Marcus Rodriguez", 
      role: "Chief Product Officer",
      company: "Innovate Labs",
      content: "We've saved 15 hours per week on meeting follow-ups. The predictive insights help us make better product decisions before problems even surface.",
      avatar: "MR",
      rating: 5,
      color: "from-emerald-500 to-green-600"
    },
    {
      name: "Dr. Elena Vasquez",
      role: "Research Director", 
      company: "QuantumBio",
      content: "The multi-language support and context preservation are phenomenal. Our international research teams can now collaborate seamlessly across time zones.",
      avatar: "EV",
      rating: 5,
      color: "from-green-600 to-emerald-600"
    }
  ];

  // INSANE GSAP Effects
  useEffect(() => {
    if (typeof window !== 'undefined') {
      gsap.registerPlugin(ScrollTrigger);

      // Create floating particle system
      createTestimonialParticles();

      // Testimonial card morphing animation
      if (testimonialCardRef.current) {
        gsap.set(testimonialCardRef.current, {
          scale: 0.5,
          rotationY: 90,
          opacity: 0,
          filter: "blur(20px)"
        });

        ScrollTrigger.create({
          trigger: testimonialCardRef.current,
          start: "top 80%",
          onEnter: () => {
            gsap.to(testimonialCardRef.current, {
              scale: 1,
              rotationY: 0,
              opacity: 1,
              filter: "blur(0px)",
              duration: 1.5,
              ease: "elastic.out(1, 0.5)"
            });
          }
        });
      }

      // Avatar with crazy hover effects
      if (avatarRef.current) {
        const avatar = avatarRef.current;
        
        avatar.addEventListener('mouseenter', () => {
          gsap.to(avatar, {
            scale: 1.3,
            rotationY: 360,
            boxShadow: "0 0 30px rgba(34, 197, 94, 0.8)",
            duration: 0.8,
            ease: "elastic.out(1, 0.3)"
          });
          
          // Create explosion effect
          createAvatarExplosion(avatar);
        });

        avatar.addEventListener('mouseleave', () => {
          gsap.to(avatar, {
            scale: 1,
            rotationY: 0,
            boxShadow: "0 0 0px rgba(34, 197, 94, 0)",
            duration: 0.6,
            ease: "power2.out"
          });
        });
      }
    }
  }, [currentTestimonial]);

  // Create particle system for testimonials
  const createTestimonialParticles = () => {
    if (particleSystemRef.current) {
      const container = particleSystemRef.current;
      container.innerHTML = ''; // Clear existing particles
      
      const particleCount = 25;
      
      for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = `absolute rounded-full bg-gradient-to-r ${
          i % 3 === 0 ? 'from-green-400/30 to-emerald-400/30' :
          i % 3 === 1 ? 'from-emerald-400/30 to-green-500/30' : 'from-green-300/30 to-emerald-300/30'
        }`;
        
        const size = Math.random() * 8 + 2;
        particle.style.width = size + 'px';
        particle.style.height = size + 'px';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.top = Math.random() * 100 + '%';
        
        container.appendChild(particle);

        // Crazy floating animation
        gsap.to(particle, {
          x: `random(-200, 200)`,
          y: `random(-200, 200)`,
          rotation: 360,
          scale: `random(0.5, 2)`,
          duration: `random(8, 15)`,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
          delay: Math.random() * 5
        });

        // Pulsing effect
        gsap.to(particle, {
          opacity: `random(0.3, 0.8)`,
          duration: `random(2, 4)`,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true
        });
      }
    }
  };

  // Avatar explosion effect
  const createAvatarExplosion = (target: HTMLElement) => {
    const particleCount = 20;
    const rect = target.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement('div');
      particle.className = 'fixed w-3 h-3 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full pointer-events-none z-50';
      particle.style.left = centerX + 'px';
      particle.style.top = centerY + 'px';
      document.body.appendChild(particle);

      const angle = (Math.PI * 2 * i) / particleCount;
      const velocity = 150 + Math.random() * 100;
      
      gsap.to(particle, {
        x: Math.cos(angle) * velocity,
        y: Math.sin(angle) * velocity,
        scale: Math.random() * 1.5 + 0.5,
        rotation: Math.random() * 360,
        opacity: 0,
        duration: 1.5,
        ease: "power2.out",
        onComplete: () => {
          if (document.body.contains(particle)) {
            document.body.removeChild(particle);
          }
        }
      });
    }
  };

  // Auto-rotate testimonials with transition effects
  useEffect(() => {
    const interval = setInterval(() => {
      if (testimonialCardRef.current) {
        // Exit animation
        gsap.to(testimonialCardRef.current, {
          scale: 0.8,
          rotationX: 90,
          opacity: 0,
          duration: 0.5,
          ease: "power2.in",
          onComplete: () => {
            setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
            
            // Enter animation
            gsap.fromTo(testimonialCardRef.current, 
              {
                scale: 0.8,
                rotationX: -90,
                opacity: 0
              },
              {
                scale: 1,
                rotationX: 0,
                opacity: 1,
                duration: 0.8,
                ease: "back.out(1.7)"
              }
            );
          }
        });
      }
    }, 6000);
    
    return () => clearInterval(interval);
  }, [testimonials.length]);

  return (
    <section ref={ref} className="py-20 bg-gradient-to-br from-emerald-50 via-white to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 relative overflow-hidden">
      {/* Floating particles system */}
      <div ref={particleSystemRef} className="absolute inset-0 pointer-events-none"></div>
      
      <div className="max-w-6xl mx-auto px-6 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <Badge variant="outline" className="mb-6 px-6 py-3 text-lg font-semibold bg-gradient-to-r from-green-100 to-emerald-100 dark:from-gray-800 dark:to-gray-700 border-green-200 dark:border-gray-600">
            <UsersIcon className="w-5 h-5 mr-3" />
            What Leaders Say
          </Badge>
          <h2 className="text-5xl md:text-7xl font-bold text-gray-900 dark:text-gray-100 mb-8">
            Trusted by
            <br />
            <span className="bg-gradient-to-r from-green-600 via-emerald-600 to-green-700 bg-clip-text text-transparent">
              Innovators
            </span>
          </h2>
          <p className="text-2xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto leading-relaxed">
            Join thousands of forward-thinking teams who&apos;ve revolutionized their meeting culture with ConvoGenius.
          </p>
        </motion.div>

        <motion.div 
          key={currentTestimonial}
          className="relative"
          style={{ perspective: '1000px' }}
        >
          <Card 
            ref={testimonialCardRef}
            className="p-12 border-0 bg-gradient-to-br from-white via-gray-50 to-white shadow-2xl rounded-3xl relative overflow-hidden"
            style={{ transformStyle: 'preserve-3d' }}
          >
            {/* Animated background gradient */}
            <div className={`absolute inset-0 bg-gradient-to-r ${testimonials[currentTestimonial].color} opacity-5 animate-pulse`}></div>
            
            <CardContent className="p-0 relative z-10">
              <div className="flex items-center mb-8">
                {[...Array(testimonials[currentTestimonial].rating)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ 
                      delay: i * 0.1, 
                      type: "spring", 
                      bounce: 0.5,
                      duration: 0.6 
                    }}
                  >
                    <StarIcon className="w-8 h-8 text-yellow-400 fill-current" />
                  </motion.div>
                ))}
              </div>
              
              <blockquote className="text-3xl md:text-4xl font-semibold text-gray-900 mb-10 leading-relaxed">
                &ldquo;{testimonials[currentTestimonial].content}&rdquo;
              </blockquote>
              
              <div className="flex items-center">
                <motion.div 
                  ref={avatarRef}
                  className={`w-20 h-20 rounded-full bg-gradient-to-r ${testimonials[currentTestimonial].color} flex items-center justify-center text-white font-bold text-2xl mr-6 cursor-pointer relative overflow-hidden`}
                  style={{ transformStyle: 'preserve-3d' }}
                >
                  {testimonials[currentTestimonial].avatar}
                  
                  {/* Animated ring */}
                  <div className="absolute inset-0 rounded-full border-4 border-white/30 animate-spin"></div>
                  <div className="absolute inset-2 rounded-full border-2 border-white/20 animate-ping"></div>
                </motion.div>
                
                <div>
                  <h4 className="text-2xl font-bold text-gray-900">{testimonials[currentTestimonial].name}</h4>
                  <p className="text-xl text-gray-600">{testimonials[currentTestimonial].role}</p>
                  <p className="text-lg text-green-600 font-semibold">{testimonials[currentTestimonial].company}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <div className="flex justify-center mt-12 space-x-4">
          {testimonials.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentTestimonial(index)}
              className={`h-4 rounded-full transition-all duration-500 transform hover:scale-125 ${
                index === currentTestimonial 
                  ? 'bg-gradient-to-r from-green-500 to-emerald-500 w-12 shadow-lg' 
                  : 'bg-gray-300 hover:bg-gray-400 w-4'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};
import { FAQSection } from "../components/faq-section";
import { MobileMenu } from "../components/mobile-menu";

// Enhanced Hero Section with Insane GSAP Animations
const HeroSection = () => {
  const ref = useRef<HTMLElement>(null);
  const heroTitleRef = useRef<HTMLHeadingElement>(null);
  const heroSubtitleRef = useRef<HTMLParagraphElement>(null);
  const heroButtonsRef = useRef<HTMLDivElement>(null);
  const heroParticlesRef = useRef<HTMLDivElement>(null);
  const heroFloatingRef = useRef<HTMLDivElement[]>([]);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"]
  });

  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  // Insane GSAP Animations
  useEffect(() => {
    if (typeof window !== 'undefined') {
      gsap.registerPlugin(ScrollTrigger);

      // Hero entrance animation sequence
      const tl = gsap.timeline({ delay: 0.5 });
      
      // Title explosion effect
      if (heroTitleRef.current) {
        gsap.set(heroTitleRef.current, { 
          scale: 0, 
          rotationY: 180, 
          z: -1000,
          transformOrigin: "center center"
        });
        
        tl.to(heroTitleRef.current, {
          scale: 1,
          rotationY: 0,
          z: 0,
          duration: 1.5,
          ease: "back.out(2)",
          transformOrigin: "center center"
        });
      }

      // Subtitle typewriter effect with morphing
      if (heroSubtitleRef.current) {
        gsap.set(heroSubtitleRef.current, { opacity: 0, y: 100, skewY: 15 });
        tl.to(heroSubtitleRef.current, {
          opacity: 1,
          y: 0,
          skewY: 0,
          duration: 1,
          ease: "elastic.out(1, 0.5)"
        }, "-=0.8");
      }

      // Buttons with magnetic hover effect
      if (heroButtonsRef.current) {
        gsap.set(heroButtonsRef.current, { opacity: 0, scale: 0, rotation: 45 });
        tl.to(heroButtonsRef.current, {
          opacity: 1,
          scale: 1,
          rotation: 0,
          duration: 0.8,
          ease: "back.out(1.7)"
        }, "-=0.5");
      }

      // Floating particles system
      heroFloatingRef.current.forEach((particle) => {
        if (particle) {
          gsap.set(particle, {
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
            scale: Math.random() * 2 + 0.5,
            rotation: Math.random() * 360
          });

          gsap.to(particle, {
            y: "-=50",
            duration: 2 + Math.random() * 3,
            ease: "sine.inOut",
            yoyo: true,
            repeat: -1,
            delay: Math.random() * 2
          });

          gsap.to(particle, {
            x: "+=30",
            duration: 3 + Math.random() * 2,
            ease: "sine.inOut",
            yoyo: true,
            repeat: -1,
            delay: Math.random() * 1
          });

          gsap.to(particle, {
            rotation: "+=360",
            duration: 10 + Math.random() * 5,
            ease: "none",
            repeat: -1
          });
        }
      });

      // Mouse-following parallax orbs
      const handleMouseMove = (e: MouseEvent) => {
        const { clientX, clientY } = e;
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        
        const deltaX = (clientX - centerX) / centerX;
        const deltaY = (clientY - centerY) / centerY;

        heroFloatingRef.current.forEach((particle, i) => {
          if (particle) {
            gsap.to(particle, {
              x: `+=${deltaX * (i + 1) * 10}`,
              y: `+=${deltaY * (i + 1) * 10}`,
              duration: 1.5,
              ease: "power2.out"
            });
          }
        });
      };

      document.addEventListener('mousemove', handleMouseMove);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        ScrollTrigger.getAll().forEach(trigger => trigger.kill());
      };
    }
  }, []);

  return (
    <motion.section
      ref={ref}
      className="relative h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-green-900 via-emerald-800 to-green-950 dark:from-gray-900 dark:via-gray-800 dark:to-green-950"
      style={{ y, opacity }}
    >
      {/* Insane floating particles */}
      <div ref={heroParticlesRef} className="absolute inset-0 pointer-events-none">
        {Array.from({ length: 15 }).map((_, i) => (
          <div
            key={i}
            ref={(el) => {
              if (el) heroFloatingRef.current[i] = el;
            }}
            className={`absolute w-4 h-4 ${
              i % 3 === 0 ? 'bg-green-400/30' : 
              i % 3 === 1 ? 'bg-emerald-400/30' : 'bg-white/20'
            } rounded-full blur-sm`}
            style={{
              boxShadow: '0 0 20px currentColor',
            }}
          />
        ))}
        
        {/* Larger morphing orbs */}
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={`orb-${i}`}
            className="absolute rounded-full bg-gradient-to-r from-green-500/20 to-emerald-500/20 blur-3xl"
            style={{
              width: `${200 + i * 50}px`,
              height: `${200 + i * 50}px`,
              left: `${20 + i * 20}%`,
              top: `${10 + i * 15}%`,
              animation: `float-${i} ${15 + i * 2}s ease-in-out infinite`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 text-center px-6 max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2, type: "spring", bounce: 0.4 }}
          className="mb-6"
        >
          <Badge variant="outline" className="bg-white/10 dark:bg-gray-800/50 text-white dark:text-gray-200 border-white/20 dark:border-gray-600/30 px-6 py-3 text-base font-medium backdrop-blur-sm">
            <SparklesIcon className="w-5 h-5 mr-3" />
            Revolutionary AI Technology
          </Badge>
        </motion.div>

        <h1
          ref={heroTitleRef}
          className="text-4xl md:text-6xl lg:text-8xl font-bold text-white dark:text-gray-100 mb-6 leading-tight"
          style={{ perspective: '1000px' }}
        >
          ConvoGenius
          <br />
          <span className="bg-gradient-to-r from-green-400 via-emerald-400 to-green-300 bg-clip-text text-transparent">
            Evolved
          </span>
        </h1>

        <p
          ref={heroSubtitleRef}
          className="text-lg md:text-xl text-gray-300 dark:text-gray-400 mb-8 max-w-3xl mx-auto leading-relaxed font-light"
        >
          Transform conversations into intelligent insights with AI that understands, learns, and evolves.
        </p>

        <div
          ref={heroButtonsRef}
          className="flex flex-col sm:flex-row gap-6 justify-center items-center"
        >
          <Link href="/sign-up">
            <motion.div
              whileHover={{ scale: 1.05, boxShadow: "0 25px 50px -12px rgba(255, 255, 255, 0.25)" }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <Button size="lg" className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-8 py-4 text-lg font-bold rounded-2xl shadow-2xl">
                Experience the Future
                <ArrowRightIcon className="w-5 h-5 ml-3" />
              </Button>
            </motion.div>
          </Link>
          <Link href="/sign-in">
            <motion.div
              whileHover={{ scale: 1.05, backgroundColor: "rgba(255, 255, 255, 0.1)" }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <Button variant="outline" size="lg" className="border-2 border-white/30 text-white hover:bg-white/10 px-10 py-5 text-xl font-bold rounded-2xl backdrop-blur-sm">
                Explore Now
              </Button>
            </motion.div>
          </Link>
        </div>
      </div>

      {/* Enhanced Scroll indicator with GSAP animation */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1.5 }}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 15, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          className="w-8 h-12 border-2 border-white/40 rounded-full flex justify-center backdrop-blur-sm"
        >
          <motion.div
            animate={{ y: [0, 16, 0], opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            className="w-1.5 h-4 bg-gradient-to-b from-green-400 to-emerald-400 rounded-full mt-2"
          />
        </motion.div>
      </motion.div>

      <style jsx>{`
        @keyframes float-0 {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-30px) rotate(180deg); }
        }
        @keyframes float-1 {
          0%, 100% { transform: translateY(0px) rotate(0deg) scale(1); }
          50% { transform: translateY(-50px) rotate(360deg) scale(1.2); }
        }
        @keyframes float-2 {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          25% { transform: translateY(-20px) rotate(90deg); }
          75% { transform: translateY(-40px) rotate(270deg); }
        }
        @keyframes float-3 {
          0%, 100% { transform: translateY(0px) rotate(0deg) scale(1); }
          33% { transform: translateY(-25px) rotate(120deg) scale(0.8); }
          66% { transform: translateY(-45px) rotate(240deg) scale(1.1); }
        }
        @keyframes float-4 {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          20% { transform: translateY(-15px) rotate(72deg); }
          40% { transform: translateY(-35px) rotate(144deg); }
          60% { transform: translateY(-25px) rotate(216deg); }
          80% { transform: translateY(-40px) rotate(288deg); }
        }
      `}</style>
    </motion.section>
  );
};

// Enhanced Features Section with INSANE GSAP Animations
const FeaturesSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const cardsRef = useRef<HTMLDivElement[]>([]);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const particleContainerRef = useRef<HTMLDivElement>(null);
  const morphingSectionRef = useRef<HTMLElement>(null);

  // GSAP animation for cards with INSANE effects
  useEffect(() => {
    if (typeof window !== 'undefined') {
      gsap.registerPlugin(ScrollTrigger);

      // Create morphing background effect
      if (morphingSectionRef.current) {
        gsap.set(morphingSectionRef.current, {
          background: "linear-gradient(45deg, #059669, #10b981, #34d399)"
        });

        gsap.to(morphingSectionRef.current, {
          background: "linear-gradient(225deg, #10b981, #34d399, #6ee7b7)",
          duration: 8,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut"
        });
      }

      // Title explosion with text splitting
      if (titleRef.current) {
        const titleText = titleRef.current.textContent;
        if (titleText) {
          titleRef.current.innerHTML = titleText
            .split('')
            .map((char) => `<span style="display: inline-block; transform: translateY(100px) rotateX(90deg);">${char === ' ' ? '&nbsp;' : char}</span>`)
            .join('');

          const chars = titleRef.current.querySelectorAll('span');
          
          gsap.to(chars, {
            y: 0,
            rotateX: 0,
            duration: 1.5,
            stagger: 0.05,
            ease: "back.out(1.7)",
            scrollTrigger: {
              trigger: titleRef.current,
              start: "top 90%",
              end: "bottom 10%"
            }
          });

          // Continuous floating animation for title chars
          chars.forEach((char, i) => {
            gsap.to(char, {
              y: "random(-10, 10)",
              rotation: "random(-5, 5)",
              duration: "random(2, 4)",
              ease: "sine.inOut",
              repeat: -1,
              yoyo: true,
              delay: i * 0.1
            });
          });
        }
      }

      // Cards with 3D morphing and particle explosion - FASTER TIMING
      if (cardsRef.current.length > 0) {
        const cards = cardsRef.current;
        
        // Set initial crazy transform states
        gsap.set(cards, {
          y: 150,
          opacity: 0,
          scale: 0.5,
          rotationY: -90,
          rotationX: 30,
          z: -300,
          transformOrigin: "center center",
          filter: "blur(10px)"
        });

        // Create timeline for ULTRA FAST sequential card reveals
        const cardTimeline = gsap.timeline({
          scrollTrigger: {
            trigger: ref.current,
            start: "top 90%",
            end: "bottom 20%",
            toggleActions: "play none none reverse",
            fastScrollEnd: true
          }
        });

        cards.forEach((card, i) => {
          // Ultra fast entrance animation
          cardTimeline.to(card, {
            y: 0,
            opacity: 1,
            scale: 1,
            rotationY: 0,
            rotationX: 0,
            z: 0,
            filter: "blur(0px)",
            duration: 0.5,
            ease: "power3.out",
            transformOrigin: "center center"
          }, i * 0.05); // Ultra fast stagger - nearly simultaneous

          // Hover animations with magnetic effect
          card.addEventListener('mouseenter', () => {
            gsap.to(card, {
              scale: 1.15,
              rotationY: 15,
              rotationX: 5,
              z: 100,
              boxShadow: "0 30px 60px rgba(0,0,0,0.3)",
              duration: 0.5,
              ease: "power2.out"
            });

            // Create particle explosion on hover
            createParticleExplosion(card);
          });

          card.addEventListener('mouseleave', () => {
            gsap.to(card, {
              scale: 1,
              rotationY: 0,
              rotationX: 0,
              z: 0,
              boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
              duration: 0.8,
              ease: "elastic.out(1, 0.3)"
            });
          });

          // Continuous floating animation
          gsap.to(card, {
            y: "random(-20, 20)",
            rotationZ: "random(-3, 3)",
            duration: "random(3, 6)",
            ease: "sine.inOut",
            repeat: -1,
            yoyo: true,
            delay: i * 0.5
          });
        });
      }

      // Particle system
      createFloatingParticles();
    }
  }, []);

  // Particle explosion function
  const createParticleExplosion = (target: HTMLElement) => {
    const particles = 15;
    const rect = target.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    for (let i = 0; i < particles; i++) {
      const particle = document.createElement('div');
      particle.className = 'absolute w-2 h-2 bg-green-400 rounded-full pointer-events-none';
      particle.style.left = centerX + 'px';
      particle.style.top = centerY + 'px';
      particle.style.zIndex = '1000';
      document.body.appendChild(particle);

      gsap.to(particle, {
        x: Math.random() * 400 - 200,
        y: Math.random() * 400 - 200,
        scale: Math.random() * 2,
        rotation: Math.random() * 360,
        opacity: 0,
        duration: 1.5,
        ease: "power2.out",
        onComplete: () => {
          document.body.removeChild(particle);
        }
      });
    }
  };

  // Floating particles in background
  const createFloatingParticles = () => {
    if (particleContainerRef.current) {
      const container = particleContainerRef.current;
      const particleCount = 30;

      for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = `absolute w-1 h-1 bg-gradient-to-r ${
          i % 3 === 0 ? 'from-green-400 to-emerald-400' :
          i % 3 === 1 ? 'from-emerald-400 to-green-500' : 'from-green-300 to-emerald-300'
        } rounded-full opacity-60`;
        
        particle.style.left = Math.random() * 100 + '%';
        particle.style.top = Math.random() * 100 + '%';
        container.appendChild(particle);

        gsap.to(particle, {
          x: Math.random() * 200 - 100,
          y: Math.random() * 200 - 100,
          scale: Math.random() * 3 + 0.5,
          rotation: 360,
          duration: Math.random() * 10 + 10,
          ease: "none",
          repeat: -1,
          yoyo: true
        });
      }
    }
  };

  const features = [
    {
      icon: VideoIcon,
      title: "HD Video Meetings",
      description: "Create and join high-quality video meetings with Stream's powerful infrastructure. Crystal-clear video calls with automatic quality adjustment for any device.",
      color: "from-green-500 to-emerald-500",
      delay: 0.1
    },
    {
      icon: MicIcon,
      title: "Live Transcription",
      description: "Real-time meeting transcripts with speaker identification and searchable text. Automatically generated JSONL transcripts for every meeting session.",
      color: "from-emerald-500 to-green-600",
      delay: 0.2
    },
    {
      icon: MessageSquareIcon,
      title: "Real-time Chat",
      description: "Integrated chat during meetings with Stream Chat. Share files, links, and messages that persist beyond the meeting session for continuous collaboration.",
      color: "from-green-600 to-emerald-600",
      delay: 0.3
    },
    {
      icon: BrainIcon,
      title: "AI-Powered Agents",
      description: "Deploy intelligent AI agents in your meetings. Create custom agents with unique instructions and personalities to enhance collaboration and productivity.",
      color: "from-emerald-600 to-green-700",
      delay: 0.4
    },
    {
      icon: ShieldCheckIcon,
      title: "Secure Authentication",
      description: "Enterprise-grade security with Better Auth. Support for email/password, Google OAuth, and secure session management with JWT tokens.",
      color: "from-green-700 to-emerald-700",
      delay: 0.5
    },
    {
      icon: EyeIcon,
      title: "Meeting Analytics",
      description: "Comprehensive meeting insights with automated summaries. Track meeting duration, participant engagement, and generate detailed reports.",
      color: "from-emerald-700 to-green-800",
      delay: 0.6
    }
  ];

  return (
    <section 
      ref={morphingSectionRef}
      className="py-20 relative overflow-hidden"
      style={{ perspective: '1000px' }}
    >
      {/* Floating particles container */}
      <div ref={particleContainerRef} className="absolute inset-0 pointer-events-none"></div>
      
      {/* Morphing background overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/80 via-green-50/80 to-emerald-50/80 dark:from-gray-900/80 dark:via-gray-800/80 dark:to-green-950/80 backdrop-blur-sm"></div>
      
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={isInView ? { scale: 1 } : {}}
            transition={{ duration: 0.6, type: "spring", bounce: 0.4 }}
          >
            <Badge variant="outline" className="mb-6 px-6 py-3 text-lg font-semibold bg-gradient-to-r from-green-100 to-emerald-100 dark:from-gray-800 dark:to-gray-700 border-green-200 dark:border-gray-600">
              <SparklesIcon className="w-5 h-5 mr-3" />
              Next-Generation Features
            </Badge>
          </motion.div>
          <h2 
            ref={titleRef}
            className="text-5xl md:text-7xl font-bold text-gray-900 dark:text-gray-100 mb-8"
            style={{ perspective: '1000px' }}
          >
            Intelligence Redefined
          </h2>
          <p className="text-2xl text-gray-600 dark:text-gray-400 max-w-4xl mx-auto leading-relaxed">
            Discover how artificial intelligence can amplify human potential and transform the way teams collaborate, decide, and innovate.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10" style={{ perspective: '1000px' }}>
          {features.map((feature, featureIndex) => (
            <div key={feature.title}>
              <motion.div
                ref={(el) => {
                  if (el) cardsRef.current[featureIndex] = el;
                }}
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.8, delay: featureIndex * 0.1 }}
                className="cursor-pointer"
                style={{ transformStyle: 'preserve-3d' }}
              >
                <Card className="p-10 h-full border-0 bg-gradient-to-br from-white via-gray-50 to-white dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 shadow-xl hover:shadow-2xl transition-all duration-500 backdrop-blur-sm relative overflow-hidden">
                  <CardContent className="p-0 relative z-10">
                    <motion.div 
                      className={`w-20 h-20 rounded-3xl bg-gradient-to-r ${feature.color} mb-8 flex items-center justify-center shadow-lg relative`}
                      whileHover={{ rotate: 360, scale: 1.1 }}
                      transition={{ duration: 0.6 }}
                    >
                      <feature.icon className="w-10 h-10 text-white" />
                      <div className="absolute inset-0 bg-white/20 rounded-3xl animate-pulse"></div>
                    </motion.div>
                    <h3 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6">{feature.title}</h3>
                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-lg">{feature.description}</p>
                  </CardContent>
                  
                  {/* Animated border */}
                  <div className="absolute inset-0 rounded-lg overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-green-400 via-emerald-400 to-green-400 opacity-0 hover:opacity-20 transition-opacity duration-500 animate-pulse"></div>
                  </div>
                </Card>
              </motion.div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// New Advanced Capabilities Section
const CapabilitiesSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [activeCapability, setActiveCapability] = useState(0);

  const capabilities = [
    {
      icon: MessageSquareIcon,
      title: "Conversational Intelligence",
      description: "Real-time sentiment analysis, topic extraction, and conversation flow optimization that makes every interaction more meaningful.",
      features: ["Emotion Detection", "Intent Recognition", "Context Preservation", "Multi-language Support"]
    },
    {
      icon: TargetIcon,
      title: "Strategic Insights",
      description: "Transform raw conversations into strategic business intelligence with AI-powered analytics and predictive modeling.",
      features: ["Trend Analysis", "Decision Tracking", "Performance Metrics", "ROI Optimization"]
    },
    {
      icon: TrendingUpIcon,
      title: "Continuous Learning",
      description: "Self-improving AI that adapts to your team's communication patterns and becomes more effective over time.",
      features: ["Pattern Recognition", "Adaptive Algorithms", "Custom Training", "Performance Enhancement"]
    }
  ];

  const titleSpring = useSpring({
    from: { opacity: 0, transform: "scale(0.8)" },
    to: isInView ? { opacity: 1, transform: "scale(1)" } : { opacity: 0, transform: "scale(0.8)" },
    config: config.wobbly,
  });

  // Create springs for all cards at once
  const cardSprings = useSprings(
    capabilities.length,
    capabilities.map((_, index) => ({
      from: { opacity: 0, transform: "translateX(-100px)" },
      to: isInView ? { opacity: 1, transform: "translateX(0px)" } : { opacity: 0, transform: "translateX(-100px)" },
      config: config.gentle,
      delay: index * 200,
    }))
  );

  return (
    <section ref={ref} className="py-32 bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 dark:from-gray-950 dark:via-gray-900 dark:to-gray-800 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <animated.div style={titleSpring} className="text-center mb-20">
          <Badge variant="outline" className="bg-white/10 dark:bg-gray-800/50 text-white dark:text-gray-200 border-white/20 dark:border-gray-600/30 mb-6 px-6 py-3 text-lg font-semibold">
            <GlobeIcon className="w-5 h-5 mr-3" />
            Advanced Capabilities
          </Badge>
          <h2 className="text-5xl md:text-7xl font-bold text-white dark:text-gray-100 mb-8">
            Beyond
            <br />
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
              Imagination
            </span>
          </h2>
          <p className="text-2xl text-gray-300 dark:text-gray-400 max-w-4xl mx-auto leading-relaxed">
            Explore the cutting-edge capabilities that set ConvoGenius apart in the realm of conversational AI.
          </p>
        </animated.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {capabilities.map((capability, capabilityIndex) => (
            <animated.div key={capability.title} style={cardSprings[capabilityIndex]}>                <motion.div
                  className={`p-8 rounded-3xl border transition-all duration-500 cursor-pointer ${
                    activeCapability === capabilityIndex 
                      ? 'bg-white/10 dark:bg-gray-700/50 border-white/30 dark:border-gray-500/50 shadow-2xl' 
                      : 'bg-white/5 dark:bg-gray-800/30 border-white/10 dark:border-gray-600/30 hover:bg-white/10 dark:hover:bg-gray-700/50'
                  }`}
                  onMouseEnter={() => setActiveCapability(capabilityIndex)}
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <motion.div 
                    className="w-16 h-16 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-600 mb-6 flex items-center justify-center"
                    whileHover={{ rotate: 180 }}
                    transition={{ duration: 0.6 }}
                  >
                    <capability.icon className="w-8 h-8 text-white" />
                  </motion.div>
                  <h3 className="text-2xl font-bold text-white dark:text-gray-200 mb-4">{capability.title}</h3>
                  <p className="text-gray-300 dark:text-gray-400 leading-relaxed mb-6">{capability.description}</p>
                <ul className="space-y-3">
                  {capability.features.map((feature, featureIndex) => (
                    <motion.li 
                      key={feature}
                      className="flex items-center text-gray-400 dark:text-gray-500"
                      initial={{ opacity: 0, x: -20 }}
                      animate={activeCapability === capabilityIndex ? { opacity: 1, x: 0 } : { opacity: 0.6, x: -10 }}
                      transition={{ delay: featureIndex * 0.1 }}
                    >
                      <CheckIcon className="w-4 h-4 text-green-400 mr-3" />
                      {feature}
                    </motion.li>
                  ))}
                </ul>
              </motion.div>
            </animated.div>
          ))}
        </div>
      </div>
    </section>
  );
};



// CTA Section Component
const CTASection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="py-16 bg-gradient-to-br from-green-900 via-emerald-900 to-gray-900 dark:from-gray-950 dark:via-gray-900 dark:to-gray-800">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-4xl md:text-6xl font-bold text-white dark:text-gray-100 mb-6">
            Ready to Transform
            <br />
            <span className="bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
              Your Meetings?
            </span>
          </h2>
          <p className="text-xl text-gray-300 dark:text-gray-400 mb-10 max-w-2xl mx-auto">
            Join thousands of teams already using ConvoGenius to make their meetings more productive, 
            engaging, and actionable.
          </p>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <Link href="/sign-up">
              <Button size="lg" className="bg-white text-black hover:bg-gray-100 dark:bg-gray-200 dark:text-gray-900 dark:hover:bg-gray-300 px-8 py-4 text-lg font-semibold rounded-xl">
                Start Your Free Trial
                <ArrowRightIcon className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link href="/sign-in">
              <Button variant="outline" size="lg" className="border-white/20 dark:border-gray-600 text-white dark:text-gray-100 hover:bg-white/10 dark:hover:bg-gray-700 px-8 py-4 text-lg font-semibold rounded-xl">
                Sign In
              </Button>
            </Link>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-sm text-gray-400 dark:text-gray-500 mt-6"
          >
            No credit card required • 14-day free trial • Cancel anytime
          </motion.p>
        </motion.div>
      </div>
    </section>
  );
};

// Main Landing View Component
export const LandingView = () => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null; // Prevent hydration issues
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Navigation */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="fixed top-0 left-0 right-0 z-50 bg-black/80 dark:bg-gray-900/90 backdrop-blur-md border-b border-white/10 dark:border-gray-700/50"
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center space-x-2">
              <Image src="/logo.svg" alt="ConvoGenius" width={32} height={32} />
              <span className="text-xl font-bold text-white">ConvoGenius</span>
            </Link>
            
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-300 dark:text-gray-400 hover:text-white dark:hover:text-gray-200 transition-colors">Features</a>
              <a href="#capabilities" className="text-gray-300 dark:text-gray-400 hover:text-white dark:hover:text-gray-200 transition-colors">Capabilities</a>
              <a href="#testimonials" className="text-gray-300 dark:text-gray-400 hover:text-white dark:hover:text-gray-200 transition-colors">Reviews</a>
              <a href="#faq" className="text-gray-300 dark:text-gray-400 hover:text-white dark:hover:text-gray-200 transition-colors">FAQ</a>
            </div>

            <div className="flex items-center space-x-4">
              <Link href="/sign-in">
                <Button variant="ghost" className="text-white dark:text-gray-200 hover:bg-white/10 dark:hover:bg-gray-700/50">
                  Sign In
                </Button>
              </Link>
              <Link href="/sign-up">
                <Button className="bg-white text-black hover:bg-gray-100 dark:bg-gray-200 dark:text-gray-900 dark:hover:bg-gray-300">
                  Get Started
                </Button>
              </Link>
              <MobileMenu />
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Main Sections */}
      <HeroSection />
      <div id="features">
        <FeaturesSection />
      </div>
      <div id="capabilities">
        <CapabilitiesSection />
      </div>
      <div id="testimonials">
        <TestimonialsSection />
      </div>
      <div id="faq">
        <FAQSection />
      </div>
      <CTASection />

      {/* Footer */}
      <footer className="bg-gray-900 dark:bg-gray-950 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <Image src="/logo.svg" alt="ConvoGenius" width={24} height={24} />
              <span className="text-lg font-bold text-white dark:text-gray-200">ConvoGenius</span>
            </div>
            
            <div className="flex items-center space-x-6 text-sm text-gray-400 dark:text-gray-500">
              <a href="#" className="hover:text-white dark:hover:text-gray-300 transition-colors">Privacy</a>
              <a href="#" className="hover:text-white dark:hover:text-gray-300 transition-colors">Terms</a>
              <a href="#" className="hover:text-white dark:hover:text-gray-300 transition-colors">Support</a>
              <span>© 2025 ConvoGenius. All rights reserved.</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

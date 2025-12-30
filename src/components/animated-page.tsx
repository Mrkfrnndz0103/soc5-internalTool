import { motion } from "motion/react"
import { useLocation } from "react-router-dom"

interface AnimatedPageProps {
  children: React.ReactNode
}

const pageVariants = {
  initial: {
    opacity: 0,
    y: 20,
    scale: 0.98
  },
  in: {
    opacity: 1,
    y: 0,
    scale: 1
  },
  out: {
    opacity: 0,
    y: -20,
    scale: 0.98
  }
}

const pageTransition = {
  type: "tween" as const,
  ease: "anticipate" as const,
  duration: 0.8
}

const slideVariants = {
  initial: {
    opacity: 0,
    x: 100
  },
  in: {
    opacity: 1,
    x: 0
  },
  out: {
    opacity: 0,
    x: -100
  }
}

const slideTransition = {
  type: "tween" as const,
  ease: "easeInOut" as const,
  duration: 0.6
}

const fadeVariants = {
  initial: {
    opacity: 0
  },
  in: {
    opacity: 1
  },
  out: {
    opacity: 0
  }
}

const fadeTransition = {
  type: "tween" as const,
  ease: "easeInOut" as const,
  duration: 0.5
}

export function AnimatedPage({ children }: AnimatedPageProps) {
  const location = useLocation()
  
  // Different animations for different route categories
  const getAnimationConfig = () => {
    const path = location.pathname
    
    if (path.startsWith("/outbound/")) {
      return {
        variants: slideVariants,
        transition: slideTransition
      }
    } else if (path.startsWith("/kpi/")) {
      return {
        variants: pageVariants,
        transition: pageTransition
      }
    } else {
      return {
        variants: fadeVariants,
        transition: fadeTransition
      }
    }
  }

  const config = getAnimationConfig()

  return (
    <motion.div
      key={location.pathname}
      initial="initial"
      animate="in"
      exit="out"
      variants={config.variants}
      transition={config.transition}
      className="w-full h-full"
    >
      {children}
    </motion.div>
  )
}

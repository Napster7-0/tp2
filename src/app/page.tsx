"use client";
import LandingPage from "@/components/LandingPage";
import ProjectManager from "@/components/ProjectManager";
import { useState } from "react";

export default function Home() {
    const [showApp, setShowApp] = useState(false)
    if(showApp){
      return (
         <ProjectManager/>
      );
    }
  return <LandingPage onStartApp={() => setShowApp(true)} />
}

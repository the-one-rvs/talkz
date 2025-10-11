import React from "react";
import Navbar from "../component/Navbar";
import Hero from "../component/Hero";

export default function Home() {
  return (
    <main className="relative w-full min-h-screen bg-white">
      <Navbar />
      <Hero />
    </main>
  );
}

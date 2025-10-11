import React from "react";
import Button from "./Button";

export default function Hero() {
  return (
    <section
      id="home"
      className="relative flex items-center justify-between min-h-screen bg-[#1f1d1d] overflow-hidden px-12 lg:px-24"
    >
      {/* Background Ellipses */}
      <div className="absolute w-[404px] h-[306px] bg-[#ecc550] rounded-full -left-36 -top-28 blur-3xl opacity-80" />
      <div className="absolute w-[404px] h-[306px] bg-[#daf457] rounded-full right-10 -top-28 blur-3xl opacity-80" />
      <div className="absolute w-[404px] h-[306px] bg-[#9132de] rounded-full right-0 bottom-10 blur-3xl opacity-80" />
      <div className="absolute w-[404px] h-[306px] bg-[#40b4e2] rounded-full -left-40 bottom-0 blur-3xl opacity-80" />

      {/* Right Image */}
      <div className="relative flex justify-center items-center w-1/2">
        <img
          src="/laptop.png"
          alt="Laptop mockup"
          className="w-[500px] h-auto object-contain drop-shadow-2xl"
        />
      </div>
      
      {/* Left Text Section */}
      <div className="relative z-10 flex flex-col gap-8 max-w-xl">
      <div className="relative flex justify-center items-center w-1/2"></div>
        <h1 className="font-oswald font-semibold text-5xl leading-tight text-white">
          Let’s get started with <br /> secure and private communications
        </h1>
        <p className="text-amber-500 text-lg leading-relaxed">
          Experience next-gen encrypted conversations with speed and simplicity.
        </p>
        <Button text="Get Started <|>" />
      </div>

      
    </section>
  );
}
